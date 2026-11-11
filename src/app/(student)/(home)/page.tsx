import Link from "next/link";
import { ArrowRight, CalendarCheck2, Coffee, FileText, Megaphone, Sparkles } from "lucide-react";
import { requireStudent } from "@/server/auth/guards";
import { getMyGrades, getNextLesson, listMyDeadlines, listMyLessons, listMyNotifications, listMyUpcomingChanges } from "@/server/dal/student";
import { listMyRequests } from "@/server/dal/requests";
import { TZ, addDays, mskParts, now, startOfDay } from "@/lib/time";
import { averagePoints } from "@/lib/brs";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty";
import { NextLessonCard } from "@/components/today/next-lesson";
import { ChangeBanner, ChangeChip, changeKind } from "@/components/schedule/change-banner";
import { teacherShort } from "@/components/schedule/lesson-meta";
import { StatusBadge } from "@/components/requests/status";
import { cn } from "@/lib/cn";
import { getI18n } from "@/i18n/server";
import { riskText } from "@/i18n/brs";
import { INTL_LOCALE } from "@/i18n/config";

export async function generateMetadata() {
  const { t } = await getI18n();
  return { title: t("common.nav.today") };
}

function greeting(d: Date) {
  const h = mskParts(d).hh;
  if (h >= 5 && h < 12) return "morning" as const;
  if (h >= 12 && h < 17) return "day" as const;
  if (h >= 17 && h < 23) return "evening" as const;
  return "night" as const;
}

