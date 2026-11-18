import "server-only";
import { and, asc, eq, inArray, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema as t } from "@/server/db";
import type { StaffViewer, StudentViewer } from "@/server/auth/guards";
import { now } from "@/lib/time";
import { pushToUsers } from "@/server/push";

/**
 * Курсы по выбору (раунд 8). Правила (вымышленное Положение, п. 4.8):
 * — запись открыта в окне opensAt…closesAt, не больше MAX_CHOICES курсов на студента (зачисление + лист ожидания);
 * — есть место → зачислен, мест нет → лист ожидания по времени записи;
 * — отказ от места до конца окна автоматически зачисляет первого из листа ожидания (с уведомлением).
 * Последнее место не может достаться двоим: строку курса блокируем (SELECT … FOR UPDATE) на время записи.
 */
export const MAX_CHOICES = 2;
export type ElectiveError = "closed" | "course" | "limit" | "exists" | "notFound" | "notChosen";

const counts = (ids: string[]) => db.select({
  electiveId: t.electiveChoices.electiveId,
  enrolled: sql<number>`count(*) filter (where ${t.electiveChoices.status} = 'ENROLLED')`.mapWith(Number),
  waiting: sql<number>`count(*) filter (where ${t.electiveChoices.status} = 'WAITLIST')`.mapWith(Number),
}).from(t.electiveChoices).where(inArray(t.electiveChoices.electiveId, ids)).groupBy(t.electiveChoices.electiveId);

export async function listMyElectives(v: StudentViewer) {
  const list = await db.select().from(t.electives).where(lte(t.electives.minCourse, v.course)).orderBy(asc(t.electives.title));
  if (!list.length) return { items: [], window: null, mine: 0 };
  const c = new Map((await counts(list.map((e) => e.id))).map((r) => [r.electiveId, r]));
  const my = await db.select().from(t.electiveChoices).where(and(eq(t.electiveChoices.studentId, v.studentId), inArray(t.electiveChoices.electiveId, list.map((e) => e.id))));
  const myMap = new Map(my.map((m) => [m.electiveId, m]));
  // Позиция в листе ожидания — в самой БД (row_number). Раньше сравнивали время записи, округлённое в JS до миллисекунд,
  // с точным временем в PostgreSQL (микросекунды): своя строка не попадала в счёт, и второй в очереди видел «1-й».
  const positions = new Map<string, number>();
  const waitIds = my.filter((x) => x.status === "WAITLIST").map((x) => x.electiveId);
  if (waitIds.length) {
    const rows = (await db.execute(sql`
      select elective_id, pos from (
        select elective_id, student_id, row_number() over (partition by elective_id order by created_at, id) as pos
        from elective_choices where status = 'WAITLIST' and elective_id in (${sql.join(waitIds.map((id) => sql`${id}`), sql`, `)})
      ) q where student_id = ${v.studentId}`)).rows as { elective_id: string; pos: string | number }[];
    for (const r of rows) positions.set(String(r.elective_id), Number(r.pos));
  }
  const at = now();
  const items = list.map((e) => {
    const k = c.get(e.id);
    const taken = Math.min(e.capacity, e.reserved + (k?.enrolled ?? 0));
    const mine = myMap.get(e.id);
    return { ...e, taken, free: Math.max(0, e.capacity - taken), waiting: k?.waiting ?? 0, myStatus: mine?.status ?? null, myPosition: positions.get(e.id) ?? null };
  });
  const w = list[0];
  return { items, window: { opensAt: w.opensAt, closesAt: w.closesAt, open: w.opensAt <= at && at <= w.closesAt }, mine: my.length };
}

