import "server-only";
import { eq, sql } from "drizzle-orm";
import { db, schema as t } from "@/server/db";
import { seedDemo } from "@/server/seed/seed";
import { env } from "@/server/env";
import { dayKey, mskParts, now } from "@/lib/time";

/**
 * Ночной сброс демо-данных (раунд 9, находка аудита «глазами жюри»). Сроки, переносы и уведомления строятся от момента
 * сброса, а на сервере идёт реальное время — без сброса к концу проверки кабинет выглядел бы заброшенным
 * (13 просрочек, пустой график). Аккаунты общие: ночной сброс заодно убирает следы чужих проверок.
 * — каждый день в 04:00–04:59 МСК; отметка за дату ставится атомарно в app_settings (второй экземпляр не продублирует);
 * — при старте: если данные старше 26 ч (сервер «проспал» 4 утра) — сбрасываем сразу;
 * — не работает в dev и тестах (там время фиксирует DEMO_NOW) и если DEMO_RESET_ENABLED=false.
 */
const KEY_DAY = "demo_reset_day";
const KEY_AT = "demo_seeded_at";
const enabled = () => env.DEMO_RESET_ENABLED === "true" && !process.env.DEMO_NOW && process.env.NODE_ENV === "production" && process.env.DEMO_NIGHTLY !== "off";

export async function markSeeded() {
  const v = now().toISOString();
  await db.insert(t.appSettings).values({ key: KEY_AT, value: v }).onConflictDoUpdate({ target: t.appSettings.key, set: { value: v } });
}

export async function seededAt(): Promise<Date | null> {
  const [r] = await db.select().from(t.appSettings).where(eq(t.appSettings.key, KEY_AT));
  return r ? new Date(r.value) : null;
}

async function reset(reason: string) {
  console.log(`[demo-reset] ${reason} — пересоздаём демо-данные`);
  await seedDemo(db, { log: () => {} });
  await markSeeded();
}

export async function runNightlyReset() {
  if (!enabled()) return;
  const at = now();
  if (mskParts(at).hh !== 4) return;
  const key = dayKey(at);
  const claimed = await db.insert(t.appSettings).values({ key: KEY_DAY, value: key })
    .onConflictDoUpdate({ target: t.appSettings.key, set: { value: key }, where: sql`${t.appSettings.value} <> ${key}` }).returning();
  if (claimed.length) await reset("ночной сброс");
}

/** Вызывается при старте сервера, после миграций. */
export async function resetIfStale() {
  if (!enabled()) return;
  const at = await seededAt();
  if (!at || +now() - +at > 26 * 3600_000) await reset(at ? "данные старше 26 часов" : "нет отметки о последнем сбросе");
}

let timer: NodeJS.Timeout | null = null;
export function startNightlyReset() {
  if (timer || !enabled()) return;
  timer = setInterval(() => { runNightlyReset().catch((e) => console.warn("[demo-reset]", (e as Error).message)); }, 5 * 60_000);
  timer.unref();
}
