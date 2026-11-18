/** Чек-лист первокурсника (раунд 8). Ключ — стабильный идентификатор пункта, тексты — в словаре checklist.items.<key>. */
export const CHECKLIST = [
  { key: "card", link: "/appointments" as string | null },
  { key: "mail", link: null },
  { key: "calendar", link: "/schedule/calendar" },
  { key: "push", link: "/profile" },
  { key: "map", link: "/map" },
  { key: "library", link: null },
  { key: "electives", link: "/grades/electives" },
  { key: "clubs", link: "/notifications?f=ANNOUNCEMENT" },
] as const;
export type ChecklistKey = (typeof CHECKLIST)[number]["key"];
export const isChecklistKey = (k: string): k is ChecklistKey => CHECKLIST.some((x) => x.key === k);
