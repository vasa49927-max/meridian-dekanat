import "server-only";
import path from "node:path";
import { count } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, schema } from "@/server/db";
import { seedDemo } from "@/server/seed/seed";
import { loadExtraCaCertificates } from "@/server/certs";
import { startMorningDigest } from "@/server/morning";

/** Старт сервера: применяем миграции; если база пустая (первый деплой) — заполняем демо-данными. */
export async function runStartup() {
  try { loadExtraCaCertificates(); } catch (e) { console.error("[certs] не удалось загрузить сертификаты:", e); }
  await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  const [r] = await db.select({ n: count() }).from(schema.users);
  if ((r?.n ?? 0) === 0) {
    console.log("[startup] пустая база — создаём демо-данные");
    await seedDemo(db, { log: (m) => console.log("[seed]", m) });
  }
  startMorningDigest();
  console.log("[startup] готово");
}
