import { Bell, CalendarDays, FileText, GraduationCap, Sparkles, Sun, UserRound, CalendarClock, Inbox, Megaphone, CalendarCog, RotateCcw } from "lucide-react";

export const STUDENT_NAV = [
  { href: "/", label: "Сегодня", icon: Sun },
  { href: "/schedule", label: "Расписание", icon: CalendarDays },
  { href: "/grades", label: "Успеваемость", icon: GraduationCap },
  { href: "/requests", label: "Заявки и справки", icon: FileText },
  { href: "/notifications", label: "Уведомления", icon: Bell, badge: "unread" as const },
  { href: "/assistant", label: "Помощник", icon: Sparkles },
  { href: "/appointments", label: "Запись к методисту", icon: CalendarClock },
  { href: "/profile", label: "Профиль", icon: UserRound },
];

export const STUDENT_TABS = [
  { href: "/", label: "Сегодня", icon: "sun" },
  { href: "/schedule", label: "Расписание", icon: "calendar" },
  { href: "/grades", label: "Успеваемость", icon: "grad" },
  { href: "/requests", label: "Заявки", icon: "file" },
  { href: "/more", label: "Ещё", icon: "menu" },
] as const;

export const STAFF_NAV = [
  { href: "/staff", label: "Очередь заявок", icon: Inbox },
  { href: "/staff/announcements", label: "Объявления", icon: Megaphone },
  { href: "/staff/schedule", label: "Переносы пар", icon: CalendarCog },
  { href: "/staff/appointments", label: "Приём студентов", icon: CalendarClock },
  { href: "/staff/demo", label: "Демо-данные", icon: RotateCcw },
];
