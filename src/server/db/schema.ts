/**
 * Схема БД «Меридиан». Все данные вымышлены.
 * Правило: у каждой таблицы с личными данными есть владелец (studentId/userId) и индекс по нему.
 */
import { relations, sql } from "drizzle-orm";
import {
  boolean, customType, index, integer, jsonb, pgEnum, pgTable, real, smallint, text, timestamp, uniqueIndex, uuid,
} from "drizzle-orm/pg-core";

const bytea = customType<{ data: Buffer; driverData: Buffer }>({ dataType: () => "bytea" });

const ts = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });
const createdAt = () => ts("created_at").notNull().defaultNow();

// ───────────── Пользователи и сессии ─────────────
export const roleEnum = pgEnum("role", ["STUDENT", "STAFF"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  login: text("login").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull(),
  createdAt: createdAt(),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** SHA-256 от токена из cookie. Сам токен в БД не хранится. */
  tokenHash: text("token_hash").notNull().unique(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: ts("expires_at").notNull(),
  lastSeenAt: ts("last_seen_at").notNull().defaultNow(),
  userAgent: text("user_agent"),
  createdAt: createdAt(),
}, (t) => [index("sessions_user_idx").on(t.userId)]);

/** Журнал попыток для rate limiting (вход, ИИ-помощник). Хранится в БД → работает при нескольких репликах. */
export const rateEvents = pgTable("rate_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  bucket: text("bucket").notNull(), // например "login:ip:1.2.3.4", "login:user:sokolova", "ai:<userId>"
  createdAt: createdAt(),
}, (t) => [index("rate_events_bucket_idx").on(t.bucket, t.createdAt)]);

// ───────────── Структура вуза ─────────────
export const campusEnum = pgEnum("campus", ["MOSCOW", "ODINTSOVO"]);

export const faculties = pgTable("faculties", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(), // МЭО
  name: text("name").notNull(),
  campus: campusEnum("campus").notNull(),
});

export const programs = pgTable("programs", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull(), // 38.03.01
  name: text("name").notNull(),
  facultyId: uuid("faculty_id").notNull().references(() => faculties.id),
});

export const buildings = pgTable("buildings", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(), // А, Б, ВУЦ, О
  name: text("name").notNull(),
  address: text("address").notNull(),
  campus: campusEnum("campus").notNull(),
  /** Подсказка «как дойти» для навигатора. */
  hint: text("hint"),
});

export const groups = pgTable("groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(), // 2.2
  course: smallint("course").notNull(),
  facultyId: uuid("faculty_id").notNull().references(() => faculties.id),
  programId: uuid("program_id").notNull().references(() => programs.id),
}, (t) => [uniqueIndex("groups_faculty_name_uq").on(t.facultyId, t.name), index("groups_course_idx").on(t.facultyId, t.course)]);

export const students = pgTable("students", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  lastName: text("last_name").notNull(),
  firstName: text("first_name").notNull(),
  middleName: text("middle_name"),
  /** Для грамматики в справках («студентка/студент»). */
  gender: text("gender").$type<"F" | "M">().notNull(),
  recordBook: text("record_book").notNull().unique(), // номер зачётки (вымышленный)
  groupId: uuid("group_id").notNull().references(() => groups.id),
  subgroup: smallint("subgroup").notNull().default(1), // языковая подгруппа
  email: text("email").notNull(),
  basis: text("basis").notNull(), // бюджет / договор
  enrollmentYear: smallint("enrollment_year").notNull(),
  militaryTraining: boolean("military_training").notNull().default(false), // обучается в ВУЦ
  /** Цвета и инициалы для сгенерированного аватара. */
  avatarHue: smallint("avatar_hue").notNull().default(220),
  languages: jsonb("languages").$type<{ lang: string; level: string }[]>().notNull().default(sql`'[]'::jsonb`),
}, (t) => [index("students_group_idx").on(t.groupId)]);

export const staff = pgTable("staff", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  lastName: text("last_name").notNull(),
  firstName: text("first_name").notNull(),
  middleName: text("middle_name"),
  position: text("position").notNull(),
  office: text("office").notNull(),
});

export const teachers = pgTable("teachers", {
  id: uuid("id").primaryKey().defaultRandom(),
  lastName: text("last_name").notNull(),
  firstName: text("first_name").notNull(),
  middleName: text("middle_name"),
  title: text("title").notNull(), // доц., проф., ст. преп.
  department: text("department").notNull(),
});

