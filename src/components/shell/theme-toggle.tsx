"use client";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

export function useTheme() {
  const [dark, setDark] = useState<boolean | null>(null);
  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);
  const toggle = () => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try { localStorage.setItem("theme", next ? "dark" : "light"); } catch {}
    setDark(next);
  };
  return { dark, toggle };
}

export function ThemeToggle({ className, withLabel }: { className?: string; withLabel?: boolean }) {
  const { dark, toggle } = useTheme();
  return (
    <button type="button" onClick={toggle} aria-label={withLabel ? undefined : dark ? "Включить светлую тему" : "Включить тёмную тему"} aria-pressed={!!dark}
      className={cn("inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-line bg-surface px-3 text-fg hover:bg-surface-2", !withLabel && "w-11 px-0", className)}>
      {dark ? <Sun className="h-5 w-5" aria-hidden /> : <Moon className="h-5 w-5" aria-hidden />}
      {withLabel && <span className="text-sm font-medium">{dark ? "Светлая тема" : "Тёмная тема"}</span>}
    </button>
  );
}
