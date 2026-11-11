/**
 * Демо-данные «Меридиана». ВСЕ ЛЮДИ ВЫМЫШЛЕНЫ: любые совпадения ФИО с реальными людьми случайны.
 * Реальны только названия факультетов/направлений и адреса кампусов МГИМО (открытые данные).
 */
import type { RequestField } from "@/server/db/schema";

export const SEMESTER = "2026-осень";

export const FACULTIES = [
  { code: "МЭО", name: "Факультет международных экономических отношений", campus: "MOSCOW" },
  { code: "МП", name: "Международно-правовой факультет", campus: "MOSCOW" },
  { code: "ФЛМК", name: "Факультет лингвистики и межкультурной коммуникации", campus: "ODINTSOVO" },
  { code: "МО", name: "Факультет международных отношений", campus: "MOSCOW" },
  { code: "МЖ", name: "Факультет международной журналистики", campus: "MOSCOW" },
] as const;

export const PROGRAMS = [
  { faculty: "МЭО", code: "38.03.01", name: "Экономика" },
  { faculty: "МП", code: "40.03.01", name: "Юриспруденция" },
  { faculty: "ФЛМК", code: "45.03.02", name: "Лингвистика" },
] as const;

export const BUILDINGS = [
  { code: "А", name: "Главный корпус", address: "пр-т Вернадского, 76", campus: "MOSCOW", hint: "Главный вход со стороны пр-та Вернадского. Аудитории 1xxx–4xxx: первая цифра — этаж." },
  { code: "Б", name: "Корпус Б", address: "пр-т Вернадского, 76, корп. Б", campus: "MOSCOW", hint: "Переход из главного корпуса на 2-м этаже. Аудитории 4xx–5xx." },
  { code: "ВУЦ", name: "Военный учебный центр", address: "пр-т Вернадского, 76", campus: "MOSCOW", hint: "Отдельный вход с торца здания. Форма одежды — по расписанию ВУЦ." },
  { code: "О", name: "Кампус Одинцово", address: "Одинцово, ул. Новоспортивная, 3", campus: "ODINTSOVO", hint: "Корпусной автобус от м. «Юго-Западная» — по расписанию на сайте кампуса." },
  { code: "СК", name: "Спортивный комплекс", address: "пр-т Вернадского, 76", campus: "MOSCOW", hint: "Вход через главный корпус, цокольный этаж." },
] as const;

export const TEACHERS = [
  { key: "kovaleva", lastName: "Ковалёва", firstName: "Марина", middleName: "Романовна", title: "доц.", department: "Кафедра мировой экономики" },
  { key: "orlov", lastName: "Орлов", firstName: "Пётр", middleName: "Андреевич", title: "проф.", department: "Кафедра экономической теории" },
  { key: "sadykova", lastName: "Садыкова", firstName: "Эльвира", middleName: "Маратовна", title: "доц.", department: "Кафедра математических методов" },
  { key: "brown", lastName: "Браун", firstName: "Алиса", middleName: "Георгиевна", title: "ст. преп.", department: "Кафедра английского языка № 3" },
  { key: "ruiz", lastName: "Руис-Петрова", firstName: "Елена", middleName: null, title: "ст. преп.", department: "Кафедра испанского языка" },
  { key: "kraus", lastName: "Краус", firstName: "Виктор", middleName: "Карлович", title: "доц.", department: "Кафедра немецкого языка" },
  { key: "lavrentiev", lastName: "Лаврентьев", firstName: "Сергей", middleName: "Ильич", title: "проф.", department: "Кафедра истории и политики" },
  { key: "zimina", lastName: "Зимина", firstName: "Ольга", middleName: "Павловна", title: "доц.", department: "Кафедра международного частного права" },
  { key: "tarasov", lastName: "Тарасов", firstName: "Игорь", middleName: "Николаевич", title: "доц.", department: "Кафедра гражданского процесса" },
  { key: "melnik", lastName: "Мельник", firstName: "Анна", middleName: "Сергеевна", title: "ст. преп.", department: "Кафедра английского языка № 2" },
  { key: "gurov", lastName: "Гуров", firstName: "Денис", middleName: "Олегович", title: "доц.", department: "Кафедра международного права" },
  { key: "voronin", lastName: "Воронин", firstName: "Алексей", middleName: "Петрович", title: "полк.", department: "Военный учебный центр" },
  { key: "fedotova", lastName: "Федотова", firstName: "Людмила", middleName: "Ивановна", title: "проф.", department: "Кафедра общего языкознания" },
  { key: "chen", lastName: "Чэнь", firstName: "Юлия", middleName: null, title: "ст. преп.", department: "Кафедра английского языка № 5" },
  { key: "beaumont", lastName: "Бомон", firstName: "Клэр", middleName: null, title: "ст. преп.", department: "Кафедра французского языка" },
  { key: "sokolovsky", lastName: "Соколовский", firstName: "Роман", middleName: "Евгеньевич", title: "доц.", department: "Кафедра русского языка" },
] as const;
export type TeacherKey = (typeof TEACHERS)[number]["key"];

