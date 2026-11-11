import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getViewer } from "@/server/auth/guards";
import { LogoMark } from "@/components/logo";
import { Disclaimer } from "@/components/shell/disclaimer";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { LanguageSwitcher } from "@/components/shell/language-switcher";
import { getI18n } from "@/i18n/server";
import { LoginForm } from "./login-form";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("auth.login.title") };
}


export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; reset?: string }> }) {
  const v = await getViewer();
  if (v) redirect(v.role === "STAFF" ? "/staff" : "/");
  const { next, reset } = await searchParams;
  const { t } = await getI18n();
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_minmax(480px,560px)]">
      <section className="hero-surface relative hidden overflow-hidden p-10 text-hero-fg lg:flex lg:flex-col xl:p-12" aria-label={t("auth.login.about")}>
        <svg className="absolute -right-40 -top-24 h-[720px] w-[720px] opacity-[0.08]" viewBox="0 0 40 40" aria-hidden>
          <circle cx="20" cy="20" r="17" fill="none" stroke="currentColor" strokeWidth=".4" />
          <path d="M20 3c-6.5 4.5-9.5 10.2-9.5 17s3 12.5 9.5 17M20 3c6.5 4.5 9.5 10.2 9.5 17s-3 12.5-9.5 17M3 20h34M5 26h30M5 14h30" fill="none" stroke="currentColor" strokeWidth=".4" />
        </svg>
        <div className="flex items-center gap-3"><LogoMark className="h-10 w-10" /><span className="font-serif text-2xl font-bold">{t("common.brand")}</span></div>
        <div className="my-auto max-w-lg">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-accent">{t("auth.login.kicker")}</p>
          <h1 className="font-serif text-[42px] leading-[1.08] xl:text-5xl">{t("auth.login.heroTitle")}</h1>
          <p className="mt-4 max-w-md text-lg text-hero-muted">{t("auth.login.heroText")}</p>
        </div>
        {/* Раунд 4: на компьютере плашка-дисклеймер — внизу левой панели, чтобы экран входа помещался без прокрутки */}
        <Disclaimer className="relative max-w-xl border-hero-fg/25 text-left text-hero-muted" />
      </section>
      <main className="flex flex-col px-5 py-6 sm:px-10 lg:py-3">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-primary lg:invisible dark:text-fg"><LogoMark className="h-9 w-9" /><span className="font-serif text-xl font-bold">{t("common.brand")}</span></span>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
        <div className="mx-auto my-auto w-full max-w-md py-8 lg:py-3">
          <h1 className="font-serif text-3xl">{t("auth.login.heading")}</h1>
          <p className="mb-5 mt-1.5 text-muted lg:mb-4">{t("auth.login.subtitle")}</p>
          {reset && <p role="status" className="mb-4 rounded-xl bg-ok-bg px-3.5 py-2.5 text-sm font-medium text-ok">{t("auth.login.reset")}</p>}
          <LoginForm next={next} />
          {/* Обзор раунда 2: не было подсказки, что делать, если пароль забыт */}
          <p className="mt-3 text-[13px] text-muted">{t("auth.login.forgot")}</p>
        </div>
        <Disclaimer className="mx-auto w-full max-w-md lg:hidden" />
      </main>
    </div>
  );
}
