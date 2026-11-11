"use client";
import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";
import { useI18n } from "@/i18n/client";

// Тема живёт в классе .dark на <html>; подписываемся на его изменения.
const subscribe = (cb: () => void) => {
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => mo.disconnect();
};

export function useTheme() {
  const dark = useSyncExternalStore(subscribe, () => document.documentElement.classList.contains("dark"), () => null);
  const toggle = () => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try { localStorage.setItem("theme", next ? "dark" : "light"); } catch {}
  };
  return { dark, toggle };
}

export function ThemeToggle({ className, withLabel }: { className?: string; withLabel?: boolean }) {
  const { dark, toggle } = useTheme();
  const { t } = useI18n();
  return (
    <button type="button" onClick={toggle} aria-label={withLabel ? undefined : dark ? t("common.theme.toLight") : t("common.theme.toDark")} aria-pressed={!!dark}
      className={cn("inline-flex h-11 items-center justify-center gap-2 control rounded-xl border border-line bg-surface px-3 text-fg hover:bg-surface-2", !withLabel && "w-11 px-0", className)}>
      {dark ? <Sun className="h-5 w-5" aria-hidden /> : <Moon className="h-5 w-5" aria-hidden />}
      {withLabel && <span className="text-sm font-medium">{dark ? t("common.theme.light") : t("common.theme.dark")}</span>}
    </button>
  );
}
