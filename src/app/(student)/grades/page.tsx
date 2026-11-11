import Link from "next/link";
import { AlertTriangle, BookOpen, CalendarClock, CalendarHeart, MessageSquareHeart, CheckCircle2, CircleDot, Flag, Target } from "lucide-react";
import { requireStudent } from "@/server/auth/guards";
import { getMyGrades } from "@/server/dal/student";
import { listMyRiskInvites } from "@/server/dal/risks";
import { listMySurveyCourses } from "@/server/dal/survey";
import { BRS, averagePoints, markFor, planFor } from "@/lib/brs";
import { now } from "@/lib/time";
import { getI18n } from "@/i18n/server";
import { INTL_LOCALE } from "@/i18n/config";
import type { I18n } from "@/i18n";
import { planText } from "@/i18n/brs";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty";
import { PointsBar } from "@/components/grades/progress";
import { WhatIf } from "@/components/grades/what-if";
import { cn } from "@/lib/cn";

export async function generateMetadata() {
  const { t } = await getI18n();
  return { title: t("grades.title") };
}

/** «2026-осень» → «Осенний семестр 2026/2027» на языке интерфейса. */
const semTitle = (s: string, t: I18n["t"]) => {
  const [y, season] = s.split("-");
  return season === "осень" ? t("grades.semester.autumn", { years: `${y}/${+y + 1}` }) : t("grades.semester.spring", { years: `${+y - 1}/${y}` });
};
const MARK_KEY = { 5: "excellent", 4: "good", 3: "satisfactory", 2: "fail" } as const;
const TONE = {
  ok: { box: "border-ok/30 bg-ok-bg", text: "text-ok", icon: CheckCircle2 },
  goal: { box: "border-primary/25 bg-primary-soft dark:border-accent/30", text: "text-primary dark:text-accent-text", icon: Target },
  exam: { box: "border-line bg-surface-2", text: "text-fg", icon: Flag },
  risk: { box: "border-danger/30 bg-danger-bg", text: "text-danger", icon: AlertTriangle },
} as const;
const ORDER = { risk: 0, goal: 1, exam: 2, ok: 3 } as const;

/**
 * Успеваемость, переработанная по правке капитана №4 и опросу (понятность рейтинга — 3,2 из 5).
 * Каждая карточка отвечает на три вопроса: где я сейчас → что мне сделать → какая следующая работа.
 */