export async function chooseElective(v: StudentViewer, electiveId: string): Promise<{ ok: true; status: "ENROLLED" | "WAITLIST" } | { ok: false; error: ElectiveError }> {
  if (!z.uuid().safeParse(electiveId).success) return { ok: false, error: "notFound" };
  return db.transaction(async (tx) => {
    const [e] = await tx.select().from(t.electives).where(eq(t.electives.id, electiveId)).for("update");
    if (!e) return { ok: false as const, error: "notFound" as const };
    const at = now();
    if (at < e.opensAt || at > e.closesAt) return { ok: false as const, error: "closed" as const };
    if (v.course < e.minCourse) return { ok: false as const, error: "course" as const };
    const mine = await tx.select({ electiveId: t.electiveChoices.electiveId }).from(t.electiveChoices).where(eq(t.electiveChoices.studentId, v.studentId));
    if (mine.some((m) => m.electiveId === e.id)) return { ok: false as const, error: "exists" as const };
    if (mine.length >= MAX_CHOICES) return { ok: false as const, error: "limit" as const };
    const [{ n }] = await tx.select({ n: sql<number>`count(*)`.mapWith(Number) }).from(t.electiveChoices).where(and(eq(t.electiveChoices.electiveId, e.id), eq(t.electiveChoices.status, "ENROLLED")));
    const status = e.reserved + n < e.capacity ? "ENROLLED" as const : "WAITLIST" as const;
    await tx.insert(t.electiveChoices).values({ studentId: v.studentId, electiveId: e.id, status });
    return { ok: true as const, status };
  });
}

/** Отказ от курса. Если освободилось место — первый из листа ожидания зачисляется и получает уведомление. */
export async function dropElective(v: StudentViewer, electiveId: string): Promise<{ ok: true } | { ok: false; error: ElectiveError }> {
  if (!z.uuid().safeParse(electiveId).success) return { ok: false, error: "notFound" };
  const promoted = await db.transaction(async (tx) => {
    const [e] = await tx.select().from(t.electives).where(eq(t.electives.id, electiveId)).for("update");
    if (!e) return { error: "notFound" as const };
    const at = now();
    if (at < e.opensAt || at > e.closesAt) return { error: "closed" as const };
    const [mine] = await tx.delete(t.electiveChoices).where(and(eq(t.electiveChoices.electiveId, e.id), eq(t.electiveChoices.studentId, v.studentId))).returning();
    if (!mine) return { error: "notChosen" as const };
    if (mine.status !== "ENROLLED") return { promoted: null };
    const [next] = await tx.select({ id: t.electiveChoices.id, userId: t.students.userId }).from(t.electiveChoices)
      .innerJoin(t.students, eq(t.students.id, t.electiveChoices.studentId))
      .where(and(eq(t.electiveChoices.electiveId, e.id), eq(t.electiveChoices.status, "WAITLIST"))).orderBy(asc(t.electiveChoices.createdAt)).limit(1);
    if (!next) return { promoted: null };
    await tx.update(t.electiveChoices).set({ status: "ENROLLED" }).where(eq(t.electiveChoices.id, next.id));
    const title = `Курс по выбору: место освободилось — ${e.title}`;
    const body = "Вы зачислены на курс из листа ожидания. Если передумали — откажитесь до конца записи, место перейдёт следующему.";
    await tx.insert(t.notifications).values({ userId: next.userId, kind: "ANNOUNCEMENT", title, body, link: "/grades/electives", important: true });
    return { promoted: { userId: next.userId, title, body } };
  });
  if ("error" in promoted && promoted.error) return { ok: false, error: promoted.error };
  if ("promoted" in promoted && promoted.promoted) void pushToUsers([promoted.promoted.userId], "announcements", { title: promoted.promoted.title, body: promoted.promoted.body, url: "/grades/electives", tag: `elective-${electiveId}` });
  return { ok: true };
}

/** Деканату: заполненность курсов и длина листов ожидания (агрегаты, без ФИО). */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- viewer — «пропуск»: без роли STAFF вызвать нельзя
export async function staffElectives(_v: StaffViewer) {
  const list = await db.select().from(t.electives).orderBy(asc(t.electives.title));
  const c = new Map((await counts(list.map((e) => e.id))).map((r) => [r.electiveId, r]));
  return list.map((e) => { const k = c.get(e.id); return { ...e, taken: Math.min(e.capacity, e.reserved + (k?.enrolled ?? 0)), waiting: k?.waiting ?? 0 }; });
}
