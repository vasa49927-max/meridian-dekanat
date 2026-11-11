import { BRS } from "@/lib/brs";
import { getI18n } from "@/i18n/server";

/**
 * Шкала семестра 0–60 с подписями: сколько набрано, сколько ещё можно набрать, где порог автомата.
 * Цифры подписаны прямо под шкалой — без легенды «угадай цвет».
 * Серверный компонент (async): подписи — на языке интерфейса.
 */
export async function PointsBar({ earned, remaining, target, targetLabel }: { earned: number; remaining: number; target: number; targetLabel: string }) {
  const { t } = await getI18n();
  const pct = (n: number) => `${Math.min(100, (n / BRS.currentMax) * 100)}%`;
  const lost = Math.max(0, BRS.currentMax - earned - remaining);
  return (
    <div className="mt-3">
      <div className="flex items-baseline justify-between text-sm">
        <span><b className="font-serif text-2xl tabular">{earned}</b><span className="text-muted"> {t("grades.bar.earned", { max: BRS.currentMax })}</span></span>
        <span className="text-[13px] text-muted">{t("grades.bar.canStill", { n: remaining })}</span>
      </div>
      <div className="relative mt-2 h-3 rounded-full bg-surface-2" role="img" aria-label={t("grades.bar.aria", { earned, max: BRS.currentMax, remaining, label: targetLabel, target })}>
        <div className="absolute inset-y-0 rounded-full bg-primary/15 dark:bg-accent/20" style={{ left: pct(earned), width: pct(remaining) }} />
        <div className={`absolute inset-y-0 left-0 rounded-full ${earned >= target ? "bg-ok" : "bg-primary dark:bg-accent"}`} style={{ width: pct(earned) }} />
        <div className="absolute -top-1.5 h-6 w-[3px] rounded bg-accent-text" style={{ left: pct(target) }} aria-hidden />
      </div>
      <div className="relative mt-1 h-4 text-[11px] text-muted" aria-hidden>
        <span className="absolute left-0">0</span>
        {/* Подпись порога: у правого края выравниваем по правому краю, чтобы не вылезала на 360 px */}
        <span className={`absolute whitespace-nowrap bg-surface px-1 font-semibold text-accent-text ${target / BRS.currentMax > 0.75 ? "-translate-x-full" : "-translate-x-1/2"}`} style={{ left: `calc(${pct(target)} + ${target / BRS.currentMax > 0.75 ? "6px" : "0px"})` }}>{t("grades.bar.threshold", { target, label: targetLabel })}</span>
      </div>
      {lost > 0 && <p className="text-[11px] text-muted">{t("grades.bar.lost", { n: lost })}</p>}
    </div>
  );
}

export { PointsBar as CurrentBar };
