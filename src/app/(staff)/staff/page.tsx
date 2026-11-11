import Link from "next/link";
import type { Metadata } from "next";
import { Inbox, Search, Star } from "lucide-react";
import { requireStaff } from "@/server/auth/guards";
import { staffFeedbackStats, staffQueue, type QueueFilter } from "@/server/dal/staff";
import { listRequestTypes } from "@/server/dal/requests";
import { fmt, now, plural } from "@/lib/time";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { StatusBadge } from "@/components/requests/status";
import { cn } from "@/lib/cn";
import { takeRequestAction } from "./actions";
import { RatingStars } from "@/components/requests/rate-form";

export const metadata: Metadata = { title: "Очередь заявок" };

const STATUS_TABS: [NonNullable<QueueFilter["status"]>, string, keyof Awaited<ReturnType<typeof staffQueue>>["stats"] | null][] = [
  ["active", "Активные", null], ["SUBMITTED", "Новые", "submitted"], ["IN_PROGRESS", "В работе", "inProgress"], ["NEEDS_INFO", "Ждут студента", "needsInfo"], ["READY", "Готовы к выдаче", "ready"], ["overdue", "Просрочены", "overdue"], ["ISSUED", "Выданы", null], ["REJECTED", "Отклонены", null],
];

export default async function StaffQueuePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const v = await requireStaff();
  const sp = await searchParams;
  const status = (STATUS_TABS.find(([k]) => k === sp.status)?.[0] ?? "active") as QueueFilter["status"];
  const mine = sp.mine === "1";
  const filter: QueueFilter = { mine, status, type: sp.type || undefined, faculty: sp.faculty || undefined, course: sp.course ? Number(sp.course) || undefined : undefined, q: sp.q?.slice(0, 50) || undefined };
  const page = Math.max(0, Number(sp.page) || 0);
  const [{ items, hasMore, stats }, types, fb] = await Promise.all([staffQueue(v, filter, page), listRequestTypes(), staffFeedbackStats(v)]);
  const at = now();
  const qs = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams(Object.entries({ ...sp, ...patch }).filter(([, val]) => val) as [string, string][]);
    return `/staff?${p}`;
  };
  return (
    <div className="pt-2 lg:pt-0">
      <PageHeader title="Очередь заявок" subtitle={`Здравствуйте, ${v.firstName} ${v.middleName ?? ""}. Сначала — с ближайшим сроком.`} />
      {/* Раунд 3: обратная связь студентов — видно, как работает офис */}
      {fb.n > 0 && (
        <details className="mb-4 rounded-2xl border border-line bg-surface px-4 py-3 text-sm">
          <summary className="flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-1">
            <span className="flex items-center gap-1.5"><Star className="h-4 w-4 fill-accent text-accent" aria-hidden /><b className="tabular">{fb.avg?.toLocaleString("ru-RU")}</b> из 5 — оценка студентов за 30 дней ({fb.n} {plural(fb.n, "отзыв", "отзыва", "отзывов")})</span>
            {fb.mineN > 0 && <span className="text-muted">ваши заявки: <b className="text-fg tabular">{fb.mineAvg?.toLocaleString("ru-RU")}</b> ({fb.mineN})</span>}
          </summary>
          {fb.recent.length > 0 && <ul className="mt-2 space-y-1.5 border-t border-line pt-2">{fb.recent.map((x, i) => <li key={i}><RatingStars rating={x.rating} /> <span className="text-muted">{x.title}, {fmt.dayMonth(x.createdAt)}:</span> «{x.comment}»</li>)}</ul>}
        </details>
      )}
      <nav aria-label="Статус" className="-mx-4 mb-3 flex gap-1.5 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:px-0">
        <Link href={qs({ mine: mine ? undefined : "1", page: undefined })} aria-pressed={mine}
          className={cn("whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-semibold", mine ? "border-accent bg-accent text-[#14182a]" : "border-line bg-surface text-fg hover:bg-surface-2")}>
          Мои · {stats.mine}
        </Link>
        <span aria-hidden className="mx-1 w-px self-stretch bg-line" />
        {STATUS_TABS.map(([k, label, stat]) => (
          <Link key={k} href={qs({ status: k === "active" ? undefined : k, page: undefined })} aria-current={status === k ? "page" : undefined}
            className={cn("whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-medium", status === k ? "border-primary bg-primary text-primary-fg" : "border-line bg-surface text-muted hover:text-fg", k === "overdue" && stats.overdue > 0 && status !== k && "border-danger/40 text-danger")}>
            {label}{stat ? ` · ${stats[stat]}` : ""}
          </Link>
        ))}
      </nav>
      <form className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_0.8fr_0.6fr_auto]" role="search" aria-label="Фильтры очереди">
        {status !== "active" && <input type="hidden" name="status" value={status} />}
        <label className="relative"><span className="sr-only">Поиск</span><Search className="absolute left-3 top-3 h-5 w-5 text-muted" aria-hidden /><input name="q" defaultValue={sp.q} placeholder="Фамилия, № заявки, зачётка" className="h-11 w-full rounded-xl border border-line bg-surface pl-10 pr-3 text-[15px] placeholder:text-muted focus:border-primary focus:outline-none" /></label>
        <label><span className="sr-only">Вид</span><Select name="type" defaultValue={sp.type ?? ""}><option value="">Все виды</option>{types.map((t) => <option key={t.code} value={t.code}>{t.title}</option>)}</Select></label>
        <label><span className="sr-only">Факультет</span><Select name="faculty" defaultValue={sp.faculty ?? ""}><option value="">Все факультеты</option>{["МЭО", "МП", "ФЛМК"].map((f) => <option key={f}>{f}</option>)}</Select></label>
        <label><span className="sr-only">Курс</span><Select name="course" defaultValue={sp.course ?? ""}><option value="">Курс</option>{[1, 2, 3, 4].map((c) => <option key={c} value={c}>{c} курс</option>)}</Select></label>
        <Button type="submit" variant="secondary">Применить</Button>
      </form>
      {items.length ? (
        <Card className="p-0 lg:p-0">
          <table className="w-full text-sm">
            <caption className="sr-only">Заявки</caption>
            <thead className="hidden border-b border-line text-left text-xs uppercase tracking-wider text-muted md:table-header-group">
              <tr><th className="px-4 py-3 font-semibold">Заявка</th><th className="px-4 py-3 font-semibold">Студент</th><th className="px-4 py-3 font-semibold">Срок</th><th className="px-4 py-3 font-semibold">Статус</th><th className="px-4 py-3 font-semibold">Ведёт</th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {items.map((r) => {
                const overdue = r.dueAt < at && ["SUBMITTED", "IN_PROGRESS"].includes(r.status);
                return (
                  <tr key={r.id} className="block px-4 py-3 hover:bg-surface-2/60 md:table-row md:p-0">
                    <td className="block md:table-cell md:px-4 md:py-3"><Link href={`/staff/requests/${r.id}`} className="font-semibold hover:underline">{r.title}</Link><span className="block text-xs text-muted">{r.number} · {fmt.dateTime(r.createdAt)}</span></td>
                    <td className="block md:table-cell md:px-4 md:py-3">{r.lastName} {r.firstName[0]}.{r.middleName ? ` ${r.middleName[0]}.` : ""}<span className="block text-xs text-muted">{r.faculty} · {r.course} курс · гр. {r.group}</span></td>
                    <td className="inline-block pr-3 md:table-cell md:px-4 md:py-3">{overdue ? <Badge tone="danger">просрочена · {fmt.dayMonth(r.dueAt)}</Badge> : <span className="tabular">{fmt.dayMonth(r.dueAt)}</span>}</td>
                    <td className="inline-block md:table-cell md:px-4 md:py-3"><StatusBadge status={r.status} /></td>
                    <td className="block pt-1 text-xs md:table-cell md:px-4 md:py-3 md:text-sm">
                      {r.assigneeId ? (
                        <span className={cn(r.assigneeId === v.staffId && "font-semibold")}><span className="md:hidden text-muted">Ведёт: </span>{r.assigneeId === v.staffId ? "Вы" : `${r.assigneeLast} ${r.assigneeFirst?.[0]}. ${r.assigneeMiddle ? r.assigneeMiddle[0] + "." : ""}`}</span>
                      ) : ["SUBMITTED", "IN_PROGRESS", "NEEDS_INFO", "READY"].includes(r.status) ? (
                        <form action={takeRequestAction}><input type="hidden" name="id" value={r.id} /><button className="rounded-lg border border-line px-2.5 py-1 text-xs font-semibold hover:bg-surface-2" aria-label={`Взять себе заявку ${r.number}`}>Взять себе</button></form>
                      ) : <span className="text-muted">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      ) : <EmptyState icon={<Inbox />} title="Заявок по фильтру нет">Попробуйте другой статус или сбросьте фильтры.</EmptyState>}
      <div className="mt-4 flex justify-between">
        {page > 0 ? <Link href={qs({ page: String(page - 1) })} className="font-semibold text-primary dark:text-accent-text">← Назад</Link> : <span />}
        {hasMore && <Link href={qs({ page: String(page + 1) })} className="font-semibold text-primary dark:text-accent-text">Дальше →</Link>}
      </div>
    </div>
  );
}
