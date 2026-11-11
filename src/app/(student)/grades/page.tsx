import Link from "next/link";
import type { Metadata } from "next";
import { AlertTriangle, BookOpen, CalendarClock, CheckCircle2, CircleDot, Flag, Target } from "lucide-react";
import { requireStudent } from "@/server/auth/guards";
import { getMyGrades } from "@/server/dal/student";
import { BRS, averagePoints, markFor, planFor } from "@/lib/brs";
import { fmt, now } from "@/lib/time";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty";
import { PointsBar } from "@/components/grades/progress";
import { WhatIf } from "@/components/grades/what-if";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Успеваемость" };

const CONTROL = { EXAM: "Экзамен", CREDIT: "Зачёт", GRADED_CREDIT: "Дифф. зачёт" } as const;
const semTitle = (s: string) => { const [y, t] = s.split("-"); return `${t === "осень" ? "Осенний" : "Весенний"} семестр ${t === "осень" ? `${y}/${+y + 1}` : `${+y - 1}/${y}`}`; };
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
  const { current, past } = await getMyGrades(v);
  const cards = current.map((d) => {
    const plan = planFor(d.control, d.summary);
    const next = d.items.find((a) => a.kind !== "FINAL" && a.points === null && a.dueAt && a.dueAt > at);
    return { d, plan, next };
  }).sort((x, y) => ORDER[x.plan.tone] - ORDER[y.plan.tone]);
  const autos = cards.filter((c) => c.plan.tone === "ok");
  const risks = cards.filter((c) => c.plan.tone === "risk");
  const upcoming = cards.flatMap((c) => (c.next ? [{ ...c.next, short: c.d.short }] : [])).sort((a, b) => +a.dueAt! - +b.dueAt!)[0];
  const avg = averagePoints(past.map((p) => p.points));
  const semesters = [...new Set(past.map((p) => p.semester))].reverse();
  const isPast = tab === "record";
  const focus = focusSteps(cards);

  return (
    <div className="pt-2 lg:pt-0">
      <PageHeader title="Успеваемость" subtitle="Осенний семестр 2026/27" />

      {/* Сводка: на что обратить внимание прямо сейчас */}
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className={cn("p-4", risks.length && "border-danger/40")}>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Требуют внимания</p>
          <p className={cn("mt-1 font-serif text-3xl tabular", risks.length ? "text-danger" : "text-ok")}>{risks.length}</p>
          <p className="text-xs text-muted">{risks.length ? risks.map((r) => r.d.short).join(", ") : "всё под контролем"}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Уже автомат</p>
          <p className="mt-1 font-serif text-3xl tabular">{autos.length}<span className="text-lg text-muted"> из {cards.length}</span></p>
          <p className="text-xs text-muted">{autos.length ? autos.map((r) => r.d.short).join(", ") : "пока нет"}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Ближайшая работа</p>
          <p className="mt-1 font-serif text-2xl leading-tight">{upcoming ? fmt.dayMonth(upcoming.dueAt!) : "—"}</p>
          <p className="text-xs text-muted">{upcoming ? `${upcoming.title} · ${upcoming.short} · до ${upcoming.maxPoints} б.` : "в семестре всё сдано"}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Средний балл зачётки</p>
          <p className="mt-1 font-serif text-3xl tabular">{avg !== null ? avg.toLocaleString("ru-RU") : "—"}</p>
          <p className="text-xs text-muted">{avg !== null ? `${semesters.length} сем. · из 100` : "итоги появятся после сессии"}</p>
        </Card>
      </div>

      <nav aria-label="Период" className="mb-4 inline-flex rounded-xl border border-line bg-surface p-1">
        <Link aria-current={!isPast ? "page" : undefined} href="/grades" className={cn("rounded-lg px-4 py-1.5 text-sm font-semibold", !isPast ? "bg-primary text-primary-fg" : "text-muted")}>Текущий семестр</Link>
        <Link aria-current={isPast ? "page" : undefined} href="/grades?tab=record" className={cn("rounded-lg px-4 py-1.5 text-sm font-semibold", isPast ? "bg-primary text-primary-fg" : "text-muted")}>Зачётка</Link>
      </nav>

      {!isPast ? (
        <>
          {/* Как это работает — в три шага, всегда на виду */}
          <ol aria-label="Как считается итог" className="mb-4 grid gap-2 rounded-2xl border border-line bg-surface p-3 text-sm sm:grid-cols-3">
            <li className="flex gap-2.5"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-fg">1</span><span><b>Работы в семестре</b> — до {BRS.currentMax} баллов (коллоквиумы, эссе, семинары)</span></li>
            <li className="flex gap-2.5"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-fg">2</span><span><b>Экзамен или зачёт</b> — до {BRS.finalMax}. Автомат: зачёт от {BRS.autoCredit}, «отлично» от {BRS.autoExcellent} за семестр</span></li>
            <li className="flex gap-2.5"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-fg">3</span><span><b>Итог из 100:</b> 90+ «отлично», 75+ «хорошо», 60+ «удовл.»</span></li>
          </ol>

          {/* Раунд 3: «С чего начать» — одна короткая очередь действий вместо одинаковых советов в каждой карточке */}
          {focus.length > 0 && (
            <section aria-labelledby="focus-h" className="mb-4 rounded-2xl border border-primary/25 bg-primary-soft p-4 dark:border-accent/30">
              <h2 id="focus-h" className="mb-2 flex items-center gap-2 font-semibold"><Target className="h-5 w-5 text-primary dark:text-accent-text" aria-hidden />С чего начать</h2>
              <ol className="space-y-1.5 text-sm">
                {focus.map((f, i) => (
                  <li key={i} className="flex gap-2.5">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-fg dark:bg-accent dark:text-[#14182a]">{i + 1}</span>
                    <span><a href={`#${encodeURIComponent(f.anchor)}`} className="font-semibold underline-offset-2 hover:underline">{f.lead}</a> {f.text}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          <div className="grid gap-3 xl:grid-cols-2">
            {cards.map(({ d, plan, next }) => {
              const s = d.summary;
              const T = TONE[plan.tone];
              const target = d.control === "CREDIT" ? BRS.autoCredit : BRS.autoExcellent;
              return (
                <Card key={d.id} as="article" id={d.name} aria-label={d.name} className="scroll-mt-24">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="font-semibold leading-snug">{d.name}</h2>
                      <p className="text-[13px] text-muted">{d.teacherTitle} {d.teacherLast} {d.teacherFirst[0]}. · {d.credits} з.е.</p>
                    </div>
                    <Badge tone={d.control === "EXAM" ? "primary" : "neutral"}>{CONTROL[d.control]}</Badge>
                  </div>

                  {/* 1. Что мне делать — главное в карточке */}
                  <div className={cn("mt-3 rounded-xl border p-3", T.box)}>
                    <p className={cn("flex items-center gap-2 font-semibold", T.text)}><T.icon className="h-5 w-5 shrink-0" aria-hidden />{plan.headline}</p>
                    <p className="mt-1 text-sm">{plan.detail}</p>
                  </div>

                  {/* 2. Где я сейчас */}
                  <PointsBar earned={s.earned} remaining={s.remainingMax} target={target} targetLabel={d.control === "CREDIT" ? "зачёт автоматом" : "«отлично» автоматом"} />

                  {/* 3. Следующая работа */}
                  {next && (
                    <p className="mt-3 flex items-start gap-2 text-sm">
                      <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-accent-text" aria-hidden />
                      <span>Следующая работа: <b>{next.title}</b> · {fmt.dayMonth(next.dueAt!)} · до {next.maxPoints}&nbsp;б.{plan.needPct ? <> — цель <b>{Math.ceil((next.maxPoints * plan.needPct) / 100)}+</b></> : null}</span>
                    </p>
                  )}

                  <details className="mt-3">
                    <summary className="tap cursor-pointer text-sm font-semibold text-primary dark:text-accent-text">Все работы и калькулятор итога</summary>
                    <ul className="mt-3 divide-y divide-line text-sm">
                      {d.items.map((a) => (
                        <li key={a.id} className="flex items-center gap-2 py-1.5">
                          {a.points !== null ? <CheckCircle2 className="h-4 w-4 shrink-0 text-ok" aria-label="оценено" /> : <CircleDot className="h-4 w-4 shrink-0 text-muted" aria-label="ещё не оценено" />}
                          <span className="min-w-0 flex-1">{a.title}<span className="text-muted"> · {a.dueAt ? fmt.dayMonth(a.dueAt) : "сессия"}</span></span>
                          <span className="tabular">{a.points !== null ? <b>{a.points}</b> : <span className="text-muted">{a.dueAt && a.dueAt < at ? "проверяется" : "—"}</span>}<span className="text-muted"> / {a.maxPoints}</span></span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3"><WhatIf earned={s.earned} remainingMax={s.remainingMax} control={d.control} /></div>
                  </details>
                </Card>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-muted">Правила БРС взяты из вымышленного «Положения о деканате (концепт)», раздел 4 — их можно спросить у помощника.</p>
        </>
      ) : past.length ? (
        <div className="space-y-4">
          {semesters.map((sem) => {
            const list = past.filter((p) => p.semester === sem);
            return (
              <Card key={sem} aria-label={semTitle(sem)}>
                <h2 className="mb-3 flex items-baseline justify-between font-semibold"><span>{semTitle(sem)}</span><span className="text-sm font-normal text-muted"> · средний {averagePoints(list.map((l) => l.points))?.toLocaleString("ru-RU")}</span></h2>
                <ul className="divide-y divide-line">
                  {list.map((g) => (
                    <li key={g.id} className="flex items-center justify-between gap-3 py-2">
                      <div className="min-w-0"><p className="text-sm font-medium">{g.disciplineName}</p><p className="text-xs text-muted">{CONTROL[g.control]} · {g.credits} з.е.</p></div>
                      <div className="text-right"><p className="font-semibold tabular">{g.points}</p><p className="text-xs text-muted">{g.control === "CREDIT" ? "зачтено" : markFor(g.points).label}</p></div>
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
          <p className="text-sm text-muted">Нужна официальная выписка? <Link href="/requests/new/RECORD_EXTRACT" className="font-semibold text-primary underline dark:text-accent-text">Заказать выписку из зачётки</Link></p>
        </div>
      ) : <EmptyState icon={<BookOpen />} title="Зачётка пока пустая">Итоги появятся после первой сессии. А текущие баллы уже видны во вкладке «Текущий семестр».</EmptyState>}
    </div>
  );
}

type FocusCard = { d: { name: string; short: string }; plan: { tone: "ok" | "goal" | "exam" | "risk"; headline: string; needPct: number | null }; next?: { title: string; dueAt: Date | null; maxPoints: number } };

/**
 * До трёх шагов «с чего начать»: 1) предмет с риском, 2) ближайшая работа с целью в баллах,
 * 3) предмет, где автомат получить проще всего. Повторы предметов пропускаем.
 */
function focusSteps(cards: FocusCard[]) {
  const out: { anchor: string; lead: string; text: string }[] = [];
  const used = new Set<string>();
  const risk = cards.find((c) => c.plan.tone === "risk");
  if (risk) {
    out.push({ anchor: risk.d.name, lead: `${risk.d.short}:`, text: `${risk.plan.headline.toLowerCase()} — разберитесь с этим предметом первым, запишитесь на консультацию.` });
    used.add(risk.d.name);
  }
  const soon = cards.filter((c) => c.next?.dueAt && !used.has(c.d.name)).sort((a, b) => +a.next!.dueAt! - +b.next!.dueAt!)[0];
  if (soon?.next?.dueAt) {
    const goal = soon.plan.needPct ? ` — цель ${Math.ceil((soon.next.maxPoints * soon.plan.needPct) / 100)}+ из ${soon.next.maxPoints}` : ` — до ${soon.next.maxPoints} б.`;
    out.push({ anchor: soon.d.name, lead: `${fmt.dayMonth(soon.next.dueAt)} — ${soon.next.title}`, text: `по предмету «${soon.d.short}»${goal}.` });
    used.add(soon.d.name);
  }
  const easiest = cards.filter((c) => c.plan.tone === "goal" && c.plan.needPct !== null && !used.has(c.d.name)).sort((a, b) => a.plan.needPct! - b.plan.needPct!)[0];
  if (easiest) out.push({ anchor: easiest.d.name, lead: `${easiest.d.short}:`, text: `автомат ближе всего — достаточно в среднем ${easiest.plan.needPct}% за оставшиеся работы.` });
  return out;
}
