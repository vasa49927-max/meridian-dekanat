"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ArrowLeftRight, Bell, CalendarClock, FileText, GraduationCap, Megaphone, Timer } from "lucide-react";
import { markReadAction } from "@/app/(student)/notifications/actions";
import { cn } from "@/lib/cn";
import { useI18n } from "@/i18n/client";

const ICON = { SCHEDULE: ArrowLeftRight, REQUEST: FileText, ANNOUNCEMENT: Megaphone, DEADLINE: Timer, APPOINTMENT: CalendarClock, GRADE: GraduationCap } as const;

export function NotificationItem({ n, when }: { n: { id: string; kind: keyof typeof ICON; title: string; body: string; link: string | null; important: boolean; read: boolean }; when: string }) {
  const { t, tc } = useI18n();
  const router = useRouter();
  const [pending, start] = useTransition();
  const Icon = ICON[n.kind] ?? Bell;
  const open = () => start(async () => { if (!n.read) await markReadAction(n.id); if (n.link) router.push(n.link); else router.refresh(); });
  return (
    <li>
      <button type="button" onClick={open} disabled={pending} className={cn("flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left transition-colors hover:border-primary", n.read ? "border-line bg-surface" : "border-line border-l-4 border-l-accent bg-surface shadow-[var(--shadow-card)]")}>
        <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", n.important ? "bg-danger-bg text-danger" : "bg-surface-2 text-accent-text")} aria-hidden><Icon className="h-5 w-5" /></span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 text-xs text-muted"><span className="font-semibold uppercase tracking-wider">{t(`notifications.kind.${n.kind}`)}</span><span>{when}</span>{n.important && <span className="font-semibold text-danger">{t("notifications.important")}</span>}</span>
          <span className={cn("mt-0.5 block leading-snug", !n.read && "font-semibold")}>{tc(n.title)}</span>
          <span className="mt-0.5 line-clamp-3 block text-sm text-muted">{tc(n.body)}</span>
        </span>
        {!n.read && <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-danger" aria-label={t("notifications.notRead")} />}
      </button>
    </li>
  );
}
