"use client";
import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, BookOpen, CalendarPlus, FileText, Moon, Search, Sparkles } from "lucide-react";
import { STAFF_NAV, STUDENT_NAV } from "./nav";

export type PaletteIndex = {
  role: "STUDENT" | "STAFF";
  disciplines: { name: string; teacher: string }[];
  requests: { id: string; title: string; number: string; status: string }[];
  requestTypes: { code: string; title: string }[];
};

/**
 * Командная палитра ⌘K / Ctrl+K: поиск по разделам, своим дисциплинам, заявкам и быстрые действия.
 * Индекс приходит с сервера уже отфильтрованным по текущему пользователю.
 */
export function CommandPalette({ index, open, setOpen }: { index: PaletteIndex; open: boolean; setOpen: (v: boolean) => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const go = (href: string) => { setOpen(false); setQ(""); router.push(href); };
  const nav = index.role === "STUDENT" ? STUDENT_NAV : STAFF_NAV;
  const item = "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] data-[selected=true]:bg-primary-soft data-[selected=true]:text-primary dark:data-[selected=true]:text-accent-text";
  const group = "px-1 py-1 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted";
  return (
    <Command.Dialog open={open} onOpenChange={setOpen} label="Поиск по кабинету"
      overlayClassName="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]"
      contentClassName="fixed left-1/2 top-[8vh] z-50 w-[min(640px,calc(100vw-24px))] -translate-x-1/2 overflow-hidden rounded-2xl border border-line bg-surface text-fg shadow-2xl">
      <div className="flex items-center gap-2 border-b border-line px-4">
        <Search className="h-5 w-5 text-muted" aria-hidden />
        <Command.Input value={q} onValueChange={setQ} placeholder="Раздел, дисциплина, справка, действие…" className="h-14 w-full bg-transparent text-base outline-none placeholder:text-muted" />
      </div>
      <Command.List className="max-h-[60vh] overflow-y-auto p-1">
        <Command.Empty className="px-4 py-8 text-center text-sm text-muted">Ничего не нашлось. Попробуйте спросить <button className="font-semibold text-primary underline dark:text-accent-text" onClick={() => go(`/assistant?q=${encodeURIComponent(q)}`)}>помощника</button>.</Command.Empty>
        {index.role === "STUDENT" && (
          <Command.Group heading="Быстрые действия" className={group}>
            {index.requestTypes.slice(0, 4).map((t) => (
              <Command.Item key={t.code} value={`заказать ${t.title}`} onSelect={() => go(`/requests/new/${t.code}`)} className={item}>
                <FileText className="h-4 w-4 shrink-0" aria-hidden /> Заказать: {t.title}
              </Command.Item>
            ))}
            <Command.Item value="записаться к методисту приём" onSelect={() => go("/appointments")} className={item}><CalendarPlus className="h-4 w-4 shrink-0" aria-hidden /> Записаться к методисту</Command.Item>
            <Command.Item value="спросить помощника ии" onSelect={() => go(`/assistant${q ? `?q=${encodeURIComponent(q)}` : ""}`)} className={item}><Sparkles className="h-4 w-4 shrink-0" aria-hidden /> Спросить помощника{q ? `: «${q}»` : ""}</Command.Item>
            {/* .ics — файл из route handler, а не страница: полноценный переход браузера здесь и нужен */}
            {/* eslint-disable-next-line @next/next/no-location-assign-relative-destination */}
            <Command.Item value="скачать расписание ics календарь" onSelect={() => { setOpen(false); window.location.href = "/api/schedule.ics"; }} className={item}><CalendarPlus className="h-4 w-4 shrink-0" aria-hidden /> Скачать расписание в календарь (.ics)</Command.Item>
          </Command.Group>
        )}
        <Command.Group heading="Разделы" className={group}>
          {nav.map((n) => <Command.Item key={n.href} value={`раздел ${n.label}`} onSelect={() => go(n.href)} className={item}><n.icon className="h-4 w-4 shrink-0" aria-hidden /> {n.label}</Command.Item>)}
          <Command.Item value="тёмная светлая тема" onSelect={() => { const d = !document.documentElement.classList.contains("dark"); document.documentElement.classList.toggle("dark", d); try { localStorage.setItem("theme", d ? "dark" : "light"); } catch {} setOpen(false); }} className={item}><Moon className="h-4 w-4 shrink-0" aria-hidden /> Переключить тему</Command.Item>
        </Command.Group>
        {index.disciplines.length > 0 && (
          <Command.Group heading="Мои дисциплины" className={group}>
            {index.disciplines.map((d) => <Command.Item key={d.name} value={`дисциплина ${d.name} ${d.teacher}`} onSelect={() => go(`/grades#${encodeURIComponent(d.name)}`)} className={item}><BookOpen className="h-4 w-4 shrink-0" aria-hidden /> <span className="min-w-0 flex-1 truncate">{d.name}</span><span className="hidden text-xs text-muted sm:inline">{d.teacher}</span></Command.Item>)}
          </Command.Group>
        )}
        {index.requests.length > 0 && (
          <Command.Group heading={index.role === "STUDENT" ? "Мои заявки" : "Последние заявки"} className={group}>
            {index.requests.map((r) => <Command.Item key={r.id} value={`заявка ${r.number} ${r.title} ${r.status}`} onSelect={() => go(index.role === "STUDENT" ? `/requests/${r.id}` : `/staff/requests/${r.id}`)} className={item}><ArrowRight className="h-4 w-4 shrink-0" aria-hidden /> <span className="min-w-0 flex-1 truncate">{r.title}</span><span className="text-xs text-muted">{r.number} · {r.status}</span></Command.Item>)}
          </Command.Group>
        )}
      </Command.List>
      <div className="flex items-center justify-between border-t border-line px-4 py-2 text-xs text-muted"><span>↑↓ — выбор, Enter — открыть</span><span>Esc — закрыть</span></div>
    </Command.Dialog>
  );
}
