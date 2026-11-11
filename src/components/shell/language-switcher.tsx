"use client";
import { useTransition } from "react";
import { Languages } from "lucide-react";
import { LOCALES, LOCALE_NAMES } from "@/i18n/config";
import { setLocaleAction } from "@/i18n/actions";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/cn";

/** Переключатель языка (раунд 3): русский, английский, китайский, французский. Нативный select — доступен с клавиатуры и на телефоне. */
export function LanguageSwitcher({ className, compact }: { className?: string; compact?: boolean }) {
  const { locale, t } = useI18n();
  const [pending, start] = useTransition();
  return (
    <label className={cn("relative inline-flex h-11 items-center gap-1.5 rounded-xl border border-line bg-surface pl-3 pr-2 text-sm font-medium hover:bg-surface-2", pending && "opacity-60", className)}>
      <Languages className="h-4 w-4 shrink-0 text-muted" aria-hidden />
      <span className="sr-only">{t("common.lang.label")}</span>
      <select value={locale} disabled={pending} onChange={(e) => start(() => setLocaleAction(e.target.value))}
        className={cn("cursor-pointer appearance-none bg-transparent pr-1 outline-none", compact && "w-[2.6rem] uppercase")}>
        {LOCALES.map((l) => <option key={l} value={l}>{compact ? l.toUpperCase() : LOCALE_NAMES[l]}</option>)}
      </select>
    </label>
  );
}
