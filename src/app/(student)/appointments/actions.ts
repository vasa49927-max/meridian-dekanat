"use server";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { requireStudent } from "@/server/auth/guards";
import { bookSchema, bookSlot, cancelMyAppointment } from "@/server/dal/appointments";
import { now } from "@/lib/time";

export type BookState = { error?: string; ok?: boolean };

export async function bookAction(_: BookState, form: FormData): Promise<BookState> {
  const v = await requireStudent();
  const p = bookSchema.safeParse({ slotId: form.get("slotId"), topic: form.get("topic"), comment: form.get("comment") || undefined });
  if (!p.success) return { error: p.error.issues[0].message };
  const r = await bookSlot(v, p.data, now());
  if (!r.ok) return { error: r.error };
  revalidatePath("/appointments");
  return { ok: true };
}

export async function cancelAppointmentAction(form: FormData) {
  const v = await requireStudent();
  const r = await cancelMyAppointment(v, String(form.get("id")));
  if ("notFound" in r && r.notFound) notFound();
  revalidatePath("/appointments");
}
