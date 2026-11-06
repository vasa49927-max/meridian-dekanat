import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { db, schema } from "@/server/db";
import { env } from "@/server/env";
import { getSession } from "./session";

/**
 * Viewer — «кто смотрит». Единственный источник studentId/staffId для всего DAL.
 * Никакие id владельца из URL, формы или тела запроса не используются.
 */
export type StudentViewer = {
  role: "STUDENT"; userId: string; studentId: string; groupId: string; subgroup: number; militaryTraining: boolean;
  facultyId: string; course: number; avatarHue: number; firstName: string; lastName: string; middleName: string | null;
};
export type StaffViewer = { role: "STAFF"; userId: string; staffId: string; firstName: string; lastName: string; middleName: string | null; position: string };
export type Viewer = StudentViewer | StaffViewer;

export const getViewer = cache(async (): Promise<Viewer | null> => {
  const s = await getSession();
  if (!s) return null;
  if (s.role === "STUDENT") {
    const [r] = await db.select({
      studentId: schema.students.id, groupId: schema.students.groupId, subgroup: schema.students.subgroup, militaryTraining: schema.students.militaryTraining, avatarHue: schema.students.avatarHue,
      firstName: schema.students.firstName, lastName: schema.students.lastName, middleName: schema.students.middleName,
      facultyId: schema.groups.facultyId, course: schema.groups.course,
    }).from(schema.students).innerJoin(schema.groups, eq(schema.groups.id, schema.students.groupId))
      .where(eq(schema.students.userId, s.userId)).limit(1);
    return r ? { role: "STUDENT", userId: s.userId, ...r } : null;
  }
  const [r] = await db.select({ staffId: schema.staff.id, firstName: schema.staff.firstName, lastName: schema.staff.lastName, middleName: schema.staff.middleName, position: schema.staff.position })
    .from(schema.staff).where(eq(schema.staff.userId, s.userId)).limit(1);
  return r ? { role: "STAFF", userId: s.userId, ...r } : null;
});

/** Для страниц и Server Actions студента. Сотрудника отправляет в его кабинет. */
export async function requireStudent(): Promise<StudentViewer> {
  const v = await getViewer();
  if (!v) redirect("/login");
  if (v.role !== "STUDENT") redirect("/staff");
  return v;
}

export async function requireStaff(): Promise<StaffViewer> {
  const v = await getViewer();
  if (!v) redirect("/login");
  if (v.role !== "STAFF") redirect("/");
  return v;
}

/** Для route handlers: без редиректов, статусы 401/403. */
export async function apiViewer<R extends Viewer["role"]>(role: R) {
  const v = await getViewer();
  if (!v) return { error: Response.json({ error: "Требуется вход" }, { status: 401 }) } as const;
  if (v.role !== role) return { error: Response.json({ error: "Недостаточно прав" }, { status: 403 }) } as const;
  return { viewer: v as Extract<Viewer, { role: R }> } as const;
}

/**
 * Проверка Origin для изменяющих запросов в route handlers (Server Actions Next проверяет сам).
 * Защита от CSRF: запрос с чужого сайта отклоняется.
 */
export async function assertSameOrigin(): Promise<Response | null> {
  const h = await headers();
  const origin = h.get("origin");
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const allowed = new Set([new URL(env.APP_URL).host, host].filter(Boolean));
  if (!origin) return Response.json({ error: "Запрос отклонён" }, { status: 403 });
  try {
    if (!allowed.has(new URL(origin).host)) return Response.json({ error: "Запрос отклонён" }, { status: 403 });
  } catch {
    return Response.json({ error: "Запрос отклонён" }, { status: 403 });
  }
  return null;
}
