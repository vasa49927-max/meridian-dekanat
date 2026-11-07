import "server-only";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/server/db";
import { hashPassword, verifyPassword } from "./password";
import { countRecent, record } from "./rate-limit";

/** Демо-аккаунты жюри: смена пароля отключена, чтобы вход продолжал работать у всех проверяющих. */
export const DEMO_LOGINS = new Set((process.env.DEMO_LOCKED_LOGINS ?? "sokolova,galiev,lin,belova").split(",").map((s) => s.trim()).filter(Boolean));

export const newPasswordSchema = z.string()
  .min(10, "Новый пароль — не короче 10 символов")
  .max(200)
  .refine((p) => /[A-Za-zА-Яа-яЁё]/.test(p) && /\d/.test(p), "Нужны и буквы, и цифры");

/**
 * Смена пароля: сверяем текущий (argon2id), пишем новый хэш, завершаем ВСЕ остальные сессии пользователя
 * (если пароль менялся из-за утечки — злоумышленник вылетит). Текущая сессия остаётся.
 */
export async function changePassword(userId: string, sessionId: string, current: string, next: string) {
  const bucket = `pwchange:${userId}`;
  if ((await countRecent(bucket, 15 * 60 * 1000)) >= 5) return { ok: false as const, error: "Слишком много попыток. Попробуйте через 15 минут." };
  const [u] = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
  if (!u) return { ok: false as const, error: "Пользователь не найден" };
  if (DEMO_LOGINS.has(u.login)) return { ok: false as const, error: "В демо-аккаунтах для жюри смена пароля отключена — иначе другие проверяющие не смогут войти. Сама функция работает для обычных пользователей." };
  if (!(await verifyPassword(u.passwordHash, current))) {
    await record(bucket);
    return { ok: false as const, error: "Текущий пароль указан неверно", field: "current" as const };
  }
  const parsed = newPasswordSchema.safeParse(next);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message, field: "next" as const };
  if (next === current) return { ok: false as const, error: "Новый пароль совпадает с текущим", field: "next" as const };
  if (next.toLowerCase().includes(u.login.toLowerCase())) return { ok: false as const, error: "Пароль не должен содержать логин", field: "next" as const };
  await db.transaction(async (tx) => {
    await tx.update(schema.users).set({ passwordHash: await hashPassword(next) }).where(eq(schema.users.id, userId));
    await tx.delete(schema.sessions).where(and(eq(schema.sessions.userId, userId), ne(schema.sessions.id, sessionId)));
  });
  return { ok: true as const };
}
