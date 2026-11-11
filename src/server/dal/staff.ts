import "server-only";
import { and, asc, count, desc, eq, gte, ilike, inArray, lt, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema as t } from "@/server/db";
import type { StaffViewer } from "@/server/auth/guards";
import { buildDocument, newVerifyCode } from "@/server/documents";
import { fmt, now } from "@/lib/time";
import { pushToUsers } from "@/server/push";

/**
 * DAL сотрудника деканата. Каждая функция требует StaffViewer —
 * вызвать её из кода студента без роли STAFF невозможно по типам и по guard-ам на страницах/actions.
 */
type Status = (typeof t.requestStatusEnum.enumValues)[number];
export const STATUS_FLOW: Record<Status, Status[]> = {
  SUBMITTED: ["IN_PROGRESS", "NEEDS_INFO", "REJECTED"],
  IN_PROGRESS: ["READY", "NEEDS_INFO", "REJECTED"],
  NEEDS_INFO: ["IN_PROGRESS", "REJECTED"],
  READY: ["ISSUED"],
  ISSUED: [],
  REJECTED: [],
};

export type QueueFilter = { status?: Status | "active" | "overdue"; type?: string; faculty?: string; course?: number; q?: string; mine?: boolean };

export async function staffQueue(v: StaffViewer, f: QueueFilter, page = 0, size = 25) {
  const conds = [];
  if (f.mine) conds.push(eq(t.requests.assigneeStaffId, v.staffId));
  if (f.status === "active" || !f.status) conds.push(inArray(t.requests.status, ["SUBMITTED", "IN_PROGRESS", "NEEDS_INFO", "READY"]));
  else if (f.status === "overdue") conds.push(inArray(t.requests.status, ["SUBMITTED", "IN_PROGRESS"]), lt(t.requests.dueAt, now()));
  else conds.push(eq(t.requests.status, f.status));
  if (f.type) conds.push(eq(t.requestTypes.code, f.type));
  if (f.faculty) conds.push(eq(t.faculties.code, f.faculty));
  if (f.course) conds.push(eq(t.groups.course, f.course));
  if (f.q) {
    const q = `%${f.q.replace(/[%_]/g, "")}%`;
    conds.push(or(ilike(t.students.lastName, q), ilike(t.requests.number, q), ilike(t.students.recordBook, q))!);
  }
  const base = db.select({
    id: t.requests.id, number: t.requests.number, status: t.requests.status, createdAt: t.requests.createdAt, dueAt: t.requests.dueAt, updatedAt: t.requests.updatedAt,
    title: t.requestTypes.title, code: t.requestTypes.code, lastName: t.students.lastName, firstName: t.students.firstName, middleName: t.students.middleName,
    group: t.groups.name, course: t.groups.course, faculty: t.faculties.code,
    assigneeId: t.requests.assigneeStaffId, assigneeLast: t.staff.lastName, assigneeFirst: t.staff.firstName, assigneeMiddle: t.staff.middleName,
  }).from(t.requests)
    .leftJoin(t.staff, eq(t.staff.id, t.requests.assigneeStaffId))
    .innerJoin(t.requestTypes, eq(t.requestTypes.id, t.requests.typeId))
    .innerJoin(t.students, eq(t.students.id, t.requests.studentId))
    .innerJoin(t.groups, eq(t.groups.id, t.students.groupId))
    .innerJoin(t.faculties, eq(t.faculties.id, t.groups.facultyId))
    .where(and(...conds));
  const items = await base.orderBy(asc(t.requests.dueAt), asc(t.requests.createdAt)).limit(size + 1).offset(page * size);
  const [stats] = await db.select({
    submitted: sql<number>`count(*) filter (where ${t.requests.status} = 'SUBMITTED')`.mapWith(Number),
    inProgress: sql<number>`count(*) filter (where ${t.requests.status} = 'IN_PROGRESS')`.mapWith(Number),
    needsInfo: sql<number>`count(*) filter (where ${t.requests.status} = 'NEEDS_INFO')`.mapWith(Number),
    ready: sql<number>`count(*) filter (where ${t.requests.status} = 'READY')`.mapWith(Number),
    overdue: sql<number>`count(*) filter (where ${t.requests.status} in ('SUBMITTED','IN_PROGRESS') and ${t.requests.dueAt} < ${now()})`.mapWith(Number),
    mine: sql<number>`count(*) filter (where ${t.requests.assigneeStaffId} = ${v.staffId} and ${t.requests.status} in ('SUBMITTED','IN_PROGRESS','NEEDS_INFO','READY'))`.mapWith(Number),
  }).from(t.requests);
  return { items: items.slice(0, size), hasMore: items.length > size, stats };
}