/** Пары по звонкам. */
export const SLOTS = {
  1: ["09:00", "10:20"], 2: ["10:40", "12:00"], 3: ["12:55", "14:15"], 4: ["14:30", "15:50"], 5: ["16:10", "17:30"], 6: ["17:40", "19:00"],
} as const;

type W = { day: 1 | 2 | 3 | 4 | 5 | 6; slot: keyof typeof SLOTS; type: "LECTURE" | "SEMINAR" | "PRACTICE" | "LANGUAGE"; room: string; b: string; subgroup?: number };
export type DisciplineSeed = {
  key: string; name: string; short: string; credits: number; control: "EXAM" | "CREDIT" | "GRADED_CREDIT"; teacher: TeacherKey; week: W[];
  /** Контрольные точки: [название, макс. балл, дата (месяц, день) | null, вид] */
  points: [string, number, [number, number] | null, "CONTROL" | "ATTENDANCE" | "ACTIVITY"][];
};

const examPoints: DisciplineSeed["points"] = [
  ["Коллоквиум 1", 15, [10, 6], "CONTROL"],
  ["Эссе", 15, [10, 27], "CONTROL"],
  ["Коллоквиум 2", 15, [11, 24], "CONTROL"],
  ["Работа на семинарах", 10, [12, 15], "ACTIVITY"],
  ["Посещаемость", 5, [12, 18], "ATTENDANCE"],
];
const langPoints: DisciplineSeed["points"] = [
  ["Тест по лексике", 15, [10, 1], "CONTROL"],
  ["Презентация", 15, [10, 29], "CONTROL"],
  ["Контрольная работа", 15, [11, 26], "CONTROL"],
  ["Работа на занятиях", 10, [12, 15], "ACTIVITY"],
  ["Посещаемость", 5, [12, 18], "ATTENDANCE"],
];
const creditPoints: DisciplineSeed["points"] = [
  ["Доклад", 15, [10, 8], "CONTROL"],
  ["Тест", 15, [10, 22], "CONTROL"],
  ["Реферат", 20, [11, 30], "CONTROL"],
  ["Посещаемость", 10, [12, 18], "ATTENDANCE"],
];

