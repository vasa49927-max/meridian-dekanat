import { WifiOff } from "lucide-react";
import { Logo } from "@/components/logo";

export const metadata = { title: "Нет сети" };

/** Показывается service worker'ом, если страницы нет в кэше и сети нет. */
export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <Logo className="text-primary dark:text-fg" />
      <WifiOff className="h-10 w-10 text-warn" aria-hidden />
      <h1 className="font-serif text-2xl">Нет подключения к интернету</h1>
      <p className="text-muted">Кабинет откроется, как только связь вернётся. Личные данные мы не храним на устройстве — так безопаснее на чужом или общем компьютере.</p>
    </main>
  );
}
