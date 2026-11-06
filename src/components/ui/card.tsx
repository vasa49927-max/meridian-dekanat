import { cn } from "@/lib/cn";

export function Card({ className, as: Tag = "section", ...p }: React.HTMLAttributes<HTMLElement> & { as?: "section" | "div" | "article" | "li" }) {
  return <Tag className={cn("rounded-[var(--radius-card)] border border-line bg-surface p-4 shadow-[var(--shadow-card)] lg:p-5", className)} {...p} />;
}

export function CardTitle({ children, action, className, id }: { children: React.ReactNode; action?: React.ReactNode; className?: string; id?: string }) {
  return (
    <div className={cn("mb-3 flex items-center justify-between gap-3", className)}>
      <h2 id={id} className="text-[13px] font-semibold uppercase tracking-[0.06em] text-accent-text">{children}</h2>
      {action}
    </div>
  );
}
