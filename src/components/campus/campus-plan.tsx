import type { Target } from "@/lib/campus";
import { cn } from "@/lib/cn";

type L = { aria: string; avenue: string; entrance: string; bridge: string; vucEntrance: string; bus: string; street: string; basement: string; target: string };

/**
 * Условная схема кампуса (ВЫМЫШЛЕННАЯ). Цели подсвечиваются акцентом, маршрут — пунктир от входа.
 * Подписи — цветом текста, корпуса — поверхность + рамка; работает в светлой и тёмной теме через токены.
 */
const box = (on: boolean) => cn("stroke-[1.5]", on ? "fill-accent/25 stroke-accent" : "fill-surface-2 stroke-line");
const label = "fill-fg text-[13px] font-semibold";
const small = "fill-muted text-[11px]";

export function MoscowPlan({ target, codes, l }: { target: Target | null; codes: Record<string, string>; l: L }) {
  // Маршрут от главного входа (320,212) до цели
  const routes: Record<string, string> = {
    A_center: "M320 250 L320 212 L320 170",
    A_east: "M320 250 L320 212 L320 160 L470 160",
    A_west: "M320 250 L320 212 L320 160 L160 160",
    B: "M320 250 L320 212 L320 150 L505 150 L540 106 L580 106",
    SK: "M320 250 L320 212 L320 185",
    VUC: "M320 262 L70 262 L70 196",
  };
  const r = target && routes[target];
  return (
    <svg viewBox="0 36 640 244" className="h-auto w-full min-w-[540px]" role="img" aria-label={l.aria}>
      {/* проспект */}
      <rect x="0" y="252" width="640" height="22" className="fill-surface-2" />
      <text x="620" y="267" textAnchor="end" className={small}>{l.avenue}</text>
      {/* ВУЦ */}
      <rect x="30" y="130" width="70" height="66" rx="6" className={box(target === "VUC")} />
      <text x="65" y="167" textAnchor="middle" className={label}>{codes["ВУЦ"]}</text>
      <rect x="62" y="193" width="16" height="6" rx="2" className="fill-muted" /><text x="65" y="215" textAnchor="middle" className={small}>{l.vucEntrance}</text>
      {/* А: западное крыло, центр, восточное крыло */}
      <rect x="100" y="130" width="130" height="60" rx="6" className={box(target === "A_west")} />
      <rect x="230" y="110" width="180" height="102" rx="8" className={box(target === "A_center" || target === "SK")} />
      <rect x="410" y="130" width="110" height="60" rx="6" className={box(target === "A_east")} />
      <text x="320" y="132" textAnchor="middle" className={label}>{codes["А"]}</text>
      {target === "SK" && <text x="320" y="200" textAnchor="middle" className={small}>{l.basement}</text>}
      {/* переход и Б */}
      <rect x="520" y="100" width="30" height="12" className={box(target === "B")} />
      <path d="M535 56 L535 100" strokeWidth="1" className="stroke-muted" /><text x="535" y="50" textAnchor="middle" className={small}>{l.bridge}</text>
      <rect x="550" y="60" width="70" height="100" rx="6" className={box(target === "B")} />
      <text x="585" y="114" textAnchor="middle" className={label}>{codes["Б"]}</text>
      {/* главный вход */}
      <rect x="306" y="208" width="28" height="8" rx="2" className="fill-primary dark:fill-accent" />
      <text x="342" y="236" className={small}>{l.entrance}</text>
      {r && <path d={r} fill="none" strokeWidth="3" strokeDasharray="6 5" strokeLinecap="round" strokeLinejoin="round" className="stroke-primary dark:stroke-accent" />}
      {r && <circle cx={r.split(" ").slice(-2)[0].replace(/[ML]/, "")} cy={r.split(" ").slice(-1)[0]} r="7" className="fill-accent stroke-surface" strokeWidth="2.5"><title>{l.target}</title></circle>}
    </svg>
  );
}

export function OdintsovoPlan({ active, codes, l }: { active: boolean; codes: Record<string, string>; l: L }) {
  return (
    <svg viewBox="0 30 640 190" className="h-auto w-full min-w-[540px]" role="img" aria-label={l.aria}>
      <rect x="0" y="190" width="640" height="22" className="fill-surface-2" />
      <text x="620" y="205" textAnchor="end" className={small}>{l.street}</text>
      <rect x="200" y="50" width="240" height="110" rx="8" className={box(active)} />
      <text x="320" y="84" textAnchor="middle" className={label}>{codes["О"]}</text>
      <rect x="306" y="156" width="28" height="8" rx="2" className="fill-primary dark:fill-accent" />
      <rect x="60" y="168" width="56" height="16" rx="4" className="fill-muted" /><text x="88" y="160" textAnchor="middle" className={small}>{l.bus}</text>
      {active && <path d="M116 176 L320 176 L320 125" fill="none" strokeWidth="3" strokeDasharray="6 5" strokeLinecap="round" className="stroke-primary dark:stroke-accent" />}
      {active && <circle cx="320" cy="125" r="7" className="fill-accent stroke-surface" strokeWidth="2.5" />}
    </svg>
  );
}
