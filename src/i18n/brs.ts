import type { DisciplineSummary, Plan } from "@/lib/brs";
import type { I18n } from ".";

/** Текст «что делать» по предмету на языке интерфейса. */
export function planText(p: Plan, s: DisciplineSummary, t: I18n["t"]) {
  const parts = p.parts.map(([k, n]) => t(`grades.plan.${k}`, { n })).join(", ");
  return {
    headline: t(`grades.plan.${p.head}`, p.vars),
    detail: t(`grades.plan.${p.detail}`, { ...p.vars, parts, reason: riskText(s, t) ?? "" }),
  };
}

/** Причина риска на языке интерфейса (или null). */
export function riskText(s: DisciplineSummary, t: I18n["t"]): string | null {
  return s.riskKey ? t(`grades.risk.${s.riskKey}`, s.riskVars) : null;
}
