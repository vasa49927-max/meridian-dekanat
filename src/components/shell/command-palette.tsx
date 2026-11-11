"use client";
import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, BookOpen, CalendarPlus, FileText, Moon, Search, Sparkles } from "lucide-react";
import { STAFF_NAV, STUDENT_NAV } from "./nav";
import { useI18n } from "@/i18n/client";

export type PaletteIndex = {
  role: "STUDENT" | "STAFF";
  disciplines: { name: string; teacher: string; anchor?: string }[];
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
  const { t } = useI18n();
  const go = (href: string) => { setOpen(false); setQ(""); router.push(href); };
  const nav = index.role === "STUDENT" ? STUDENT_NAV : STAFF_NAV;
  const item = "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] data-[selected=true]:bg-primary-soft data-[selected=true]:text-primary dark:data-[selected=true]:text-accent-text";
  const group = "px-1 py-1 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted";
  return (
    <Command.Dialog open={open} onOpenChange={setOpen} label={t("common.palette.label")}
      overlayClassName="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]"
      contentClassName="fixed left-1/2 top-[8vh] z-50 w-[min(640px,calc(100vw-24px))] -translate-x-1/2 overflow-hidden rounded-2xl border border-line bg-surface text-fg shadow-2xl">
      <div className="flex items-center gap-2 border-b border-line px-4">
        <Search className="h-5 w-5 text-muted" aria-hidden />
        <Command.Input value={q} onValueChange={setQ} placeholder={t("common.palette.placeholder")} className="h-14 w-full bg-transparent text-base outline-none placeholder:text-muted" />
      </div>
      <Command.List className="max-h-[60vh] overflow-y-auto p-1">
        <Command.Empty className="px-4 py-8 text-center text-sm text-muted">{t("common.palette.empty")} <button className="font-semibold text-primary underline dark:text-accent-text" onClick={() => go(`/assistant?q=${encodeURIComponent(q)}`)}>{t("common.palette.emptyAssistant")}</button>.</Command.Empty>
        {index.role === "STUDENT" && (
          <Command.Group heading={t("common.palette.quick")} className={group}>
            {index.requestTypes.slice(0, 4).map((rt) => (
              <Command.Item key={rt.code} value={`заказать order ${rt.title}`} onSelect={() => go(`/requests/new/${rt.code}`)} className={item}>
                <FileText className="h-4 w-4 shrink-0" aria-hidden /> {t("common.palette.order", { title: rt.title })}
              </Command.Item>
            ))}
            <Command.Item value={`записаться к методисту приём ${t("common.palette.book")}`} onSelect={() => go("/appointments")} className={item}><CalendarPlus className="h-4 w-4 shrink-0" aria-hidden /> {t("common.palette.book")}</Command.Item>
            <Command.Item value={`спросить помощника ии ${t("common.palette.ask")}`} onSelect={() => go(`/assistant${q ? `?q=${encodeURIComponent(q)}` : ""}`)} className={item}><Sparkles className="h-4 w-4 shrink-0" aria-hidden /> {t("common.palette.ask")}{q ? `: «${q}»` : ""}</Command.Item>
            <Command.Item value={`расписание календарь ics подписка ${t("common.palette.calendar")}`} onSelect={() => go("/schedule/calendar")} className={item}><CalendarPlus className="h-4 w-4 shrink-0" aria-hidden /> {t("common.palette.calendar")}</Command.Item>
          </Command.Group>
        )}
        <Command.Group heading={t("common.palette.sections")} className={group}>
          {nav.map((n) => <Command.Item key={n.href} value={`раздел ${n.label} ${t(`common.nav.${n.key}`)}`} onSelect={() => go(n.href)} className={item}><n.icon className="h-4 w-4 shrink-0" aria-hidden /> {t(`common.nav.${n.key}`)}</Command.Item>)}
          <Command.Item value={`тёмная светлая тема theme ${t("common.palette.theme")}`} onSelect={() => { const d = !document.documentElement.classList.contains("dark"); document.documentElement.classList.toggle("dark", d); try { localStorage.setItem("theme", d ? "dark" : "light"); } catch {} setOpen(false); }} className={item}><Moon className="h-4 w-4 shrink-0" aria-hidden /> {t("common.palette.theme")}</Command.Item>
        </Command.Group>
        {index.disciplines.length > 0 && (
          <Command.Group heading={t("common.palette.myCourses")} className={group}>
            {index.disciplines.map((d) => <Command.Item key={d.name} value={`дисциплина ${d.name} ${d.teacher}`} onSelect={() => go(`/grades#${encodeURIComponent(d.anchor ?? d.name)}`)} className={item}><BookOpen className="h-4 w-4 shrink-0" aria-hidden /> <span className="min-w-0 flex-1 truncate">{d.name}</span><span className="hidden text-xs text-muted sm:inline">{d.teacher}</span></Command.Item>)}
          </Command.Group>
        )}
        {index.requests.length > 0 && (
          <Command.Group heading={index.role === "STUDENT" ? t("common.palette.myRequests") : t("common.palette.lastRequests")} className={group}>
            {index.requests.map((r) => <Command.Item key={r.id} value={`заявка ${r.number} ${r.title} ${r.status}`} onSelect={() => go(index.role === "STUDENT" ? `/requests/${r.id}` : `/staff/requests/${r.id}`)} className={item}><ArrowRight className="h-4 w-4 shrink-0" aria-hidden /> <span className="min-w-0 flex-1 truncate">{r.title}</span><span className="text-xs text-muted">{r.number} · {r.status}</span></Command.Item>)}
          </Command.Group>
        )}
      </Command.List>
      <div className="flex items-center justify-between border-t border-line px-4 py-2 text-xs text-muted"><span>{t("common.palette.hintNav")}</span><span>{t("common.palette.hintEsc")}</span></div>
    </Command.Dialog>
  );
}
