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
  /** Причина риска без языка: ключ grades.risk.* + значения (раунд 3, переводы). */
  riskKey: RiskKey | null;
  riskVars: { pace?: number; need?: number };
};
export type RiskKey = "finalLow" | "unreachable" | "pace";

// Русские формулировки (для текстов на сервере и обратной совместимости); переводы — в словаре grades.risk / grades.plan.
const RISK_RU: Record<RiskKey, (v: DisciplineSummary["riskVars"]) => string> = {
  finalLow: () => "итог ниже 60 — нужна пересдача",
  unreachable: () => "даже с максимумом за экзамен не набрать 60",
  pace: (v) => `темп ${v.pace}% — для «удовлетворительно» нужно ${v.need} б. на экзамене`,
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
  let riskKey: RiskKey | null = null;
  const riskVars: DisciplineSummary["riskVars"] = {};
  const maxReachable = earned + remainingMax + BRS.finalMax;
  if (total !== null && total < BRS.passTotal) {
    risk = "high"; riskKey = "finalLow";
  } else if (maxReachable < BRS.passTotal) {
    risk = "high"; riskKey = "unreachable";
  } else if (gradedMax >= 10 && pacePct < 60) {
    risk = "watch"; riskKey = "pace";
    riskVars.pace = pacePct; riskVars.need = Math.max(0, round1(BRS.passTotal - projectedCurrent));
  }
  const riskReason = riskKey ? RISK_RU[riskKey](riskVars) : null;
  return { earned, gradedMax, remainingMax, pacePct, projectedCurrent, final, total, auto, risk, riskReason, riskKey, riskVars };
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

export type PlanHead = "riskHigh" | "okCredit" | "okExcellent" | "goalCredit" | "goalExcellent" | "watch" | "creditExam" | "exam";
export type PlanDetail = "riskHighDetail" | "okCreditDetail" | "okExcellentDetail" | "goalCreditDetail" | "goalExcellentDetail" | "creditNeed" | "creditImpossible" | "examNeed" | "examImpossible";
export type PlanVars = { earned?: number; target?: number; need?: number; remaining?: number; pct?: number; pace?: number };

export type Plan = {
  tone: "ok" | "goal" | "exam" | "risk";
  /** Ключи для перевода: grades.plan.<head> / grades.plan.<detail>; parts — «отлично — ~N» и т. п. */
  head: PlanHead; detail: PlanDetail; vars: PlanVars; parts: [key: "partExcellent" | "partGood" | "partSat", n: number][];
  /** Средний % от максимума, который нужен за оставшиеся работы, чтобы выйти на автомат. */
  needPct: number | null;
};

/**
 * «Что мне делать» по дисциплине — одной фразой (переработка раздела по правке капитана №4).
 * Порядок проверок: риск → автомат уже есть → автомат достижим → только экзамен/зачёт.
 * Возвращает ключи и числа; текст на нужном языке собирает planText() из src/i18n/brs.ts.
 */
export function planFor(control: Control, s: DisciplineSummary): Plan {
  const isCredit = control === "CREDIT";
  const base = { vars: {} as PlanVars, parts: [] as Plan["parts"], needPct: null as number | null };
  if (s.risk === "high") return { ...base, tone: "risk", head: "riskHigh", detail: "riskHighDetail" };
  if (s.auto?.achieved) {
    return { ...base, tone: "ok", head: isCredit ? "okCredit" : "okExcellent", detail: isCredit ? "okCreditDetail" : "okExcellentDetail", vars: { earned: s.earned, target: isCredit ? BRS.autoCredit : BRS.autoExcellent } };
  }
  if (s.auto?.possible && s.remainingMax > 0) {
    const pct = Math.min(100, Math.ceil((s.auto.need / s.remainingMax) * 100));
    return { ...base, tone: s.risk === "watch" ? "risk" : "goal", head: isCredit ? "goalCredit" : "goalExcellent", detail: isCredit ? "goalCreditDetail" : "goalExcellentDetail", vars: { need: s.auto.need, remaining: s.remainingMax, pct }, needPct: pct };
  }
  const watch = s.risk === "watch";
  if (isCredit) {
    const need = neededOnFinal(s.projectedCurrent, BRS.passTotal);
    return { ...base, tone: watch ? "risk" : "exam", head: watch ? "watch" : "creditExam", detail: need.feasible ? "creditNeed" : "creditImpossible", vars: { pace: s.pacePct, need: need.need } };
  }
  const n5 = neededOnFinal(s.projectedCurrent, 90), n4 = neededOnFinal(s.projectedCurrent, 75), n3 = neededOnFinal(s.projectedCurrent, 60);
  const parts: Plan["parts"] = [];
  if (n5.feasible) parts.push(["partExcellent", n5.need]);
  if (n4.feasible) parts.push(["partGood", n4.need]);
  if (n3.feasible) parts.push(["partSat", n3.need]);
  return { ...base, tone: watch ? "risk" : "exam", head: watch ? "watch" : "exam", detail: parts.length ? "examNeed" : "examImpossible", vars: { pace: s.pacePct }, parts: parts.slice(0, 2) };
}

/**
 * Прогноз академической стипендии (раунд 8; вымышленное Положение, п. 10.1): назначается студентам бюджетной основы
 * по итогам сессии без оценок «удовлетворительно» и задолженностей.
 * Прогноз итога по дисциплине = прогноз текущего контроля при нынешнем темпе + экзамен/зачёт в том же темпе.
 * Это ориентир, а не обещание: в интерфейсе так и подписано.
 */
export type StipendItem = { name: string; short: string; control: Control; summary: DisciplineSummary };
/** kind: exam — хватит нужного балла на экзамене; pace — нужно поднять темп в семестре (need из rem) и сдать экзамен на максимум; impossible — уже недостижимо. */
export type StipendRisk = { name: string; short: string; control: Control; predicted: number; need: number; rem: number; kind: "exam" | "pace" | "impossible"; feasible: boolean };
export type StipendForecast = { applicable: boolean; status: "keep" | "risk" | "none"; risks: StipendRisk[]; predictedMin: number | null };

export function predictTotal(s: DisciplineSummary) {
  if (s.total !== null) return s.total;
  const pace = s.gradedMax ? s.earned / s.gradedMax : 0.7; // нет оценок — считаем «средним» темпом 70%
  return round1(Math.min(100, s.projectedCurrent + pace * BRS.finalMax));
}

export function stipendForecast(basis: string, items: StipendItem[]): StipendForecast {
  if (basis !== "бюджет") return { applicable: false, status: "none", risks: [], predictedMin: null };
  const risks: StipendRisk[] = [];
  let predictedMin: number | null = null;
  for (const it of items) {
    const s = it.summary;
    const credit = it.control === "CREDIT";
    // Зачёт автоматом или «отлично» автоматом — дисциплина не угрожает стипендии
    if (s.auto?.achieved) continue;
    const predicted = predictTotal(s);
    const threshold = credit ? BRS.passTotal : 75;
    if (!credit) predictedMin = predictedMin === null ? predicted : Math.min(predictedMin, predicted);
    if (predicted < threshold) {
      const n = neededOnFinal(s.projectedCurrent, threshold);
      const needCurrent = Math.max(0, round1(threshold - BRS.finalMax - s.earned)); // сколько добрать в семестре, если экзамен — на максимум
      const kind = n.feasible ? "exam" as const : needCurrent <= s.remainingMax ? "pace" as const : "impossible" as const;
      risks.push({ name: it.name, short: it.short, control: it.control, predicted, need: kind === "exam" ? n.need : needCurrent, rem: s.remainingMax, kind, feasible: kind !== "impossible" });
    }
  }
  return { applicable: true, status: risks.length ? "risk" : "keep", risks, predictedMin };
}
