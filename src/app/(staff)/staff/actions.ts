"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/server/auth/guards";
import { announcementSchema, moveSchema, staffChangeLesson, staffChangeStatus, staffPublishAnnouncement, staffTakeRequest, statusChangeSchema } from "@/server/dal/staff";
import { db } from "@/server/db";
import { env } from "@/server/env";
import { seedDemo } from "@/server/seed/seed";
import { msk } from "@/lib/time";
import { LIMITS, countRecent, record } from "@/server/auth/rate-limit";
import { staffInviteAtRisk } from "@/server/dal/risks";
import { draftReply } from "@/server/ai/draft";
import { z } from "zod";

export type StaffState = { error?: string; ok?: string };

/** Каждое действие сотрудника начинается с requireStaff(): роль проверяется на сервере, а не в интерфейсе. */
export async function changeStatusAction(_: StaffState, form: FormData): Promise<StaffState> {
  const v = await requireStaff();
  const p = statusChangeSchema.safeParse({ id: form.get("id"), status: form.get("status"), comment: String(form.get("comment") ?? "").trim() || undefined });
  if (!p.success) return { error: "Проверьте данные формы" };
  // Пометки из ИИ-черновика вида [укажите причину] не должны уйти студенту
  if (p.data.comment && /\[(укажите|уточните|ук\.)/i.test(p.data.comment)) return { error: "В комментарии осталась пометка в [квадратных скобках] — допишите текст вместо неё" };
  const r = await staffChangeStatus(v, p.data);
  if (!r.ok) return { error: r.error };
  revalidatePath("/staff", "layout");
  return { ok: "Статус обновлён — студент уже получил уведомление." };
}

/** «Взять себе» — закрепить заявку за текущим сотрудником. */
export async function takeRequestAction(form: FormData): Promise<void> {
  const v = await requireStaff();
  await staffTakeRequest(v, String(form.get("id") ?? ""));
  revalidatePath("/staff", "layout");
}

export async function publishAnnouncementAction(_: StaffState, form: FormData): Promise<StaffState> {
  const v = await requireStaff();
  const raw = Object.fromEntries([...form.entries()].filter(([, val]) => val !== ""));
  const p = announcementSchema.safeParse({ ...raw, important: form.get("important") === "on" });
  if (!p.success) return { error: p.error.issues[0].message };
  const r = await staffPublishAnnouncement(v, p.data);
  if (!r.ok) return { error: r.error };
  revalidatePath("/staff/announcements");
  return { ok: `Опубликовано. Уведомление получили студентов: ${r.recipients}.` };
}

export async function changeLessonAction(_: StaffState, form: FormData): Promise<StaffState> {
  const v = await requireStaff();
  const raw = Object.fromEntries([...form.entries()].filter(([, val]) => val !== ""));
  const p = moveSchema.safeParse(raw);
  if (!p.success) return { error: p.error.issues[0].message };
  const r = await staffChangeLesson(v, p.data, (date, time) => {
    const [y, m, d] = date.split("-").map(Number);
    const [hh, mm] = time.split(":").map(Number);
    return msk(y, m, d, hh, mm);
  });
  if (!r.ok) return { error: r.error };
  revalidatePath("/staff/schedule");
  return { ok: `Сохранено. Уведомление получили студентов: ${r.recipients}.` };
}

export async function resetDemoAction(): Promise<StaffState> {
  await requireStaff();
  if (env.DEMO_RESET_ENABLED !== "true") return { error: "Сброс отключён" };
  // Не чаще раза в 30 минут: один член жюри не выбросит из кабинета других посреди проверки (находка M-2).
  if ((await countRecent("demo-reset", LIMITS.demoReset.windowMs)) >= LIMITS.demoReset.max) return { error: "Демо-данные уже сбрасывали в последние 30 минут. Попробуйте позже." };
  await seedDemo(db);
  await record("demo-reset");
  // Сид удаляет все сессии — в том числе текущую. Возвращаемся на вход.
  redirect("/login?reset=1");
}

/** Раннее предупреждение: пригласить студента с риском на консультацию (уведомление + push/MAX). */
export async function inviteAtRiskAction(_: StaffState, form: FormData): Promise<StaffState> {
  const v = await requireStaff();
  const ids = z.object({ studentId: z.string().uuid(), offeringId: z.string().uuid() }).safeParse({ studentId: form.get("studentId"), offeringId: form.get("offeringId") });
  if (!ids.success) return { error: "Проверьте данные" };
  const r = await staffInviteAtRisk(v, ids.data.studentId, ids.data.offeringId);
  if (!r.ok) return { error: r.error };
  revalidatePath("/staff/risks");
  return { ok: "Приглашение отправлено" };
}

/** ИИ-черновик комментария к смене статуса. Только для сотрудника; лимит — как у помощника студента. */
export async function draftReplyAction(id: string, status: string): Promise<{ text?: string; mode?: "llm" | "offline"; error?: string }> {
  const v = await requireStaff();
  const p = z.object({ id: z.string().uuid(), status: z.enum(["IN_PROGRESS", "NEEDS_INFO", "READY", "ISSUED", "REJECTED"]) }).safeParse({ id, status });
  if (!p.success) return { error: "Сначала выберите статус" };
  const bucket = `draft:${v.staffId}`;
  if ((await countRecent(bucket, LIMITS.aiPerUser.windowMs)) >= LIMITS.aiPerUser.max) return { error: "Слишком много черновиков за час — попробуйте позже" };
  await record(bucket);
  const d = await draftReply(v, p.data.id, p.data.status);
  if (!d) return { error: "Заявка не найдена" };
  return d;
}
