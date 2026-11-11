import "server-only";
import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { and, eq, gt, inArray, lt } from "drizzle-orm";
import { db, schema as t } from "@/server/db";
import { studentViewerByUserId } from "@/server/auth/guards";
import { listMyLessons } from "@/server/dal/student";
import { listMyRequests } from "@/server/dal/requests";
import { countRecent, record } from "@/server/auth/rate-limit";
import { LESSON_TYPE } from "@/components/schedule/lesson-meta";
import { STATUS_LABEL } from "@/components/requests/status";
import { addDays, fmt, now, startOfDay } from "@/lib/time";

/**
 * Чат-бот деканата в мессенджере MAX (D-031). Код полностью готов, но бот «спит», пока в окружении нет
 * MAX_BOT_TOKEN: ключ выдают только организациям, ИП и самозанятым после проверки на платформе MAX.
 * API: https://dev.max.ru/docs-api — базовый адрес platform-api2.max.ru, токен в заголовке Authorization,
 * вебхук приходит с заголовком X-Max-Bot-Api-Secret.
 */
export const maxConfig = () => ({
  token: process.env.MAX_BOT_TOKEN || null,
  secret: process.env.MAX_BOT_SECRET || null,
  botName: process.env.MAX_BOT_NAME || null,
  api: (process.env.MAX_API_URL || "https://platform-api2.max.ru").replace(/\/$/, ""),
});
export const maxEnabled = () => !!(maxConfig().token && maxConfig().secret);

const hash = (s: string) => createHash("sha256").update(s).digest("hex");

