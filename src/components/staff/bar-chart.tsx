"use client";
import { useState } from "react";

/**
 * Простая столбчатая диаграмма одного ряда (раунд 6, панель руководителя).
 * По правилам dataviz: один цвет (одна серия — без легенды), тонкие столбцы со скруглённым верхом,
 * 2px просвет, бледная сетка, подписи — цветом текста; наведение/фокус показывает значение; есть таблица.
 */
export function BarChart({ data, label, unit, height = 160 }: { data: { key: string; label: string; short: string; value: number }[]; label: string; unit: string; height?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));
  const nice = Math.ceil(max / 5) * 5 || 5;
  const w = 100 / data.length;
  const ticks = [0, nice / 2, nice];
  const every = Math.ceil(data.length / 8); // подписи по оси X — выборочно
  return (
    <figure className="m-0">
      <div className="relative" style={{ height }}>
        {/* сетка */}
        {ticks.map((t) => (
          <div key={t} className="absolute inset-x-8 border-t border-line/70" style={{ bottom: `${(t / nice) * (height - 20) + 20}px` }}>
            <span className="absolute -left-8 -top-2 w-7 text-right text-[10px] tabular text-muted">{t}</span>
          </div>
        ))}
        <svg className="absolute inset-x-8 bottom-5 overflow-visible" style={{ height: height - 20, width: "calc(100% - 4rem)" }} viewBox={`0 0 100 ${height - 20}`} preserveAspectRatio="none" role="img" aria-label={label}>
          {data.map((d, i) => {
            const h = (d.value / nice) * (height - 20);
            return (
              <g key={d.key}>
                <rect x={i * w} y={0} width={w} height={height - 20} fill="transparent" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} />
                <rect x={i * w + w * 0.18} y={height - 20 - h} width={w * 0.64} height={Math.max(h, d.value ? 1 : 0)} rx={1.2}
                  className={hover === i ? "fill-accent" : "fill-primary dark:fill-accent/80"} pointerEvents="none" />
              </g>
            );
          })}
        </svg>
        {hover !== null && (
          <div className="pointer-events-none absolute -translate-x-1/2 rounded-lg border border-line bg-surface px-2 py-1 text-xs shadow-[var(--shadow-card)]"
            style={{ left: `calc(2rem + (100% - 4rem) * ${(hover + 0.5) / data.length})`, bottom: `${(data[hover].value / nice) * (height - 20) + 26}px` }}>
            <b className="tabular">{data[hover].value}</b> {unit} · {data[hover].label}
          </div>
        )}
        <div className="absolute inset-x-8 bottom-0 h-4">
          {data.map((d, i) => (i % every === 0 ? <span key={d.key} className="absolute -translate-x-1/2 text-[10px] text-muted" style={{ left: `${((i + 0.5) / data.length) * 100}%` }}>{d.short}</span> : null))}
        </div>
      </div>
      <details className="mt-2 text-sm">
        <summary className="cursor-pointer text-muted">Таблица значений</summary>
        <table className="mt-2 w-full text-left text-xs"><tbody>{data.map((d) => <tr key={d.key} className="border-t border-line"><td className="py-1">{d.label}</td><td className="py-1 text-right tabular">{d.value}</td></tr>)}</tbody></table>
      </details>
    </figure>
  );
}
