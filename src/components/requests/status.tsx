import { Ban, CheckCheck, CheckCircle2, CircleDashed, Loader, MessageCircleWarning } from "lucide-react";

export type ReqStatus = "SUBMITTED" | "IN_PROGRESS" | "NEEDS_INFO" | "READY" | "ISSUED" | "REJECTED";

export const STATUS_LABEL: Record<ReqStatus, string> = {
  SUBMITTED: "Подана", IN_PROGRESS: "В работе", NEEDS_INFO: "Нужно дополнить", READY: "Готова", ISSUED: "Выдана", REJECTED: "Отклонена",
};
export const TONE = { SUBMITTED: "neutral", IN_PROGRESS: "info", NEEDS_INFO: "warn", READY: "ok", ISSUED: "primary", REJECTED: "danger" } as const;
export const ICON = { SUBMITTED: CircleDashed, IN_PROGRESS: Loader, NEEDS_INFO: MessageCircleWarning, READY: CheckCircle2, ISSUED: CheckCheck, REJECTED: Ban };

export { StatusBadge } from "./status-badge";

/** Шаги трекера: подана → в работе → готова → выдана (или отклонена / нужно дополнить). */
export const TRACK: ReqStatus[] = ["SUBMITTED", "IN_PROGRESS", "READY", "ISSUED"];
