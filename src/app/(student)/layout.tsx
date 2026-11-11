import { LogOut } from "lucide-react";
import { requireStudent } from "@/server/auth/guards";
import { countMyUnread, getMyGrades } from "@/server/dal/student";
import { listMyRequests, listRequestTypes } from "@/server/dal/requests";
import { Logo } from "@/components/logo";
import { Avatar } from "@/components/avatar";
import { SideNav } from "@/components/shell/side-nav";
import { TabBar } from "@/components/shell/tab-bar";
import { TopBar } from "@/components/shell/top-bar";
import { Disclaimer } from "@/components/shell/disclaimer";
import { OfflineBanner } from "@/components/shell/offline-banner";
import { Onboarding } from "@/components/shell/onboarding";
import { logoutAction } from "../(auth)/login/actions";
import { getI18n } from "@/i18n/server";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const v = await requireStudent();
  const { t, tr, name: nm } = await getI18n();
  const [unread, grades, reqs, types] = await Promise.all([countMyUnread(v), getMyGrades(v), listMyRequests(v, null, 8), listRequestTypes()]);
  const index = {
    role: "STUDENT" as const,
    disciplines: grades.current.map((d) => ({ anchor: d.name, name: tr("subjects", d.name), teacher: `${tr("titles", d.teacherTitle)} ${nm(d.teacherLast)} ${nm(d.teacherFirst)[0]}.` })),
    requests: reqs.items.map((r) => ({ id: r.id, title: tr("rt", r.title), number: r.number, status: t(`common.status.${r.status}`) })),
    requestTypes: types.filter((x) => x.popular).map((x) => ({ code: x.code, title: tr("rt", x.title) })),
  };
  const name = nm(`${v.firstName} ${v.lastName}`);
  return (
    <div className="lg:grid lg:grid-cols-[272px_minmax(0,1fr)] lg:bg-[linear-gradient(to_right,var(--side)_272px,transparent_272px)]">
      <a href="#main" className="sr-only z-50 rounded-lg bg-primary px-4 py-2 text-primary-fg focus:not-sr-only focus:fixed focus:left-3 focus:top-3">{t("common.nav.skip")}</a>
      <aside className="sticky top-0 hidden h-dvh flex-col gap-6 side-surface px-4 py-6 text-side-fg lg:flex">
        <Logo className="px-2 [&_svg]:h-9 [&_svg]:w-9" />
        <SideNav role="STUDENT" unread={unread} />
        <div className="flex items-center gap-3 rounded-2xl bg-side-on p-3">
          <Avatar name={name} hue={v.avatarHue} size={40} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{name}</p>
            <p className="truncate text-xs opacity-75">{t("common.nav.studentRole", { course: v.course })}</p>
          </div>
          <form action={logoutAction}>
            <button className="grid h-9 w-9 place-items-center rounded-lg hover:bg-side-on" aria-label={t("common.nav.logout")}><LogOut className="h-5 w-5" aria-hidden /></button>
          </form>
        </div>
      </aside>
      <div className="min-w-0">
        <OfflineBanner />
        <TopBar unread={unread} index={index} />
        <main id="main" tabIndex={-1} className="mx-auto min-h-dvh max-w-[1240px] px-4 pb-6 outline-none lg:px-9">{children}</main>
        <footer className="mx-auto max-w-[1240px] px-4 pb-28 pt-4 lg:px-9 lg:pb-8"><Disclaimer /></footer>
      </div>
      <TabBar unread={unread} />
      <Onboarding firstName={v.firstName} />
    </div>
  );
}