// ───────────── Учёба: дисциплины, расписание, БРС ─────────────
export const controlEnum = pgEnum("control_type", ["EXAM", "CREDIT", "GRADED_CREDIT"]);

export const disciplines = pgTable("disciplines", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  shortName: text("short_name").notNull(),
  credits: smallint("credits").notNull(), // з.е.
  control: controlEnum("control").notNull(),
});

/** Какая дисциплина у какой группы в семестре и кто ведёт. */
export const courseOfferings = pgTable("course_offerings", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id").notNull().references(() => groups.id),
  disciplineId: uuid("discipline_id").notNull().references(() => disciplines.id),
  teacherId: uuid("teacher_id").notNull().references(() => teachers.id),
  semester: text("semester").notNull(), // 2026-осень
}, (t) => [uniqueIndex("offering_uq").on(t.groupId, t.disciplineId, t.semester)]);

export const lessonTypeEnum = pgEnum("lesson_type", ["LECTURE", "SEMINAR", "PRACTICE", "LANGUAGE", "MILITARY", "CONSULTATION", "EXAM", "CREDIT"]);
export const lessonStatusEnum = pgEnum("lesson_status", ["SCHEDULED", "MOVED", "CANCELLED"]);

export const lessons = pgTable("lessons", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id").notNull().references(() => groups.id),
  subgroup: smallint("subgroup"), // null — вся группа
  offeringId: uuid("offering_id").references(() => courseOfferings.id),
  title: text("title").notNull(), // название (для ВУЦ/консультаций без дисциплины)
  teacherId: uuid("teacher_id").references(() => teachers.id),
  type: lessonTypeEnum("type").notNull(),
  startsAt: ts("starts_at").notNull(),
  endsAt: ts("ends_at").notNull(),
  room: text("room").notNull(),
  buildingId: uuid("building_id").notNull().references(() => buildings.id),
  status: lessonStatusEnum("status").notNull().default("SCHEDULED"),
  /** Было до переноса — показываем «было → стало». */
  prevStartsAt: ts("prev_starts_at"),
  prevRoom: text("prev_room"),
  changeNote: text("change_note"),
  changedAt: ts("changed_at"),
}, (t) => [index("lessons_group_time_idx").on(t.groupId, t.startsAt)]);

export const assessmentKindEnum = pgEnum("assessment_kind", ["CONTROL", "ATTENDANCE", "ACTIVITY", "FINAL"]);

/** Контрольная точка БРС (коллоквиум, эссе, посещаемость, экзамен). */
export const assessments = pgTable("assessments", {
  id: uuid("id").primaryKey().defaultRandom(),
  offeringId: uuid("offering_id").notNull().references(() => courseOfferings.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  kind: assessmentKindEnum("kind").notNull(),
  maxPoints: smallint("max_points").notNull(),
  dueAt: ts("due_at"),
  sortOrder: smallint("sort_order").notNull().default(0),
}, (t) => [index("assessments_offering_idx").on(t.offeringId)]);

export const scores = pgTable("scores", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  assessmentId: uuid("assessment_id").notNull().references(() => assessments.id, { onDelete: "cascade" }),
  points: real("points").notNull(),
  gradedAt: ts("graded_at").notNull().defaultNow(),
}, (t) => [uniqueIndex("scores_uq").on(t.studentId, t.assessmentId), index("scores_student_idx").on(t.studentId)]);

/** Итоги прошлых семестров (зачётка). */
export const finalGrades = pgTable("final_grades", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  disciplineName: text("discipline_name").notNull(),
  semester: text("semester").notNull(),
  control: controlEnum("control").notNull(),
  points: smallint("points").notNull(),
  credits: smallint("credits").notNull(),
}, (t) => [index("final_grades_student_idx").on(t.studentId)]);

// ───────────── Сроки ─────────────
export const deadlines = pgTable("deadlines", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  dueAt: ts("due_at").notNull(),
  /** Аудитория: null во всех полях — для всех. */
  facultyId: uuid("faculty_id").references(() => faculties.id),
  course: smallint("course"),
  groupId: uuid("group_id").references(() => groups.id),
  link: text("link"),
}, (t) => [index("deadlines_due_idx").on(t.dueAt)]);

// ───────────── Заявки и справки ─────────────
export const requestCategoryEnum = pgEnum("request_category", ["CERTIFICATE", "APPLICATION"]);
export const requestStatusEnum = pgEnum("request_status", ["SUBMITTED", "IN_PROGRESS", "NEEDS_INFO", "READY", "ISSUED", "REJECTED"]);

