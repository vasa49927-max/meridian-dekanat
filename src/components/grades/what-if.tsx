"use client";
import { useId, useState } from "react";
import { BRS, markFor, whatIf } from "@/lib/brs";
import { cn } from "@/lib/cn";
import { useI18n } from "@/i18n/client";

const MARK_KEY = { 5: "excellent", 4: "good", 3: "satisfactory", 2: "fail" } as const;

/** Калькулятор «что, если»: двигаем баллы за оставшиеся точки и экзамен — видим итог и оценку. */
export function WhatIf({ earned, remainingMax, control }: { earned: number; remainingMax: number; control: "EXAM" | "CREDIT" | "GRADED_CREDIT" }) {
  const { t } = useI18n();
  const id = useId();
  const [extra, setExtra] = useState(Math.round(remainingMax * 0.7));
  const [fin, setFin] = useState(28);
  const autoTarget = control === "CREDIT" ? BRS.autoCredit : BRS.autoExcellent;
  const r = whatIf(earned, extra, fin);
  const autoReached = r.current >= autoTarget;
  const markColor = r.mark.mark === 5 ? "text-ok" : r.mark.mark === 4 ? "text-info" : r.mark.mark === 3 ? "text-warn" : "text-danger";
  return (
    <div className="rounded-2xl border border-line bg-bg p-4">
      <p className="mb-3 text-sm font-semibold">{t("grades.whatIf.title")}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-a`} className="flex justify-between text-sm"><span>{t("grades.whatIf.remaining")}</span><b className="tabular">{t("grades.whatIf.ofMax", { n: extra, max: remainingMax })}</b></label>
          <input id={`${id}-a`} type="range" min={0} max={remainingMax} value={extra} onChange={(e) => setExtra(+e.target.value)} disabled={!remainingMax} className="mt-1 h-10 w-full cursor-pointer accent-[var(--primary)]" />
        </div>
        <div>
          <label htmlFor={`${id}-b`} className="flex justify-between text-sm"><span>{control === "CREDIT" ? t("grades.whatIf.onCredit") : t("grades.whatIf.onExam")}</span><b className="tabular">{autoReached && control === "CREDIT" ? t("grades.whatIf.notNeeded") : t("grades.whatIf.ofMax", { n: fin, max: BRS.finalMax })}</b></label>
          <input id={`${id}-b`} type="range" min={0} max={BRS.finalMax} value={fin} onChange={(e) => setFin(+e.target.value)} disabled={autoReached && control === "CREDIT"} className="mt-1 h-10 w-full cursor-pointer accent-[var(--primary)]" />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1" aria-live="polite">
        <p>{t("grades.whatIf.current")} <b className="tabular">{r.current}</b>/60</p>
        {control === "CREDIT" ? (
          <p className={cn("font-semibold", autoReached || r.total >= 60 ? "text-ok" : "text-danger")}>{autoReached ? t("grades.whatIf.autoCredit") : r.total >= 60 ? t("grades.whatIf.passed", { total: r.total }) : t("grades.whatIf.failed", { total: r.total })}</p>
        ) : (
          <p>{t("grades.whatIf.total")} <b className={cn("text-lg tabular", markColor)}>{autoReached ? t("grades.whatIf.autoExcellent") : t("grades.whatIf.totalMark", { total: r.total, mark: t(`grades.marks.${MARK_KEY[markFor(r.total).mark]}`) })}</b></p>
        )}
      </div>
    </div>
  );
}