export const CURRICULA: Record<string, DisciplineSeed[]> = {
  "МЭО 2.2": [
    { key: "macro", name: "Макроэкономика", short: "Макро", credits: 5, control: "EXAM", teacher: "orlov", points: examPoints,
      week: [{ day: 1, slot: 1, type: "LECTURE", room: "2001", b: "А" }, { day: 3, slot: 2, type: "SEMINAR", room: "3015", b: "А" }] },
    { key: "mfr", name: "Международные финансовые рынки", short: "МФР", credits: 4, control: "EXAM", teacher: "kovaleva", points: examPoints,
      week: [{ day: 2, slot: 3, type: "LECTURE", room: "2001", b: "А" }, { day: 5, slot: 2, type: "SEMINAR", room: "3047", b: "А" }] },
    { key: "stat", name: "Статистика", short: "Статистика", credits: 4, control: "EXAM", teacher: "sadykova", points: examPoints,
      week: [{ day: 2, slot: 1, type: "LECTURE", room: "1018", b: "А" }, { day: 4, slot: 2, type: "PRACTICE", room: "412", b: "Б" }] },
    { key: "busen", name: "Деловой английский язык", short: "Англ.", credits: 4, control: "GRADED_CREDIT", teacher: "brown", points: langPoints,
      week: [{ day: 1, slot: 3, type: "LANGUAGE", room: "518", b: "Б" }, { day: 5, slot: 4, type: "LANGUAGE", room: "412", b: "Б" }] },
    { key: "span", name: "Испанский язык (второй иностранный)", short: "Испанский", credits: 3, control: "GRADED_CREDIT", teacher: "ruiz", points: langPoints,
      week: [{ day: 3, slot: 4, type: "LANGUAGE", room: "506", b: "Б", subgroup: 2 }, { day: 5, slot: 3, type: "LANGUAGE", room: "518", b: "Б", subgroup: 2 }] },
    { key: "germ", name: "Немецкий язык (второй иностранный)", short: "Немецкий", credits: 3, control: "GRADED_CREDIT", teacher: "kraus", points: langPoints,
      week: [{ day: 3, slot: 4, type: "LANGUAGE", room: "508", b: "Б", subgroup: 1 }, { day: 5, slot: 3, type: "LANGUAGE", room: "520", b: "Б", subgroup: 1 }] },
    { key: "hist", name: "История международных отношений", short: "ИМО", credits: 3, control: "CREDIT", teacher: "lavrentiev", points: creditPoints,
      week: [{ day: 4, slot: 3, type: "SEMINAR", room: "2110", b: "А" }] },
  ],
  "МП 4.1": [
    { key: "mchp", name: "Международное частное право", short: "МЧП", credits: 5, control: "EXAM", teacher: "zimina", points: examPoints,
      week: [{ day: 1, slot: 2, type: "LECTURE", room: "1018", b: "А" }, { day: 3, slot: 3, type: "SEMINAR", room: "3021", b: "А" }] },
    { key: "civproc", name: "Гражданский процесс", short: "ГП", credits: 4, control: "EXAM", teacher: "tarasov", points: examPoints,
      week: [{ day: 2, slot: 2, type: "LECTURE", room: "2001", b: "А" }, { day: 5, slot: 1, type: "SEMINAR", room: "3033", b: "А" }] },
    { key: "wto", name: "Право ВТО", short: "ВТО", credits: 3, control: "CREDIT", teacher: "gurov", points: creditPoints,
      week: [{ day: 2, slot: 4, type: "SEMINAR", room: "3040", b: "А" }] },
    { key: "legen", name: "Юридический английский язык", short: "Англ.", credits: 3, control: "GRADED_CREDIT", teacher: "melnik", points: langPoints,
      week: [{ day: 1, slot: 4, type: "LANGUAGE", room: "430", b: "Б" }, { day: 5, slot: 3, type: "LANGUAGE", room: "430", b: "Б" }] },
    { key: "arb", name: "Международный коммерческий арбитраж", short: "МКА", credits: 3, control: "EXAM", teacher: "gurov", points: examPoints,
      week: [{ day: 3, slot: 1, type: "LECTURE", room: "2110", b: "А" }] },
  ],
  "ФЛМК 1.3": [
    { key: "ling", name: "Введение в языкознание", short: "Языкознание", credits: 4, control: "EXAM", teacher: "fedotova", points: examPoints,
      week: [{ day: 1, slot: 2, type: "LECTURE", room: "201", b: "О" }, { day: 4, slot: 2, type: "SEMINAR", room: "305", b: "О" }] },
    { key: "pken", name: "Практический курс английского языка", short: "Англ.", credits: 6, control: "EXAM", teacher: "chen", points: langPoints,
      week: [{ day: 1, slot: 3, type: "LANGUAGE", room: "214", b: "О" }, { day: 3, slot: 2, type: "LANGUAGE", room: "214", b: "О" }, { day: 5, slot: 2, type: "LANGUAGE", room: "214", b: "О" }] },
    { key: "fr", name: "Французский язык (второй иностранный)", short: "Французский", credits: 4, control: "GRADED_CREDIT", teacher: "beaumont", points: langPoints,
      week: [{ day: 2, slot: 3, type: "LANGUAGE", room: "118", b: "О" }, { day: 4, slot: 4, type: "LANGUAGE", room: "118", b: "О" }] },
    { key: "rki", name: "Русский язык и культура речи", short: "Русский", credits: 2, control: "CREDIT", teacher: "sokolovsky", points: creditPoints,
      week: [{ day: 2, slot: 2, type: "SEMINAR", room: "310", b: "О" }] },
    { key: "histru", name: "История России", short: "История", credits: 3, control: "CREDIT", teacher: "lavrentiev", points: creditPoints,
      week: [{ day: 3, slot: 3, type: "LECTURE", room: "101", b: "О" }] },
  ],
};

