"use server";
import { revalidatePath } from "next/cache";
import { requireStudent } from "@/server/auth/guards";
import { toggleMyChecklist } from "@/server/dal/checklist";

export async function toggleChecklistAction(item: string, done: boolean): Promise<boolean> {
  const v = await requireStudent();
  const ok = await toggleMyChecklist(v, item, done);
  revalidatePath("/");
  return ok;
}
