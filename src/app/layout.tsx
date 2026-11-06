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

export const metadata: Metadata = {
  title: { default: "Меридиан — цифровой деканат", template: "%s · Меридиан" },
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
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <ThemeScript nonce={nonce} />
      </head>
      <body className="min-h-dvh">
        {children}
        <Toaster />
        <SwRegister />
      </body>
    </html>
  );
}
