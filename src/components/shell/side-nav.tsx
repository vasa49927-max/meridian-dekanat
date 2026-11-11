"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { STAFF_NAV, STUDENT_NAV } from "./nav";
import { cn } from "@/lib/cn";
import { useI18n } from "@/i18n/client";

export function isActive(pathname: string, href: string, root: string) {
  return href === root ? pathname === root : pathname === href || pathname.startsWith(href + "/");
}

export function SideNav({ role, unread = 0 }: { role: "STUDENT" | "STAFF"; unread?: number }) {
  const pathname = usePathname();
  const { t, tn } = useI18n();
  const items = role === "STUDENT" ? STUDENT_NAV : STAFF_NAV;
  const root = role === "STUDENT" ? "/" : "/staff";
  const groups = [...new Set(items.map((it) => it.group))];
  return (
    <nav aria-label={t("common.nav.sections")} className="-mx-1 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-1 [scrollbar-width:thin]">
      {groups.map((g) => (
        <div key={g} role="group" aria-labelledby={`nav-g-${g}`}>
          <p id={`nav-g-${g}`} className="mb-1 px-3 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-side-fg/50">{t(`common.nav.groups.${g}`)}</p>
          <ul className="flex flex-col gap-0.5">
            {items.filter((it) => it.group === g).map((it) => {
              const active = isActive(pathname, it.href, root);
              const Icon = it.icon;
              const badge = "badge" in it && it.badge === "unread" && unread > 0 ? unread : null;
              return (
                <li key={it.href}>
                  <Link href={it.href} aria-current={active ? "page" : undefined}
                    className={cn("nav-item group relative flex items-center gap-3 rounded-xl px-3 py-2 font-medium text-side-fg/80 transition-[background-color,color,transform] duration-200 hover:bg-side-on hover:text-side-fg active:scale-[0.98]", active && "nav-item-active bg-side-on font-semibold text-side-fg")}>
                    <Icon className={cn("h-[19px] w-[19px] transition-transform duration-200 group-hover:scale-110", active && "text-accent")} aria-hidden />
                    <span>{t(`common.nav.${it.key}`)}</span>
                    {badge && <span className="ml-auto rounded-full bg-danger-solid px-2 py-0.5 text-[11px] font-bold text-white" aria-label={tn("common.nav.unreadCount", badge)}>{badge}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