export default async function GradesPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const v = await requireStudent();
  const { tab } = await searchParams;
  const at = now();
  const i18n = await getI18n();
  const { t, tn, tr, name, f, locale } = i18n;
  const num = (n: number) => n.toLocaleString(INTL_LOCALE[locale]);
  const [{ current, past }, invites, survey] = await Promise.all([getMyGrades(v), listMyRiskInvites(v), listMySurveyCourses(v)]);
  const surveyLeft = survey.filter((c) => !c.voted).length;
  const cards = current.map((d) => {
    const plan = planFor(d.control, d.summary);
    const next = d.items.find((a) => a.kind !== "FINAL" && a.points === null && a.dueAt && a.dueAt > at);
    return { d, plan, next, text: planText(plan, d.summary, t) };
  }).sort((x, y) => ORDER[x.plan.tone] - ORDER[y.plan.tone]);
  const autos = cards.filter((c) => c.plan.tone === "ok");
  const risks = cards.filter((c) => c.plan.tone === "risk");
  const upcoming = cards.flatMap((c) => (c.next ? [{ ...c.next, short: c.d.short }] : [])).sort((a, b) => +a.dueAt! - +b.dueAt!)[0];
  const avg = averagePoints(past.map((p) => p.points));
  const semesters = [...new Set(past.map((p) => p.semester))].reverse();
  const isPast = tab === "record";
  const focus = focusSteps(cards, i18n);

  return (
    <div className="pt-2 lg:pt-0">
      <PageHeader title={t("grades.title")} subtitle={t("grades.semester.autumn", { years: "2026/27" })} />

      {/* Сводка: на что обратить внимание прямо сейчас */}
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className={cn("p-4", risks.length && "border-danger/40")}>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">{t("grades.summary.attention")}</p>
          <p className={cn("mt-1 font-serif text-3xl tabular", risks.length ? "text-danger" : "text-ok")}>{risks.length}</p>
          <p className="text-xs text-muted">{risks.length ? risks.map((r) => tr("short", r.d.short)).join(", ") : t("grades.summary.allGood")}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">{t("grades.summary.autos")}</p>
          <p className="mt-1 font-serif text-3xl tabular">{autos.length}<span className="text-lg text-muted"> {t("grades.summary.of", { n: cards.length })}</span></p>
          <p className="text-xs text-muted">{autos.length ? autos.map((r) => tr("short", r.d.short)).join(", ") : t("grades.summary.none")}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">{t("grades.summary.next")}</p>
          <p className="mt-1 font-serif text-2xl leading-tight">{upcoming ? f.dayMonth(upcoming.dueAt!) : "—"}</p>
          <p className="text-xs text-muted">{upcoming ? t("grades.summary.nextDetail", { title: tr("assessments", upcoming.title), short: tr("short", upcoming.short), max: upcoming.maxPoints }) : t("grades.summary.allDone")}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">{t("grades.summary.avg")}</p>
          <p className="mt-1 font-serif text-3xl tabular">{avg !== null ? num(avg) : "—"}</p>
          <p className="text-xs text-muted">{avg !== null ? tn("grades.summary.avgDetail", semesters.length) : t("grades.summary.avgEmpty")}</p>
        </Card>
      </div>

      <nav aria-label={t("grades.tabs.aria")} className="mb-4 seg inline-flex rounded-xl border border-line p-1">
        <Link aria-current={!isPast ? "page" : undefined} href="/grades" className={cn("rounded-lg px-4 py-1.5 text-sm font-semibold", !isPast ? "bg-primary text-primary-fg" : "text-muted")}>{t("grades.tabs.current")}</Link>
        <Link aria-current={isPast ? "page" : undefined} href="/grades?tab=record" className={cn("rounded-lg px-4 py-1.5 text-sm font-semibold", isPast ? "bg-primary text-primary-fg" : "text-muted")}>{t("grades.tabs.record")}</Link>
      </nav>

      {!isPast ? (
        <>
          {/* Как это работает — в три шага, всегда на виду */}
          <ol aria-label={t("grades.how.aria")} className="mb-4 grid gap-2 card rounded-2xl border border-line bg-surface p-3 text-sm sm:grid-cols-3">
            <li className="flex gap-2.5"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-fg">1</span><span><b>{t("grades.how.s1b")}</b> {t("grades.how.s1", { max: BRS.currentMax })}</span></li>
            <li className="flex gap-2.5"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-fg">2</span><span><b>{t("grades.how.s2b")}</b> {t("grades.how.s2", { max: BRS.finalMax, credit: BRS.autoCredit, excellent: BRS.autoExcellent })}</span></li>
            <li className="flex gap-2.5"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-fg">3</span><span><b>{t("grades.how.s3b")}</b> {t("grades.how.s3")}</span></li>
          </ol>

          {/* Раунд 3: «С чего начать» — одна короткая очередь действий вместо одинаковых советов в каждой карточке */}
          {focus.length > 0 && (
            <section aria-labelledby="focus-h" className="mb-4 rounded-2xl border border-primary/25 bg-primary-soft p-4 dark:border-accent/30">
              <h2 id="focus-h" className="mb-2 flex items-center gap-2 font-semibold"><Target className="h-5 w-5 text-primary dark:text-accent-text" aria-hidden />{t("grades.focus.title")}</h2>
              <ol className="space-y-1.5 text-sm">
                {focus.map((step, i) => (
                  <li key={i} className="flex gap-2.5">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-fg dark:bg-accent dark:text-[#14182a]">{i + 1}</span>
                    <span><a href={`#${encodeURIComponent(step.anchor)}`} className="font-semibold underline-offset-2 hover:underline">{step.lead}</a> {step.text}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          <div className="grid gap-3 xl:grid-cols-2">
            {cards.map(({ d, plan, next, text }) => {
              const s = d.summary;
              const T = TONE[plan.tone];
              const target = d.control === "CREDIT" ? BRS.autoCredit : BRS.autoExcellent;
              return (
                <Card key={d.id} as="article" id={d.name} aria-label={tr("subjects", d.name)} className="scroll-mt-24">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="font-semibold leading-snug">{tr("subjects", d.name)}</h2>
                      <p className="text-[13px] text-muted">{tr("titles", d.teacherTitle)} {name(d.teacherLast)} {name(d.teacherFirst)[0]}. · {tn("grades.card.credits", d.credits)}</p>
                    </div>
                    <Badge tone={d.control === "EXAM" ? "primary" : "neutral"}>{t(`common.control.${d.control}`)}</Badge>
                  </div>

                  {/* 1. Что мне делать — главное в карточке */}
                  <div className={cn("mt-3 rounded-xl border p-3", T.box)}>
                    <p className={cn("flex items-center gap-2 font-semibold", T.text)}><T.icon className="h-5 w-5 shrink-0" aria-hidden />{text.headline}</p>
                    <p className="mt-1 text-sm">{text.detail}</p>
                  </div>
                  {/* Раунд 6: деканат пригласил на консультацию по этой дисциплине */}
                  {invites.has(d.id) && (
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-info/30 bg-info-bg p-3 text-sm">
                      <p className="flex items-center gap-2"><CalendarHeart className="h-4 w-4 shrink-0 text-info" aria-hidden />{t("grades.invite.text", { date: f.dayMonth(invites.get(d.id)!) })}</p>
                      <Link href="/appointments" className="font-semibold text-info underline-offset-2 hover:underline">{t("grades.invite.cta")}</Link>
                    </div>
                  )}

                  {/* 2. Где я сейчас */}
                  <PointsBar earned={s.earned} remaining={s.remainingMax} target={target} targetLabel={d.control === "CREDIT" ? t("grades.card.autoCredit") : t("grades.card.autoExcellent")} />

                  {/* 3. Следующая работа */}
                  {next && (
                    <p className="mt-3 flex items-start gap-2 text-sm">
                      <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-accent-text" aria-hidden />
                      <span>{t("grades.card.nextLabel")} <b>{tr("assessments", next.title)}</b> · {f.dayMonth(next.dueAt!)} · {t("grades.card.upTo", { n: next.maxPoints })}{plan.needPct ? <> {t("grades.card.goal")} <b>{Math.ceil((next.maxPoints * plan.needPct) / 100)}+</b></> : null}</span>
                    </p>
                  )}

                  <details className="mt-3">
                    <summary className="tap cursor-pointer text-sm font-semibold text-primary dark:text-accent-text">{t("grades.card.details")}</summary>
                    <ul className="mt-3 divide-y divide-line text-sm">
                      {d.items.map((a) => (
                        <li key={a.id} className="flex items-center gap-2 py-1.5">
                          {a.points !== null ? <CheckCircle2 className="h-4 w-4 shrink-0 text-ok" aria-label={t("grades.card.graded")} /> : <CircleDot className="h-4 w-4 shrink-0 text-muted" aria-label={t("grades.card.notGraded")} />}
                          <span className="min-w-0 flex-1">{tr("assessments", a.title)}<span className="text-muted"> · {a.dueAt ? f.dayMonth(a.dueAt) : t("grades.card.session")}</span></span>
                          <span className="tabular">{a.points !== null ? <b>{a.points}</b> : <span className="text-muted">{a.dueAt && a.dueAt < at ? t("grades.card.checking") : "—"}</span>}<span className="text-muted"> / {a.maxPoints}</span></span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3"><WhatIf earned={s.earned} remainingMax={s.remainingMax} control={d.control} /></div>
                  </details>
                </Card>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-muted">{t("grades.card.rules")}</p>
          {/* Раунд 6: приглашение пройти анонимный опрос, пока есть неоценённые курсы */}
          {surveyLeft > 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 card rounded-2xl border border-line bg-surface p-4 text-sm">
              <p className="flex items-center gap-2"><MessageSquareHeart className="h-5 w-5 shrink-0 text-primary dark:text-accent-text" aria-hidden />{t("survey.banner.text")}</p>
              <Link href="/survey" className="font-semibold text-primary underline-offset-2 hover:underline dark:text-accent-text">{t("survey.banner.cta")}</Link>
            </div>
          )}
        </>
      ) : past.length ? (
        <div className="space-y-4">
          {semesters.map((sem) => {
            const list = past.filter((p) => p.semester === sem);
            return (
              <Card key={sem} aria-label={semTitle(sem, t)}>
                <h2 className="mb-3 flex items-baseline justify-between font-semibold"><span>{semTitle(sem, t)}</span><span className="text-sm font-normal text-muted"> {t("grades.record.avg", { avg: num(averagePoints(list.map((l) => l.points)) ?? 0) })}</span></h2>
                <ul className="divide-y divide-line">
                  {list.map((g) => (
                    <li key={g.id} className="flex items-center justify-between gap-3 py-2">
                      <div className="min-w-0"><p className="text-sm font-medium">{tr("subjects", g.disciplineName)}</p><p className="text-xs text-muted">{t(`common.control.${g.control}`)} · {tn("grades.card.credits", g.credits)}</p></div>
                      <div className="text-right"><p className="font-semibold tabular">{g.points}</p><p className="text-xs text-muted">{g.control === "CREDIT" ? t("grades.record.passed") : t(`grades.marks.${MARK_KEY[markFor(g.points).mark]}`)}</p></div>
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
          <p className="text-sm text-muted">{t("grades.record.needExtract")} <Link href="/requests/new/RECORD_EXTRACT" className="font-semibold text-primary underline dark:text-accent-text">{t("grades.record.orderExtract")}</Link></p>
        </div>
      ) : <EmptyState icon={<BookOpen />} title={t("grades.record.emptyTitle")}>{t("grades.record.emptyText")}</EmptyState>}
    </div>
  );
}

type FocusCard = { d: { name: string; short: string }; text: { headline: string }; plan: { tone: "ok" | "goal" | "exam" | "risk"; needPct: number | null }; next?: { title: string; dueAt: Date | null; maxPoints: number } };

/**
 * До трёх шагов «с чего начать»: 1) предмет с риском, 2) ближайшая работа с целью в баллах,
 * 3) предмет, где автомат получить проще всего. Повторы предметов пропускаем.
 */
function focusSteps(cards: FocusCard[], { t, tr, f, locale }: I18n) {
  const out: { anchor: string; lead: string; text: string }[] = [];
  const used = new Set<string>();
  const risk = cards.find((c) => c.plan.tone === "risk");
  if (risk) {
    out.push({ anchor: risk.d.name, lead: t("grades.focus.lead", { short: tr("short", risk.d.short) }), text: t("grades.focus.risk", { headline: risk.text.headline.toLocaleLowerCase(INTL_LOCALE[locale]) }) });
    used.add(risk.d.name);
  }
  const soon = cards.filter((c) => c.next?.dueAt && !used.has(c.d.name)).sort((a, b) => +a.next!.dueAt! - +b.next!.dueAt!)[0];
  if (soon?.next?.dueAt) {
    const short = tr("short", soon.d.short), max = soon.next.maxPoints;
    const text = soon.plan.needPct ? t("grades.focus.soonGoal", { short, target: Math.ceil((max * soon.plan.needPct) / 100), max }) : t("grades.focus.soonMax", { short, max });
    out.push({ anchor: soon.d.name, lead: t("grades.focus.soonLead", { date: f.dayMonth(soon.next.dueAt), title: tr("assessments", soon.next.title) }), text });
    used.add(soon.d.name);
  }
  const easiest = cards.filter((c) => c.plan.tone === "goal" && c.plan.needPct !== null && !used.has(c.d.name)).sort((a, b) => a.plan.needPct! - b.plan.needPct!)[0];
  if (easiest) out.push({ anchor: easiest.d.name, lead: t("grades.focus.lead", { short: tr("short", easiest.d.short) }), text: t("grades.focus.easiest", { pct: easiest.plan.needPct! }) });
  return out;
}
