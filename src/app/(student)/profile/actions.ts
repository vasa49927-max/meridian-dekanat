"use server";
import { getSession } from "@/server/auth/session";
import { requireStudent } from "@/server/auth/guards";
import { changePassword, endOtherSessions } from "@/server/auth/change-password";
import { revalidatePath } from "next/cache";
import { savePrefs } from "@/server/push";
import { getI18n } from "@/i18n/server";

export type PwState = { ok?: boolean; error?: string; field?: "current" | "next" | "repeat" };

export async function changePasswordAction(_: PwState, form: FormData): Promise<PwState> {
  const v = await requireStudent();
  const { t } = await getI18n();
  const s = await getSession();
  if (!s) return { error: t("profile.errors.sessionExpired") };
  const current = String(form.get("current") ?? "");
  const next = String(form.get("next") ?? "");
  if (next !== String(form.get("repeat") ?? "")) return { error: t("profile.errors.mismatch"), field: "repeat" };
  const r = await changePassword(v.userId, s.sessionId, current, next, {
    tooMany: t("profile.errors.tooMany"), noUser: t("profile.errors.noUser"), demo: t("profile.errors.demo"), wrongCurrent: t("profile.errors.wrongCurrent"),
    tooShort: t("profile.errors.tooShort"), lettersDigits: t("profile.errors.lettersDigits"), same: t("profile.errors.same"), hasLogin: t("profile.errors.hasLogin"),
  });
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

/** Что присылать на телефон: переносы, заявки, объявления, утренняя сводка. */
export async function savePushPrefsAction(_: { ok?: boolean }, form: FormData): Promise<{ ok?: boolean }> {
  const v = await requireStudent();
  await savePrefs(v.userId, { schedule: form.get("schedule") === "on", requests: form.get("requests") === "on", announcements: form.get("announcements") === "on", morning: form.get("morning") === "on" });
  revalidatePath("/profile");
  return { ok: true };
}
