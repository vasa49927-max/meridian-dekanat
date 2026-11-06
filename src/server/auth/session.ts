import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { cache } from "react";
import { and, eq, gt } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { isProd } from "@/server/env";

/**
 * Сессии хранятся в БД (таблица sessions) — сервер без состояния, можно запускать N реплик.
 * В cookie — случайный токен 256 бит; в БД — только его SHA-256 (утечка БД не даёт войти).
 */
export const SESSION_COOKIE = isProd ? "__Host-mrd_session" : "mrd_session";
const IDLE_MS = 7 * 24 * 3600 * 1000; // 7 дней без активности → сессия истекает
const ABSOLUTE_MS = 30 * 24 * 3600 * 1000; // и не дольше 30 дней от входа
const TOUCH_MS = 60 * 60 * 1000; // продлеваем не чаще раза в час

export const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");

export async function createSession(userId: string, userAgent: string | null) {
  const token = randomBytes(32).toString("base64url");
  const nowMs = Date.now();
  await db.insert(schema.sessions).values({
    tokenHash: hashToken(token),
    userId,
    expiresAt: new Date(nowMs + IDLE_MS),
    userAgent: userAgent?.slice(0, 200) ?? null,
  });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: ABSOLUTE_MS / 1000,
  });
}

export type SessionUser = { sessionId: string; userId: string; role: "STUDENT" | "STAFF"; login: string };

/** Проверка сессии на каждом запросе. cache() — один запрос к БД на рендер. */
export const getSession = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || token.length > 100) return null;
  const nowDate = new Date();
  const rows = await db
    .select({ id: schema.sessions.id, userId: schema.sessions.userId, createdAt: schema.sessions.createdAt, lastSeenAt: schema.sessions.lastSeenAt, role: schema.users.role, login: schema.users.login })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
    .where(and(eq(schema.sessions.tokenHash, hashToken(token)), gt(schema.sessions.expiresAt, nowDate)))
    .limit(1);
  const s = rows[0];
  if (!s) return null;
  if (nowDate.getTime() - s.createdAt.getTime() > ABSOLUTE_MS) return null;
  if (nowDate.getTime() - s.lastSeenAt.getTime() > TOUCH_MS) {
    await db.update(schema.sessions)
      .set({ lastSeenAt: nowDate, expiresAt: new Date(nowDate.getTime() + IDLE_MS) })
      .where(eq(schema.sessions.id, s.id));
  }
  return { sessionId: s.id, userId: s.userId, role: s.role, login: s.login };
});

/** Выход: запись сессии удаляется из БД — токен становится бесполезным даже если его скопировали. */
export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.delete(schema.sessions).where(eq(schema.sessions.tokenHash, hashToken(token)));
  jar.delete(SESSION_COOKIE);
}
