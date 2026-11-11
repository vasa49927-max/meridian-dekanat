"use server";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { requireStudent } from "@/server/auth/guards";
import { bookSchema, bookSlot, cancelMyAppointment } from "@/server/dal/appointments";
import { now } from "@/lib/time";
import { getI18n } from "@/i18n/server";

export type BookState = { error?: string; ok?: boolean };

/** Сообщения DAL (русские) → ключи словаря; неизвестное сообщение показываем как есть. */
const ERRORS = {
  "Выберите время": "slot",
  "Коротко опишите тему визита": "topic",
  "Можно держать не больше двух активных записей — отмените одну из них": "limit",
  "Это время только что заняли. Выберите другое.": "taken",
} as const;

export async function bookAction(_: BookState, form: FormData): Promise<BookState> {
  const v = await requireStudent();
  const { t } = await getI18n();
  const msg = (m: string) => (m in ERRORS ? t(`appointments.errors.${ERRORS[m as keyof typeof ERRORS]}`) : m);
  const p = bookSchema.safeParse({ slotId: form.get("slotId"), topic: form.get("topic"), comment: form.get("comment") || undefined });
  if (!p.success) return { error: msg(p.error.issues[0].message) };
  const r = await bookSlot(v, p.data, now());
  if (!r.ok) return { error: msg(r.error) };
  revalidatePath("/appointments");
  return { ok: true };
}

export async function cancelAppointmentAction(form: FormData) {
  const v = await requireStudent();
  const r = await cancelMyAppointment(v, String(form.get("id")));
  if ("notFound" in r && r.notFound) notFound();
  revalidatePath("/appointments");
}
