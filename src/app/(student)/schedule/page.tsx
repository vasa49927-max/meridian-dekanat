import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeftRight, Ban, CalendarArrowDown, ChevronLeft, ChevronRight, MapPin, Shield } from "lucide-react";
import { requireStudent } from "@/server/auth/guards";
import { listMyLessons, type LessonView } from "@/server/dal/student";
import { addDays, dayKey, fmt, isSameDay, mskParts, now, parseDayKey, startOfDay, startOfWeek } from "@/lib/time";
import { PageHeader } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty";
import { Badge } from "@/components/ui/badge";
import { LESSON_TYPE, teacherShort } from "@/components/schedule/lesson-meta";
import { ChangeChip, ChangeLines, changeKind } from "@/components/schedule/change-banner";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Расписание" };

const DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

function LessonCard({ l, at, compact }: { l: LessonView; at: Date; compact?: boolean }) {
  const kind = changeKind(l);
  const live = l.startsAt <= at && l.endsAt > at && l.status !== "CANCELLED";
  // Правка капитана №3b: отменённая пара — красная полоса «ПАРА ОТМЕНЕНА» на всю ширину карточки, детали приглушены.
  if (kind === "cancel") return (
    <article className="min-w-0 overflow-hidden rounded-2xl border-2 border-danger/50 bg-danger-bg/60" aria-label={`${fmt.time(l.startsAt)} ${l.title}, пара отменена`}>
      <p className="flex items-center gap-2 bg-danger-solid px-3.5 py-1.5 text-sm font-bold uppercase tracking-wide text-white"><Ban className="h-4 w-4" aria-hidden />Пара отменена</p>
      <div className="p-3.5">
        <p className="text-sm font-semibold tabular text-muted">{fmt.time(l.startsAt)}–{fmt.time(l.endsAt)} · {LESSON_TYPE[l.type]}</p>
        <h3 className="mt-0.5 font-semibold leading-snug text-muted">{l.title}</h3>
        {l.changeNote && <p className="mt-1.5 text-[13px] font-medium text-danger">{l.changeNote}</p>}
      </div>
    </article>
  );
  return (
    <article className={cn("min-w-0 rounded-2xl border bg-surface p-3.5", kind ? "border-warn-line border-l-4 border-l-warn" : "border-line", live && "ring-2 ring-accent")}
      aria-label={`${fmt.time(l.startsAt)} ${l.title}${kind === "move" ? ", перенос" : kind === "room" ? ", другая аудитория" : ""}`}>
      <div className={cn("flex items-start gap-3", compact && "flex-col gap-1")}>
        <div className={cn("w-12 shrink-0 tabular", compact && "flex w-auto items-baseline gap-1.5")}>
          <p className="font-semibold">{fmt.time(l.startsAt)}</p>
          <p className="text-xs text-muted">{compact ? "– " : ""}{fmt.time(l.endsAt)}</p>
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            <Badge tone={l.type === "EXAM" || l.type === "CREDIT" ? "danger" : l.type === "MILITARY" ? "primary" : "neutral"}>{l.type === "MILITARY" && <Shield className="h-3 w-3" aria-hidden />}{LESSON_TYPE[l.type]}</Badge>
            {live && <Badge tone="ok">идёт сейчас</Badge>}
            {kind && <ChangeChip kind={kind} />}
            {l.subgroup && l.subgroup !== 9 && <Badge>подгруппа {l.subgroup}</Badge>}
          </div>
          <h3 className="font-semibold leading-snug">{l.title}</h3>
          {!compact && <p className="mt-0.5 text-[13px] text-muted">{teacherShort(l)}</p>}
          <p className="mt-1 flex items-center gap-1 text-[13px]"><MapPin className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden />ауд. {l.room} · {l.buildingName}{l.campus === "ODINTSOVO" ? " (Одинцово)" : ""}</p>
          {kind && <p className="mt-1.5 rounded-lg bg-warn-bg/70 px-2.5 py-1.5 text-sm"><ChangeLines l={l} /></p>}
        </div>
      </div>
    </article>
  );
}

