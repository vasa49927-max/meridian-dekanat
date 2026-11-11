"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, FileText, GraduationCap, Menu, Sun } from "lucide-react";
import { STUDENT_TABS } from "./nav";
import { isActive } from "./side-nav";
import { cn } from "@/lib/cn";
import { useI18n } from "@/i18n/client";

const ICONS = { sun: Sun, calendar: CalendarDays, grad: GraduationCap, file: FileText, menu: Menu };
const MORE_PATHS = ["/more", "/notifications", "/assistant", "/appointments", "/profile"];

export function TabBar({ unread }: { unread: number }) {
  const pathname = usePathname();
  const { t: tt } = useI18n();
  return (
    <nav aria-label={tt("common.nav.mainSections")} className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      <ul className="mx-auto flex max-w-xl">
        {STUDENT_TABS.map((t) => {
          const Icon = ICONS[t.icon];
          const active = t.href === "/more" ? MORE_PATHS.some((p) => pathname.startsWith(p)) : isActive(pathname, t.href, "/");
          return (
            <li key={t.href} className="flex-1">
              <Link href={t.href} aria-current={active ? "page" : undefined}
                className={cn("relative mx-1 my-1.5 flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-medium text-muted", active && "bg-primary-soft font-semibold text-primary dark:text-accent-text")}>
                <Icon className="h-[22px] w-[22px]" aria-hidden />
                {tt(`common.nav.${t.key}`)}
                {t.href === "/more" && unread > 0 && <span className="absolute right-[22%] top-0.5 h-2.5 w-2.5 rounded-full bg-danger ring-2 ring-surface" aria-label={tt("common.nav.hasUnread")} />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
