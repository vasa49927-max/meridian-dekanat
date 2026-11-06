import { cn } from "@/lib/cn";

const tones = {
  neutral: "bg-surface-2 text-fg",
  ok: "bg-ok-bg text-ok",
  info: "bg-info-bg text-info",
  warn: "bg-warn-bg text-warn",
  danger: "bg-danger-bg text-danger",
  primary: "bg-primary-soft text-primary dark:text-accent-text",
} as const;

export function Badge({ tone = "neutral", className, ...p }: React.HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof tones }) {
  return <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-lg px-2 py-0.5 text-xs font-semibold", tones[tone], className)} {...p} />;
}
