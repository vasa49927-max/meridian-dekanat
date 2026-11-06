import { BRS } from "@/lib/brs";
import { cn } from "@/lib/cn";

/** Полоса текущего контроля 0–60 с отметками «автомата». */
export function CurrentBar({ earned, gradedMax, control }: { earned: number; gradedMax: number; control: string }) {
  const pct = (n: number) => `${(n / BRS.currentMax) * 100}%`;
  const target = control === "CREDIT" ? BRS.autoCredit : BRS.autoExcellent;
  return (
    <div className="relative mt-3 h-2.5 rounded-full bg-surface-2" role="img" aria-label={`Текущий контроль: ${earned} из ${BRS.currentMax}, проверено работ на ${gradedMax} баллов`}>
      <div className="absolute inset-y-0 left-0 rounded-full bg-primary/15 dark:bg-accent/20" style={{ width: pct(gradedMax) }} />
      <div className={cn("absolute inset-y-0 left-0 rounded-full", earned >= target ? "bg-ok" : "bg-primary dark:bg-accent")} style={{ width: pct(earned) }} />
      <div className="absolute -top-1 h-[18px] w-0.5 rounded bg-accent-text" style={{ left: pct(target) }} aria-hidden />
    </div>
  );
}
