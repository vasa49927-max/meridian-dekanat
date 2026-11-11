import Link from "next/link";
import { Compass } from "lucide-react";
import { Disclaimer } from "@/components/shell/disclaimer";
import { getI18n } from "@/i18n/server";

/** Одинаковый ответ и для несуществующего, и для чужого объекта — не подтверждаем, что он есть. */
export default async function NotFound() {
  const { t } = await getI18n();
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-2xl bg-surface-2 text-accent-text" aria-hidden><Compass className="h-8 w-8" /></span>
      <h1 className="font-serif text-3xl">{t("auth.pages.notFound.title")}</h1>
      <p className="text-muted">{t("auth.pages.notFound.text")}</p>
      <Link href="/" className="inline-flex h-11 items-center rounded-xl bg-primary px-5 font-semibold text-primary-fg">{t("auth.pages.notFound.home")}</Link>
      <Disclaimer className="mt-8" />
    </main>
  );
}
