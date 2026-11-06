import { cn } from "@/lib/cn";

/**
 * Логотип «Меридиан»: окружность, две дуги меридианов, параллель и звезда-ориентир.
 * Идея «международности» без копирования эмблемы вуза (см. docs/DESIGN.md).
 */
export function LogoMark({ className, title = "Меридиан" }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 40 40" role="img" aria-label={title} className={cn("h-8 w-8", className)}>
      <circle cx="20" cy="20" r="17" fill="none" stroke="currentColor" strokeWidth="2.4" />
      <path d="M20 3c-6.5 4.5-9.5 10.2-9.5 17s3 12.5 9.5 17M20 3c6.5 4.5 9.5 10.2 9.5 17s-3 12.5-9.5 17" fill="none" stroke="currentColor" strokeWidth="2.4" />
      <path d="M5 26h30" fill="none" stroke="currentColor" strokeWidth="2.4" />
      <path d="M31.5 4.5l1.4 3.6 3.6 1.4-3.6 1.4-1.4 3.6-1.4-3.6-3.6-1.4 3.6-1.4z" fill="var(--accent)" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="font-serif text-xl font-bold tracking-tight">Меридиан</span>
    </span>
  );
}
