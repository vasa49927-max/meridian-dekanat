import Link from "next/link";
import { LogOut } from "lucide-react";
import { requireStaff } from "@/server/auth/guards";
import { staffCounts, staffQueue } from "@/server/dal/staff";
import { Logo } from "@/components/logo";
import { Avatar } from "@/components/avatar";
import { SideNav } from "@/components/shell/side-nav";
import { TopBar } from "@/components/shell/top-bar";
import { Disclaimer } from "@/components/shell/disclaimer";
import { STAFF_NAV } from "@/components/shell/nav";
import { STATUS_LABEL } from "@/components/requests/status";
import { logoutAction } from "../../(auth)/login/actions";

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const v = await requireStaff();
  const [q, counts] = await Promise.all([staffQueue(v, { status: "active" }, 0, 10), staffCounts()]);
  const index = { role: "STAFF" as const, disciplines: [], requestTypes: [], requests: q.items.map((r) => ({ id: r.id, title: `${r.title} — ${r.lastName}`, number: r.number, status: STATUS_LABEL[r.status] })) };
  return (
    <div className="lg:grid lg:grid-cols-[272px_minmax(0,1fr)] lg:bg-[linear-gradient(to_right,var(--side)_272px,transparent_272px)]">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-fg">Перейти к содержимому</a>
      <aside className="sticky top-0 hidden h-dvh flex-col gap-6 bg-side px-4 py-6 text-side-fg lg:flex">
        <div className="px-2"><Logo className="[&_svg]:h-9 [&_svg]:w-9" /><p className="mt-1 pl-12 text-xs uppercase tracking-widest text-accent">Деканат</p></div>
        <SideNav role="STAFF" />
        <p className="rounded-xl bg-side-on px-3 py-2 text-xs">Новых заявок: <b>{counts.newRequests}</b> · записей на приём: <b>{counts.upcomingAppointments}</b></p>
        <div className="flex items-center gap-3 rounded-2xl bg-side-on p-3">
          <Avatar name={`${v.firstName} ${v.lastName}`} hue={30} size={40} />
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{v.firstName} {v.middleName} {v.lastName}</p><p className="truncate text-xs opacity-75">{v.position}</p></div>
          <form action={logoutAction}><button className="grid h-9 w-9 place-items-center rounded-lg hover:bg-side-on" aria-label="Выйти"><LogOut className="h-5 w-5" aria-hidden /></button></form>
        </div>
      </aside>
      <div className="min-w-0">
        <TopBar unread={0} index={index} home="/staff" />
        <nav aria-label="Разделы деканата" className="-mt-1 mb-2 flex gap-1.5 overflow-x-auto px-4 pb-1 lg:hidden">
          {STAFF_NAV.map((n) => <Link key={n.href} href={n.href} className="whitespace-nowrap rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-medium">{n.label}</Link>)}
          <form action={logoutAction}><button className="whitespace-nowrap rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-medium text-danger">Выйти</button></form>
        </nav>
        <main id="main" tabIndex={-1} className="mx-auto max-w-[1240px] px-4 pb-6 outline-none lg:px-9">{children}</main>
        <footer className="mx-auto max-w-[1240px] px-4 pb-8 lg:px-9"><Disclaimer /></footer>
      </div>
    </div>
  );
}
