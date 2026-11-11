import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db, schema as t } from "@/server/db";
import { studentViewerByUserId } from "@/server/auth/guards";
import { listMyLessons } from "@/server/dal/student";
import { pushToUsers } from "@/server/push";
import { addDays, dayKey, fmt, mskParts, now, plural, startOfDay } from "@/lib/time";

/** Текст утренней сводки для одного студента. Экспортирован для теста. */
export function morningText(lessons: { title: string; startsAt: Date; room: string; buildingName: string; status: string }[]) {
  const active = lessons.filter((l) => l.status !== "CANCELLED");
  const changed = lessons.filter((l) => l.status !== "SCHEDULED").length;
  if (!active.length) return { title: "Сегодня пар нет", body: changed ? `Изменения в расписании: ${changed}. Подробности — в «Расписании».` : "Хорошего дня!" };
  const f = active[0];
  return {
    title: `Сегодня ${active.length} ${plural(active.length, "пара", "пары", "пар")}`,
    body: `Первая — ${fmt.time(f.startsAt)}, «${f.title}», ауд. ${f.room} (${f.buildingName}).${changed ? ` Изменений: ${changed}.` : ""}`,
  };
}

/**
 * Утренняя сводка в 7:30 по Москве (пн–сб) тем, кто её включил. Один раз в день:
 * отметка «отправлено за дату» ставится атомарно в app_settings — второй экземпляр сервера не продублирует.
 */
export async function runMorningDigest() {
  const at = now();
  const p = mskParts(at);
  const mins = p.hh * 60 + p.mm;
  if (p.weekday === 7 || mins < 7 * 60 + 30 || mins > 10 * 60) return;
  const key = dayKey(at);
  const claimed = await db.insert(t.appSettings).values({ key: "morning_sent", value: key })
    .onConflictDoUpdate({ target: t.appSettings.key, set: { value: key }, where: sql`${t.appSettings.value} <> ${key}` }).returning();
  if (!claimed.length) return;
  const users = await db.selectDistinct({ userId: t.pushSubscriptions.userId }).from(t.pushSubscriptions)
    .innerJoin(t.notifyPrefs, and(eq(t.notifyPrefs.userId, t.pushSubscriptions.userId), eq(t.notifyPrefs.morning, true)));
  for (const { userId } of users) {
    const v = await studentViewerByUserId(userId);
    if (!v) continue;
    const lessons = await listMyLessons(v, startOfDay(at), addDays(startOfDay(at), 1));
    await pushToUsers([userId], "morning", { ...morningText(lessons), url: "/", tag: `morning-${key}` });
  }
  if (users.length) console.log(`[morning] сводка отправлена: ${users.length}`);
}

let timer: NodeJS.Timeout | null = null;
export function startMorningDigest() {
  if (timer || process.env.MORNING_DIGEST === "off") return;
  timer = setInterval(() => { runMorningDigest().catch((e) => console.warn("[morning]", (e as Error).message)); }, 5 * 60_000);
  timer.unref();
}
