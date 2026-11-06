import { ArrowLeftRight, CalendarClock, FileCheck, FileText, Globe, IdCard, ListChecks, Repeat, Shield, Wallet } from "lucide-react";

const MAP = { "file-check": FileCheck, globe: Globe, shield: Shield, wallet: Wallet, "list-checks": ListChecks, "calendar-clock": CalendarClock, repeat: Repeat, "arrow-left-right": ArrowLeftRight, "id-card": IdCard, "file-text": FileText } as const;

export function RequestIcon({ name, className }: { name: string; className?: string }) {
  const Icon = MAP[name as keyof typeof MAP] ?? FileText;
  return <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary dark:text-accent-text ${className ?? ""}`} aria-hidden><Icon className="h-5 w-5" /></span>;
}
