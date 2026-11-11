"use server";
import { getSession } from "@/server/auth/session";
import { requireStudent } from "@/server/auth/guards";
import { changePassword, endOtherSessions } from "@/server/auth/change-password";
import { revalidatePath } from "next/cache";

export type PwState = { ok?: boolean; error?: string; field?: "current" | "next" | "repeat" };

export async function changePasswordAction(_: PwState, form: FormData): Promise<PwState> {
  const v = await requireStudent();
  const s = await getSession();
  if (!s) return { error: "Сессия истекла — войдите снова" };
  const current = String(form.get("current") ?? "");
  const next = String(form.get("next") ?? "");
  if (next !== String(form.get("repeat") ?? "")) return { error: "Новые пароли не совпадают", field: "repeat" };
  const r = await changePassword(v.userId, s.sessionId, current, next);
  return r.ok ? { ok: true } : { error: r.error, field: "field" in r ? r.field : undefined };
}

/** «Выйти на других устройствах»: удаляем все сессии пользователя, кроме текущей. Владелец — только из сессии. */
export async function logoutOthersAction(): Promise<void> {
  const v = await requireStudent();
  const s = await getSession();
  if (!s || s.userId !== v.userId) return;
  await endOtherSessions(v.userId, s.sessionId, s.login);
  revalidatePath("/profile");
}
