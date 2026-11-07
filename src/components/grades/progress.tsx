import { BRS } from "@/lib/brs";

/**
 * Шкала семестра 0–60 с подписями: сколько набрано, сколько ещё можно набрать, где порог автомата.
 * Цифры подписаны прямо под шкалой — без легенды «угадай цвет».
 */
export function PointsBar({ earned, remaining, target, targetLabel }: { earned: number; remaining: number; target: number; targetLabel: string }) {
  const pct = (n: number) => `${Math.min(100, (n / BRS.currentMax) * 100)}%`;
  const lost = Math.max(0, BRS.currentMax - earned - remaining);
  return (
    <div className="mt-3">
      <div className="flex items-baseline justify-between text-sm">
        <span><b className="font-serif text-2xl tabular">{earned}</b><span className="text-muted"> из {BRS.currentMax} за семестр</span></span>
        <span className="text-[13px] text-muted">ещё можно {remaining}&nbsp;б.</span>
      </div>
      <div className="relative mt-2 h-3 rounded-full bg-surface-2" role="img" aria-label={`Набрано ${earned} из ${BRS.currentMax}. Ещё можно набрать ${remaining}. Порог: ${targetLabel} — ${target}.`}>
        <div className="absolute inset-y-0 rounded-full bg-primary/15 dark:bg-accent/20" style={{ left: pct(earned), width: pct(remaining) }} />
        <div className={`absolute inset-y-0 left-0 rounded-full ${earned >= target ? "bg-ok" : "bg-primary dark:bg-accent"}`} style={{ width: pct(earned) }} />
        <div className="absolute -top-1.5 h-6 w-[3px] rounded bg-accent-text" style={{ left: pct(target) }} aria-hidden />
      </div>
      <div className="relative mt-1 h-4 text-[11px] text-muted" aria-hidden>
        <span className="absolute left-0">0</span>
        {/* Подпись порога: у правого края выравниваем по правому краю, чтобы не вылезала на 360 px */}
        <span className={`absolute whitespace-nowrap bg-surface px-1 font-semibold text-accent-text ${target / BRS.currentMax > 0.75 ? "-translate-x-full" : "-translate-x-1/2"}`} style={{ left: `calc(${pct(target)} + ${target / BRS.currentMax > 0.75 ? "6px" : "0px"})` }}>порог {target}: {targetLabel}</span>
      </div>
      {lost > 0 && <p className="text-[11px] text-muted">Потеряно в проверенных работах: {lost} б.</p>}
    </div>
  );
}

export { PointsBar as CurrentBar };