/** Отправка текста пользователю MAX. Ошибки не роняют основное действие. */
export async function maxSend(externalUserId: string, text: string) {
  const c = maxConfig();
  if (!c.token) return false;
  try {
    const res = await fetch(`${c.api}/messages?user_id=${encodeURIComponent(externalUserId)}`, {
      method: "POST", headers: { Authorization: c.token, "Content-Type": "application/json" },
      body: JSON.stringify({ text: text.slice(0, 4000) }), signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) console.warn(`[max] отправка: ${res.status}`);
    return res.ok;
  } catch (e) {
    console.warn("[max] не отправлено:", (e as Error).message);
    return false;
  }
}

/** Код привязки на 10 минут (6 цифр). Старые коды пользователя удаляются. */
export async function createLinkCode(userId: string) {
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await db.delete(t.botLinkCodes).where(eq(t.botLinkCodes.userId, userId));
  await db.delete(t.botLinkCodes).where(lt(t.botLinkCodes.expiresAt, new Date()));
  await db.insert(t.botLinkCodes).values({ codeHash: hash(code), userId, expiresAt: new Date(Date.now() + 10 * 60_000) });
  return code;
}

export async function getMaxLink(userId: string) {
  const [l] = await db.select().from(t.messengerLinks).where(and(eq(t.messengerLinks.userId, userId), eq(t.messengerLinks.provider, "MAX")));
  return l ?? null;
}

export async function unlinkMax(userId: string) {
  await db.delete(t.messengerLinks).where(and(eq(t.messengerLinks.userId, userId), eq(t.messengerLinks.provider, "MAX")));
}

async function linkByCode(externalUserId: string, code: string) {
  const bucket = `max-link:${externalUserId}`;
  if ((await countRecent(bucket, 15 * 60_000)) >= 5) return "Слишком много попыток. Подождите 15 минут и получите новый код в профиле.";
  await record(bucket);
  const [c] = await db.delete(t.botLinkCodes).where(and(eq(t.botLinkCodes.codeHash, hash(code)), gt(t.botLinkCodes.expiresAt, new Date()))).returning();
  if (!c) return "Код не подошёл или устарел. Получите новый: «Профиль» → «Чат-бот в MAX».";
  await db.insert(t.messengerLinks).values({ userId: c.userId, provider: "MAX", externalUserId })
    .onConflictDoUpdate({ target: [t.messengerLinks.provider, t.messengerLinks.externalUserId], set: { userId: c.userId, createdAt: new Date() } });
  const v = await studentViewerByUserId(c.userId);
  return `Готово${v ? `, ${v.firstName}` : ""}! Аккаунт привязан. Сюда будут приходить переносы пар и статусы заявок.\n\n${HELP}`;
}

const HELP = "Команды:\n/today — пары сегодня\n/tomorrow — пары завтра\n/requests — мои заявки\n/unlink — отвязать аккаунт";

async function lessonsText(userId: string, dayOffset: number) {
  const v = await studentViewerByUserId(userId);
  if (!v) return "Расписание доступно только студентам.";
  const day = addDays(startOfDay(now()), dayOffset);
  const list = await listMyLessons(v, day, addDays(day, 1));
  const head = `${dayOffset === 0 ? "Сегодня" : "Завтра"}, ${fmt.shortDay(day)}`;
  if (!list.length) return `${head}: пар нет.`;
  return `${head}:\n` + list.map((l) => {
    const mark = l.status === "CANCELLED" ? " — ОТМЕНА" : l.status === "MOVED" ? " — ПЕРЕНОС" : "";
    return `${fmt.time(l.startsAt)}–${fmt.time(l.endsAt)} ${l.title} (${LESSON_TYPE[l.type]}), ауд. ${l.room}, ${l.buildingName}${mark}`;
  }).join("\n");
}

async function requestsText(userId: string) {
  const v = await studentViewerByUserId(userId);
  if (!v) return "Заявки доступны только студентам.";
  const { items } = await listMyRequests(v, null, 10);
  const active = items.filter((r) => r.status !== "ISSUED" && r.status !== "REJECTED");
  if (!active.length) return "Активных заявок нет. Заказать справку: «Заявки» в кабинете.";
  return "Ваши заявки:\n" + active.map((r) => `${r.number} · ${r.title} — ${STATUS_LABEL[r.status]}${r.dueAt ? `, срок до ${fmt.dayMonth(r.dueAt)}` : ""}`).join("\n");
}

/** Ответ на сообщение пользователя MAX. Экспортирован для тестов. */
export async function handleText(externalUserId: string, raw: string): Promise<string> {
  const text = raw.trim();
  const lower = text.toLowerCase();
  const code = text.match(/^(?:\/link\s+|\/start\s+|привязать\s+)?(\d{6})$/i)?.[1];
  if (code) return linkByCode(externalUserId, code);
  const [link] = await db.select().from(t.messengerLinks).where(and(eq(t.messengerLinks.provider, "MAX"), eq(t.messengerLinks.externalUserId, externalUserId)));
  if (!link) return "Здравствуйте! Я бот цифрового деканата «Меридиан» (концепт).\nЧтобы привязать аккаунт, откройте в кабинете «Профиль» → «Чат-бот в MAX» и пришлите сюда 6-значный код.";
  if (["/today", "сегодня"].includes(lower)) return lessonsText(link.userId, 0);
  if (["/tomorrow", "завтра"].includes(lower)) return lessonsText(link.userId, 1);
  if (["/requests", "заявки"].includes(lower)) return requestsText(link.userId);
  if (["/unlink", "/stop", "отвязать"].includes(lower)) {
    await db.delete(t.messengerLinks).where(eq(t.messengerLinks.id, link.id));
    return "Аккаунт отвязан. Уведомления сюда больше не придут.";
  }
  return HELP;
}

type MaxUpdate = {
  update_type?: string;
  message?: { sender?: { user_id?: number | string }; body?: { text?: string | null } };
  user?: { user_id?: number | string };
  payload?: string | null;
};

/** Проверка секрета вебхука — сравнение за постоянное время. */
export function checkSecret(header: string | null) {
  const s = maxConfig().secret;
  if (!s || !header) return false;
  const a = Buffer.from(header), b = Buffer.from(s);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Обработка входящего события вебхука MAX. */
export async function handleUpdate(u: MaxUpdate) {
  if (u.update_type === "message_created") {
    const from = u.message?.sender?.user_id;
    const text = u.message?.body?.text;
    if (from == null || !text) return;
    await maxSend(String(from), await handleText(String(from), text));
  } else if (u.update_type === "bot_started") {
    const from = u.user?.user_id;
    if (from == null) return;
    await maxSend(String(from), await handleText(String(from), u.payload && /^\d{6}$/.test(u.payload) ? u.payload : "/start"));
  }
}

/** Рассылка уведомления привязанным пользователям (вызывается вместе с Web Push). */
export async function maxNotify(userIds: string[], msg: { title: string; body: string }) {
  if (!maxConfig().token || !userIds.length) return;
  const links = await db.select().from(t.messengerLinks).where(and(eq(t.messengerLinks.provider, "MAX"), inArray(t.messengerLinks.userId, userIds)));
  await Promise.all(links.map((l) => maxSend(l.externalUserId, `${msg.title}\n${msg.body}`)));
}
