import Link from "next/link";
import { Award, Bell, CalendarClock, MapPinned, MessageSquareHeart, ChevronRight, LogOut, Sparkles, UserRound } from "lucide-react";
import { requireStudent } from "@/server/auth/guards";
import { countMyUnread } from "@/server/dal/student";
import { PageHeader } from "@/components/ui/page-header";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { LanguageSwitcher } from "@/components/shell/language-switcher";
import { TourButton } from "@/components/shell/onboarding";
import { logoutAction } from "../../(auth)/login/actions";
import { getI18n } from "@/i18n/server";

export async function generateMetadata() {
  const { t } = await getI18n();
  return { title: t("common.nav.more") };
}

export default async function MorePage() {
  const v = await requireStudent();
  const { t, tn } = await getI18n();
  const unread = await countMyUnread(v);
  const items = [
    { href: "/notifications", label: t("common.nav.notifications"), hint: unread ? tn("today.more.unread", unread) : t("today.more.allRead"), icon: Bell, badge: unread },
    { href: "/assistant", label: t("today.more.assistant"), hint: t("today.more.assistantHint"), icon: Sparkles },
    { href: "/appointments", label: t("common.nav.appointments"), hint: t("today.more.appointmentsHint"), icon: CalendarClock },
    { href: "/portfolio", label: t("portfolio.title"), hint: t("portfolio.subtitle"), icon: Award },
    { href: "/survey", label: t("survey.title"), hint: t("survey.banner.text"), icon: MessageSquareHeart },
    { href: "/map", label: t("campus.title"), hint: t("campus.subtitle"), icon: MapPinned },
    { href: "/profile", label: t("common.nav.profile"), hint: t("today.more.profileHint"), icon: UserRound },
  ];
  return (
    <div className="pt-2">
      <PageHeader title={t("common.nav.more")} />
      <ul className="overflow-hidden rounded-2xl border border-line bg-surface">
        {items.map((it) => (
          <li key={it.href} className="border-b border-line last:border-0">
            <Link href={it.href} className="flex items-center gap-3 px-4 py-3.5 hover:bg-surface-2">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary dark:text-accent-text" aria-hidden><it.icon className="h-5 w-5" /></span>
              <span className="min-w-0 flex-1"><span className="block font-semibold">{it.label}</span><span className="block text-sm text-muted">{it.hint}</span></span>
              {it.badge ? <span className="rounded-full bg-danger-solid px-2 py-0.5 text-xs font-bold text-white">{it.badge}</span> : null}
              <ChevronRight className="h-5 w-5 text-muted" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap gap-2">
        <LanguageSwitcher />
        <ThemeToggle withLabel />
        <TourButton className="inline-flex h-11 items-center gap-2 rounded-xl border border-line bg-surface px-4 text-sm font-medium hover:bg-surface-2" />
        <form action={logoutAction}><button className="inline-flex h-11 items-center gap-2 rounded-xl border border-line bg-surface px-4 text-sm font-medium text-danger hover:bg-surface-2"><LogOut className="h-5 w-5" aria-hidden />{t("common.nav.logout")}</button></form>
      </div>
    </div>
  );
}
