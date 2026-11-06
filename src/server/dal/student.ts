import "server-only";
import { and, asc, count, desc, eq, gt, gte, inArray, isNull, lt, lte, or, sql } from "drizzle-orm";
import { db, schema as t } from "@/server/db";
import type { StudentViewer } from "@/server/auth/guards";
import { summarize, type Control } from "@/lib/brs";
import { now } from "@/lib/time";

/**
 * Data Access Layer студента. КАЖДАЯ функция получает viewer из сессии и фильтрует по нему.
 * id из URL используются только вместе с условием владения (… AND student_id = viewer.studentId).
 */

// ───────── Профиль
export async function getMyProfile(v: StudentViewer) {
  const [r] = await db.select({
    student: t.students, group: t.groups, faculty: t.faculties, program: t.programs, login: t.users.login,
  }).from(t.students)
    .innerJoin(t.groups, eq(t.groups.id, t.students.groupId))
    .innerJoin(t.faculties, eq(t.faculties.id, t.groups.facultyId))
    .innerJoin(t.programs, eq(t.programs.id, t.groups.programId))
    .innerJoin(t.users, eq(t.users.id, t.students.userId))
    .where(eq(t.students.id, v.studentId)).limit(1);
  return r;
}

// ───────── Расписание
/** Видимость занятий: своя группа, общая или своя языковая подгруппа, ВУЦ (подгруппа 9) — только студентам ВУЦ. */
const visibleLessons = (v: StudentViewer) => and(
  eq(t.lessons.groupId, v.groupId),
  or(isNull(t.lessons.subgroup), eq(t.lessons.subgroup, v.subgroup), v.militaryTraining ? eq(t.lessons.subgroup, 9) : sql`false`),
);

const lessonSelect = {
  id: t.lessons.id, title: t.lessons.title, type: t.lessons.type, startsAt: t.lessons.startsAt, endsAt: t.lessons.endsAt,
  room: t.lessons.room, status: t.lessons.status, prevStartsAt: t.lessons.prevStartsAt, prevRoom: t.lessons.prevRoom,
  changeNote: t.lessons.changeNote, subgroup: t.lessons.subgroup,
  teacherLast: t.teachers.lastName, teacherFirst: t.teachers.firstName, teacherMiddle: t.teachers.middleName, teacherTitle: t.teachers.title,
  buildingCode: t.buildings.code, buildingName: t.buildings.name, buildingAddress: t.buildings.address, buildingHint: t.buildings.hint, campus: t.buildings.campus,
};
export type LessonView = Awaited<ReturnType<typeof listMyLessons>>[number];

export async function listMyLessons(v: StudentViewer, from: Date, to: Date) {
  return db.select(lessonSelect).from(t.lessons)
    .leftJoin(t.teachers, eq(t.teachers.id, t.lessons.teacherId))
    .innerJoin(t.buildings, eq(t.buildings.id, t.lessons.buildingId))
    .where(and(visibleLessons(v), gte(t.lessons.startsAt, from), lt(t.lessons.startsAt, to)))
    .orderBy(asc(t.lessons.startsAt));
}

/** Ближайшее неотменённое занятие, которое ещё не закончилось. */
export async function getNextLesson(v: StudentViewer, at: Date) {
  const [r] = await db.select(lessonSelect).from(t.lessons)
    .leftJoin(t.teachers, eq(t.teachers.id, t.lessons.teacherId))
    .innerJoin(t.buildings, eq(t.buildings.id, t.lessons.buildingId))
    .where(and(visibleLessons(v), gt(t.lessons.endsAt, at), sql`${t.lessons.status} <> 'CANCELLED'`))
    .orderBy(asc(t.lessons.startsAt)).limit(1);
  return r ?? null;
}

/** Изменения в расписании на ближайшие дни (для баннера «было → стало»). */
export async function listMyUpcomingChanges(v: StudentViewer, at: Date, days = 7) {
  return db.select(lessonSelect).from(t.lessons)
    .leftJoin(t.teachers, eq(t.teachers.id, t.lessons.teacherId))
    .innerJoin(t.buildings, eq(t.buildings.id, t.lessons.buildingId))
    .where(and(visibleLessons(v), sql`${t.lessons.status} <> 'SCHEDULED'`, lte(t.lessons.changedAt, at),
      gt(sql`coalesce(${t.lessons.prevStartsAt}, ${t.lessons.startsAt})`, at), lt(t.lessons.startsAt, new Date(+at + days * 86400000))))
    .orderBy(asc(t.lessons.startsAt));
}

