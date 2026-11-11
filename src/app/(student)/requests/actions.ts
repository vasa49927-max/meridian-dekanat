"use server";
import { redirect, notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStudent } from "@/server/auth/guards";
import { createMyRequest, feedbackSchema, rateMyRequest, replyToMyRequest, withdrawMyRequest } from "@/server/dal/requests";
import { AttachmentLimitError, readUploads } from "@/server/attachments";

export type FormState = { error?: string; fieldErrors?: Record<string, string>; values?: Record<string, string> };

/** Подача заявки. Роль и владелец — из сессии; поля проверяются zod-схемой, собранной из описания типа заявки. */
export async function createRequestAction(code: string, _: FormState, form: FormData): Promise<FormState> {
  const v = await requireStudent();
  const values: Record<string, string> = {};
  for (const [k, val] of form.entries()) if (typeof val === "string" && !k.startsWith("$") && k !== "comment" && k !== "files") values[k] = val;
  const comment = String(form.get("comment") ?? "").trim() || null;
  const up = await readUploads(form.getAll("files"));
  if (!up.ok) return { error: up.error, fieldErrors: { files: up.error }, values: { ...values, comment: comment ?? "" } };
  const res = await createMyRequest(v, code, values, comment, up.files);
  if (!res.ok) return { error: res.error, fieldErrors: "fieldErrors" in res ? res.fieldErrors : undefined, values: { ...values, comment: comment ?? "" } };
  revalidatePath("/requests");
  redirect(`/requests/${res.id}?created=1`);
}

const replySchema = z.object({ id: z.uuid(), comment: z.string().trim().min(3, "Напишите ответ деканату").max(800) });

export async function replyAction(_: FormState, form: FormData): Promise<FormState> {
  const v = await requireStudent();
  const p = replySchema.safeParse({ id: form.get("id"), comment: form.get("comment") });
  if (!p.success) return { error: p.error.issues[0].message };
  const up = await readUploads(form.getAll("files"));
  if (!up.ok) return { error: up.error };
  let r;
  try { r = await replyToMyRequest(v, p.data.id, p.data.comment, up.files); }
  catch (e) { if (e instanceof AttachmentLimitError) return { error: e.message }; throw e; }
  if ("notFound" in r && r.notFound) notFound();
  if (!r.ok) return { error: r.error };
  revalidatePath(`/requests/${p.data.id}`);
  return {};
}

export async function withdrawAction(form: FormData) {
  const v = await requireStudent();
  const id = z.uuid().safeParse(form.get("id"));
  if (!id.success) notFound();
  const r = await withdrawMyRequest(v, id.data);
  if ("notFound" in r && r.notFound) notFound();
  revalidatePath(`/requests/${id.data}`);
}

export type RateState = { ok?: boolean; error?: string };

/** Оценка работы деканата по закрытой заявке. */
export async function rateRequestAction(_: RateState, form: FormData): Promise<RateState> {
  const v = await requireStudent();
  const id = String(form.get("id") ?? "");
  const p = feedbackSchema.safeParse({ rating: form.get("rating") ?? undefined, comment: String(form.get("comment") ?? "").trim() || undefined });
  if (!p.success) return { error: p.error.issues[0].message };
  const r = await rateMyRequest(v, id, p.data);
  if (!r.ok) { if ("notFound" in r) notFound(); return { error: r.error }; }
  revalidatePath(`/requests/${id}`);
  return { ok: true };
}
