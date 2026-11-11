import { Bell, CalendarDays, FileText, GraduationCap, Sparkles, Sun, UserRound, CalendarClock, Inbox, Megaphone, CalendarCog, RotateCcw } from "lucide-react";

export const STUDENT_NAV = [
  { href: "/", label: "Сегодня", key: "today", icon: Sun },
  { href: "/schedule", label: "Расписание", key: "schedule", icon: CalendarDays },
  { href: "/grades", label: "Успеваемость", key: "grades", icon: GraduationCap },
  { href: "/requests", label: "Заявки и справки", key: "requests", icon: FileText },
  { href: "/notifications", label: "Уведомления", key: "notifications", icon: Bell, badge: "unread" as const },
  { href: "/assistant", label: "Помощник", key: "assistant", icon: Sparkles },
  { href: "/appointments", label: "Запись к методисту", key: "appointments", icon: CalendarClock },
  { href: "/profile", label: "Профиль", key: "profile", icon: UserRound },
] as const;

export const STUDENT_TABS = [
  { href: "/", label: "Сегодня", key: "today", icon: "sun" },
  { href: "/schedule", label: "Расписание", key: "schedule", icon: "calendar" },
  { href: "/grades", label: "Успеваемость", key: "grades", icon: "grad" },
  { href: "/requests", label: "Заявки", key: "requestsShort", icon: "file" },
  { href: "/more", label: "Ещё", key: "more", icon: "menu" },
] as const;

export const STAFF_NAV = [
  { href: "/staff", label: "Очередь заявок", key: "staffQueue", icon: Inbox },
  { href: "/staff/announcements", label: "Объявления", key: "staffAnnouncements", icon: Megaphone },
  { href: "/staff/schedule", label: "Переносы пар", key: "staffLessons", icon: CalendarCog },
  { href: "/staff/appointments", label: "Приём студентов", key: "staffReception", icon: CalendarClock },
  { href: "/staff/demo", label: "Демо-данные", key: "staffDemo", icon: RotateCcw },
] as const;
