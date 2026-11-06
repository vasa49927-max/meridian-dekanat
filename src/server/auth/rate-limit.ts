import "server-only";
import { and, count, eq, gt, lt } from "drizzle-orm";
import { headers } from "next/headers";
import { db, schema } from "@/server/db";

/** Счётчики в БД, а не в памяти процесса: лимит одинаков для всех реплик сервера. */
export async function countRecent(bucket: string, windowMs: number) {
  const since = new Date(Date.now() - windowMs);
  const [r] = await db.select({ n: count() }).from(schema.rateEvents)
    .where(and(eq(schema.rateEvents.bucket, bucket), gt(schema.rateEvents.createdAt, since)));
  return r?.n ?? 0;
}

export async function record(bucket: string) {
  await db.insert(schema.rateEvents).values({ bucket });
  // Изредка чистим старые записи, чтобы таблица не росла.
  if (Math.random() < 0.02) {
    await db.delete(schema.rateEvents).where(lt(schema.rateEvents.createdAt, new Date(Date.now() - 24 * 3600 * 1000)));
  }
}

export async function clear(bucket: string) {
  await db.delete(schema.rateEvents).where(eq(schema.rateEvents.bucket, bucket));
}

/** IP клиента. За прокси хостинга — первый адрес из X-Forwarded-For. */
export async function clientIp() {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown").slice(0, 64);
}

export const LIMITS = {
  loginPerUser: { max: 5, windowMs: 15 * 60 * 1000 }, // 5 неудачных попыток на логин за 15 минут
  loginPerIp: { max: 30, windowMs: 15 * 60 * 1000 }, // 30 неудачных попыток с IP за 15 минут
  aiPerUser: { max: 30, windowMs: 60 * 60 * 1000 }, // 30 вопросов помощнику в час
} as const;