/** Демо-аккаунты для жюри. Пароли публикуются в docs/TEST_ACCOUNTS.md — это вымышленные учётки. */
export const DEMO_STUDENTS = [
  { login: "sokolova", password: "Demo-2026-anna", group: "МЭО 2.2", lastName: "Соколова", firstName: "Анна", middleName: "Викторовна", gender: "F", recordBook: "МЭО-25-0417", subgroup: 2, basis: "бюджет", enrollmentYear: 2025, military: false, hue: 222,
    languages: [{ lang: "Английский", level: "C1" }, { lang: "Испанский", level: "A2" }],
    // баллы по контрольным точкам (null — ещё не оценено)
    scores: {
      macro: [14, 13, null, null, null], mfr: [13, 14, null, null, null], stat: [6, 7, null, null, null],
      busen: [14, 13, null, null, null], span: [12, 13, null, null, null], hist: [14, 15, 18, null],
    } as Record<string, (number | null)[]>,
    past: [
      ["2025-осень", [["Микроэкономика", "EXAM", 86, 5], ["Математический анализ", "EXAM", 74, 5], ["Английский язык", "GRADED_CREDIT", 92, 4], ["Введение в специальность", "CREDIT", 88, 2], ["История России", "CREDIT", 81, 3]]],
      ["2026-весна", [["Эконометрика", "EXAM", 79, 5], ["Мировая экономика", "EXAM", 91, 4], ["Английский язык", "GRADED_CREDIT", 90, 4], ["Испанский язык", "GRADED_CREDIT", 83, 3], ["Философия", "CREDIT", 77, 3]]],
    ] as [string, [string, "EXAM" | "CREDIT" | "GRADED_CREDIT", number, number][]][],
  },
  { login: "galiev", password: "Demo-2026-timur", group: "МП 4.1", lastName: "Галиев", firstName: "Тимур", middleName: "Ренатович", gender: "M", recordBook: "МП-23-0291", subgroup: 1, basis: "договор", enrollmentYear: 2023, military: true, hue: 160,
    languages: [{ lang: "Английский", level: "C1" }, { lang: "Французский", level: "B2" }],
    scores: { mchp: [15, 14, null, null, null], civproc: [14, 15, null, null, null], wto: [14, 15, 17, null], legen: [15, 14, null, null, null], arb: [13, 15, null, null, null] } as Record<string, (number | null)[]>,
    past: [
      ["2023-осень", [["Теория государства и права", "EXAM", 88, 5], ["Римское право", "EXAM", 91, 4], ["Английский язык", "GRADED_CREDIT", 93, 4]]],
      ["2024-весна", [["Конституционное право", "EXAM", 86, 5], ["Английский язык", "GRADED_CREDIT", 90, 4], ["Логика", "CREDIT", 84, 2]]],
      ["2024-осень", [["Гражданское право", "EXAM", 92, 5], ["Международное публичное право", "EXAM", 89, 5], ["Французский язык", "GRADED_CREDIT", 85, 3]]],
      ["2025-весна", [["Уголовное право", "EXAM", 81, 5], ["Право ЕС", "EXAM", 90, 4], ["Французский язык", "GRADED_CREDIT", 87, 3]]],
      ["2025-осень", [["Административное право", "EXAM", 94, 4], ["Налоговое право", "EXAM", 87, 4], ["Курсовая работа", "GRADED_CREDIT", 95, 2]]],
      ["2026-весна", [["Международное экономическое право", "EXAM", 91, 5], ["Трудовое право", "CREDIT", 86, 3], ["Производственная практика", "GRADED_CREDIT", 93, 3]]],
    ] as [string, [string, "EXAM" | "CREDIT" | "GRADED_CREDIT", number, number][]][],
  },
  { login: "lin", password: "Demo-2026-mei", group: "ФЛМК 1.3", lastName: "Лин", firstName: "Мэй", middleName: null, gender: "F", recordBook: "ФЛМК-26-0058", subgroup: 1, basis: "договор", enrollmentYear: 2026, military: false, hue: 330,
    languages: [{ lang: "Китайский", level: "родной" }, { lang: "Русский", level: "B2" }, { lang: "Английский", level: "B2" }, { lang: "Французский", level: "A1" }],
    scores: { ling: [11, 12, null, null, null], pken: [12, 11, null, null, null], fr: [13, 14, null, null, null], rki: [9, 8, null, null], histru: [12, null, null, null] } as Record<string, (number | null)[]>,
    past: [] as [string, [string, "EXAM" | "CREDIT" | "GRADED_CREDIT", number, number][]][],
  },
] as const;

