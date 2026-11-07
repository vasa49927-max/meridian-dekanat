"use server";
import { getSession } from "@/server/auth/session";
import { requireStudent } from "@/server/auth/guards";
import { changePassword } from "@/server/auth/change-password";

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
