/**
 * Изоляция на уровне Data Access Layer (интеграционный тест с реальной БД после сида).
 * Даже если бы страница забыла проверку, DAL не отдаст и не изменит чужие данные.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { and, eq, isNull } from "drizzle-orm";
import { db, schema as t } from "@/server/db";
import { seedDemo } from "@/server/seed/seed";
import type { StudentViewer } from "@/server/auth/guards";
import { getMyRequest, replyToMyRequest, withdrawMyRequest } from "@/server/dal/requests";
import { markMyNotificationRead, listMyLessons } from "@/server/dal/student";
import { cancelMyAppointment } from "@/server/dal/appointments";

async function viewer(login: string): Promise<StudentViewer> {
  const [r] = await db.select({ userId: t.users.id, s: t.students, g: t.groups }).from(t.users)
    .innerJoin(t.students, eq(t.students.userId, t.users.id)).innerJoin(t.groups, eq(t.groups.id, t.students.groupId)).where(eq(t.users.login, login));
  return { role: "STUDENT", userId: r.userId, studentId: r.s.id, groupId: r.s.groupId, subgroup: r.s.subgroup, militaryTraining: r.s.militaryTraining, facultyId: r.g.facultyId, course: r.g.course, avatarHue: r.s.avatarHue, firstName: r.s.firstName, lastName: r.s.lastName, middleName: r.s.middleName };
}

let anna: StudentViewer, timur: StudentViewer;
beforeAll(async () => {
  await seedDemo(db, { now: new Date("2026-11-13T07:15:00Z") });
  anna = await viewer("sokolova");
  timur = await viewer("galiev");
}, 60_000);
afterAll(async () => { await seedDemo(db, { now: new Date("2026-11-13T07:15:00Z") }); });

describe("DAL: студент не видит и не меняет чужое", () => {
  it("getMyRequest по чужому id → null", async () => {
    const [annaReq] = await db.select().from(t.requests).where(eq(t.requests.studentId, anna.studentId)).limit(1);
    expect(await getMyRequest(anna, annaReq.id)).not.toBeNull();
    expect(await getMyRequest(timur, annaReq.id)).toBeNull();
  });

  it("ответить на чужую заявку или отозвать её нельзя", async () => {
    const [annaReq] = await db.select().from(t.requests).where(eq(t.requests.studentId, anna.studentId)).limit(1);
    expect(await replyToMyRequest(timur, annaReq.id, "взлом")).toMatchObject({ ok: false, notFound: true });
    expect(await withdrawMyRequest(timur, annaReq.id)).toMatchObject({ ok: false, notFound: true });
  });

  it("отметить прочитанным чужое уведомление — без эффекта", async () => {
    const [n] = await db.select().from(t.notifications).where(and(eq(t.notifications.userId, anna.userId), isNull(t.notifications.readAt))).limit(1);
    await markMyNotificationRead(timur, n.id);
    const [after] = await db.select().from(t.notifications).where(eq(t.notifications.id, n.id));
    expect(after.readAt).toBeNull();
  });

  it("отменить чужую запись к методисту нельзя", async () => {
    const [ap] = await db.select().from(t.appointments).where(eq(t.appointments.studentId, timur.studentId)).limit(1);
    expect(await cancelMyAppointment(anna, ap.id)).toMatchObject({ ok: false, notFound: true });
    const [after] = await db.select().from(t.appointments).where(eq(t.appointments.id, ap.id));
    expect(after.status).toBe("BOOKED");
  });

  it("занятия ВУЦ видят только студенты ВУЦ; чужая языковая подгруппа скрыта", async () => {
    const from = new Date("2026-11-09T00:00:00Z"), to = new Date("2026-11-16T00:00:00Z");
    const timurL = await listMyLessons(timur, from, to);
    expect(timurL.some((l) => l.type === "MILITARY")).toBe(true);
    const annaL = await listMyLessons(anna, from, to);
    expect(annaL.some((l) => l.title.startsWith("Испанский"))).toBe(true);
    expect(annaL.some((l) => l.title.startsWith("Немецкий"))).toBe(false);
    expect(annaL.every((l) => l.title !== "Международное частное право")).toBe(true);
  });

  it("пароли в БД — только argon2id-хэши", async () => {
    const users = await db.select({ h: t.users.passwordHash }).from(t.users);
    expect(users.every((u) => u.h.startsWith("$argon2id$v=19$m=19456,t=2,p=1$"))).toBe(true);
    expect(users.some((u) => u.h.includes("Demo-2026"))).toBe(false);
  });

  it("в БД хранится только хэш токена сессии", async () => {
    const cols = Object.keys(t.sessions);
    expect(cols).toContain("tokenHash");
    expect(cols).not.toContain("token");
  });
});

import { changePassword } from "@/server/auth/change-password";
import { hashPassword, verifyPassword } from "@/server/auth/password";
describe("Смена пароля (обычный, не демо-аккаунт)", () => {
  it("проверяет текущий, пишет новый хэш и завершает другие сессии", async () => {
    const [u] = await db.insert(t.users).values({ login: "pwtest", passwordHash: await hashPassword("Old-pass-123"), role: "STUDENT" }).returning();
    const [s1] = await db.insert(t.sessions).values({ tokenHash: "h1-" + Date.now(), userId: u.id, expiresAt: new Date(Date.now() + 1e7) }).returning();
    await db.insert(t.sessions).values({ tokenHash: "h2-" + Date.now(), userId: u.id, expiresAt: new Date(Date.now() + 1e7) });
    expect(await changePassword(u.id, s1.id, "wrong", "New-pass-456")).toMatchObject({ ok: false, field: "current" });
    expect(await changePassword(u.id, s1.id, "Old-pass-123", "short1")).toMatchObject({ ok: false, field: "next" });
    expect(await changePassword(u.id, s1.id, "Old-pass-123", "New-pass-456")).toMatchObject({ ok: true });
    const [after] = await db.select().from(t.users).where(eq(t.users.id, u.id));
    expect(await verifyPassword(after.passwordHash, "New-pass-456")).toBe(true);
    const left = await db.select().from(t.sessions).where(eq(t.sessions.userId, u.id));
    expect(left.map((x) => x.id)).toEqual([s1.id]);
  });
});
