"use server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/server/db";
import { verifyPassword } from "@/server/auth/password";
import { createSession, destroySession } from "@/server/auth/session";
import { LIMITS, clear, clientIp, countRecent, record } from "@/server/auth/rate-limit";

const schemaLogin = z.object({
  login: z.string().trim().toLowerCase().min(1, "Введите логин").max(64),
  password: z.string().min(1, "Введите пароль").max(200),
});

export type LoginState = { error?: string; fields?: { login?: string; password?: string }; login?: string };

const GENERIC = "Неверный логин или пароль";

/** Только локальные пути вида /schedule?d=… — защищает от open redirect (`//evil`, `/\evil`, `https:`). Находка L-1. */
function safeNext(next: string) {
  if (!/^\/(?![\/\\])[\w\-/?=&%.]*$/.test(next) || next.startsWith("/staff")) return "/";
  return next;
}

export async function loginAction(_: LoginState, form: FormData): Promise<LoginState> {
  const parsed = schemaLogin.safeParse({ login: form.get("login"), password: form.get("password") });
  if (!parsed.success) {
    const f = parsed.error.flatten().fieldErrors;
    return { fields: { login: f.login?.[0], password: f.password?.[0] }, login: String(form.get("login") ?? "") };
  }
  const { login, password } = parsed.data;
  const ip = await clientIp();
  const pairBucket = `login:pair:${login}:${ip}`;
  const userBucket = `login:user:${login}`;
  const ipBucket = `login:ip:${ip}`;
  // Защита от перебора (счётчики в БД): 5 неудач на «логин+IP», 20 на логин со всех IP, 30 с одного IP.
  // Ключ «логин+IP» не даёт злоумышленнику заблокировать вход настоящему студенту пятью попытками (находка M-3).
  const [byPair, byUser, byIp] = await Promise.all([
    countRecent(pairBucket, LIMITS.loginPerUserIp.windowMs), countRecent(userBucket, LIMITS.loginPerUser.windowMs), countRecent(ipBucket, LIMITS.loginPerIp.windowMs),
  ]);
  if (byPair >= LIMITS.loginPerUserIp.max || byUser >= LIMITS.loginPerUser.max || byIp >= LIMITS.loginPerIp.max) {
    return { error: "Слишком много неудачных попыток. Подождите 15 минут и попробуйте снова.", login };
  }
  const [user] = await db.select().from(schema.users).where(eq(schema.users.login, login)).limit(1);
  const ok = await verifyPassword(user?.passwordHash ?? null, password);
  if (!user || !ok) {
    await Promise.all([record(pairBucket), record(userBucket), record(ipBucket)]);
    const left = LIMITS.loginPerUserIp.max - byPair - 1;
    return { error: left > 0 && left <= 2 ? `${GENERIC}. Осталось попыток: ${left}` : GENERIC, login };
  }
  await clear(pairBucket);
  await createSession(user.id, (await headers()).get("user-agent"));
  const next = String(form.get("next") ?? "");
  redirect(user.role === "STAFF" ? "/staff" : safeNext(next));
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
