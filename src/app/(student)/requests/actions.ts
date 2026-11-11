"use server";
import { redirect, notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStudent } from "@/server/auth/guards";
import { createMyRequest, feedbackSchema, rateMyRequest, replyToMyRequest, withdrawMyRequest, type RequestMsgs } from "@/server/dal/requests";
import { ATTACH_LIMITS, AttachmentLimitError, readUploads, type UploadMsgs } from "@/server/attachments";
import { getI18n } from "@/i18n/server";
import type { I18n } from "@/i18n";

export type FormState = { error?: string; fieldErrors?: Record<string, string>; values?: Record<string, string> };

/** Тексты ошибок DAL на языке интерфейса (русские совпадают с текстами по умолчанию в DAL). */
function requestMsgs({ t, tr }: I18n): RequestMsgs {
  return {
    tooLong: (n) => t("requests.errors.tooLong", { n }), chooseOption: t("requests.errors.chooseOption"),
    required: (label) => t("requests.errors.required", { label: tr("rt", label) }),
    noType: t("requests.errors.noType"), checkFields: t("requests.errors.checkFields"), createFailed: t("requests.errors.createFailed"),
    replyNotAllowed: t("requests.errors.replyNotAllowed"), withdrawNotAllowed: t("requests.errors.withdrawNotAllowed"),
    rateNotAllowed: t("requests.errors.rateNotAllowed"), alreadyRated: t("requests.errors.alreadyRated"),
  };
}
function uploadMsgs({ t }: I18n): UploadMsgs {
  return {
    tooMany: (n) => t("requests.errors.tooManyFiles", { n }),
    tooBig: (name) => t("requests.errors.fileTooBig", { name }),
    badType: (name) => t("requests.errors.fileType", { name }),
  };
}

/** Подача заявки. Роль и владелец — из сессии; поля проверяются zod-схемой, собранной из описания типа заявки. */
export async function createRequestAction(code: string, _: FormState, form: FormData): Promise<FormState> {
  const v = await requireStudent();
  const i18n = await getI18n();
  const values: Record<string, string> = {};
  for (const [k, val] of form.entries()) if (typeof val === "string" && !k.startsWith("$") && k !== "comment" && k !== "files") values[k] = val;
  const comment = String(form.get("comment") ?? "").trim() || null;
  const up = await readUploads(form.getAll("files"), uploadMsgs(i18n));
  if (!up.ok) return { error: up.error, fieldErrors: { files: up.error }, values: { ...values, comment: comment ?? "" } };
  const res = await createMyRequest(v, code, values, comment, up.files, requestMsgs(i18n));
  if (!res.ok) return { error: res.error, fieldErrors: "fieldErrors" in res ? res.fieldErrors : undefined, values: { ...values, comment: comment ?? "" } };
  revalidatePath("/requests");
  redirect(`/requests/${res.id}?created=1`);
}

export async function replyAction(_: FormState, form: FormData): Promise<FormState> {
  const v = await requireStudent();
  const i18n = await getI18n();
  const { t } = i18n;
  const replySchema = z.object({ id: z.uuid(), comment: z.string().trim().min(3, t("requests.errors.replyEmpty")).max(800) });
  const p = replySchema.safeParse({ id: form.get("id"), comment: form.get("comment") });
  if (!p.success) return { error: p.error.issues[0].message };
  const up = await readUploads(form.getAll("files"), uploadMsgs(i18n));
  if (!up.ok) return { error: up.error };
  let r;
  try { r = await replyToMyRequest(v, p.data.id, p.data.comment, up.files, requestMsgs(i18n)); }
  catch (e) { if (e instanceof AttachmentLimitError) return { error: t("requests.errors.tooManyTotal", { n: ATTACH_LIMITS.maxPerRequest }) }; throw e; }
  if ("notFound" in r && r.notFound) notFound();
  if (!r.ok) return { error: r.error };
  revalidatePath(`/requests/${p.data.id}`);
  return {};
}

export async function withdrawAction(form: FormData) {
  const v = await requireStudent();
  const id = z.uuid().safeParse(form.get("id"));
  if (!id.success) notFound();
  const r = await withdrawMyRequest(v, id.data, requestMsgs(await getI18n()));
  if ("notFound" in r && r.notFound) notFound();
  revalidatePath(`/requests/${id.data}`);
}

export type RateState = { ok?: boolean; error?: string };

/** Оценка работы деканата по закрытой заявке. */
export async function rateRequestAction(_: RateState, form: FormData): Promise<RateState> {
  const v = await requireStudent();
  const i18n = await getI18n();
  const { t } = i18n;
  const id = String(form.get("id") ?? "");
  const p = feedbackSchema.safeParse({ rating: form.get("rating") ?? undefined, comment: String(form.get("comment") ?? "").trim() || undefined });
  if (!p.success) return { error: p.error.issues[0].path[0] === "comment" ? t("requests.errors.tooLong", { n: 500 }) : t("requests.errors.rating") };
  const r = await rateMyRequest(v, id, p.data, requestMsgs(i18n));
  if (!r.ok) { if ("notFound" in r) notFound(); return { error: r.error }; }
  revalidatePath(`/requests/${id}`);
  return { ok: true };
}