export async function staffGetRequest(_v: StaffViewer, id: string) {
  if (!z.uuid().safeParse(id).success) return null;
  const r = await db.query.requests.findFirst({
    where: eq(t.requests.id, id),
    with: { type: true, events: { orderBy: asc(t.requestEvents.createdAt) }, document: true, student: { with: { group: { with: { faculty: true, program: true } } } }, assignee: { columns: { id: true, lastName: true, firstName: true, middleName: true } }, feedback: true },
  });
  return r ?? null;
}

/** «Взять себе»: заявка закрепляется за сотрудником. Студент видит, кто ведёт его заявку. */
export async function staffTakeRequest(v: StaffViewer, id: string) {
  if (!z.uuid().safeParse(id).success) return { ok: false as const, error: "Заявка не найдена" };
  const res = await db.update(t.requests).set({ assigneeStaffId: v.staffId, updatedAt: new Date() })
    .where(and(eq(t.requests.id, id), inArray(t.requests.status, ["SUBMITTED", "IN_PROGRESS", "NEEDS_INFO", "READY"]))).returning({ id: t.requests.id });
  return res.length ? { ok: true as const } : { ok: false as const, error: "Заявка уже закрыта или не найдена" };
}

/** Оценки студентов за 30 дней: средняя, количество, последние комментарии. Для всего офиса и лично для сотрудника. */
export async function staffFeedbackStats(v: StaffViewer) {
  const since = new Date(+now() - 30 * 86400000);
  const [all] = await db.select({
    avg: sql<number | null>`round(avg(${t.requestFeedback.rating})::numeric, 1)`.mapWith((x) => (x === null ? null : Number(x))),
    n: count(),
    mineAvg: sql<number | null>`round(avg(${t.requestFeedback.rating}) filter (where ${t.requests.assigneeStaffId} = ${v.staffId}), 1)`.mapWith((x) => (x === null ? null : Number(x))),
    mineN: sql<number>`count(*) filter (where ${t.requests.assigneeStaffId} = ${v.staffId})`.mapWith(Number),
  }).from(t.requestFeedback).innerJoin(t.requests, eq(t.requests.id, t.requestFeedback.requestId)).where(gte(t.requestFeedback.createdAt, since));
  const recent = await db.select({ rating: t.requestFeedback.rating, comment: t.requestFeedback.comment, createdAt: t.requestFeedback.createdAt, title: t.requestTypes.title })
    .from(t.requestFeedback).innerJoin(t.requests, eq(t.requests.id, t.requestFeedback.requestId)).innerJoin(t.requestTypes, eq(t.requestTypes.id, t.requests.typeId))
    .where(and(gte(t.requestFeedback.createdAt, since), sql`${t.requestFeedback.comment} is not null`)).orderBy(desc(t.requestFeedback.createdAt)).limit(3);
  return { ...all, recent };
}

export const statusChangeSchema = z.object({
  id: z.uuid(),
  status: z.enum(["IN_PROGRESS", "NEEDS_INFO", "READY", "ISSUED", "REJECTED"]),
  comment: z.string().trim().max(800).optional(),
});

const STATUS_TITLE: Record<Status, string> = { SUBMITTED: "подана", IN_PROGRESS: "в работе", NEEDS_INFO: "нужно дополнить", READY: "готова", ISSUED: "выдана", REJECTED: "отклонена" };