// ───────── Успеваемость
export async function getMyGrades(v: StudentViewer) {
  const offerings = await db.select({ id: t.courseOfferings.id, name: t.disciplines.name, short: t.disciplines.shortName, credits: t.disciplines.credits, control: t.disciplines.control, teacherLast: t.teachers.lastName, teacherFirst: t.teachers.firstName, teacherMiddle: t.teachers.middleName, teacherTitle: t.teachers.title })
    .from(t.courseOfferings)
    .innerJoin(t.disciplines, eq(t.disciplines.id, t.courseOfferings.disciplineId))
    .innerJoin(t.teachers, eq(t.teachers.id, t.courseOfferings.teacherId))
    .where(eq(t.courseOfferings.groupId, v.groupId));
  if (!offerings.length) return { current: [], past: [] };
  const asm = await db.select().from(t.assessments).where(inArray(t.assessments.offeringId, offerings.map((o) => o.id))).orderBy(asc(t.assessments.sortOrder));
  const myScores = await db.select({ assessmentId: t.scores.assessmentId, points: t.scores.points, gradedAt: t.scores.gradedAt })
    .from(t.scores).where(eq(t.scores.studentId, v.studentId));
  const sm = new Map(myScores.map((s) => [s.assessmentId, s]));
  // Дисциплины чужой языковой подгруппы не показываем: у них нет занятий для этой подгруппы.
  const mine = await db.selectDistinct({ offeringId: t.lessons.offeringId }).from(t.lessons).where(visibleLessons(v));
  const mineSet = new Set(mine.map((m) => m.offeringId));
  const current = offerings.filter((o) => mineSet.has(o.id)).map((o) => {
    const items = asm.filter((a) => a.offeringId === o.id).map((a) => ({ id: a.id, title: a.title, kind: a.kind, maxPoints: a.maxPoints, dueAt: a.dueAt, points: sm.get(a.id)?.points ?? null, gradedAt: sm.get(a.id)?.gradedAt ?? null }));
    return { ...o, items, summary: summarize(o.control as Control, items) };
  });
  const past = await db.select().from(t.finalGrades).where(eq(t.finalGrades.studentId, v.studentId)).orderBy(asc(t.finalGrades.semester));
  return { current, past };
}

// ───────── Сроки
export async function listMyDeadlines(v: StudentViewer, at: Date, limit = 6) {
  const general = await db.select().from(t.deadlines).where(and(
    gt(t.deadlines.dueAt, at),
    or(
      and(isNull(t.deadlines.facultyId), isNull(t.deadlines.groupId), isNull(t.deadlines.course)),
      and(eq(t.deadlines.facultyId, v.facultyId), isNull(t.deadlines.course)),
      and(eq(t.deadlines.facultyId, v.facultyId), eq(t.deadlines.course, v.course)),
      eq(t.deadlines.groupId, v.groupId),
    ),
  )).orderBy(asc(t.deadlines.dueAt)).limit(limit);
  const grades = await getMyGrades(v);
  const control = grades.current.flatMap((d) => d.items.filter((a) => a.kind === "CONTROL" && a.dueAt && a.dueAt > at && a.points === null)
    .map((a) => ({ id: a.id, title: `${a.title} — ${d.short}`, description: `${d.name} · до ${a.maxPoints} б.`, dueAt: a.dueAt!, link: "/grades" as string | null })));
  return [...general.map((g) => ({ id: g.id, title: g.title, description: g.description, dueAt: g.dueAt, link: g.link })), ...control]
    .sort((a, b) => +a.dueAt - +b.dueAt).slice(0, limit);
}

// ───────── Уведомления (createdAt ≤ сейчас: часть напоминаний «созревает» по времени)
export type NotifFilter = "all" | "unread" | "important" | "SCHEDULE" | "REQUEST" | "ANNOUNCEMENT" | "DEADLINE";

export async function countMyUnread(v: StudentViewer | { userId: string }) {
  const [r] = await db.select({ n: count() }).from(t.notifications)
    .where(and(eq(t.notifications.userId, v.userId), isNull(t.notifications.readAt), lte(t.notifications.createdAt, now())));
  return r?.n ?? 0;
}

export async function listMyNotifications(v: { userId: string }, filter: NotifFilter, cursor: { createdAt: Date; id: string } | null, limit = 20) {
  const conds = [eq(t.notifications.userId, v.userId), lte(t.notifications.createdAt, now())];
  if (filter === "unread") conds.push(isNull(t.notifications.readAt));
  else if (filter === "important") conds.push(eq(t.notifications.important, true));
  else if (filter !== "all") conds.push(eq(t.notifications.kind, filter));
  if (cursor) conds.push(or(lt(t.notifications.createdAt, cursor.createdAt), and(eq(t.notifications.createdAt, cursor.createdAt), lt(t.notifications.id, cursor.id)))!);
  const rows = await db.select().from(t.notifications).where(and(...conds))
    .orderBy(desc(t.notifications.createdAt), desc(t.notifications.id)).limit(limit + 1);
  return { items: rows.slice(0, limit), next: rows.length > limit ? rows[limit - 1] : null };
}

export async function markMyNotificationRead(v: { userId: string }, id: string) {
  await db.update(t.notifications).set({ readAt: new Date() })
    .where(and(eq(t.notifications.id, id), eq(t.notifications.userId, v.userId), isNull(t.notifications.readAt)));
}
export async function markAllMyNotificationsRead(v: { userId: string }) {
  await db.update(t.notifications).set({ readAt: new Date() })
    .where(and(eq(t.notifications.userId, v.userId), isNull(t.notifications.readAt), lte(t.notifications.createdAt, now())));
}

export async function getAnnouncementForMe(v: StudentViewer, id: string) {
  const [a] = await db.select().from(t.announcements).where(and(eq(t.announcements.id, id), or(
    eq(t.announcements.audience, "ALL"),
    and(eq(t.announcements.audience, "FACULTY"), eq(t.announcements.facultyId, v.facultyId)),
    and(eq(t.announcements.audience, "COURSE"), eq(t.announcements.facultyId, v.facultyId), eq(t.announcements.course, v.course)),
    and(eq(t.announcements.audience, "GROUP"), eq(t.announcements.groupId, v.groupId)),
  ))).limit(1);
  return a ?? null;
}
