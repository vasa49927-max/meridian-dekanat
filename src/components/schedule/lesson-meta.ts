/** Русские названия типов занятий — для текстов, которые уходят в БД и .ics. В интерфейсе: t(`common.lessonType.${type}`). */
export const LESSON_TYPE: Record<string, string> = {
  LECTURE: "Лекция", SEMINAR: "Семинар", PRACTICE: "Практика", LANGUAGE: "Иностранный язык", MILITARY: "ВУЦ", CONSULTATION: "Консультация", EXAM: "Экзамен", CREDIT: "Зачёт",
};
type TeacherFields = { teacherTitle: string | null; teacherLast: string | null; teacherFirst: string | null; teacherMiddle: string | null };
export const teacherShort = (l: TeacherFields) =>
  l.teacherLast ? `${l.teacherTitle ?? ""} ${l.teacherLast} ${l.teacherFirst?.[0] ?? ""}.${l.teacherMiddle ? ` ${l.teacherMiddle[0]}.` : ""}`.trim() : null;

/** То же на языке интерфейса: звание через tr("titles"), имя — через name() (латиница в нерусских интерфейсах). */
export const teacherShortI18n = (l: TeacherFields, tr: (group: "titles", v: string | null | undefined) => string, name: (s: string | null | undefined) => string) =>
  l.teacherLast ? `${tr("titles", l.teacherTitle)} ${name(l.teacherLast)} ${name(l.teacherFirst).charAt(0)}.${l.teacherMiddle ? ` ${name(l.teacherMiddle).charAt(0)}.` : ""}`.trim() : null;
