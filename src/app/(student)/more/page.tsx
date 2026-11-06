import Link from "next/link";
import type { Metadata } from "next";
import { Bell, CalendarClock, ChevronRight, LogOut, Sparkles, UserRound } from "lucide-react";
import { requireStudent } from "@/server/auth/guards";
import { countMyUnread } from "@/server/dal/student";
import { PageHeader } from "@/components/ui/page-header";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { logoutAction } from "../../(auth)/login/actions";

export const metadata: Metadata = { title: "Ещё" };

export default async function MorePage() {
  const v = await requireStudent();
  const unread = await countMyUnread(v);
  const items = [
    { href: "/notifications", label: "Уведомления", hint: unread ? `${unread} непрочитанных` : "всё прочитано", icon: Bell, badge: unread },
    { href: "/assistant", label: "Помощник деканата", hint: "ИИ отвечает по Положению и вашим данным", icon: Sparkles },
    { href: "/appointments", label: "Запись к методисту", hint: "без живой очереди", icon: CalendarClock },
    { href: "/profile", label: "Профиль", hint: "данные, языки, сессии", icon: UserRound },
  ];
  return (
    <div className="pt-2">
      <PageHeader title="Ещё" />
      <ul className="overflow-hidden rounded-2xl border border-line bg-surface">
        {items.map((it) => (
          <li key={it.href} className="border-b border-line last:border-0">
            <Link href={it.href} className="flex items-center gap-3 px-4 py-3.5 hover:bg-surface-2">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary dark:text-accent-text" aria-hidden><it.icon className="h-5 w-5" /></span>
              <span className="min-w-0 flex-1"><span className="block font-semibold">{it.label}</span><span className="block text-sm text-muted">{it.hint}</span></span>
              {it.badge ? <span className="rounded-full bg-danger px-2 py-0.5 text-xs font-bold text-white">{it.badge}</span> : null}
              <ChevronRight className="h-5 w-5 text-muted" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap gap-2">
        <ThemeToggle withLabel />
        <form action={logoutAction}><button className="inline-flex h-11 items-center gap-2 rounded-xl border border-line bg-surface px-4 text-sm font-medium text-danger hover:bg-surface-2"><LogOut className="h-5 w-5" aria-hidden />Выйти</button></form>
      </div>
    </div>
  );
}
