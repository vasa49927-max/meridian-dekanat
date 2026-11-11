import { cn } from "@/lib/cn";

export function EmptyState({ icon, title, children, action, className }: { icon?: React.ReactNode; title: string; children?: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 rounded-[var(--radius-card)] border border-dashed border-line bg-surface/50 px-6 py-10 text-center", className)}>
      {icon && <div className="mb-1 grid h-12 w-12 place-items-center rounded-2xl bg-primary-soft text-accent-text shadow-[var(--ring-hi)] [&_svg]:h-6 [&_svg]:w-6" aria-hidden>{icon}</div>}
      <p className="font-semibold">{title}</p>
      {children && <div className="max-w-sm text-sm text-muted">{children}</div>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
