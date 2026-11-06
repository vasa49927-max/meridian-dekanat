"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { STAFF_NAV, STUDENT_NAV } from "./nav";
import { cn } from "@/lib/cn";

export function isActive(pathname: string, href: string, root: string) {
  return href === root ? pathname === root : pathname === href || pathname.startsWith(href + "/");
}

export function SideNav({ role, unread = 0 }: { role: "STUDENT" | "STAFF"; unread?: number }) {
  const pathname = usePathname();
  const items = role === "STUDENT" ? STUDENT_NAV : STAFF_NAV;
  const root = role === "STUDENT" ? "/" : "/staff";
  return (
    <nav aria-label="Разделы" className="flex flex-1 flex-col gap-0.5">
      {items.map((it) => {
        const active = isActive(pathname, it.href, root);
        const Icon = it.icon;
        const badge = "badge" in it && it.badge === "unread" && unread > 0 ? unread : null;
        return (
          <Link key={it.href} href={it.href} aria-current={active ? "page" : undefined}
            className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 font-medium text-side-fg/85 transition-colors hover:bg-side-on hover:text-side-fg", active && "bg-side-on font-semibold text-side-fg")}>
            <Icon className={cn("h-5 w-5", active && "text-accent")} aria-hidden />
            <span>{it.label}</span>
            {badge && <span className="ml-auto rounded-full bg-danger px-2 py-0.5 text-[11px] font-bold text-white" aria-label={`${badge} непрочитанных`}>{badge}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
