import { cn } from "@/lib/cn";

/**
 * Иллюстрация «Посольства» для пустых состояний, ошибок и офлайна (раунд 8): мягкий круг, дуги меридианов,
 * латунные искры и иконка ситуации в центре. Всё на токенах темы — работает в светлой и тёмной теме. Декоративная (aria-hidden).
 */
export function Scene({ icon, tone = "primary", className }: { icon?: React.ReactNode; tone?: "primary" | "warn" | "danger" | "ok"; className?: string }) {
  const ring = { primary: "text-primary/15 dark:text-accent/20", warn: "text-warn/20", danger: "text-danger/20", ok: "text-ok/20" }[tone];
  const core = { primary: "bg-primary-soft text-primary dark:text-accent-text", warn: "bg-warn-bg text-warn", danger: "bg-danger-bg text-danger", ok: "bg-ok-bg text-ok" }[tone];
  return (
    <div className={cn("relative mx-auto h-28 w-36", className)} aria-hidden>
      <svg viewBox="0 0 144 112" className={cn("absolute inset-0 h-full w-full", ring)} fill="none" stroke="currentColor">
        <ellipse cx="72" cy="56" rx="54" ry="44" strokeWidth="1.5" />
        <path d="M72 12c-17 11-25 26-25 44s8 33 25 44M72 12c17 11 25 26 25 44s-8 33-25 44M20 40h104M20 72h104" strokeWidth="1.2" strokeDasharray="3 4" />
      </svg>
      <svg viewBox="0 0 144 112" className="absolute inset-0 h-full w-full text-accent" fill="currentColor">
        <path d="M118 18l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" opacity=".9" />
        <path d="M24 84l1.5 3.5 3.5 1.5-3.5 1.5L24 94l-1.5-3.5L19 89l3.5-1.5z" opacity=".7" />
        <circle cx="30" cy="22" r="2" opacity=".5" />
        <circle cx="122" cy="86" r="1.6" opacity=".6" />
      </svg>
      {icon && <div className={cn("absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-2xl shadow-[var(--ring-hi),var(--shadow-card)] [&_svg]:h-7 [&_svg]:w-7", core)}>{icon}</div>}
    </div>
  );
}
