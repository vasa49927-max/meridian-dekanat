import "server-only";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "@/server/env";
import * as schema from "./schema";

// Один пул на процесс; при hot-reload в dev переиспользуем.
const g = globalThis as unknown as { __pgPool?: Pool };
const pool = g.__pgPool ?? new Pool({ connectionString: env.DATABASE_URL, max: 10 });
if (env.NODE_ENV !== "production") g.__pgPool = pool;

export const db = drizzle(pool, { schema });
export type DB = typeof db;
export { schema };
