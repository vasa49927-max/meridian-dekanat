import { CalendarClock, Clock, ListChecks, Users } from "lucide-react";
import { requireStudent } from "@/server/auth/guards";
import { listMyElectives, MAX_CHOICES } from "@/server/dal/electives";
import { now } from "@/lib/time";
import { getI18n } from "@/i18n/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty";
import { GradesTabs } from "@/components/grades/grades-tabs";
import { ElectiveButton } from "@/components/electives/elective-button";
import { cn } from "@/lib/cn";

export async function generateMetadata() {
  const { t } = await getI18n();
  return { title: t("electives.title") };
}

const DAY: Record<string, "mon" | "tue" | "wed" | "thu" | "fri" | "sat"> = { Пн: "mon", Вт: "tue", Ср: "wed", Чт: "thu", Пт: "fri", Сб: "sat" };
const TITLE = /^(доц\.|проф\.|ст\. преп\.|преп\.)\s+(.+)$/;

/** Курсы по выбору (раунд 8): запись с ограничением мест и листом ожидания. */
export default async function ElectivesPage() {
  const v = await requireStudent();
  const { t, tn, tr, name, f } = await getI18n();
  const { items, window, mine } = await listMyElectives(v);
  const at = now();
  const slot = (s: string) => { const m = s.match(/^(Пн|Вт|Ср|Чт|Пт|Сб), (\d{1,2}:\d{2}) · ауд\. (.+)$/); return m ? t("electives.slot", { day: t(`schedule.days.${DAY[m[1]]}`), time: m[2], room: m[3] }) : s; };
  const teacher = (s: string) => { const m = s.match(TITLE); return m ? `${tr("titles", m[1])} ${name(m[2])}` : name(s); };
  const sorted = [...items].sort((a, b) => Number(!!b.myStatus) - Number(!!a.myStatus));
  return (
    <div className="pt-2 lg:pt-0">
      <PageHeader title={t("grades.title")} subtitle={t("electives.subtitle")} />
      <GradesTabs active="electives" labels={{ aria: t("grades.tabs.aria"), current: t("grades.tabs.current"), record: t("grades.tabs.record"), electives: t("electives.tab") }} />
      {window && (
        <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_1.2fr]">
          <Card className={cn("flex items-start gap-3", window.open ? "border-primary/30" : "")}>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary dark:text-accent-text" aria-hidden><CalendarClock className="h-5 w-5" /></span>
            <div>
              <p className="font-semibold">{window.open ? t("electives.window.open", { date: f.dayMonth(window.closesAt) }) : at < window.opensAt ? t("electives.window.soon", { date: f.dayMonth(window.opensAt) }) : t("electives.window.closed", { date: f.dayMonth(window.closesAt) })}</p>
              {window.open && <p className="text-sm text-muted">{tn("electives.window.openLeft", Math.max(1, Math.ceil((+window.closesAt - +at) / 86400000)))}</p>}
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-surface-2 px-2.5 py-1 text-sm font-semibold"><ListChecks className="h-4 w-4 text-accent-text" aria-hidden />{t("electives.mine", { n: mine, max: MAX_CHOICES })}</p>
            </div>
          </Card>
          <Card>
            <h2 className="mb-1.5 text-[13px] font-semibold uppercase tracking-[0.06em] text-accent-text">{t("electives.rules.title")}</h2>
            <ol className="list-decimal space-y-0.5 pl-5 text-sm text-muted">
              <li>{t("electives.rules.r1", { n: MAX_CHOICES })}</li><li>{t("electives.rules.r2")}</li><li>{t("electives.rules.r3")}</li>
            </ol>
          </Card>
        </div>
      )}
      {!items.length ? <EmptyState title={t("electives.title")} /> : (
        <ul className="stagger grid gap-3 lg:grid-cols-2">
          {sorted.map((e) => {
            const pct = Math.round((e.taken / e.capacity) * 100);
            const full = e.free === 0;
            return (
              <Card as="li" key={e.id} className={cn("flex flex-col", e.myStatus === "ENROLLED" && "border-ok/40", e.myStatus === "WAITLIST" && "border-warn-line")}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-semibold leading-snug">{tr("electives", e.title)}</h2>
                    <p className="text-[13px] text-muted">{teacher(e.teacher)} · {t("electives.credits", { n: e.credits })}{e.minCourse > 1 ? ` · ${t("electives.fromCourse", { n: e.minCourse })}` : ""}</p>
                  </div>
                  {e.myStatus && <Badge tone={e.myStatus === "ENROLLED" ? "ok" : "warn"} className="shrink-0">{t(`electives.status.${e.myStatus}`, { pos: e.myPosition ?? 1 })}</Badge>}
                </div>
                <p className="mt-2 text-sm">{tr("electives", e.description)}</p>
                <p className="mt-2 flex items-center gap-1.5 text-[13px] text-muted"><Clock className="h-3.5 w-3.5" aria-hidden />{slot(e.slot)}</p>
                <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-3">
                  <div className="min-w-[180px] flex-1">
                    <div className="flex items-baseline justify-between gap-2 text-[13px]">
                      <span className="inline-flex items-center gap-1 text-muted"><Users className="h-3.5 w-3.5" aria-hidden />{t("electives.seats", { taken: e.taken, capacity: e.capacity })}</span>
                      <span className={cn("font-semibold", full ? "text-danger" : e.free <= 3 ? "text-warn" : "text-ok")}>{full ? t("electives.full") : tn("electives.free", e.free)}</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2" role="img" aria-label={t("electives.seats", { taken: e.taken, capacity: e.capacity })}>
                      <div className={cn("h-full rounded-full", full ? "bg-danger" : e.free <= 3 ? "bg-warn" : "bg-primary dark:bg-accent/80")} style={{ width: `${pct}%` }} />
                    </div>
                    {e.waiting > 0 && <p className="mt-1 text-xs text-muted">{t("electives.waiting", { n: e.waiting })}</p>}
                  </div>
                  <ElectiveButton id={e.id} mine={e.myStatus} full={full} disabled={!window?.open || (!e.myStatus && mine >= MAX_CHOICES)} />
                </div>
              </Card>
            );
          })}
        </ul>
      )}
    </div>
  );
}