/** Однокурсники демо-студентов — для правдоподобной очереди деканата (входа для них нет в TEST_ACCOUNTS). */
export const EXTRA_STUDENTS: { group: string; lastName: string; firstName: string; middleName: string; gender: "F" | "M" }[] = [
  { group: "МЭО 2.2", lastName: "Беляев", firstName: "Максим", middleName: "Олегович", gender: "M" },
  { group: "МЭО 2.2", lastName: "Кравец", firstName: "Дарья", middleName: "Андреевна", gender: "F" },
  { group: "МЭО 2.2", lastName: "Юсупов", firstName: "Артур", middleName: "Ильдарович", gender: "M" },
  { group: "МП 4.1", lastName: "Никитина", firstName: "Полина", middleName: "Сергеевна", gender: "F" },
  { group: "МП 4.1", lastName: "Захаров", firstName: "Глеб", middleName: "Викторович", gender: "M" },
  { group: "МП 4.1", lastName: "Ахмедова", firstName: "Лейла", middleName: "Рустамовна", gender: "F" },
  { group: "ФЛМК 1.3", lastName: "Петренко", firstName: "Вера", middleName: "Николаевна", gender: "F" },
  { group: "ФЛМК 1.3", lastName: "Осипов", firstName: "Кирилл", middleName: "Дмитриевич", gender: "M" },
];

export const DEMO_STAFF = { login: "belova", password: "Demo-2026-staff", lastName: "Белова", firstName: "Ирина", middleName: "Павловна", position: "Методист единого студенческого офиса", office: "Студенческий офис, ауд. 1012, корпус А" };

