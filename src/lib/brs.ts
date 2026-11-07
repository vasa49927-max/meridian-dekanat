/**
 * Балльно-рейтинговая система по вымышленному «Положению о деканате (концепт)», раздел 4.
 * Чистые функции без доступа к БД — покрыты unit-тестами (tests/unit/brs.test.ts).
 */
export const BRS = {
  currentMax: 60, // текущий контроль
  finalMax: 40, // экзамен / зачёт
  passTotal: 60,
  /** Зачёт «автоматом»: текущий контроль ≥ 70% (42 из 60). П. 4.5 Положения. */
  autoCredit: 42,
  /** Экзамен «автоматом» на «отлично» по желанию студента: текущий ≥ 90% (54 из 60). П. 4.6. */
  autoExcellent: 54,
  marks: [
    { min: 90, mark: 5, label: "отлично" },
    { min: 75, mark: 4, label: "хорошо" },
    { min: 60, mark: 3, label: "удовлетворительно" },
    { min: 0, mark: 2, label: "неудовлетворительно" },
  ],
} as const;

export type Control = "EXAM" | "CREDIT" | "GRADED_CREDIT";
export type AssessmentInput = { id: string; title: string; maxPoints: number; points: number | null; kind: string; dueAt?: Date | null };

export function markFor(total: number) {
  return BRS.marks.find((m) => total >= m.min) ?? BRS.marks[BRS.marks.length - 1];
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export type DisciplineSummary = {
  earned: number; // набрано в текущем контроле
  gradedMax: number; // максимум по уже оценённым точкам
  remainingMax: number; // ещё можно набрать в текущем контроле
  pacePct: number; // % от возможного по оценённым
  projectedCurrent: number; // прогноз текущего балла при сохранении темпа
  final: number | null; // балл за экзамен/зачёт, если уже есть
  total: number | null; // итог, если есть final
  auto: { kind: "credit" | "excellent"; target: number; achieved: boolean; need: number; possible: boolean } | null;
  risk: "none" | "watch" | "high";
  riskReason: string | null;
};

/** Сводка по дисциплине: сколько набрано, прогноз, автомат, риски. */
export function summarize(control: Control, items: AssessmentInput[]): DisciplineSummary {
  const current = items.filter((a) => a.kind !== "FINAL");
  const finalItem = items.find((a) => a.kind === "FINAL");
  const earned = round1(current.reduce((s, a) => s + (a.points ?? 0), 0));
  const gradedMax = current.filter((a) => a.points !== null).reduce((s, a) => s + a.maxPoints, 0);
  const remainingMax = current.filter((a) => a.points === null).reduce((s, a) => s + a.maxPoints, 0);
  const pacePct = gradedMax ? Math.round((earned / gradedMax) * 100) : 0;
  const projectedCurrent = gradedMax ? round1(Math.min(BRS.currentMax, earned + (earned / gradedMax) * remainingMax)) : 0;
  const final = finalItem?.points ?? null;
  const total = final !== null ? round1(earned + final) : null;

  const target = control === "CREDIT" ? BRS.autoCredit : BRS.autoExcellent;
  const need = Math.max(0, round1(target - earned));
  const auto = {
    kind: control === "CREDIT" ? ("credit" as const) : ("excellent" as const),
    target, achieved: earned >= target, need, possible: need <= remainingMax,
  };

  let risk: DisciplineSummary["risk"] = "none";
  let riskReason: string | null = null;
  const maxReachable = earned + remainingMax + BRS.finalMax;
  if (total !== null && total < BRS.passTotal) {
    risk = "high"; riskReason = "итог ниже 60 — нужна пересдача";
  } else if (maxReachable < BRS.passTotal) {
    risk = "high"; riskReason = "даже с максимумом за экзамен не набрать 60";
  } else if (gradedMax >= 10 && pacePct < 60) {
    risk = "watch";
    riskReason = `темп ${pacePct}% — для «удовлетворительно» нужно ${Math.max(0, round1(BRS.passTotal - projectedCurrent))} б. на экзамене`;
  }
  return { earned, gradedMax, remainingMax, pacePct, projectedCurrent, final, total, auto, risk, riskReason };
}

/** Сколько нужно набрать на экзамене при данном текущем балле, чтобы получить целевую оценку. */
export function neededOnFinal(current: number, targetTotal: number) {
  const need = Math.max(0, round1(targetTotal - current));
  return { need, feasible: need <= BRS.finalMax };
}

/** «Что, если»: итог при гипотетических баллах за оставшиеся точки и экзамен. */
export function whatIf(earned: number, extraCurrent: number, finalPoints: number) {
  const current = Math.min(BRS.currentMax, round1(earned + extraCurrent));
  const total = round1(current + Math.min(BRS.finalMax, finalPoints));
  return { current, total, mark: markFor(total) };
}

/** Средний балл зачётки по 100-балльной шкале. */
export function averagePoints(points: number[]) {
  if (!points.length) return null;
  return round1(points.reduce((s, p) => s + p, 0) / points.length);
}

export type Plan = {
  tone: "ok" | "goal" | "exam" | "risk";
  headline: string;
  detail: string;
  /** Средний % от максимума, который нужен за оставшиеся работы, чтобы выйти на автомат. */
  needPct: number | null;
};

/**
 * «Что мне делать» по дисциплине — одной фразой (переработка раздела по правке капитана №4).
 * Порядок проверок: риск → автомат уже есть → автомат достижим → только экзамен/зачёт.
 */
export function planFor(control: Control, s: DisciplineSummary): Plan {
  const isCredit = control === "CREDIT";
  const autoName = isCredit ? "зачёт без сдачи" : "«отлично» без экзамена";
  if (s.risk === "high") {
    return { tone: "risk", headline: "Есть риск не сдать", detail: `${s.riskReason ?? ""}. Запишитесь к методисту или к преподавателю на консультацию.`, needPct: null };
  }
  if (s.auto?.achieved) {
    return { tone: "ok", headline: isCredit ? "Зачёт уже ваш" : "«Отлично» без экзамена — уже можно", detail: isCredit ? `Набрано ${s.earned} из 60 — больше ${BRS.autoCredit}, зачёт ставится автоматически.` : `Набрано ${s.earned} из 60 — больше ${BRS.autoExcellent}. Можно не сдавать экзамен и получить «отлично».`, needPct: null };
  }
  if (s.auto?.possible && s.remainingMax > 0) {
    const pct = Math.min(100, Math.ceil((s.auto.need / s.remainingMax) * 100));
    return { tone: s.risk === "watch" ? "risk" : "goal", headline: `До «${isCredit ? "автомата" : "отлично» автоматом"}${isCredit ? "»" : ""}: ещё ${s.auto.need} б.`, detail: `Осталось работ на ${s.remainingMax} б. Набирайте в среднем ${pct}% за каждую — и получите ${autoName}.`, needPct: pct };
  }
  if (isCredit) {
    const need = neededOnFinal(s.projectedCurrent, BRS.passTotal);
    return { tone: s.risk === "watch" ? "risk" : "exam", headline: s.risk === "watch" ? `Нужно подтянуть баллы: темп ${s.pacePct}%` : "Нужно сдавать зачёт", detail: need.feasible ? `При нынешнем темпе на зачёте нужно набрать около ${need.need} из 40.` : "Даже максимум на зачёте не даст 60 — срочно к методисту.", needPct: null };
  }
  const n5 = neededOnFinal(s.projectedCurrent, 90), n4 = neededOnFinal(s.projectedCurrent, 75), n3 = neededOnFinal(s.projectedCurrent, 60);
  const parts = [n5.feasible && `«отлично» — ~${n5.need}`, n4.feasible && `«хорошо» — ~${n4.need}`, n3.feasible && `«удовл.» — ~${n3.need}`].filter(Boolean);
  return { tone: s.risk === "watch" ? "risk" : "exam", headline: s.risk === "watch" ? `Нужно подтянуть баллы: темп ${s.pacePct}%` : "Готовимся к экзамену", detail: parts.length ? `Сколько нужно на экзамене (из 40) при нынешнем темпе: ${parts.slice(0, 2).join(", ")}.` : "Даже максимум на экзамене не даст 60 — срочно к методисту.", needPct: null };
}
