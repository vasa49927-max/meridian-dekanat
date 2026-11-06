// Применяет SQL-миграции из ./drizzle. Используется локально и при старте контейнера.
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) { console.error("DATABASE_URL не задан"); process.exit(1); }
const pool = new pg.Pool({ connectionString: url });
await migrate(drizzle(pool), { migrationsFolder: new URL("../drizzle", import.meta.url).pathname });
await pool.end();
console.log("Миграции применены");