export default async function SchedulePage({ searchParams }: { searchParams: Promise<{ d?: string; view?: string }> }) {
  const v = await requireStudent();
  const sp = await searchParams;
  const at = now();
  const view = sp.view === "week" ? "week" : "day";
  const selected = parseDayKey(sp.d) ?? startOfDay(at);
  const week = startOfWeek(selected);
  const lessons = await listMyLessons(v, week, addDays(week, 7));
  const days = Array.from({ length: 6 }, (_, i) => addDays(week, i));
  const byDay = (d: Date) => lessons.filter((l) => isSameDay(l.startsAt, d));
  const changesCount = lessons.filter((l) => l.status !== "SCHEDULED").length;
  // Ближайший следующий день с занятиями (для пустого состояния): в пределах недели или понедельник следующей.
  const nextStudyDay = days.find((d) => d > selected && byDay(d).length) ?? addDays(week, 7);
  const sundayLessons = byDay(addDays(week, 6));
  const q = (d: Date, vv = view) => `/schedule?d=${dayKey(d)}${vv === "week" ? "&view=week" : ""}`;
  const p = mskParts(week);
  const weekNo = Math.floor((+week - +startOfWeek(new Date(Date.UTC(2026, 8, 1)))) / (7 * 86400000)) + 1;

  return (
    <div className="pt-2 lg:pt-0">
      {/* Правка капитана №3a: даты недели — крупно, номер недели — подписью. */}
      <PageHeader title="Расписание" subtitle={<><span className="block font-serif text-xl font-bold text-fg lg:text-2xl">{mskParts(week).d} — {fmt.dayMonth(addDays(week, 5))} {p.y}</span>{weekNo > 0 && weekNo < 30 ? <span className="text-sm">{weekNo}-я учебная неделя</span> : null}</>}
        action={<LinkButton href="/api/schedule.ics" variant="secondary" size="sm" prefetch={false}><CalendarArrowDown className="h-4 w-4" aria-hidden />В календарь (.ics)</LinkButton>} />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <nav aria-label="Вид расписания" className="inline-flex rounded-xl border border-line bg-surface p-1">
          {(["day", "week"] as const).map((vv) => (
            <Link key={vv} aria-current={view === vv ? "page" : undefined} href={q(selected, vv)} className={cn("rounded-lg px-3.5 py-1.5 text-sm font-semibold", view === vv ? "bg-primary text-primary-fg" : "text-muted hover:text-fg")}>{vv === "day" ? "День" : "Неделя"}</Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <Link href={q(addDays(view === "week" ? week : selected, view === "week" ? -7 : -1))} className="grid h-10 w-9 place-items-center rounded-xl border border-line bg-surface hover:bg-surface-2" aria-label={view === "week" ? "Предыдущая неделя" : "Предыдущий день"}><ChevronLeft className="h-5 w-5" aria-hidden /></Link>
          <Link href={q(startOfDay(at))} className="h-10 rounded-xl border border-line bg-surface px-2.5 text-sm font-semibold leading-10 hover:bg-surface-2">Сегодня</Link>
          <Link href={q(addDays(view === "week" ? week : selected, view === "week" ? 7 : 1))} className="grid h-10 w-9 place-items-center rounded-xl border border-line bg-surface hover:bg-surface-2" aria-label={view === "week" ? "Следующая неделя" : "Следующий день"}><ChevronRight className="h-5 w-5" aria-hidden /></Link>
        </div>
      </div>

      {changesCount > 0 && (
        <p className="mb-4 flex items-center gap-2 rounded-xl border border-warn-line bg-warn-bg px-3.5 py-2.5 text-sm font-medium text-warn"><ArrowLeftRight className="h-4 w-4 shrink-0" aria-hidden />На этой неделе изменений в расписании: {changesCount}. Они выделены цветом — и продублированы в уведомлениях.</p>
      )}

      {view === "day" ? (
        <>
          <nav aria-label="Дни недели" className="mb-4 grid grid-cols-6 gap-1.5">
            {days.map((d, i) => {
              const sel = isSameDay(d, selected);
              const list = byDay(d);
              const hasChange = list.some((l) => l.status !== "SCHEDULED");
              return (
                <Link key={i} href={q(d)} aria-current={sel ? "date" : undefined} aria-label={`${DAYS[i]} ${mskParts(d).d} — ${fmt.weekday(d)}, ${fmt.dayMonth(d)}: занятий ${list.length}${hasChange ? ", есть изменения" : ""}`}
                  className={cn("relative flex flex-col items-center rounded-xl border py-2", sel ? "border-primary bg-primary text-primary-fg" : "border-line bg-surface hover:bg-surface-2", isSameDay(d, at) && !sel && "border-accent")}>
                  <span className="text-[13px] font-semibold uppercase opacity-90">{DAYS[i]}</span>
                  <span className="text-2xl font-bold leading-tight tabular">{mskParts(d).d}</span>
                  <span className="mt-0.5 flex h-1.5 gap-0.5" aria-hidden>{list.slice(0, 4).map((l) => <i key={l.id} className={cn("h-1.5 w-1.5 rounded-full", l.status !== "SCHEDULED" ? "bg-warn" : sel ? "bg-primary-fg/70" : "bg-muted/50")} />)}</span>
                  {hasChange && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-warn" />}
                </Link>
              );
            })}
          </nav>
          <h2 className="mb-3 font-serif text-xl font-bold lg:text-2xl">{fmt.longDay(selected)}{isSameDay(selected, at) ? <span className="ml-2 align-middle font-sans text-sm font-semibold text-accent-text">сегодня</span> : null}</h2>
          {byDay(selected).length ? (
            <div className="grid gap-2.5">{byDay(selected).map((l) => <LessonCard key={l.id} l={l} at={at} />)}</div>
          ) : (
            <EmptyState title="Занятий нет" icon={<CalendarArrowDown />} action={<Link href={q(nextStudyDay)} className="inline-flex h-11 items-center rounded-xl bg-primary-soft px-4 font-semibold text-primary dark:text-accent-text">Показать {fmt.shortDay(nextStudyDay)} →</Link>}>
              {mskParts(selected).weekday === 7 ? "Воскресенье — выходной." : "В этот день пар нет — можно заняться курсовой или записаться к методисту."}
            </EmptyState>
          )}
        </>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3 2xl:grid-cols-6 2xl:gap-3">
          {days.map((d, i) => {
            const list = byDay(d);
            return (
              <section key={i} aria-label={fmt.longDay(d)} className={cn("min-w-0", isSameDay(d, at) && "rounded-2xl xl:bg-primary-soft/40 xl:p-1.5")}>
                <h2 className={cn("mb-2 flex items-baseline gap-2 px-1 text-lg font-bold", isSameDay(d, at) && "text-primary dark:text-accent-text")}>
                  <span>{fmt.weekday(d).replace(/^./, (c) => c.toUpperCase())}, {fmt.dayMonthShort(d)}</span>{isSameDay(d, at) && <span className="text-xs font-semibold uppercase">сегодня</span>}
                </h2>
                {list.length ? <div className="grid grid-cols-[minmax(0,1fr)] gap-2">{list.map((l) => <LessonCard key={l.id} l={l} at={at} compact />)}</div> : <p className="rounded-2xl border border-dashed border-line px-3 py-4 text-center text-sm text-muted">Нет пар</p>}
              </section>
            );
          })}
          {sundayLessons.length > 0 && <p className="text-sm text-muted">В воскресенье: {sundayLessons.length} зан.</p>}
        </div>
      )}
    </div>
  );
}
