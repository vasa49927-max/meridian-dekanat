import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, CalendarCheck2, Coffee, FileText, Megaphone, Sparkles } from "lucide-react";
import { requireStudent } from "@/server/auth/guards";
import { getMyGrades, getNextLesson, listMyDeadlines, listMyLessons, listMyNotifications, listMyUpcomingChanges } from "@/server/dal/student";
import { listMyRequests } from "@/server/dal/requests";
import { addDays, fmt, mskParts, now, relativeDay, startOfDay } from "@/lib/time";
import { averagePoints } from "@/lib/brs";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty";
import { NextLessonCard } from "@/components/today/next-lesson";
import { ChangeBanner } from "@/components/schedule/change-banner";
import { LESSON_TYPE, teacherShort } from "@/components/schedule/lesson-meta";
import { StatusBadge } from "@/components/requests/status";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Сегодня" };

function greeting(d: Date) {
  const h = mskParts(d).hh;
  if (h >= 5 && h < 12) return "Доброе утро";
  if (h >= 12 && h < 17) return "Добрый день";
  if (h >= 17 && h < 23) return "Добрый вечер";
  return "Доброй ночи";
}

export default async function TodayPage() {
  const v = await requireStudent();
  const at = now();
  const dayStart = startOfDay(at);
  const [next, today, changes, deadlines, reqs, grades, news] = await Promise.all([
    getNextLesson(v, at), listMyLessons(v, dayStart, addDays(dayStart, 1)), listMyUpcomingChanges(v, at), listMyDeadlines(v, at, 4),
    listMyRequests(v, null, 10), getMyGrades(v), listMyNotifications(v, "ANNOUNCEMENT", null, 3),
  ]);
  const activeReqs = reqs.items.filter((r) => r.status !== "ISSUED" && r.status !== "REJECTED").slice(0, 3);
  const pastAvg = averagePoints(grades.past.map((g) => g.points));
  const autoDone = grades.current.filter((d) => d.summary.auto?.achieved).length;
  const risky = grades.current.filter((d) => d.summary.risk !== "none");
  const gradedMax = grades.current.reduce((s, d) => s + d.summary.gradedMax, 0);
  const earned = grades.current.reduce((s, d) => s + d.summary.earned, 0);
  const pace = gradedMax ? Math.round((earned / gradedMax) * 100) : null;

  return (
    <div className="pt-2 lg:pt-0">
      <div className="mb-5">
        <p className="text-sm text-muted">{fmt.longDay(at)}</p>
        <h1 className="font-serif text-[26px] leading-tight lg:text-[34px]">{greeting(at)}, {v.firstName}</h1>
      </div>

      <div className="grid gap-3 lg:grid-cols-3 lg:gap-4">
        <div className="lg:col-span-2">
          {next ? (
            <NextLessonCard
              title={next.title} type={LESSON_TYPE[next.type]} startsAt={next.startsAt.toISOString()} endsAt={next.endsAt.toISOString()}
              room={next.room} building={next.buildingName} address={next.buildingAddress} hint={next.buildingHint}
              teacher={teacherShort(next)} teacherInitials={`${next.teacherLast?.[0] ?? ""}${next.teacherFirst?.[0] ?? ""}`} serverNow={at.toISOString()}
              moved={next.status === "MOVED"} prevText={next.prevStartsAt ? `${fmt.shortDay(next.prevStartsAt)}, ${fmt.time(next.prevStartsAt)}, ауд. ${next.prevRoom}` : null}
            />
          ) : (
            <Card className="h-full"><EmptyState icon={<Coffee />} title="Пар больше нет">Семестр закончился или занятия ещё не поставлены. Расписание сессии — в разделе «Расписание».</EmptyState></Card>
          )}
        </div>

        <Card aria-labelledby="grades-h" className="lg:row-span-1">
          <CardTitle id="grades-h" action={<Link href="/grades" className="text-sm font-semibold text-primary hover:underline dark:text-accent-text">Подробнее</Link>}>Как дела с учёбой</CardTitle>
          <div className="flex items-end gap-3">
            <p className="font-serif text-[44px] leading-none tabular">{pace !== null ? `${pace}%` : "—"}</p>
            <p className="pb-1 text-sm leading-tight text-muted">баллов от возможного<br />в этом семестре</p>
          </div>
          <ul className="mt-3 space-y-1.5 text-sm">
            <li>Автомат уже есть: <b>{autoDone} из {grades.current.length}</b></li>
            {pastAvg !== null && <li>Средний балл зачётки: <b className="tabular">{pastAvg.toLocaleString("ru-RU")}</b></li>}
            {risky.length > 0 ? (
              <li className="text-danger"><b>Риск:</b> {risky.slice(0, 2).map((r) => r.short).join(", ")} — {risky[0].summary.riskReason}</li>
            ) : <li className="text-ok">Рисков нет — так держать</li>}
          </ul>
        </Card>

        <div className="lg:col-span-3"><ChangeBanner changes={changes} /></div>

        <Card aria-labelledby="day-h" className="lg:row-span-2">
          <CardTitle id="day-h" action={<Link href="/schedule" className="text-sm font-semibold text-primary hover:underline dark:text-accent-text">Неделя</Link>}>
            Сегодня · {today.filter((l) => l.status !== "CANCELLED").length ? `${today.filter((l) => l.status !== "CANCELLED").length} пар${today.filter((l) => l.status !== "CANCELLED").length < 5 ? "ы" : ""}` : "без пар"}
          </CardTitle>
          {today.length ? (
            <ol className="divide-y divide-dashed divide-line">
              {today.map((l) => {
                const done = l.endsAt < at;
                const live = l.startsAt <= at && l.endsAt > at;
                return (
                  <li key={l.id} className={cn("flex gap-3 py-2.5", done && "text-muted [&_p]:text-muted")}>
                    <time className={cn("w-12 shrink-0 font-semibold tabular", live && "text-primary dark:text-accent-text")} dateTime={l.startsAt.toISOString()}>{fmt.time(l.startsAt)}</time>
                    <div className="min-w-0">
                      <p className={cn("font-semibold leading-snug", live && "text-primary dark:text-accent-text", l.status === "CANCELLED" && "line-through decoration-warn")}>{l.title}</p>
                      <p className={cn("text-[13px] text-muted", l.status !== "SCHEDULED" && "font-semibold text-warn")}>
                        {l.status === "CANCELLED" ? "Отменена" : l.status === "MOVED" ? `Изменение: ауд. ${l.room}` : `${LESSON_TYPE[l.type]} · ауд. ${l.room}, корп. ${l.buildingCode}`}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          ) : <EmptyState icon={<CalendarCheck2 />} title="Сегодня пар нет" className="py-6">{next ? `Ближайшая — ${relativeDay(next.startsAt, at)} в ${fmt.time(next.startsAt)}.` : null}</EmptyState>}
        </Card>

        <Card aria-labelledby="dl-h">
          <CardTitle id="dl-h">Ближайшие сроки</CardTitle>
          {deadlines.length ? (
            <ul className="divide-y divide-line">
              {deadlines.map((d) => {
                const hot = +d.dueAt - +at < 36 * 3600 * 1000;
                const inner = (
                  <div className="flex gap-3 py-2.5">
                    <Badge tone={hot ? "danger" : "neutral"} className="mt-0.5 min-w-[70px] justify-center">{relativeDay(d.dueAt, at) === "сегодня" ? "сегодня" : relativeDay(d.dueAt, at) === "завтра" ? "завтра" : fmt.dayMonthShort(d.dueAt)}</Badge>
                    <div className="min-w-0"><p className="text-sm font-semibold leading-snug">{d.title}</p>{d.description && <p className="text-[13px] text-muted">{d.description}</p>}</div>
                  </div>
                );
                return <li key={d.id}>{d.link ? <Link href={d.link} className="block rounded-lg hover:bg-surface-2/60">{inner}</Link> : inner}</li>;
              })}
            </ul>
          ) : <EmptyState title="Сроков на горизонте нет" className="py-6" />}
        </Card>

        <Card aria-labelledby="rq-h">
          <CardTitle id="rq-h" action={<Link href="/requests" className="text-sm font-semibold text-primary hover:underline dark:text-accent-text">Все</Link>}>Мои заявки</CardTitle>
          {activeReqs.length ? (
            <ul className="divide-y divide-line">
              {activeReqs.map((r) => (
                <li key={r.id}>
                  <Link href={`/requests/${r.id}`} className="flex items-start gap-3 rounded-lg py-2.5 hover:bg-surface-2/60">
                    <StatusBadge status={r.status} className="mt-0.5" />
                    <div className="min-w-0"><p className="text-sm font-semibold leading-snug">{r.title}</p><p className="text-[13px] text-muted">{r.status === "NEEDS_INFO" ? "Деканат просит дополнить" : r.status === "READY" ? "Документ готов — откройте" : `Срок — до ${fmt.dayMonthShort(r.dueAt)}`}</p></div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted">Активных заявок нет.</p>}
          <Link href="/requests/new" className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline dark:text-accent-text"><FileText className="h-4 w-4" aria-hidden />Заказать справку</Link>
        </Card>

        <Card aria-labelledby="ai-h" className="lg:col-span-1">
          <CardTitle id="ai-h">Помощник деканата</CardTitle>
          <p className="text-sm text-muted">Отвечает по Положению и вашим данным, умеет заполнить заявку.</p>
          <form action="/assistant" className="mt-3 flex gap-2">
            <label htmlFor="ai-q" className="sr-only">Вопрос помощнику</label>
            <input id="ai-q" name="q" placeholder="Какую справку взять для визы?" className="h-11 min-w-0 flex-1 rounded-xl border border-line bg-bg px-3.5 text-[15px] placeholder:text-muted/80 focus:border-primary focus:outline-none" />
            <button className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-fg" aria-label="Спросить"><Sparkles className="h-5 w-5" aria-hidden /></button>
          </form>
        </Card>

        <Card aria-labelledby="news-h" className="lg:col-span-1">
          <CardTitle id="news-h" action={<Link href="/notifications?f=ANNOUNCEMENT" className="text-sm font-semibold text-primary hover:underline dark:text-accent-text">Все</Link>}>Объявления</CardTitle>
          {news.items.length ? (
            <ul className="divide-y divide-line">
              {news.items.map((n) => (
                <li key={n.id}>
                  <Link href={n.link ?? "/notifications"} className="flex items-start gap-3 rounded-lg py-2.5 hover:bg-surface-2/60">
                    <Megaphone className={cn("mt-0.5 h-4 w-4 shrink-0", n.important ? "text-danger" : "text-muted")} aria-hidden />
                    <div className="min-w-0"><p className={cn("text-sm leading-snug", !n.readAt && "font-semibold")}>{n.title}</p><p className="text-[13px] text-muted">{fmt.dayMonthShort(n.createdAt)}{n.important ? " · важное" : ""}</p></div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted">Новых объявлений нет.</p>}
          <Link href="/notifications" className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline dark:text-accent-text">Все уведомления <ArrowRight className="h-4 w-4" aria-hidden /></Link>
        </Card>
      </div>
    </div>
  );
}
