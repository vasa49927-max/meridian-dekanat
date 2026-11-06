"use client";
import { useId, useState } from "react";
import { BRS, markFor, whatIf } from "@/lib/brs";
import { cn } from "@/lib/cn";

/** Калькулятор «что, если»: двигаем баллы за оставшиеся точки и экзамен — видим итог и оценку. */
export function WhatIf({ earned, remainingMax, control }: { earned: number; remainingMax: number; control: "EXAM" | "CREDIT" | "GRADED_CREDIT" }) {
  const id = useId();
  const [extra, setExtra] = useState(Math.round(remainingMax * 0.7));
  const [fin, setFin] = useState(28);
  const autoTarget = control === "CREDIT" ? BRS.autoCredit : BRS.autoExcellent;
  const r = whatIf(earned, extra, fin);
  const autoReached = r.current >= autoTarget;
  const markColor = r.mark.mark === 5 ? "text-ok" : r.mark.mark === 4 ? "text-info" : r.mark.mark === 3 ? "text-warn" : "text-danger";
  return (
    <div className="rounded-2xl border border-line bg-bg p-4">
      <p className="mb-3 text-sm font-semibold">Что, если…</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-a`} className="flex justify-between text-sm"><span>за оставшиеся работы</span><b className="tabular">{extra} из {remainingMax}</b></label>
          <input id={`${id}-a`} type="range" min={0} max={remainingMax} value={extra} onChange={(e) => setExtra(+e.target.value)} disabled={!remainingMax} className="mt-2 w-full accent-[var(--primary)]" />
        </div>
        <div>
          <label htmlFor={`${id}-b`} className="flex justify-between text-sm"><span>{control === "CREDIT" ? "на зачёте" : "на экзамене"}</span><b className="tabular">{autoReached && control === "CREDIT" ? "не нужен" : `${fin} из ${BRS.finalMax}`}</b></label>
          <input id={`${id}-b`} type="range" min={0} max={BRS.finalMax} value={fin} onChange={(e) => setFin(+e.target.value)} disabled={autoReached && control === "CREDIT"} className="mt-2 w-full accent-[var(--primary)]" />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1" aria-live="polite">
        <p>Текущий: <b className="tabular">{r.current}</b>/60</p>
        {control === "CREDIT" ? (
          <p className={cn("font-semibold", autoReached || r.total >= 60 ? "text-ok" : "text-danger")}>{autoReached ? "Зачёт автоматом" : r.total >= 60 ? `Итог ${r.total} — зачтено` : `Итог ${r.total} — не зачтено`}</p>
        ) : (
          <p>Итог: <b className={cn("text-lg tabular", markColor)}>{autoReached ? "отлично (автомат)" : `${r.total} — ${markFor(r.total).label}`}</b></p>
        )}
      </div>
    </div>
  );
}
