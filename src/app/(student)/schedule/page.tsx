import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeftRight, Ban, CalendarArrowDown, ChevronLeft, ChevronRight, MapPin, Shield } from "lucide-react";
import { requireStudent } from "@/server/auth/guards";
import { listMyLessons, type LessonView } from "@/server/dal/student";
import { addDays, dayKey, isSameDay, mskParts, now, parseDayKey, startOfDay, startOfWeek } from "@/lib/time";
import { PageHeader } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty";
import { Badge } from "@/components/ui/badge";
import { teacherShortI18n } from "@/components/schedule/lesson-meta";
import { ChangeChip, ChangeLines, changeKind } from "@/components/schedule/change-banner";
import { SessionView } from "@/components/schedule/session-view";
import { cn } from "@/lib/cn";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("schedule.title") };
}

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat"] as const;

async function LessonCard({ l, at, compact }: { l: LessonView; at: Date; compact?: boolean }) {
  const { t, tr, tc, name, f } = await getI18n();
  const title = tr("subjects", l.title);
  const type = t(`common.lessonType.${l.type}`);
  const kind = changeKind(l);
  const live = l.startsAt <= at && l.endsAt > at && l.status !== "CANCELLED";
  // Правка капитана №3b: отменённая пара — полоса «Пара отменена» на всю ширину карточки, детали приглушены.
  // Раунд 2: цвет мягче — розоватая полоса с красным текстом вместо сплошной красной заливки.
  if (kind === "cancel") return (
    <article className="min-w-0 overflow-hidden rounded-2xl border border-danger-line bg-danger-bg/50" aria-label={t("schedule.lesson.cancelledAria", { time: f.time(l.startsAt), title })}>
      <p className="flex items-center gap-2 border-b border-danger-line bg-danger-bg px-3.5 py-1.5 text-sm font-bold uppercase tracking-wide text-danger"><Ban className="h-4 w-4" aria-hidden />{t("schedule.lesson.cancelled")}</p>
      <div className="p-3.5">
        <p className="text-sm font-semibold tabular text-muted">{f.time(l.startsAt)}–{f.time(l.endsAt)} · {type}</p>
        <h3 className="mt-0.5 font-semibold leading-snug text-muted">{title}</h3>
        {l.changeNote && <p className="mt-1.5 text-[13px] font-medium text-danger">{tc(l.changeNote)}</p>}
      </div>
    </article>
  );
  return (
    <article className={cn("min-w-0 rounded-2xl border bg-surface p-3.5", kind ? "border-warn-line border-l-4 border-l-warn" : "border-line", live && "ring-2 ring-accent")}
      aria-label={`${f.time(l.startsAt)} ${title}${kind === "move" ? t("schedule.lesson.movedAria") : kind === "room" ? t("schedule.lesson.roomAria") : ""}`}>
      <div className={cn("flex items-start gap-3", compact && "flex-col gap-1")}>
        <div className={cn("w-12 shrink-0 tabular", compact && "flex w-auto items-baseline gap-1.5")}>
          <p className="font-semibold">{f.time(l.startsAt)}</p>
          <p className="text-xs text-muted">{compact ? "– " : ""}{f.time(l.endsAt)}</p>
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            <Badge tone={l.type === "EXAM" || l.type === "CREDIT" ? "danger" : l.type === "MILITARY" ? "primary" : "neutral"}>{l.type === "MILITARY" && <Shield className="h-3 w-3" aria-hidden />}{type}</Badge>
            {live && <Badge tone="ok">{t("schedule.lesson.live")}</Badge>}
            {kind && <ChangeChip kind={kind} />}
            {l.subgroup && l.subgroup !== 9 && <Badge>{t("schedule.lesson.subgroup", { n: l.subgroup })}</Badge>}
          </div>
          <h3 className="font-semibold leading-snug">{title}</h3>
          {!compact && <p className="mt-0.5 text-[13px] text-muted">{teacherShortI18n(l, tr, name)}</p>}
          <p className="mt-1 flex items-center gap-1 text-[13px]"><MapPin className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden />{t("schedule.lesson.room", { room: l.room })} · {tr("buildings", l.buildingName)}{l.campus === "ODINTSOVO" ? t("schedule.lesson.odintsovo") : ""}</p>
          {kind && <p className="mt-1.5 rounded-lg bg-warn-bg/70 px-2.5 py-1.5 text-sm"><ChangeLines l={l} /></p>}
        </div>
      </div>
    </article>
  );
}

