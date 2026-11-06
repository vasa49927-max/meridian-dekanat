import Link from "next/link";
import type { Metadata } from "next";
import { Inbox, Search } from "lucide-react";
import { requireStaff } from "@/server/auth/guards";
import { staffQueue, type QueueFilter } from "@/server/dal/staff";
import { listRequestTypes } from "@/server/dal/requests";
import { fmt, now } from "@/lib/time";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { StatusBadge } from "@/components/requests/status";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Очередь заявок" };

const STATUS_TABS: [NonNullable<QueueFilter["status"]>, string, keyof Awaited<ReturnType<typeof staffQueue>>["stats"] | null][] = [
  ["active", "Активные", null], ["SUBMITTED", "Новые", "submitted"], ["IN_PROGRESS", "В работе", "inProgress"], ["NEEDS_INFO", "Ждут студента", "needsInfo"], ["READY", "Готовы к выдаче", "ready"], ["overdue", "Просрочены", "overdue"], ["ISSUED", "Выданы", null], ["REJECTED", "Отклонены", null],
];

export default async function StaffQueuePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const v = await requireStaff();
  const sp = await searchParams;
  const status = (STATUS_TABS.find(([k]) => k === sp.status)?.[0] ?? "active") as QueueFilter["status"];
  const filter: QueueFilter = { status, type: sp.type || undefined, faculty: sp.faculty || undefined, course: sp.course ? Number(sp.course) || undefined : undefined, q: sp.q?.slice(0, 50) || undefined };
  const page = Math.max(0, Number(sp.page) || 0);
  const [{ items, hasMore, stats }, types] = await Promise.all([staffQueue(v, filter, page), listRequestTypes()]);
  const at = now();
  const qs = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams(Object.entries({ ...sp, ...patch }).filter(([, val]) => val) as [string, string][]);
    return `/staff?${p}`;
  };
  return (
    <div className="pt-2 lg:pt-0">
      <PageHeader title="Очередь заявок" subtitle={`Здравствуйте, ${v.firstName} ${v.middleName ?? ""}. Сначала — с ближайшим сроком.`} />
      <nav aria-label="Статус" className="-mx-4 mb-3 flex gap-1.5 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:px-0">
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
              <tr><th className="px-4 py-3 font-semibold">Заявка</th><th className="px-4 py-3 font-semibold">Студент</th><th className="px-4 py-3 font-semibold">Срок</th><th className="px-4 py-3 font-semibold">Статус</th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {items.map((r) => {
                const overdue = r.dueAt < at && ["SUBMITTED", "IN_PROGRESS"].includes(r.status);
                return (
                  <tr key={r.id} className="block px-4 py-3 hover:bg-surface-2/60 md:table-row md:p-0">
                    <td className="block md:table-cell md:px-4 md:py-3"><Link href={`/staff/requests/${r.id}`} className="font-semibold hover:underline">{r.title}</Link><span className="block text-xs text-muted">{r.number} · {fmt.dateTime(r.createdAt)}</span></td>
                    <td className="block md:table-cell md:px-4 md:py-3">{r.lastName} {r.firstName[0]}. {r.middleName?.[0]}.<span className="block text-xs text-muted">{r.faculty} · {r.course} курс · гр. {r.group}</span></td>
                    <td className="inline-block pr-3 md:table-cell md:px-4 md:py-3">{overdue ? <Badge tone="danger">просрочена · {fmt.dayMonthShort(r.dueAt)}</Badge> : <span className="tabular">{fmt.dayMonthShort(r.dueAt)}</span>}</td>
                    <td className="inline-block md:table-cell md:px-4 md:py-3"><StatusBadge status={r.status} /></td>
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
