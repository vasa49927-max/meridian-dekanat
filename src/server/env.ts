import "server-only";
import { z } from "zod";

/**
 * Единственная точка чтения секретов. Только сервер (импорт "server-only" ломает сборку,
 * если модуль случайно попадёт в клиентский бандл).
 */
// Пустая строка в .env = «не задано».
const optional = <T extends z.ZodTypeAny>(t: T) => z.preprocess((v) => (v === "" ? undefined : v), t.optional());

const schema = z.object({
  DATABASE_URL: z.string().url(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  /** Публичный адрес сайта — для проверки Origin и ссылок в QR. */
  APP_URL: z.string().url().default("http://localhost:3000"),
  GIGACHAT_AUTH_KEY: optional(z.string().min(10)),
  GIGACHAT_SCOPE: z.string().default("GIGACHAT_API_PERS"),
  GIGACHAT_MODEL: z.string().default("GigaChat"),
  /** Разрешить кнопку «Сбросить демо-данные» в кабинете деканата. */
  DEMO_RESET_ENABLED: z.enum(["true", "false"]).default("true"),
});

export const env = schema.parse(process.env);
export const isProd = env.NODE_ENV === "production";
