import "server-only";
import { and, asc, desc, eq, gt } from "drizzle-orm";
import { z } from "zod";
import { db, schema as t } from "@/server/db";
import type { StudentViewer } from "@/server/auth/guards";
import { fmt } from "@/lib/time";

export async function listFreeSlots(at: Date) {
  return db.select({ id: t.slots.id, startsAt: t.slots.startsAt, endsAt: t.slots.endsAt, location: t.slots.location, staffLast: t.staff.lastName, staffFirst: t.staff.firstName, staffMiddle: t.staff.middleName, position: t.staff.position })
    .from(t.slots).innerJoin(t.staff, eq(t.staff.id, t.slots.staffId))
    .where(and(eq(t.slots.isBooked, false), gt(t.slots.startsAt, at))).orderBy(asc(t.slots.startsAt)).limit(200);
}

export async function listMyAppointments(v: StudentViewer) {
  return db.select({ id: t.appointments.id, topic: t.appointments.topic, comment: t.appointments.comment, status: t.appointments.status, startsAt: t.slots.startsAt, endsAt: t.slots.endsAt, location: t.slots.location, staffLast: t.staff.lastName, staffFirst: t.staff.firstName, staffMiddle: t.staff.middleName })
    .from(t.appointments).innerJoin(t.slots, eq(t.slots.id, t.appointments.slotId)).innerJoin(t.staff, eq(t.staff.id, t.slots.staffId))
    .where(eq(t.appointments.studentId, v.studentId)).orderBy(desc(t.slots.startsAt));
}

export const bookSchema = z.object({
  slotId: z.uuid("Выберите время"),
  topic: z.string().trim().min(3, "Коротко опишите тему визита").max(120),
  comment: z.string().trim().max(500).optional(),
});

/** Бронирование без гонок: слот помечается занятым условным UPDATE … WHERE is_booked = false. */
export async function bookSlot(v: StudentViewer, input: z.infer<typeof bookSchema>, at: Date) {
  const active = (await listMyAppointments(v)).filter((a) => a.status === "BOOKED" && a.startsAt > at);
  if (active.length >= 2) return { ok: false as const, error: "Можно держать не больше двух активных записей — отмените одну из них" };
  return db.transaction(async (tx) => {
    const taken = await tx.update(t.slots).set({ isBooked: true })
      .where(and(eq(t.slots.id, input.slotId), eq(t.slots.isBooked, false), gt(t.slots.startsAt, at))).returning();
    if (!taken.length) return { ok: false as const, error: "Это время только что заняли. Выберите другое." };
    const [ap] = await tx.insert(t.appointments).values({ slotId: input.slotId, studentId: v.studentId, topic: input.topic, comment: input.comment || null }).returning();
    await tx.insert(t.notifications).values({ userId: v.userId, kind: "APPOINTMENT", title: "Вы записаны к методисту", body: `${fmt.shortDay(taken[0].startsAt)}, ${fmt.time(taken[0].startsAt)} · ${taken[0].location}. Тема: ${input.topic}.`, link: "/appointments", readAt: new Date() });
    return { ok: true as const, id: ap.id };
  });
}

export async function cancelMyAppointment(v: StudentViewer, id: string) {
  if (!z.uuid().safeParse(id).success) return { ok: false as const, notFound: true };
  return db.transaction(async (tx) => {
    const [ap] = await tx.select().from(t.appointments).where(and(eq(t.appointments.id, id), eq(t.appointments.studentId, v.studentId))).limit(1);
    if (!ap) return { ok: false as const, notFound: true };
    if (ap.status !== "BOOKED") return { ok: false as const, error: "Запись уже неактивна" };
    await tx.update(t.appointments).set({ status: "CANCELLED" }).where(eq(t.appointments.id, id));
    await tx.update(t.slots).set({ isBooked: false }).where(eq(t.slots.id, ap.slotId));
    return { ok: true as const };
  });
}