export type RequestField = {
  name: string;
  label: string;
  kind: "text" | "textarea" | "select" | "number" | "date";
  options?: string[];
  required?: boolean;
  placeholder?: string;
  hint?: string;
  max?: number;
};

export const requestTypes = pgTable("request_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: requestCategoryEnum("category").notNull(),
  slaDays: smallint("sla_days").notNull(),
  /** Готовая справка — электронный документ с QR. */
  producesDocument: boolean("produces_document").notNull().default(false),
  fields: jsonb("fields").$type<RequestField[]>().notNull(),
  icon: text("icon").notNull().default("file-text"),
  popular: boolean("popular").notNull().default(false),
  regulationRef: text("regulation_ref"), // пункт Положения
});

export const requests = pgTable("requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  number: text("number").notNull().unique(), // З-2026-00123
  studentId: uuid("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  typeId: uuid("type_id").notNull().references(() => requestTypes.id),
  status: requestStatusEnum("status").notNull().default("SUBMITTED"),
  payload: jsonb("payload").$type<Record<string, string>>().notNull(),
  studentComment: text("student_comment"),
  /** Последний комментарий деканата (причина отказа / что доработать). */
  staffComment: text("staff_comment"),
  assigneeStaffId: uuid("assignee_staff_id").references(() => staff.id),
  dueAt: ts("due_at").notNull(),
  createdAt: createdAt(),
  updatedAt: ts("updated_at").notNull().defaultNow(),
}, (t) => [
  index("requests_student_idx").on(t.studentId, t.createdAt),
  index("requests_status_idx").on(t.status, t.createdAt),
]);

export const requestEvents = pgTable("request_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  requestId: uuid("request_id").notNull().references(() => requests.id, { onDelete: "cascade" }),
  status: requestStatusEnum("status").notNull(),
  comment: text("comment"),
  actor: text("actor").notNull(), // «Вы», «Деканат МЭО»
  createdAt: createdAt(),
}, (t) => [index("request_events_req_idx").on(t.requestId, t.createdAt)]);

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  requestId: uuid("request_id").notNull().unique().references(() => requests.id, { onDelete: "cascade" }),
  studentId: uuid("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  /** Случайный код для публичной проверки по QR (не id!). */
  verifyCode: text("verify_code").notNull().unique(),
  title: text("title").notNull(),
  body: jsonb("body").$type<{ lines: string[]; purpose?: string; language?: string }>().notNull(),
  issuedAt: ts("issued_at").notNull().defaultNow(),
  validUntil: ts("valid_until"),
  revoked: boolean("revoked").notNull().default(false),
}, (t) => [index("documents_student_idx").on(t.studentId)]);

/**
 * Вложения к заявкам (правка капитана №5). Для прототипа файлы хранятся в БД (bytea):
 * не нужен отдельный том на хостинге, бэкапы БД включают файлы. Лимиты — в src/server/attachments.ts.
 */
export const attachments = pgTable("attachments", {
  id: uuid("id").primaryKey().defaultRandom(),
  requestId: uuid("request_id").notNull().references(() => requests.id, { onDelete: "cascade" }),
  uploaderRole: text("uploader_role").$type<"STUDENT" | "STAFF">().notNull(),
  fileName: text("file_name").notNull(),
  mime: text("mime").notNull(),
  size: integer("size").notNull(),
  data: bytea("data").notNull(),
  createdAt: createdAt(),
}, (t) => [index("attachments_request_idx").on(t.requestId)]);

// ───────────── Уведомления и объявления ─────────────
export const notificationKindEnum = pgEnum("notification_kind", ["SCHEDULE", "REQUEST", "ANNOUNCEMENT", "DEADLINE", "APPOINTMENT", "GRADE"]);
export const audienceEnum = pgEnum("audience", ["ALL", "FACULTY", "COURSE", "GROUP"]);

export const announcements = pgTable("announcements", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  source: text("source").notNull(), // «Деканат МЭО», «Студсовет»
  important: boolean("important").notNull().default(false),
  audience: audienceEnum("audience").notNull(),
  facultyId: uuid("faculty_id").references(() => faculties.id),
  course: smallint("course"),
  groupId: uuid("group_id").references(() => groups.id),
  authorStaffId: uuid("author_staff_id").references(() => staff.id),
  publishedAt: ts("published_at").notNull().defaultNow(),
}, (t) => [index("announcements_published_idx").on(t.publishedAt)]);

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  kind: notificationKindEnum("kind").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  link: text("link"),
  important: boolean("important").notNull().default(false),
  readAt: ts("read_at"),
  createdAt: createdAt(),
}, (t) => [
  index("notifications_user_idx").on(t.userId, t.createdAt),
  index("notifications_unread_idx").on(t.userId).where(sql`read_at is null`),
]);