export const REQUEST_TYPES: {
  code: string; title: string; description: string; category: "CERTIFICATE" | "APPLICATION"; slaDays: number; producesDocument: boolean; icon: string; popular?: boolean; regulationRef: string; fields: RequestField[];
}[] = [
  { code: "STUDY_CERT", title: "Справка об обучении", description: "Подтверждает, что вы студент МГИМО. Для работы, банка, соцзащиты, «по месту требования».", category: "CERTIFICATE", slaDays: 1, producesDocument: true, icon: "file-check", popular: true, regulationRef: "п. 6.2",
    fields: [{ name: "purpose", label: "Куда предоставляется", kind: "text", placeholder: "По месту требования", hint: "Можно оставить «по месту требования»" }, { name: "copies", label: "Количество экземпляров", kind: "select", options: ["1", "2", "3"], required: true }] },
  { code: "STUDY_CERT_EN", title: "Справка об обучении на английском", description: "Для визы, посольства, зарубежной стажировки или обмена. Электронная, с QR-кодом проверки.", category: "CERTIFICATE", slaDays: 3, producesDocument: true, icon: "globe", popular: true, regulationRef: "п. 6.3",
    fields: [{ name: "country", label: "Страна", kind: "text", required: true, placeholder: "Например, Испания" }, { name: "purpose", label: "Цель", kind: "select", options: ["Виза", "Стажировка", "Программа обмена", "Конференция", "Другое"], required: true }, { name: "dates", label: "Даты поездки", kind: "text", placeholder: "С 10.01.2027 по 25.01.2027" }] },
  { code: "MILITARY_CERT", title: "Справка для военкомата", description: "Справка по форме приложения № 4 для отсрочки. Подаётся ежегодно, обычно в сентябре–ноябре.", category: "CERTIFICATE", slaDays: 2, producesDocument: true, icon: "shield", popular: true, regulationRef: "п. 6.4",
    fields: [{ name: "commissariat", label: "Военный комиссариат", kind: "text", required: true, placeholder: "Военный комиссариат Гагаринского района г. Москвы" }] },
  { code: "STIPEND_CERT", title: "Справка о размере стипендии", description: "Сумма начисленной стипендии за период. Для соцзащиты, налогового вычета, банка.", category: "CERTIFICATE", slaDays: 3, producesDocument: true, icon: "wallet", regulationRef: "п. 6.5",
    fields: [{ name: "period", label: "Период", kind: "select", options: ["Последние 3 месяца", "Последние 6 месяцев", "Календарный год"], required: true }, { name: "purpose", label: "Куда предоставляется", kind: "text", placeholder: "По месту требования" }] },
  { code: "RECORD_EXTRACT", title: "Выписка из зачётной книжки", description: "Оценки за все завершённые семестры. Для стажировок, перевода, конкурсов.", category: "CERTIFICATE", slaDays: 5, producesDocument: true, icon: "list-checks", regulationRef: "п. 6.6",
    fields: [{ name: "language", label: "Язык", kind: "select", options: ["Русский", "Английский"], required: true }, { name: "purpose", label: "Для чего", kind: "text", placeholder: "Конкурс на стажировку" }] },
  { code: "INDIVIDUAL_PLAN", title: "Индивидуальный график обучения", description: "Свободное посещение на время стажировки, спортивных сборов или по семейным обстоятельствам.", category: "APPLICATION", slaDays: 10, producesDocument: false, icon: "calendar-clock", regulationRef: "п. 7.1",
    fields: [{ name: "reason", label: "Основание", kind: "select", options: ["Стажировка / работа по профилю", "Спортивные сборы", "Семейные обстоятельства", "Иное"], required: true }, { name: "period", label: "Период", kind: "text", required: true, placeholder: "С 01.12.2026 по 28.02.2027" }, { name: "details", label: "Подробности", kind: "textarea", required: true, placeholder: "Где стажировка, как будете сдавать контрольные точки", max: 1000 }] },
  { code: "RETAKE", title: "Перенос экзамена / пересдача", description: "Перенос сдачи по уважительной причине или запись на пересдачу.", category: "APPLICATION", slaDays: 5, producesDocument: false, icon: "repeat", regulationRef: "п. 4.8",
    fields: [{ name: "discipline", label: "Дисциплина", kind: "text", required: true }, { name: "reason", label: "Причина", kind: "textarea", required: true, max: 800 }] },
  { code: "CREDIT_TRANSFER", title: "Перезачёт дисциплины", description: "Если дисциплина уже изучена в другом вузе или на программе обмена.", category: "APPLICATION", slaDays: 10, producesDocument: false, icon: "arrow-left-right", regulationRef: "п. 7.3",
    fields: [{ name: "discipline", label: "Дисциплина", kind: "text", required: true }, { name: "source", label: "Где изучена", kind: "textarea", required: true, placeholder: "Вуз, программа, количество часов, оценка", max: 800 }] },
  { code: "STUDENT_ID_DUP", title: "Дубликат студенческого билета", description: "Если билет утерян или испорчен. Электронный билет продолжает работать.", category: "APPLICATION", slaDays: 5, producesDocument: false, icon: "id-card", regulationRef: "п. 7.5",
    fields: [{ name: "reason", label: "Причина", kind: "select", options: ["Утерян", "Испорчен", "Смена ФИО"], required: true }] },
  // Правка капитана (раунд 4): заявление по оплате обучения — для студентов на договоре.
  { code: "TUITION_PAYMENT", title: "Заявление об оплате обучения", description: "Для обучающихся по договору: рассрочка или отсрочка платежа, оплата материнским капиталом или третьим лицом, возврат переплаты.", category: "APPLICATION", slaDays: 10, producesDocument: false, icon: "wallet", regulationRef: "п. 7.7",
    fields: [
      { name: "kind", label: "Что нужно", kind: "select", options: ["Рассрочка платежа", "Отсрочка платежа", "Оплата материнским капиталом", "Оплата третьим лицом (работодателем, родственником)", "Возврат излишне уплаченного"], required: true },
      { name: "term", label: "За какой период", kind: "select", options: ["Весенний семестр 2026/27", "Осенний семестр 2026/27", "2026/27 учебный год"], required: true },
      { name: "contract", label: "Номер договора", kind: "text", placeholder: "Например, Д-2025-01234", max: 40 },
      { name: "reason", label: "Обоснование", kind: "textarea", required: true, placeholder: "Почему нужна рассрочка или отсрочка, какой график платежей удобен", max: 800 },
    ] },
];

