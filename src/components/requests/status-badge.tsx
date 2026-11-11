"use client";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/i18n/client";
import { ICON, TONE, type ReqStatus } from "./status";

export function StatusBadge({ status, className }: { status: ReqStatus; className?: string }) {
  const Icon = ICON[status];
  const { t } = useI18n();
  return <Badge tone={TONE[status]} className={className}><Icon className="h-3.5 w-3.5" aria-hidden />{t(`common.status.${status}`)}</Badge>;
}
