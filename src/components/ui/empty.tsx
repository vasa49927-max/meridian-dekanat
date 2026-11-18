import { cn } from "@/lib/cn";
import { Scene } from "./scene";

/** Пустое состояние: иллюстрация «Посольства» + короткий текст + действие (раунд 8 — вместо голой иконки). */
export function EmptyState({ icon, title, children, action, className, tone }: { icon?: React.ReactNode; title: string; children?: React.ReactNode; action?: React.ReactNode; className?: string; tone?: "primary" | "warn" | "danger" | "ok" }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 rounded-[var(--radius-card)] border border-dashed border-line bg-surface/50 px-6 py-8 text-center", className)}>
      <Scene icon={icon} tone={tone} className="mb-1" />
      <p className="font-semibold">{title}</p>
      {children && <div className="max-w-sm text-sm text-muted">{children}</div>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
