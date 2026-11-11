import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, schema as t } from "@/server/db";
import type { StudentViewer } from "@/server/auth/guards";
import { listMyLessons, type LessonView } from "@/server/dal/student";
import { LESSON_TYPE } from "@/components/schedule/lesson-meta";
import { addDays, now, startOfWeek } from "@/lib/time";

/**
 * Календарь в формате iCalendar (RFC 5545): разовая выгрузка и подписка по секретной ссылке.
 * Перенос пары меняет время у события с тем же UID и увеличивает SEQUENCE — календарь телефона
 * обновляет его сам при следующей синхронизации (обычно раз в 1–12 часов, зависит от приложения).
 */
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const dt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

/** Перенос длинных строк по 75 октетов (RFC 5545 §3.1) — с учётом того, что кириллица занимает 2 байта. */
export function fold(line: string): string {
  const out: string[] = [];
  let cur = "", bytes = 0;
  for (const ch of line) {
    const b = Buffer.byteLength(ch);
    if (bytes + b > (out.length ? 74 : 75)) { out.push(cur); cur = ""; bytes = 0; }
    cur += ch; bytes += b;
  }
  out.push(cur);
  return out.join("\r\n ");
}

export function buildIcs(lessons: LessonView[], name = "Меридиан — расписание"): string {
  const stamp = dt(new Date());
  const lines = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Meridian concept//RU", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    fold(`X-WR-CALNAME:${esc(name)}`), "X-WR-TIMEZONE:Europe/Moscow",
    // Подсказка клиентам: проверять обновления раз в час (Apple, Outlook, Яндекс учитывают; Google — по своему графику).
    "REFRESH-INTERVAL;VALUE=DURATION:PT1H", "X-PUBLISHED-TTL:PT1H",
  ];
  for (const l of lessons) {
    const teacher = l.teacherLast ? `${l.teacherTitle ?? ""} ${l.teacherLast} ${l.teacherFirst ?? ""} ${l.teacherMiddle ?? ""}`.replace(/\s+/g, " ").trim() : "";
    const note = l.status === "MOVED" ? `Изменение: ${l.changeNote ?? "перенос"}` : l.status === "CANCELLED" ? `Отменено: ${l.changeNote ?? ""}` : "";
    const seq = l.changedAt ? Math.max(1, Math.floor(+l.changedAt / 60000) % 100000) : 0;
    lines.push(
      "BEGIN:VEVENT", `UID:${l.id}@meridian`, `DTSTAMP:${stamp}`, `SEQUENCE:${seq}`, `DTSTART:${dt(l.startsAt)}`, `DTEND:${dt(l.endsAt)}`,
      fold(`SUMMARY:${esc(`${l.status === "CANCELLED" ? "[ОТМЕНА] " : l.status === "MOVED" ? "[ПЕРЕНОС] " : ""}${l.title} (${LESSON_TYPE[l.type]})`)}`),
      fold(`LOCATION:${esc(`ауд. ${l.room}, ${l.buildingName}, ${l.buildingAddress}`)}`),
      fold(`DESCRIPTION:${esc([teacher, note].filter(Boolean).join("\n"))}`),
      `STATUS:${l.status === "CANCELLED" ? "CANCELLED" : "CONFIRMED"}`, "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}

/** Окно календаря: прошлая неделя + полгода вперёд (семестр и сессия). */
export async function calendarFor(v: StudentViewer) {
  const from = addDays(startOfWeek(now()), -7);
  return buildIcs(await listMyLessons(v, from, addDays(from, 190)));
}

const hash = (token: string) => createHash("sha256").update(token).digest("hex");

/** Новая секретная ссылка (старая сразу перестаёт работать). Токен возвращается один раз и в БД не хранится. */
export async function rotateCalendarToken(userId: string): Promise<string> {
  const token = randomBytes(24).toString("base64url");
  await db.insert(t.calendarFeeds).values({ userId, tokenHash: hash(token) })
    .onConflictDoUpdate({ target: t.calendarFeeds.userId, set: { tokenHash: hash(token), createdAt: new Date(), lastFetchedAt: null } });
  return token;
}

export async function disableCalendarFeed(userId: string) {
  await db.delete(t.calendarFeeds).where(eq(t.calendarFeeds.userId, userId));
}

export async function getCalendarFeed(userId: string) {
  const [f] = await db.select({ createdAt: t.calendarFeeds.createdAt, lastFetchedAt: t.calendarFeeds.lastFetchedAt }).from(t.calendarFeeds).where(eq(t.calendarFeeds.userId, userId));
  return f ?? null;
}

/** Владелец ленты по токену из ссылки (или null). Сравнение — по хэшу через уникальный индекс. */
export async function feedOwner(token: string): Promise<string | null> {
  if (!/^[A-Za-z0-9_-]{32}$/.test(token)) return null;
  const [f] = await db.update(t.calendarFeeds).set({ lastFetchedAt: new Date() }).where(eq(t.calendarFeeds.tokenHash, hash(token))).returning({ userId: t.calendarFeeds.userId });
  return f?.userId ?? null;
}
