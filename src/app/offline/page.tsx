import { WifiOff } from "lucide-react";
import type { Metadata } from "next";
import { Logo } from "@/components/logo";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("auth.pages.offline.title") };
}

/** Показывается service worker'ом, если страницы нет в кэше и сети нет. */
export default async function OfflinePage() {
  const { t } = await getI18n();
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <Logo className="text-primary dark:text-fg" />
      <WifiOff className="h-10 w-10 text-warn" aria-hidden />
      <h1 className="font-serif text-2xl">{t("auth.pages.offline.heading")}</h1>
      <p className="text-muted">{t("auth.pages.offline.text")}</p>
    </main>
  );
}
