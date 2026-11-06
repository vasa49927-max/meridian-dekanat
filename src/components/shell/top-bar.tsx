"use client";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { Bell, Search } from "lucide-react";
import { LogoMark } from "@/components/logo";
import type { PaletteIndex } from "./command-palette";

// Палитра (cmdk) грузится только при первом открытии — меньше JS на старте страницы.
const CommandPalette = dynamic(() => import("./command-palette").then((m) => m.CommandPalette), { ssr: false });
import { ThemeToggle } from "./theme-toggle";

export function TopBar({ unread, index, home = "/" }: { unread: number; index: PaletteIndex; home?: string }) {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const returnTo = useRef<HTMLElement | null>(null);
  // При закрытии палитры возвращаем фокус туда, откуда её открыли (UX-ревью №9).
  const show = (v: boolean) => {
    if (v) { returnTo.current = document.activeElement as HTMLElement | null; setLoaded(true); }
    else setTimeout(() => returnTo.current?.focus(), 0);
    setOpen(v);
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); returnTo.current = document.activeElement as HTMLElement | null; setLoaded(true); setOpen((o) => !o); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur lg:static lg:border-0 lg:bg-transparent lg:backdrop-blur-none">
      <div className="mx-auto flex h-16 max-w-[1240px] items-center gap-2 px-4 lg:h-20 lg:px-9">
        <Link href={home} className="mr-auto flex items-center gap-2 text-primary lg:hidden dark:text-fg" aria-label="Меридиан — на главную">
          <LogoMark className="h-9 w-9" />
          <span className="font-serif text-lg font-bold">Меридиан</span>
        </Link>
        <button type="button" onClick={() => show(true)} aria-label="Поиск и действия (Ctrl+K)"
          className="inline-flex h-11 w-11 items-center justify-center gap-3 rounded-xl border border-line bg-surface text-muted hover:bg-surface-2 lg:ml-auto lg:w-80 lg:justify-start lg:px-3.5">
          <Search className="h-5 w-5 shrink-0" aria-hidden />
          <span className="hidden flex-1 text-left text-sm lg:inline">Поиск и действия</span>
          <kbd className="hidden rounded-md border border-line px-1.5 text-[11px] lg:inline">Ctrl K</kbd>
        </button>
        {index.role === "STUDENT" && (
          <Link href="/notifications" aria-label={unread ? `Уведомления: ${unread} непрочитанных` : "Уведомления"}
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-surface hover:bg-surface-2">
            <Bell className="h-5 w-5" aria-hidden />
            {unread > 0 && <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full border-2 border-bg bg-danger-solid px-1 text-[11px] font-bold text-white">{unread > 99 ? "99+" : unread}</span>}
          </Link>
        )}
        <ThemeToggle className="hidden lg:inline-flex" />
      </div>
      {loaded && <CommandPalette index={index} open={open} setOpen={show} />}
    </header>
  );
}
