"use client";
import { cn } from "@/lib/cn";
import { useI18n } from "@/i18n/client";

/** Обязательная плашка: на странице входа и в футере каждой страницы (на всех языках). */
export function Disclaimer({ className }: { className?: string }) {
  const { t } = useI18n();
  return (
    <p role="note" className={cn("rounded-xl border border-dashed border-line px-4 py-3 text-center text-xs text-muted", className)}>
      <strong className="font-semibold">{t("common.disclaimerStrong")}</strong> {t("common.disclaimerRest")}
    </p>
  );
}