/** Смена статуса: история + уведомление студенту + электронная справка с QR при «готова». Всё в одной транзакции. */
export async function staffChangeStatus(v: StaffViewer, input: z.infer<typeof statusChangeSchema>) {
  const r = await staffGetRequest(v, input.id);
  if (!r) return { ok: false as const, error: "Заявка не найдена" };
  if (!STATUS_FLOW[r.status].includes(input.status)) return { ok: false as const, error: `Из статуса «${STATUS_TITLE[r.status]}» нельзя перейти в «${STATUS_TITLE[input.status]}»` };
  if ((input.status === "REJECTED" || input.status === "NEEDS_INFO") && !input.comment) return { ok: false as const, error: "Укажите причину — студент увидит её в заявке" };
  const actor = `${v.lastName} ${v.firstName[0]}. ${v.middleName ? v.middleName[0] + "." : ""}, студенческий офис`;
  await db.transaction(async (tx) => {
    await tx.update(t.requests).set({ status: input.status, staffComment: input.comment || null, assigneeStaffId: v.staffId, updatedAt: new Date() }).where(eq(t.requests.id, r.id));
    await tx.insert(t.requestEvents).values({ requestId: r.id, status: input.status, comment: input.comment || null, actor });
    if (input.status === "READY" && r.type.producesDocument && !r.document) {
      const g = r.student.group;
      const doc = buildDocument(r.type.code, {
        lastName: r.student.lastName, firstName: r.student.firstName, middleName: r.student.middleName, gender: r.student.gender, course: g.course,
        facultyName: g.faculty.name, programCode: g.program.code, programName: g.program.name, basis: r.student.basis, enrollmentYear: r.student.enrollmentYear, recordBook: r.student.recordBook,
      }, r.payload);
      if (doc) await tx.insert(t.documents).values({ requestId: r.id, studentId: r.studentId, verifyCode: newVerifyCode(), title: doc.title, body: doc.body, validUntil: new Date(Date.now() + 90 * 86400000) });
    }
    const body = input.comment || (input.status === "READY" ? (r.type.producesDocument ? "Документ готов — откройте заявку: там электронная справка с QR-кодом." : "Заявление рассмотрено.") : input.status === "IN_PROGRESS" ? "Заявку взяли в работу." : "Статус обновлён.");
    await tx.insert(t.notifications).values({ userId: r.student.userId, kind: "REQUEST", title: `${r.type.title}: ${STATUS_TITLE[input.status]}`, body, link: `/requests/${r.id}`, important: input.status === "READY" || input.status === "NEEDS_INFO" || input.status === "REJECTED" });
    return body;
  }).then((body) => { void pushToUsers([r.student.userId], "requests", { title: `${r.type.title}: ${STATUS_TITLE[input.status]}`, body, url: `/requests/${r.id}`, tag: `request-${r.id}` }); });
  return { ok: true as const };
}

// ───────── Объявления
export async function staffAudienceOptions() {
  const faculties = await db.select().from(t.faculties).orderBy(asc(t.faculties.code));
  const groups = await db.select({ id: t.groups.id, name: t.groups.name, course: t.groups.course, faculty: t.faculties.code, facultyId: t.groups.facultyId })
    .from(t.groups).innerJoin(t.faculties, eq(t.faculties.id, t.groups.facultyId)).orderBy(asc(t.faculties.code), asc(t.groups.name));
  return { faculties, groups };
}

export const announcementSchema = z.object({
  title: z.string().trim().min(5, "Заголовок — от 5 символов").max(140),
  body: z.string().trim().min(10, "Текст — от 10 символов").max(2000),
  audience: z.enum(["ALL", "FACULTY", "COURSE", "GROUP"]),
  facultyId: z.uuid().optional(),
  course: z.coerce.number().int().min(1).max(6).optional(),
  groupId: z.uuid().optional(),
  important: z.boolean(),
}).superRefine((d, ctx) => {
  if (d.audience !== "ALL" && d.audience !== "GROUP" && !d.facultyId) ctx.addIssue({ code: "custom", path: ["facultyId"], message: "Выберите факультет" });
  if (d.audience === "COURSE" && !d.course) ctx.addIssue({ code: "custom", path: ["course"], message: "Выберите курс" });
  if (d.audience === "GROUP" && !d.groupId) ctx.addIssue({ code: "custom", path: ["groupId"], message: "Выберите группу" });
});

