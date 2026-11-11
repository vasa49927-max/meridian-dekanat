import { Award, MapPinned, BarChart3, ShieldAlert, MessageSquareHeart, Bell, CalendarDays, FileText, GraduationCap, Sparkles, Sun, UserRound, CalendarClock, Inbox, Megaphone, CalendarCog, RotateCcw } from "lucide-react";

/**
 * Раунд 7 (аудит удобства): 11 пунктов одним списком читались медленно — разбили на три смысловые группы
 * (закон Хика: выбор из 3–4 пунктов внутри знакомой группы быстрее, чем из 11).
 */
export const STUDENT_NAV = [
  { href: "/", label: "Сегодня", key: "today", icon: Sun, group: "study" },
  { href: "/schedule", label: "Расписание", key: "schedule", icon: CalendarDays, group: "study" },
  { href: "/grades", label: "Успеваемость", key: "grades", icon: GraduationCap, group: "study" },
  { href: "/map", label: "Как пройти", key: "map", icon: MapPinned, group: "study" },
  { href: "/requests", label: "Заявки и справки", key: "requests", icon: FileText, group: "office" },
  { href: "/appointments", label: "Запись к методисту", key: "appointments", icon: CalendarClock, group: "office" },
  { href: "/assistant", label: "Помощник", key: "assistant", icon: Sparkles, group: "office" },
  { href: "/notifications", label: "Уведомления", key: "notifications", icon: Bell, badge: "unread" as const, group: "office" },
  { href: "/portfolio", label: "Портфолио", key: "portfolio", icon: Award, group: "me" },
  { href: "/survey", label: "Оценка курсов", key: "survey", icon: MessageSquareHeart, group: "me" },
  { href: "/profile", label: "Профиль", key: "profile", icon: UserRound, group: "me" },
] as const;

export const STUDENT_TABS = [
  { href: "/", label: "Сегодня", key: "today", icon: "sun" },
  { href: "/schedule", label: "Расписание", key: "schedule", icon: "calendar" },
  { href: "/grades", label: "Успеваемость", key: "grades", icon: "grad" },
  { href: "/requests", label: "Заявки", key: "requestsShort", icon: "file" },
  { href: "/more", label: "Ещё", key: "more", icon: "menu" },
] as const;

export const STAFF_NAV = [
  { href: "/staff", label: "Очередь заявок", key: "staffQueue", icon: Inbox, group: "work" },
  { href: "/staff/appointments", label: "Приём студентов", key: "staffReception", icon: CalendarClock, group: "work" },
  { href: "/staff/announcements", label: "Объявления", key: "staffAnnouncements", icon: Megaphone, group: "work" },
  { href: "/staff/schedule", label: "Переносы пар", key: "staffLessons", icon: CalendarCog, group: "work" },
  { href: "/staff/analytics", label: "Панель руководителя", key: "staffAnalytics", icon: BarChart3, group: "analytics" },
  { href: "/staff/risks", label: "Риски студентов", key: "staffRisks", icon: ShieldAlert, group: "analytics" },
  { href: "/staff/surveys", label: "Опросы о курсах", key: "staffSurveys", icon: MessageSquareHeart, group: "analytics" },
  { href: "/staff/demo", label: "Демо-данные", key: "staffDemo", icon: RotateCcw, group: "service" },
] as const;
