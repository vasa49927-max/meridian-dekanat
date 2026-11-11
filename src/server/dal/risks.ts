import "server-only";
import { and, desc, eq, gte, inArray } from "drizzle-orm";
import { db, schema as t } from "@/server/db";
import type { StaffViewer, StudentViewer } from "@/server/auth/guards";
import { summarize, type Control, type DisciplineSummary } from "@/lib/brs";
import { addDays, now } from "@/lib/time";
import { pushToUsers } from "@/server/push";

/**
 * Раннее предупреждение (раунд 6, улучшение №2): деканат видит студентов, у которых по БРС есть риск
 * не закрыть дисциплину, и может пригласить их на консультацию. Расчёт — та же функция summarize(),
 * что показывает риск самому студенту, поэтому студент и деканат видят одно и то же.
 */
export type RiskRow = {
  studentId: string; name: string; group: string; course: number; faculty: string;
  offeringId: string; discipline: string; control: Control; summary: DisciplineSummary;
  invitedAt: Date | null;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- viewer нужен как «пропуск»: вызвать без роли STAFF нельзя по типам
export async function staffRiskList(_v: StaffViewer): Promise<RiskRow[]> {
  const students = await db.select({ id: t.students.id, last: t.students.lastName, first: t.students.firstName, middle: t.students.middleName, groupId: t.students.groupId, subgroup: t.students.subgroup, military: t.students.militaryTraining, group: t.groups.name, course: t.groups.course, faculty: t.faculties.code })
    .from(t.students).innerJoin(t.groups, eq(t.groups.id, t.students.groupId)).innerJoin(t.faculties, eq(t.faculties.id, t.groups.facultyId));
  if (!students.length) return [];
  const groupIds = [...new Set(students.map((s) => s.groupId))];
  const offerings = await db.select({ id: t.courseOfferings.id, groupId: t.courseOfferings.groupId, name: t.disciplines.name, control: t.disciplines.control })
    .from(t.courseOfferings).innerJoin(t.disciplines, eq(t.disciplines.id, t.courseOfferings.disciplineId)).where(inArray(t.courseOfferings.groupId, groupIds));
  if (!offerings.length) return [];
  const offIds = offerings.map((o) => o.id);
  const asm = await db.select({ id: t.assessments.id, offeringId: t.assessments.offeringId, title: t.assessments.title, kind: t.assessments.kind, maxPoints: t.assessments.maxPoints }).from(t.assessments).where(inArray(t.assessments.offeringId, offIds));
  const sc = await db.select({ studentId: t.scores.studentId, assessmentId: t.scores.assessmentId, points: t.scores.points }).from(t.scores).where(inArray(t.scores.studentId, students.map((s) => s.id)));
  const score = new Map(sc.map((s) => [`${s.studentId}:${s.assessmentId}`, s.points]));
  // Какие дисциплины видит студент (языковые подгруппы, ВУЦ) — по занятиям, как в его кабинете
  const ls = await db.selectDistinct({ offeringId: t.lessons.offeringId, groupId: t.lessons.groupId, subgroup: t.lessons.subgroup }).from(t.lessons).where(inArray(t.lessons.groupId, groupIds));
  const inv = await db.select({ studentId: t.riskInvites.studentId, offeringId: t.riskInvites.offeringId, createdAt: t.riskInvites.createdAt }).from(t.riskInvites).orderBy(desc(t.riskInvites.createdAt));
  const invited = new Map<string, Date>();
  for (const i of inv) if (!invited.has(`${i.studentId}:${i.offeringId}`)) invited.set(`${i.studentId}:${i.offeringId}`, i.createdAt);

  const rows: RiskRow[] = [];
  for (const s of students) {
    const visible = new Set(ls.filter((l) => l.groupId === s.groupId && (l.subgroup === null || l.subgroup === s.subgroup || (s.military && l.subgroup === 9))).map((l) => l.offeringId));
    for (const o of offerings) {
      if (o.groupId !== s.groupId || !visible.has(o.id)) continue;
      const items = asm.filter((a) => a.offeringId === o.id).map((a) => ({ ...a, points: score.get(`${s.id}:${a.id}`) ?? null }));
      const summary = summarize(o.control as Control, items);
      if (summary.risk === "none") continue;
      rows.push({ studentId: s.id, name: `${s.last} ${s.first}${s.middle ? ` ${s.middle}` : ""}`, group: s.group, course: s.course, faculty: s.faculty, offeringId: o.id, discipline: o.name, control: o.control as Control, summary, invitedAt: invited.get(`${s.id}:${o.id}`) ?? null });
    }
  }
  // Сначала высокий риск, внутри — у кого меньше темп
  return rows.sort((a, b) => (a.summary.risk === b.summary.risk ? a.summary.pacePct - b.summary.pacePct : a.summary.risk === "high" ? -1 : 1));
}

/** Приглашение на консультацию: уведомление в кабинете + push/MAX. Повторно по той же дисциплине — не чаще раза в 7 дней. */
export async function staffInviteAtRisk(v: StaffViewer, studentId: string, offeringId: string) {
  const [row] = await db.select({ userId: t.students.userId, discipline: t.disciplines.name })
    .from(t.students)
    .innerJoin(t.courseOfferings, and(eq(t.courseOfferings.id, offeringId), eq(t.courseOfferings.groupId, t.students.groupId)))
    .innerJoin(t.disciplines, eq(t.disciplines.id, t.courseOfferings.disciplineId))
    .where(eq(t.students.id, studentId)).limit(1);
  if (!row) return { ok: false as const, error: "Студент или дисциплина не найдены" };
  const at = now();
  const [recent] = await db.select({ id: t.riskInvites.id }).from(t.riskInvites)
    .where(and(eq(t.riskInvites.studentId, studentId), eq(t.riskInvites.offeringId, offeringId), gte(t.riskInvites.createdAt, addDays(at, -7)))).limit(1);
  if (recent) return { ok: false as const, error: "Приглашение по этой дисциплине уже отправлено на этой неделе" };
  const title = `Приглашение на консультацию: ${row.discipline}`;
  const body = "В деканате видят, что по этой дисциплине есть риск не набрать нужные баллы. Запишитесь на консультацию в студенческий офис — вместе составим план.";
  await db.transaction(async (tx) => {
    await tx.insert(t.riskInvites).values({ studentId, offeringId, staffId: v.staffId });
    await tx.insert(t.notifications).values({ userId: row.userId, kind: "GRADE", title, body, link: "/appointments", important: true });
  });
  void pushToUsers([row.userId], "announcements", { title, body, url: "/appointments", tag: `risk-${offeringId}` });
  return { ok: true as const };
}

/** Студенту: по каким дисциплинам деканат пригласил на консультацию (последние 30 дней). */
export async function listMyRiskInvites(v: StudentViewer) {
  const rows = await db.select({ offeringId: t.riskInvites.offeringId, createdAt: t.riskInvites.createdAt })
    .from(t.riskInvites).where(and(eq(t.riskInvites.studentId, v.studentId), gte(t.riskInvites.createdAt, addDays(now(), -30))));
  return new Map(rows.map((r) => [r.offeringId, r.createdAt]));
}