// ───────────── Запись к методисту ─────────────
export const appointmentStatusEnum = pgEnum("appointment_status", ["BOOKED", "CANCELLED", "DONE"]);

export const slots = pgTable("slots", {
  id: uuid("id").primaryKey().defaultRandom(),
  staffId: uuid("staff_id").notNull().references(() => staff.id, { onDelete: "cascade" }),
  startsAt: ts("starts_at").notNull(),
  endsAt: ts("ends_at").notNull(),
  location: text("location").notNull(),
  isBooked: boolean("is_booked").notNull().default(false),
}, (t) => [index("slots_time_idx").on(t.startsAt)]);

export const appointments = pgTable("appointments", {
  id: uuid("id").primaryKey().defaultRandom(),
  slotId: uuid("slot_id").notNull().references(() => slots.id, { onDelete: "cascade" }),
  studentId: uuid("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  topic: text("topic").notNull(),
  comment: text("comment"),
  status: appointmentStatusEnum("status").notNull().default("BOOKED"),
  createdAt: createdAt(),
}, (t) => [index("appointments_student_idx").on(t.studentId, t.createdAt)]);

// ───────────── Связи (для db.query) ─────────────
export const usersRelations = relations(users, ({ one }) => ({
  student: one(students, { fields: [users.id], references: [students.userId] }),
  staff: one(staff, { fields: [users.id], references: [staff.userId] }),
}));
export const studentsRelations = relations(students, ({ one, many }) => ({
  user: one(users, { fields: [students.userId], references: [users.id] }),
  group: one(groups, { fields: [students.groupId], references: [groups.id] }),
  requests: many(requests),
}));
export const groupsRelations = relations(groups, ({ one }) => ({
  faculty: one(faculties, { fields: [groups.facultyId], references: [faculties.id] }),
  program: one(programs, { fields: [groups.programId], references: [programs.id] }),
}));
export const lessonsRelations = relations(lessons, ({ one }) => ({
  teacher: one(teachers, { fields: [lessons.teacherId], references: [teachers.id] }),
  building: one(buildings, { fields: [lessons.buildingId], references: [buildings.id] }),
  group: one(groups, { fields: [lessons.groupId], references: [groups.id] }),
}));
export const offeringsRelations = relations(courseOfferings, ({ one, many }) => ({
  discipline: one(disciplines, { fields: [courseOfferings.disciplineId], references: [disciplines.id] }),
  teacher: one(teachers, { fields: [courseOfferings.teacherId], references: [teachers.id] }),
  assessments: many(assessments),
}));
export const assessmentsRelations = relations(assessments, ({ one, many }) => ({
  offering: one(courseOfferings, { fields: [assessments.offeringId], references: [courseOfferings.id] }),
  scores: many(scores),
}));
export const scoresRelations = relations(scores, ({ one }) => ({
  assessment: one(assessments, { fields: [scores.assessmentId], references: [assessments.id] }),
}));
export const requestsRelations = relations(requests, ({ one, many }) => ({
  type: one(requestTypes, { fields: [requests.typeId], references: [requestTypes.id] }),
  student: one(students, { fields: [requests.studentId], references: [students.id] }),
  events: many(requestEvents),
  document: one(documents, { fields: [requests.id], references: [documents.requestId] }),
}));
export const requestEventsRelations = relations(requestEvents, ({ one }) => ({
  request: one(requests, { fields: [requestEvents.requestId], references: [requests.id] }),
}));
export const documentsRelations = relations(documents, ({ one }) => ({
  request: one(requests, { fields: [documents.requestId], references: [requests.id] }),
  student: one(students, { fields: [documents.studentId], references: [students.id] }),
}));
export const slotsRelations = relations(slots, ({ one }) => ({
  staff: one(staff, { fields: [slots.staffId], references: [staff.id] }),
}));
export const appointmentsRelations = relations(appointments, ({ one }) => ({
  slot: one(slots, { fields: [appointments.slotId], references: [slots.id] }),
}));
