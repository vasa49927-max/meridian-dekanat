import "server-only";
import { hash, verify } from "@node-rs/argon2";

/**
 * argon2id, параметры OWASP Password Storage Cheat Sheet: m=19 МиБ, t=2, p=1.
 * В БД хранится только строка вида $argon2id$v=19$m=19456,t=2,p=1$<соль>$<хэш>.
 */
const OPTS = { memoryCost: 19456, timeCost: 2, parallelism: 1, algorithm: 2 /* Argon2id */ } as const;

export function hashPassword(plain: string) {
  return hash(plain, OPTS);
}

// Хэш-заглушка: если логина нет, всё равно тратим столько же времени —
// по времени ответа нельзя понять, существует ли пользователь.
let dummy: Promise<string> | null = null;

export async function verifyPassword(stored: string | null, plain: string): Promise<boolean> {
  if (!stored) {
    dummy ??= hash("timing-equalizer", OPTS);
    await verify(await dummy, plain).catch(() => false);
    return false;
  }
  try {
    return await verify(stored, plain);
  } catch {
    return false;
  }
}
