import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "@fontsource/golos-text/400.css";
import "@fontsource/golos-text/500.css";
import "@fontsource/golos-text/600.css";
import "@fontsource/golos-text/700.css";
import "@fontsource/pt-serif/700.css";
import "./globals.css";
import { ThemeScript } from "@/components/theme-script";
import { Toaster } from "@/components/ui/toaster";
import { SwRegister } from "@/components/sw-register";
import { I18nProvider } from "@/i18n/client";
import { clientI18nProps, getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  const brand = t("common.brand");
  return { ...baseMetadata, title: { default: `${brand} — ${t("common.tagline")}`, template: `%s · ${brand}` }, applicationName: brand, appleWebApp: { capable: true, title: brand, statusBarStyle: "default" } };
}

const baseMetadata: Metadata = {
  description: "Концепт личного кабинета студента для конкурса МГИМО по ИИ. Не является официальным сервисом МГИМО.",
  applicationName: "Меридиан",
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: "Меридиан", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f3ec" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1020" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const i18n = await clientI18nProps();
  return (
    <html lang={i18n.locale === "zh" ? "zh-CN" : i18n.locale} suppressHydrationWarning>
      <head>
        <ThemeScript nonce={nonce} />
      </head>
      <body className="min-h-dvh">
        <I18nProvider {...i18n}>
          {children}
        </I18nProvider>
        <Toaster />
        <SwRegister />
      </body>
    </html>
  );
}
