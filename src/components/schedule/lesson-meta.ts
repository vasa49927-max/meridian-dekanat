export const LESSON_TYPE: Record<string, string> = {
  LECTURE: "Лекция", SEMINAR: "Семинар", PRACTICE: "Практика", LANGUAGE: "Иностранный язык", MILITARY: "ВУЦ", CONSULTATION: "Консультация", EXAM: "Экзамен", CREDIT: "Зачёт",
};
export const teacherShort = (l: { teacherTitle: string | null; teacherLast: string | null; teacherFirst: string | null; teacherMiddle: string | null }) =>
  l.teacherLast ? `${l.teacherTitle ?? ""} ${l.teacherLast} ${l.teacherFirst?.[0] ?? ""}.${l.teacherMiddle ? ` ${l.teacherMiddle[0]}.` : ""}`.trim() : null;
