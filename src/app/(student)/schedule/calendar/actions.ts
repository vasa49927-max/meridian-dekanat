"use server";
import { revalidatePath } from "next/cache";
import { requireStudent } from "@/server/auth/guards";
import { disableCalendarFeed, rotateCalendarToken } from "@/server/calendar";
import { env } from "@/server/env";

export type FeedState = { url?: string; error?: string };

/** Новая секретная ссылка. Показываем её один раз: в БД хранится только хэш. */
export async function createFeedAction(): Promise<FeedState> {
  const v = await requireStudent();
  const token = await rotateCalendarToken(v.userId);
  revalidatePath("/schedule/calendar");
  return { url: `${env.APP_URL.replace(/\/$/, "")}/api/calendar/${token}.ics` };
}

export async function disableFeedAction(): Promise<void> {
  const v = await requireStudent();
  await disableCalendarFeed(v.userId);
  revalidatePath("/schedule/calendar");
}