export default async function TodayPage() {
  const v = await requireStudent();
  const { t, tn, tr, name, f } = await getI18n();
  const at = now();
  const dayStart = startOfDay(at);
  const [next, today, changes, deadlines, reqs, grades, news] = await Promise.all([
    getNextLesson(v, at), listMyLessons(v, dayStart, addDays(dayStart, 1)), listMyUpcomingChanges(v, at), listMyDeadlines(v, at, 4),
    listMyRequests(v, null, 10), getMyGrades(v), listMyNotifications(v, "ANNOUNCEMENT", null, 3),
  ]);
  // Сегодня пар нет (вечер/выходной) — показываем день ближайшей пары, а не пустую карточку (UX-ревью №11).
  const todayActive = today.filter((l) => l.status !== "CANCELLED");
  const showNextDay = !todayActive.length && next;
  const dayList = showNextDay ? await listMyLessons(v, startOfDay(next.startsAt), addDays(startOfDay(next.startsAt), 1)) : today;
  const isTomorrow = showNextDay && f.near(next.startsAt, at) === f.rel(addDays(at, 1), at);
  const dayTitle = showNextDay ? (isTomorrow ? t("today.day.tomorrow", { date: f.dayMonth(next.startsAt) }) : f.longDay(next.startsAt)) : t("common.nav.today");
  // Название месяца для «листка календаря»: в русском — родительный падеж из «11 ноября», как раньше.
  const monthName = f.locale === "ru" ? f.dayMonth(at).split(" ")[1] : new Intl.DateTimeFormat(INTL_LOCALE[f.locale], { timeZone: TZ, month: "long" }).format(at);
  const teacher = next ? teacherShort({
    teacherTitle: next.teacherTitle ? tr("titles", next.teacherTitle) : null, teacherLast: next.teacherLast ? name(next.teacherLast) : null,
    teacherFirst: next.teacherFirst ? name(next.teacherFirst) : null, teacherMiddle: next.teacherMiddle ? name(next.teacherMiddle) : null,
  }) : null;
  const activeReqs = reqs.items.filter((r) => r.status !== "ISSUED" && r.status !== "REJECTED").slice(0, 3);
  const pastAvg = averagePoints(grades.past.map((g) => g.points));
  const autoDone = grades.current.filter((d) => d.summary.auto?.achieved).length;
  const risky = grades.current.filter((d) => d.summary.risk !== "none");
  const gradedMax = grades.current.reduce((s, d) => s + d.summary.gradedMax, 0);
  const earned = grades.current.reduce((s, d) => s + d.summary.earned, 0);
  const pace = gradedMax ? Math.round((earned / gradedMax) * 100) : null;
  // Идея из опроса однокурсников: «рейтинг по предметам, которые сегодня в расписании».
  const todayNames = new Set(dayList.filter((l) => l.status !== "CANCELLED").map((l) => l.title));
  const todayGrades = grades.current.filter((d) => todayNames.has(d.name)).slice(0, 3);

  return (
    <div className="pt-2 lg:pt-0">
      {/* Правка капитана №2a: день недели и дата — крупно, «листком календаря». */}
      <div className="mb-5 flex items-center gap-3.5">
        <div className="w-[68px] shrink-0 overflow-hidden rounded-2xl border border-line bg-surface text-center shadow-[var(--shadow-card)]" aria-hidden>
          <p className="bg-hero py-0.5 text-[11px] font-bold uppercase tracking-wider text-accent">{f.weekdayShort(at)}</p>
          <p className="pt-1 font-serif text-[30px] font-bold leading-none tabular">{mskParts(at).d}</p>
          <p className="pb-1.5 text-[11px] font-medium text-muted">{monthName}</p>
        </div>
        <div className="min-w-0">
          <p className="text-lg font-semibold leading-tight lg:text-xl">{f.longDay(at)}</p>
          <h1 className="font-serif text-[24px] leading-tight lg:text-[32px]">{t(`today.greeting.${greeting(at)}`, { name: name(v.firstName) })}</h1>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-3 lg:gap-4">
        <div className="lg:col-span-2">
          {next ? (
            <NextLessonCard
              title={tr("subjects", next.title)} type={t(`common.lessonType.${next.type}`)} startsAt={next.startsAt.toISOString()} endsAt={next.endsAt.toISOString()}
              room={next.room} building={tr("buildings", next.buildingName)} address={tr("addresses", next.buildingAddress)} hint={next.buildingHint ? tr("hints", next.buildingHint) : null}
              teacher={teacher} teacherInitials={`${name(next.teacherLast)[0] ?? ""}${name(next.teacherFirst)[0] ?? ""}`} serverNow={at.toISOString()}
              moved={next.status === "MOVED"} prevText={next.prevStartsAt ? t("today.next.prev", { day: f.shortDay(next.prevStartsAt), time: f.time(next.prevStartsAt), room: next.prevRoom ?? "" }) : null}
            />
          ) : (
            <Card className="h-full"><EmptyState icon={<Coffee />} title={t("today.next.noMore")}>{t("today.next.noMoreText")}</EmptyState></Card>
          )}
        </div>

        <Card aria-labelledby="grades-h" className="max-lg:order-1 lg:row-span-1">
          <CardTitle id="grades-h" action={<Link href="/grades" className="tap text-sm font-semibold text-primary hover:underline dark:text-accent-text">{t("common.actions.more")}</Link>}>{t("today.grades.title")}</CardTitle>
          <div className="flex items-end gap-3">
            <p className="font-serif text-[44px] leading-none tabular">{pace !== null ? `${pace}%` : "—"}</p>
            <p className="pb-1 text-sm leading-tight text-muted">{t("today.grades.pace1")}<br />{t("today.grades.pace2")}</p>
          </div>
          {todayGrades.length > 0 && (
            <div className="mt-3 rounded-xl bg-surface-2/70 p-2.5">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted">{showNextDay ? t("today.grades.dayPoints") : t("today.grades.todayPoints")}</p>
              <ul className="space-y-1">
                {todayGrades.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="min-w-0 truncate">{tr("short", d.short)}</span>
                    <span className="flex shrink-0 items-center gap-1.5">
                      <b className="tabular">{d.summary.earned}<span className="font-normal text-muted">/60</span></b>
                      {d.summary.auto?.achieved ? <Badge tone="ok">{t("today.grades.auto")}</Badge> : d.summary.risk !== "none" ? <Badge tone="danger">{t("today.grades.risk")}</Badge> : d.summary.auto?.possible ? <Badge title={t("today.grades.toAutoHint")}>{t("today.grades.toAuto", { n: d.summary.auto.need })}</Badge> : null}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <ul className="mt-3 space-y-1.5 text-sm">
            <li>{t("today.grades.autoDone")} <b>{t("today.grades.autoOf", { n: autoDone, total: grades.current.length })}</b></li>
            {pastAvg !== null && <li>{t("today.grades.avg")} <b className="tabular">{pastAvg.toLocaleString(INTL_LOCALE[f.locale])}</b></li>}
            {risky.length > 0 ? (
              <li className="text-danger"><b>{t("today.grades.riskLabel")}</b> {risky.slice(0, 2).map((r) => tr("short", r.short)).join(", ")} — {riskText(risky[0].summary, t)}</li>
            ) : <li className="text-ok">{t("today.grades.noRisk")}</li>}
          </ul>
        </Card>

        {/* Обзор раунда 2: изменения — боль №1 по опросу (11 из 11), на телефоне показываем их сразу после карточки пары */}
        <div className="lg:col-span-3"><ChangeBanner changes={changes} /></div>

        {/* Раунд 3: нижняя часть — три колонки-стопки без растягивания карточек (на телефоне колонки «растворяются» — порядок задают order-классы) */}
        <div className="max-lg:contents lg:col-span-3 lg:grid lg:grid-cols-3 lg:items-start lg:gap-4">
          <div className="max-lg:contents lg:flex lg:flex-col lg:gap-4">
            <Card aria-labelledby="day-h" className="max-lg:order-2">
              <CardTitle id="day-h" action={<Link href="/schedule" className="tap text-sm font-semibold text-primary hover:underline dark:text-accent-text">{t("today.day.week")}</Link>}>
                {dayTitle} · {(() => { const n = dayList.filter((l) => l.status !== "CANCELLED").length; return n ? tn("today.day.lessons", n) : t("today.day.none"); })()}
              </CardTitle>
              {showNextDay && <p className="-mt-1 mb-1 text-[13px] text-muted">{t("today.day.nextDayNote")}</p>}
              {dayList.length ? (
                <ol className="divide-y divide-dashed divide-line">
                  {dayList.map((l) => {
                    const done = l.endsAt < at;
                    const live = l.startsAt <= at && l.endsAt > at;
                    const kind = changeKind(l);
                    return (
                      <li key={l.id} className={cn("flex gap-3 py-2.5", done && !kind && "text-muted [&_p]:text-muted", kind === "cancel" && "-mx-2 rounded-xl bg-danger-bg/70 px-2")}>
                        <time className={cn("w-12 shrink-0 font-semibold tabular", live && "text-primary dark:text-accent-text", kind === "cancel" && "text-danger")} dateTime={l.startsAt.toISOString()}>{f.time(l.startsAt)}</time>
                        <div className="min-w-0">
                          <p className={cn("font-semibold leading-snug", live && "text-primary dark:text-accent-text")}>{tr("subjects", l.title)}</p>
                          {kind && <ChangeChip kind={kind} className="mt-1" />}
                          <p className="mt-0.5 text-[13px] text-muted">
                            {kind === "cancel" ? (l.changeNote ?? t("today.day.cancelled")) : kind === "room" ? t("today.day.roomChanged", { room: l.room, prev: l.prevRoom ?? "" }) : kind === "move" ? t("today.day.movedHere", { room: l.room }) : t("today.day.meta", { type: t(`common.lessonType.${l.type}`), room: l.room, building: name(l.buildingCode) })}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              ) : <EmptyState icon={<CalendarCheck2 />} title={t("today.day.empty")} className="py-6">{next ? t("today.day.nearest", { day: f.rel(next.startsAt, at), time: f.time(next.startsAt) }) : null}</EmptyState>}
            </Card>

            <Card aria-labelledby="ai-h" className="max-lg:order-2 lg:col-span-1">
              <CardTitle id="ai-h">{t("today.ai.title")}</CardTitle>
              <p className="text-sm text-muted">{t("today.ai.text")}</p>
              <form action="/assistant" className="mt-3 flex gap-2">
                <label htmlFor="ai-q" className="sr-only">{t("today.ai.label")}</label>
                <input id="ai-q" name="q" placeholder={t("today.ai.placeholder")} className="h-11 min-w-0 flex-1 rounded-xl border border-line bg-bg px-3.5 text-[15px] placeholder:text-muted/80 focus:border-primary focus:outline-none" />
                <button className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-fg" aria-label={t("today.ai.ask")}><Sparkles className="h-5 w-5" aria-hidden /></button>
              </form>
            </Card>

          </div>
          <div className="max-lg:contents lg:flex lg:flex-col lg:gap-4">
            <Card aria-labelledby="dl-h" className="max-lg:order-2">
              <CardTitle id="dl-h">{t("today.deadlines.title")}</CardTitle>
              {deadlines.length ? (
                <ul className="divide-y divide-line">
                  {deadlines.map((d) => {
                    const hot = +d.dueAt - +at < 36 * 3600 * 1000;
                    const inner = (
                      <div className="flex gap-3 py-2.5">
                        <Badge tone={hot ? "danger" : "neutral"} className="mt-0.5 min-w-[70px] justify-center">{f.near(d.dueAt, at) ?? f.dayMonth(d.dueAt)}</Badge>
                        <div className="min-w-0"><p className="text-sm font-semibold leading-snug">{d.parts ? t("today.deadlines.workTitle", { work: tr("assessments", d.parts.work), short: tr("short", d.parts.short) }) : d.title}</p>{d.parts ? <p className="text-[13px] text-muted">{t("today.deadlines.workDesc", { name: tr("subjects", d.parts.name), max: d.parts.max })}</p> : d.description && <p className="text-[13px] text-muted">{d.description}</p>}</div>
                      </div>
                    );
                    return <li key={d.id}>{d.link ? <Link href={d.link} className="block rounded-lg hover:bg-surface-2/60">{inner}</Link> : inner}</li>;
                  })}
                </ul>
              ) : <EmptyState title={t("today.deadlines.empty")} className="py-6" />}
            </Card>

          </div>
          <div className="max-lg:contents lg:flex lg:flex-col lg:gap-4">
            <Card aria-labelledby="rq-h" className="max-lg:order-2">
              <CardTitle id="rq-h" action={<Link href="/requests" className="tap text-sm font-semibold text-primary hover:underline dark:text-accent-text">{t("common.actions.all")}</Link>}>{t("today.requests.title")}</CardTitle>
              {activeReqs.length ? (
                <ul className="divide-y divide-line">
                  {activeReqs.map((r) => (
                    <li key={r.id}>
                      {/* Правка капитана №2d: статус — под названием, а не отдельной широкой колонкой. */}
                      <Link href={`/requests/${r.id}`} className="block rounded-lg py-2.5 hover:bg-surface-2/60">
                        <p className="text-sm font-semibold leading-snug">{tr("rt", r.title)}</p>
                        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-muted">
                          <StatusBadge status={r.status} />
                          <span>{r.status === "NEEDS_INFO" ? t("today.requests.needsInfo") : r.status === "READY" ? t("today.requests.ready") : t("today.requests.due", { date: f.dayMonth(r.dueAt) })}</span>
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-muted">{t("today.requests.empty")}</p>}
              <Link href="/requests/new" className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline dark:text-accent-text"><FileText className="h-4 w-4" aria-hidden />{t("today.requests.order")}</Link>
            </Card>

            <Card aria-labelledby="news-h" className="max-lg:order-2 lg:col-span-1">
              <CardTitle id="news-h" action={<Link href="/notifications?f=ANNOUNCEMENT" className="tap text-sm font-semibold text-primary hover:underline dark:text-accent-text">{t("common.actions.all")}</Link>}>{t("today.news.title")}</CardTitle>
              {news.items.length ? (
                <ul className="divide-y divide-line">
                  {news.items.map((n) => (
                    <li key={n.id}>
                      <Link href={n.link ?? "/notifications"} className="flex items-start gap-3 rounded-lg py-2.5 hover:bg-surface-2/60">
                        <Megaphone className={cn("mt-0.5 h-4 w-4 shrink-0", n.important ? "text-danger" : "text-muted")} aria-hidden />
                        <div className="min-w-0"><p className={cn("text-sm leading-snug", !n.readAt && "font-semibold")}>{n.title}</p><p className="text-[13px] text-muted">{f.dayMonth(n.createdAt)}{n.important ? ` · ${t("today.news.important")}` : ""}</p></div>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-muted">{t("today.news.empty")}</p>}
              <Link href="/notifications" className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline dark:text-accent-text">{t("today.news.all")} <ArrowRight className="h-4 w-4" aria-hidden /></Link>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
