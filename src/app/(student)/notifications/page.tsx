import Link from "next/link";
import type { Metadata } from "next";
import { BellOff, CheckCheck, X } from "lucide-react";
import { requireStudent } from "@/server/auth/guards";
import { countMyUnread, getAnnouncementForMe, listMyNotifications, type NotifFilter } from "@/server/dal/student";
import { dayKey, fmt, nearDay, now, relativeDay } from "@/lib/time";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty";
import { NotificationItem } from "@/components/notifications/item";
import { markAllReadAction } from "./actions";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Уведомления" };

const FILTERS: [NotifFilter, string][] = [["all", "Все"], ["unread", "Непрочитанные"], ["important", "Важные"], ["SCHEDULE", "Расписание"], ["REQUEST", "Заявки"], ["ANNOUNCEMENT", "Объявления"], ["DEADLINE", "Сроки"]];

export default async function NotificationsPage({ searchParams }: { searchParams: Promise<{ f?: string; before?: string; a?: string }> }) {
  const v = await requireStudent();
  const sp = await searchParams;
  const filter = (FILTERS.find(([k]) => k === sp.f)?.[0] ?? "all") as NotifFilter;
  let cursor: { createdAt: Date; id: string } | null = null;
  if (sp.before) {
    const [ts, id] = sp.before.split("_");
    const d = new Date(Number(ts));
    if (!Number.isNaN(+d) && id) cursor = { createdAt: d, id };
  }
  const at = now();
  const [{ items, next }, unread, ann] = await Promise.all([listMyNotifications(v, filter, cursor), countMyUnread(v), sp.a ? getAnnouncementForMe(v, sp.a).catch(() => null) : null]);
  const q = (f: NotifFilter) => (f === "all" ? "/notifications" : `/notifications?f=${f}`);
  return (
    <div className="mx-auto max-w-3xl pt-2 lg:pt-0">
      <PageHeader title="Уведомления" subtitle={unread ? `Непрочитанных: ${unread}` : "Всё прочитано"} action={unread > 0 ? <form action={markAllReadAction}><Button variant="secondary" size="sm"><CheckCheck className="h-4 w-4" aria-hidden />Прочитать все</Button></form> : null} />
      {ann && (
        <Card className="mb-4 border-primary/30">
          <div className="flex items-start justify-between gap-3"><p className="text-xs font-semibold uppercase tracking-wider text-accent-text">{ann.source} · {fmt.dayMonth(ann.publishedAt)}</p><Link href={q(filter)} aria-label="Закрыть объявление" className="-m-1 rounded-lg p-1 text-muted hover:bg-surface-2"><X className="h-5 w-5" aria-hidden /></Link></div>
          <h2 className="mt-1 font-serif text-xl">{ann.title}</h2>
          <p className="mt-2 whitespace-pre-line">{ann.body}</p>
        </Card>
      )}
      <nav aria-label="Фильтры" className="-mx-4 mb-4 flex gap-1.5 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:px-0">
        {FILTERS.map(([k, label]) => (
          <Link key={k} href={q(k)} aria-current={filter === k ? "page" : undefined} className={cn("whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-medium", filter === k ? "border-primary bg-primary text-primary-fg" : "border-line bg-surface text-muted hover:text-fg")}>{label}{k === "unread" && unread ? ` · ${unread}` : ""}</Link>
        ))}
      </nav>
      {items.length ? (
        <>
          {/* Раунд 3: лента разбита по дням — «Сегодня», «Вчера», «11 ноября» */}
          <div className="space-y-5">
            {groupByDay(items, at).map((g) => (
              <section key={g.key} aria-labelledby={`day-${g.key}`}>
                <h2 id={`day-${g.key}`} className="mb-2 flex items-baseline gap-2 text-sm font-semibold">
                  <span className="first-letter:uppercase">{g.title}</span>{g.sub && <span className="font-normal text-muted">{g.sub}</span>}
                </h2>
                <ul className="grid gap-2">
                  {g.items.map((n) => <NotificationItem key={n.id} n={{ id: n.id, kind: n.kind, title: n.title, body: n.body, link: n.link, important: n.important, read: !!n.readAt }} when={fmt.time(n.createdAt)} />)}
                </ul>
              </section>
            ))}
          </div>
          {next && <div className="mt-4 text-center"><Link href={`${q(filter)}${filter === "all" ? "?" : "&"}before=${+next.createdAt}_${next.id}`} className="inline-flex h-11 items-center rounded-xl border border-line bg-surface px-4 font-semibold hover:bg-surface-2">Показать ещё</Link></div>}
        </>
      ) : <EmptyState icon={<BellOff />} title={filter === "unread" ? "Непрочитанных нет" : "Здесь пока пусто"}>Изменения расписания, статусы заявок и объявления деканата появятся здесь автоматически.</EmptyState>}
    </div>
  );
}

/** Группы по календарным дням (по Москве), в порядке ленты. */
function groupByDay<T extends { createdAt: Date }>(items: T[], at: Date) {
  const groups: { key: string; title: string; sub: string | null; items: T[] }[] = [];
  for (const n of items) {
    const key = dayKey(n.createdAt);
    let g = groups.at(-1);
    if (!g || g.key !== key) {
      const rel = relativeDay(n.createdAt, at);
      g = { key, title: rel, sub: nearDay(n.createdAt, at) || rel === "вчера" ? fmt.dayMonth(n.createdAt) : fmt.weekday(n.createdAt), items: [] };
      groups.push(g);
    }
    g.items.push(n);
  }
  return groups;
}
