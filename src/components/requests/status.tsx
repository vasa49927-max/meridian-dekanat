import { Ban, CheckCheck, CheckCircle2, CircleDashed, Loader, MessageCircleWarning } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type ReqStatus = "SUBMITTED" | "IN_PROGRESS" | "NEEDS_INFO" | "READY" | "ISSUED" | "REJECTED";

export const STATUS_LABEL: Record<ReqStatus, string> = {
  SUBMITTED: "Подана", IN_PROGRESS: "В работе", NEEDS_INFO: "Нужно дополнить", READY: "Готова", ISSUED: "Выдана", REJECTED: "Отклонена",
};
const TONE = { SUBMITTED: "neutral", IN_PROGRESS: "info", NEEDS_INFO: "warn", READY: "ok", ISSUED: "primary", REJECTED: "danger" } as const;
const ICON = { SUBMITTED: CircleDashed, IN_PROGRESS: Loader, NEEDS_INFO: MessageCircleWarning, READY: CheckCircle2, ISSUED: CheckCheck, REJECTED: Ban };

export function StatusBadge({ status, className }: { status: ReqStatus; className?: string }) {
  const Icon = ICON[status];
  return <Badge tone={TONE[status]} className={className}><Icon className="h-3.5 w-3.5" aria-hidden />{STATUS_LABEL[status]}</Badge>;
}

/** Шаги трекера: подана → в работе → готова → выдана (или отклонена / нужно дополнить). */
export const TRACK: ReqStatus[] = ["SUBMITTED", "IN_PROGRESS", "READY", "ISSUED"];