/** Публикация + веерная рассылка уведомлений адресатам одним INSERT … SELECT (масштабируется на тысячи студентов). */
export async function staffPublishAnnouncement(v: StaffViewer, d: z.infer<typeof announcementSchema>) {
  const r = await db.transaction(async (tx) => {
    let facultyId = d.facultyId ?? null;
    if (d.audience === "GROUP" && d.groupId) {
      const [g] = await tx.select().from(t.groups).where(eq(t.groups.id, d.groupId));
      if (!g) return { ok: false as const, error: "Группа не найдена" };
      facultyId = g.facultyId;
    }
    const [a] = await tx.insert(t.announcements).values({
      title: d.title, body: d.body, important: d.important, audience: d.audience, source: "Студенческий офис", authorStaffId: v.staffId,
      facultyId: d.audience === "ALL" ? null : facultyId, course: d.audience === "COURSE" ? d.course! : null, groupId: d.audience === "GROUP" ? d.groupId! : null,
    }).returning();
    const where = d.audience === "ALL" ? sql`true`
      : d.audience === "FACULTY" ? sql`g.faculty_id = ${a.facultyId}`
      : d.audience === "COURSE" ? sql`g.faculty_id = ${a.facultyId} and g.course = ${a.course}`
      : sql`g.id = ${a.groupId}`;
    const res = await tx.execute(sql`insert into notifications (user_id, kind, title, body, link, important)
      select s.user_id, 'ANNOUNCEMENT', ${a.title}, ${a.body}, ${"/notifications?a=" + a.id}, ${a.important}
      from students s join groups g on g.id = s.group_id where ${where} returning user_id`);
    const userIds = (res.rows as { user_id: string }[]).map((x) => x.user_id);
    return { ok: true as const, recipients: userIds.length, userIds, msg: { title: a.important ? `Важно: ${a.title}` : a.title, body: a.body.slice(0, 180), url: `/notifications?a=${a.id}` } };
  });
  if (!r.ok) return r;
  void pushToUsers(r.userIds, "announcements", r.msg); // на телефоны — после фиксации транзакции, не задерживая ответ
  return { ok: true as const, recipients: r.recipients };
}

export async function staffListAnnouncements() {
  return db.select().from(t.announcements).orderBy(desc(t.announcements.publishedAt)).limit(30);
}

// ───────── Расписание: переносы
export async function staffListLessons(groupId: string, from: Date, to: Date) {
  if (!z.uuid().safeParse(groupId).success) return [];
  return db.select({ id: t.lessons.id, title: t.lessons.title, type: t.lessons.type, startsAt: t.lessons.startsAt, endsAt: t.lessons.endsAt, room: t.lessons.room, status: t.lessons.status, subgroup: t.lessons.subgroup, prevStartsAt: t.lessons.prevStartsAt, prevRoom: t.lessons.prevRoom, building: t.buildings.code })
    .from(t.lessons).innerJoin(t.buildings, eq(t.buildings.id, t.lessons.buildingId))
    .where(and(eq(t.lessons.groupId, groupId), gte(t.lessons.startsAt, from), lt(t.lessons.startsAt, to))).orderBy(asc(t.lessons.startsAt));
}

