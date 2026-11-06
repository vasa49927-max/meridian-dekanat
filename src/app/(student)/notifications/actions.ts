"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStudent } from "@/server/auth/guards";
import { markAllMyNotificationsRead, markMyNotificationRead } from "@/server/dal/student";

export async function markReadAction(id: string) {
  const v = await requireStudent();
  if (!z.uuid().safeParse(id).success) return;
  await markMyNotificationRead(v, id); // UPDATE … WHERE id = $1 AND user_id = <из сессии>
  revalidatePath("/", "layout");
}

export async function markAllReadAction() {
  const v = await requireStudent();
  await markAllMyNotificationsRead(v);
  revalidatePath("/", "layout");
}
