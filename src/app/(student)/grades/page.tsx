import Link from "next/link";
import type { Metadata } from "next";
import { AlertTriangle, BookOpen, CheckCircle2, Info, Target } from "lucide-react";
import { requireStudent } from "@/server/auth/guards";
import { getMyGrades } from "@/server/dal/student";
import { BRS, averagePoints, markFor, neededOnFinal } from "@/lib/brs";
import { fmt, now } from "@/lib/time";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty";
import { CurrentBar } from "@/components/grades/progress";
import { WhatIf } from "@/components/grades/what-if";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Успеваемость" };

const CONTROL = { EXAM: "Экзамен", CREDIT: "Зачёт", GRADED_CREDIT: "Дифф. зачёт" } as const;
const semTitle = (s: string) => { const [y, t] = s.split("-"); return `${t === "осень" ? "Осенний" : "Весенний"} семестр ${t === "осень" ? `${y}/${+y + 1}` : `${+y - 1}/${y}`}`; };

export default async function GradesPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const v = await requireStudent();
  const { tab } = await searchParams;
  const at = now();
  const { current, past } = await getMyGrades(v);
  const earned = current.reduce((s, d) => s + d.summary.earned, 0);
  const gradedMax = current.reduce((s, d) => s + d.summary.gradedMax, 0);
  const pace = gradedMax ? Math.round((earned / gradedMax) * 100) : null;
  const autos = current.filter((d) => d.summary.auto?.achieved);
  const risks = current.filter((d) => d.summary.risk !== "none");
  const avg = averagePoints(past.map((p) => p.points));
  const semesters = [...new Set(past.map((p) => p.semester))].reverse();
  const isPast = tab === "record";

  return (
    <div className="pt-2 lg:pt-0">
      <PageHeader title="Успеваемость" subtitle="Осенний семестр 2026/27 · балльно-рейтинговая система" />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="p-4"><p className="text-xs font-semibold uppercase tracking-wider text-muted">Темп семестра</p><p className="mt-1 font-serif text-3xl tabular">{pace ?? "—"}<span className="text-lg">%</span></p><p className="text-xs text-muted">от возможного по проверенным работам</p></Card>
        <Card className="p-4"><p className="text-xs font-semibold uppercase tracking-wider text-muted">Автоматы</p><p className="mt-1 font-serif text-3xl tabular">{autos.length}<span className="text-lg text-muted"> / {current.length}</span></p><p className="text-xs text-muted">уже набрано на автомат</p></Card>
        <Card className="p-4"><p className="text-xs font-semibold uppercase tracking-wider text-muted">Средний балл</p><p className="mt-1 font-serif text-3xl tabular">{avg !== null ? avg.toLocaleString("ru-RU") : "—"}</p><p className="text-xs text-muted">{avg !== null ? `зачётка, ${semesters.length} сем.` : "первый семестр — итогов ещё нет"}</p></Card>
        <Card className={cn("p-4", risks.length && "border-danger/40")}><p className="text-xs font-semibold uppercase tracking-wider text-muted">Риски</p><p className={cn("mt-1 font-serif text-3xl tabular", risks.length ? "text-danger" : "text-ok")}>{risks.length}</p><p className="text-xs text-muted">{risks.length ? risks.map((r) => r.short).join(", ") : "всё под контролем"}</p></Card>
      </div>

      <div role="tablist" aria-label="Период" className="mb-4 inline-flex rounded-xl border border-line bg-surface p-1">
        <Link role="tab" aria-selected={!isPast} href="/grades" className={cn("rounded-lg px-4 py-1.5 text-sm font-semibold", !isPast ? "bg-primary text-primary-fg" : "text-muted")}>Текущий семестр</Link>
        <Link role="tab" aria-selected={isPast} href="/grades?tab=record" className={cn("rounded-lg px-4 py-1.5 text-sm font-semibold", isPast ? "bg-primary text-primary-fg" : "text-muted")}>Зачётка</Link>
      </div>

      {!isPast ? (
        <>
          <details className="mb-4 rounded-2xl border border-line bg-surface p-4 text-sm">
            <summary className="flex cursor-pointer items-center gap-2 font-semibold"><Info className="h-4 w-4 text-accent-text" aria-hidden />Как считаются баллы (Положение, раздел 4)</summary>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-muted">
              <li>Текущий контроль — до {BRS.currentMax} баллов, {`экзамен или зачёт`} — до {BRS.finalMax}. Итог — по 100-балльной шкале.</li>
              <li>90–100 — «отлично», 75–89 — «хорошо», 60–74 — «удовлетворительно», меньше 60 — пересдача.</li>
              <li>Зачёт «автоматом» — при {BRS.autoCredit}+ баллах текущего контроля (70%).</li>
              <li>Экзамен «автоматом» на «отлично» по желанию студента — при {BRS.autoExcellent}+ баллах (90%).</li>
            </ul>
            <p className="mt-2 text-xs text-muted">Положение вымышленное — составлено для концепта на основе открытых описаний БРС.</p>
          </details>
          <div className="grid gap-3 xl:grid-cols-2">
            {current.map((d) => {
              const s = d.summary;
              const need3 = neededOnFinal(s.projectedCurrent, 60);
              const need4 = neededOnFinal(s.projectedCurrent, 75);
              const need5 = neededOnFinal(s.projectedCurrent, 90);
              const examHint = need5.feasible ? `при нынешнем темпе для «отлично» нужно ~${need5.need} б. на экзамене, для «хорошо» — ~${need4.need}`
                : need4.feasible ? `при нынешнем темпе для «хорошо» нужно ~${need4.need} б. на экзамене`
                : need3.feasible ? `при нынешнем темпе для «удовлетворительно» нужно ~${need3.need} б. на экзамене — подтяните оставшиеся работы` : "даже максимум на экзамене не даст 60 — запишитесь к методисту";
              return (
                <Card key={d.id} as="article" id={d.name} aria-label={d.name} className="scroll-mt-24">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="font-semibold leading-snug">{d.name}</h2>
                      <p className="text-[13px] text-muted">{d.teacherTitle} {d.teacherLast} {d.teacherFirst[0]}. · {d.credits} з.е.</p>
                    </div>
                    <Badge tone={d.control === "EXAM" ? "primary" : "neutral"}>{CONTROL[d.control]}</Badge>
                  </div>
                  <div className="mt-3 flex items-baseline justify-between">
                    <p><b className="font-serif text-2xl tabular">{s.earned}</b><span className="text-muted"> / {BRS.currentMax} текущий контроль</span></p>
                    <p className="text-sm text-muted">проверено на {s.gradedMax} б.</p>
                  </div>
                  <CurrentBar earned={s.earned} gradedMax={s.gradedMax} control={d.control} />
                  <div className="mt-3 space-y-1.5 text-sm">
                    {s.auto?.achieved ? (
                      <p className="flex items-center gap-2 font-semibold text-ok"><CheckCircle2 className="h-4 w-4" aria-hidden />{s.auto.kind === "credit" ? "Зачёт автоматом уже есть" : "Можно получить «отлично» автоматом"}</p>
                    ) : s.auto?.possible ? (
                      <p className="flex items-center gap-2"><Target className="h-4 w-4 text-accent-text" aria-hidden />До {s.auto.kind === "credit" ? "зачёта автоматом" : "«отлично» автоматом"}: <b>{s.auto.need} б.</b> из {s.remainingMax} оставшихся</p>
                    ) : (
                      <p className="flex items-center gap-2 text-muted"><Target className="h-4 w-4" aria-hidden />Автомат уже недоступен — {d.control === "CREDIT" ? "сдаём зачёт" : examHint}</p>
                    )}
                    {s.risk !== "none" && s.auto?.possible !== false && <p className={cn("flex items-start gap-2 font-medium", s.risk === "high" ? "text-danger" : "text-warn")}><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />{s.riskReason}</p>}
                  </div>
                  <details className="mt-3 group">
                    <summary className="cursor-pointer text-sm font-semibold text-primary dark:text-accent-text">Контрольные точки и «что, если»</summary>
                    <table className="mt-3 w-full text-sm">
                      <caption className="sr-only">Контрольные точки: {d.name}</caption>
                      <thead><tr className="text-left text-xs text-muted"><th className="pb-1 font-medium">Работа</th><th className="pb-1 font-medium">Срок</th><th className="pb-1 text-right font-medium">Баллы</th></tr></thead>
                      <tbody className="divide-y divide-line">
                        {d.items.map((a) => (
                          <tr key={a.id}>
                            <td className="py-1.5 pr-2">{a.title}</td>
                            <td className="py-1.5 pr-2 text-muted">{a.dueAt ? fmt.dayMonthShort(a.dueAt) : "сессия"}</td>
                            <td className="py-1.5 text-right tabular">{a.points !== null ? <b>{a.points}</b> : <span className="text-muted">{a.dueAt && a.dueAt < at ? "проверяется" : "—"}</span>}<span className="text-muted"> / {a.maxPoints}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="mt-3"><WhatIf earned={s.earned} remainingMax={s.remainingMax} control={d.control} /></div>
                  </details>
                </Card>
              );
            })}
          </div>
        </>
      ) : past.length ? (
        <div className="space-y-4">
          {semesters.map((sem) => {
            const list = past.filter((p) => p.semester === sem);
            return (
              <Card key={sem} aria-label={semTitle(sem)}>
                <h2 className="mb-3 flex items-baseline justify-between font-semibold"><span>{semTitle(sem)}</span><span className="text-sm font-normal text-muted">средний {averagePoints(list.map((l) => l.points))?.toLocaleString("ru-RU")}</span></h2>
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