export const moveSchema = z.object({
  lessonId: z.uuid(),
  action: z.enum(["move", "cancel"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  room: z.string().trim().max(30).optional(),
  note: z.string().trim().min(3, "Укажите причину — её увидят студенты").max(300),
});

/** Перенос/отмена пары + уведомление всем затронутым студентам (группа, подгруппа, ВУЦ). */
export async function staffChangeLesson(_v: StaffViewer, d: z.infer<typeof moveSchema>, mskToDate: (date: string, time: string) => Date) {
  const r = await db.transaction(async (tx) => {
    const [l] = await tx.select().from(t.lessons).where(eq(t.lessons.id, d.lessonId)).limit(1);
    if (!l) return { ok: false as const, error: "Занятие не найдено" };
    const prevStartsAt = l.prevStartsAt ?? l.startsAt;
    const prevRoom = l.prevRoom ?? l.room;
    let title: string; let body: string;
    const was = `${fmt.shortDay(l.startsAt)}, ${fmt.time(l.startsAt)}, ауд. ${l.room}`;
    if (d.action === "cancel") {
      await tx.update(t.lessons).set({ status: "CANCELLED", changeNote: d.note, changedAt: new Date(), prevStartsAt, prevRoom }).where(eq(t.lessons.id, l.id));
      title = `Отмена: ${l.title}`; body = `${was} — занятие отменено. ${d.note}`;
    } else {
      const startsAt = d.date && d.time ? mskToDate(d.date, d.time) : l.startsAt;
      const endsAt = new Date(+startsAt + (+l.endsAt - +l.startsAt));
      const room = d.room || l.room;
      if (+startsAt === +l.startsAt && room === l.room) return { ok: false as const, error: "Измените дату, время или аудиторию" };
      await tx.update(t.lessons).set({ status: "MOVED", startsAt, endsAt, room, changeNote: d.note, changedAt: new Date(), prevStartsAt, prevRoom }).where(eq(t.lessons.id, l.id));
      title = +startsAt === +l.startsAt ? `Новая аудитория: ${l.title}` : `Перенос: ${l.title}`;
      body = `Было: ${was}. Стало: ${fmt.shortDay(startsAt)}, ${fmt.time(startsAt)}, ауд. ${room}. ${d.note}`;
    }
    const sub = l.subgroup === null ? sql`true` : l.subgroup === 9 ? sql`s.military_training` : sql`s.subgroup = ${l.subgroup}`;
    const key = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Moscow" }).format(l.startsAt);
    const res = await tx.execute(sql`insert into notifications (user_id, kind, title, body, link, important)
      select s.user_id, 'SCHEDULE', ${title}, ${body}, ${"/schedule?d=" + key}, true from students s where s.group_id = ${l.groupId} and ${sub} returning user_id`);
    const userIds = (res.rows as { user_id: string }[]).map((x) => x.user_id);
    return { ok: true as const, recipients: userIds.length, userIds, msg: { title, body, url: `/schedule?d=${key}`, tag: `lesson-${l.id}` } };
  });
  if (!r.ok) return r;
  void pushToUsers(r.userIds, "schedule", r.msg);
  return { ok: true as const, recipients: r.recipients };
}

// ───────── Приём методиста
export async function staffAppointments(v: StaffViewer, from: Date) {
  return db.select({ id: t.appointments.id, topic: t.appointments.topic, comment: t.appointments.comment, status: t.appointments.status, startsAt: t.slots.startsAt, lastName: t.students.lastName, firstName: t.students.firstName, group: t.groups.name, faculty: t.faculties.code })
    .from(t.appointments).innerJoin(t.slots, eq(t.slots.id, t.appointments.slotId)).innerJoin(t.students, eq(t.students.id, t.appointments.studentId))
    .innerJoin(t.groups, eq(t.groups.id, t.students.groupId)).innerJoin(t.faculties, eq(t.faculties.id, t.groups.facultyId))
    .where(and(eq(t.slots.staffId, v.staffId), gte(t.slots.startsAt, from), eq(t.appointments.status, "BOOKED"))).orderBy(asc(t.slots.startsAt));
}

export async function staffCounts() {
  const [r] = await db.select({ n: count() }).from(t.requests).where(eq(t.requests.status, "SUBMITTED"));
  const [u] = await db.select({ n: count() }).from(t.slots).where(and(eq(t.slots.isBooked, true), gte(t.slots.startsAt, now())));
  return { newRequests: r?.n ?? 0, upcomingAppointments: u?.n ?? 0 };
}