export const ANNOUNCEMENTS: { title: string; body: string; source: string; important: boolean; audience: "ALL" | "FACULTY" | "COURSE" | "GROUP"; faculty?: string; course?: number; group?: string; daysAgo: number }[] = [
  { title: "Запись на курсы по выбору на весенний семестр", body: "Запись открыта в разделе «Успеваемость → Курсы по выбору» до 15 ноября включительно. После этой даты поменять выбор можно только заявлением.", source: "Учебный офис", important: true, audience: "ALL", daysAgo: 6 },
  { title: "Продление приёма заявлений на стажировки до 20 ноября", body: "Студенты 2–4 курсов могут подать заявку на зимнюю стажировку в международных организациях. Нужна выписка из зачётки — закажите её в «Заявках», это занимает до 5 дней.", source: "Деканат МЭО", important: true, audience: "FACULTY", faculty: "МЭО", daysAgo: 2 },
  { title: "Модель ООН: открыта регистрация делегатов", body: "Ежегодная модель ООН пройдёт в весеннем семестре. Регистрация делегатов и волонтёров — до 1 декабря на странице студсовета.", source: "Студсовет", important: false, audience: "ALL", daysAgo: 1 },
  { title: "Кейс-чемпионат бизнес-клуба: регистрация команд", body: "Команды по 3–4 человека, кейс от партнёра клуба. Финал — в начале декабря в конференц-зале главного корпуса.", source: "Бизнес-клуб", important: false, audience: "ALL", daysAgo: 4 },
  { title: "Справка для военкомата — закажите онлайн до 30 ноября", body: "Студентам, обучающимся в ВУЦ и состоящим на воинском учёте: ежегодную справку по форме № 4 можно заказать в «Заявках» без визита в деканат.", source: "Военный учебный центр", important: true, audience: "FACULTY", faculty: "МП", daysAgo: 3 },
  { title: "Консультации по выпускным работам: график научных руководителей", body: "График консультаций на ноябрь–декабрь опубликован. Записаться к методисту по оформлению темы ВКР можно в разделе «Запись к методисту».", source: "Деканат МП", important: false, audience: "COURSE", faculty: "МП", course: 4, daysAgo: 8 },
  { title: "Изменения в расписании корпусного автобуса", body: "С 9 ноября первый рейс от м. «Юго-Западная» в 07:40 вместо 07:50, добавлен рейс в 19:20 из Одинцова.", source: "Кампус Одинцово", important: false, audience: "FACULTY", faculty: "ФЛМК", daysAgo: 5 },
  { title: "Читальный зал в сессию работает до 22:00", body: "С 14 декабря по 24 января читальный зал главного корпуса открыт ежедневно с 9:00 до 22:00.", source: "Библиотека", important: false, audience: "ALL", daysAgo: 10 },
  { title: "Адаптационная встреча для первокурсников", body: "Расскажем про БРС, Положение о деканате и как пользоваться «Меридианом». Аудитория 101, кампус Одинцово.", source: "Деканат ФЛМК", important: false, audience: "COURSE", faculty: "ФЛМК", course: 1, daysAgo: 12 },
];