export default async function SchedulePage({ searchParams }: { searchParams: Promise<{ d?: string; view?: string }> }) {
  const v = await requireStudent();
  const { t, f } = await getI18n();
  const sp = await searchParams;
  const at = now();
  const view = sp.view === "week" ? "week" : sp.view === "session" ? "session" : "day";
  const selected = parseDayKey(sp.d) ?? startOfDay(at);
  const week = startOfWeek(selected);
  const lessons = await listMyLessons(v, week, addDays(week, 7));
  const days = Array.from({ length: 6 }, (_, i) => addDays(week, i));
  const byDay = (d: Date) => lessons.filter((l) => isSameDay(l.startsAt, d));
  const changesCount = lessons.filter((l) => l.status !== "SCHEDULED").length;
  // Ближайший следующий день с занятиями (для пустого состояния): в пределах недели или понедельник следующей.
  const nextStudyDay = days.find((d) => d > selected && byDay(d).length) ?? addDays(week, 7);
  const sundayLessons = byDay(addDays(week, 6));
  const q = (d: Date, vv: typeof view = view === "session" ? "day" : view) => (vv === "session" ? "/schedule?view=session" : `/schedule?d=${dayKey(d)}${vv === "week" ? "&view=week" : ""}`);
  const p = mskParts(week);
  const weekNo = Math.floor((+week - +startOfWeek(new Date(Date.UTC(2026, 8, 1)))) / (7 * 86400000)) + 1;

  return (
    <div className="pt-2 lg:pt-0">
      {/* Правка капитана №3a: даты недели — крупно, номер недели — подписью. */}
      <PageHeader title={t("schedule.title")} subtitle={view === "session" ? <span className="block font-serif text-xl font-bold text-fg lg:text-2xl">{t("schedule.sessionTitle", { y: p.y, y2: String(p.y + 1).slice(2) })}</span> : <><span className="block font-serif text-xl font-bold text-fg lg:text-2xl">{t("schedule.weekRange", { d: p.d, start: f.dayMonth(week), end: f.dayMonth(addDays(week, 5)), y: p.y })}</span>{weekNo > 0 && weekNo < 30 ? <span className="text-sm">{t("schedule.weekNo", { n: weekNo })}</span> : null}</>}
        action={<LinkButton href="/schedule/calendar" variant="secondary" size="sm"><CalendarArrowDown className="h-4 w-4" aria-hidden />{t("schedule.toCalendar")}</LinkButton>} />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <nav aria-label={t("schedule.views.label")} className="inline-flex rounded-xl border border-line bg-surface p-1">
          {(["day", "week", "session"] as const).map((vv) => (
            <Link key={vv} aria-current={view === vv ? "page" : undefined} href={q(selected, vv)} className={cn("rounded-lg px-3.5 py-1.5 text-sm font-semibold", view === vv ? "bg-primary text-primary-fg" : "text-muted hover:text-fg")}>{t(`schedule.views.${vv}`)}</Link>
          ))}
        </nav>
        {view !== "session" && <div className="ml-auto flex items-center gap-1">
          <Link href={q(addDays(view === "week" ? week : selected, view === "week" ? -7 : -1))} className="grid h-10 w-9 place-items-center rounded-xl border border-line bg-surface hover:bg-surface-2" aria-label={view === "week" ? t("schedule.nav.prevWeek") : t("schedule.nav.prevDay")}><ChevronLeft className="h-5 w-5" aria-hidden /></Link>
          <Link href={q(startOfDay(at))} className="h-10 rounded-xl border border-line bg-surface px-2.5 text-sm font-semibold leading-10 hover:bg-surface-2">{t("schedule.nav.today")}</Link>
          <Link href={q(addDays(view === "week" ? week : selected, view === "week" ? 7 : 1))} className="grid h-10 w-9 place-items-center rounded-xl border border-line bg-surface hover:bg-surface-2" aria-label={view === "week" ? t("schedule.nav.nextWeek") : t("schedule.nav.nextDay")}><ChevronRight className="h-5 w-5" aria-hidden /></Link>
        </div>}
      </div>

      {view === "session" ? <SessionView v={v} at={at} /> : <>
      {changesCount > 0 && (
        <p className="mb-4 flex items-center gap-2 rounded-xl border border-warn-line bg-warn-bg px-3.5 py-2.5 text-sm font-medium text-warn"><ArrowLeftRight className="h-4 w-4 shrink-0" aria-hidden />{t("schedule.changesNote", { n: changesCount })}</p>
      )}

      {view === "day" ? (
        <>
          <nav aria-label={t("schedule.days.label")} className="mb-4 grid grid-cols-6 gap-1.5">
            {days.map((d, i) => {
              const sel = isSameDay(d, selected);
              const list = byDay(d);
              const hasChange = list.some((l) => l.status !== "SCHEDULED");
              return (
                <Link key={i} href={q(d)} aria-current={sel ? "date" : undefined} aria-label={`${t("schedule.dayAria", { short: t(`schedule.days.${DAYS[i]}`), d: mskParts(d).d, weekday: f.weekday(d), date: f.dayMonth(d), n: list.length })}${hasChange ? t("schedule.dayAriaChanges") : ""}`}
                  className={cn("relative flex flex-col items-center rounded-xl border py-2", sel ? "border-primary bg-primary text-primary-fg" : "border-line bg-surface hover:bg-surface-2", isSameDay(d, at) && !sel && "border-accent")}>
                  <span className="text-[13px] font-semibold uppercase opacity-90">{t(`schedule.days.${DAYS[i]}`)}</span>
                  <span className="text-2xl font-bold leading-tight tabular">{mskParts(d).d}</span>
                  <span className="mt-0.5 flex h-1.5 gap-0.5" aria-hidden>{list.slice(0, 4).map((l) => <i key={l.id} className={cn("h-1.5 w-1.5 rounded-full", l.status !== "SCHEDULED" ? "bg-warn" : sel ? "bg-primary-fg/70" : "bg-muted/50")} />)}</span>
                  {hasChange && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-warn" />}
                </Link>
              );
            })}
          </nav>
          <h2 className="mb-3 font-serif text-xl font-bold lg:text-2xl">{f.longDay(selected)}{isSameDay(selected, at) ? <span className="ml-2 align-middle font-sans text-sm font-semibold text-accent-text">{t("schedule.todayBadge")}</span> : null}</h2>
          {byDay(selected).length ? (
            <div className="grid gap-2.5">{byDay(selected).map((l) => <LessonCard key={l.id} l={l} at={at} />)}</div>
          ) : (
            <EmptyState title={t("schedule.empty.title")} icon={<CalendarArrowDown />} action={<Link href={q(nextStudyDay)} className="inline-flex h-11 items-center rounded-xl bg-primary-soft px-4 font-semibold text-primary dark:text-accent-text">{t("schedule.empty.show", { date: f.shortDay(nextStudyDay) })}</Link>}>
              {mskParts(selected).weekday === 7 ? t("schedule.empty.sunday") : t("schedule.empty.free")}
            </EmptyState>
          )}
        </>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3 2xl:grid-cols-6 2xl:gap-3">
          {days.map((d, i) => {
            const list = byDay(d);
            return (
              <section key={i} aria-label={f.longDay(d)} className={cn("min-w-0", isSameDay(d, at) && "rounded-2xl xl:bg-primary-soft/40 xl:p-1.5")}>
                <h2 className={cn("mb-2 flex items-baseline gap-2 px-1 text-lg font-bold", isSameDay(d, at) && "text-primary dark:text-accent-text")}>
                  <span>{f.longDay(d)}</span>{isSameDay(d, at) && <span className="text-xs font-semibold uppercase">{t("schedule.todayBadge")}</span>}
                </h2>
                {list.length ? <div className="grid grid-cols-[minmax(0,1fr)] gap-2">{list.map((l) => <LessonCard key={l.id} l={l} at={at} compact />)}</div> : <p className="rounded-2xl border border-dashed border-line px-3 py-4 text-center text-sm text-muted">{t("schedule.noPairs")}</p>}
              </section>
            );
          })}
          {sundayLessons.length > 0 && <p className="text-sm text-muted">{t("schedule.sundayCount", { n: sundayLessons.length })}</p>}
        </div>
      )}
      </>}
    </div>
  );
}
