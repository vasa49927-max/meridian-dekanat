import "server-only";
import { cache } from "react";
import { and, asc, desc, eq, lt, or } from "drizzle-orm";
import { z } from "zod";
import { db, schema as t } from "@/server/db";
import type { StudentViewer } from "@/server/auth/guards";
import type { RequestField } from "@/server/db/schema";
import { newRequestNumber } from "@/server/documents";
import { saveAttachments, type ReadyFile } from "@/server/attachments";
import { now } from "@/lib/time";

export const listRequestTypes = cache(async () =>
  db.select().from(t.requestTypes).orderBy(desc(t.requestTypes.popular), asc(t.requestTypes.title)));
export async function getRequestType(code: string) {
  const [r] = await db.select().from(t.requestTypes).where(eq(t.requestTypes.code, code)).limit(1);
  return r ?? null;
}

export async function listMyRequests(v: StudentViewer, cursor: { createdAt: Date; id: string } | null = null, limit = 30) {
  const conds = [eq(t.requests.studentId, v.studentId)];
  if (cursor) conds.push(or(lt(t.requests.createdAt, cursor.createdAt), and(eq(t.requests.createdAt, cursor.createdAt), lt(t.requests.id, cursor.id)))!);
  const rows = await db.select({
    id: t.requests.id, number: t.requests.number, status: t.requests.status, createdAt: t.requests.createdAt, updatedAt: t.requests.updatedAt, dueAt: t.requests.dueAt,
    staffComment: t.requests.staffComment, title: t.requestTypes.title, icon: t.requestTypes.icon, code: t.requestTypes.code, documentId: t.documents.id,
  }).from(t.requests)
    .innerJoin(t.requestTypes, eq(t.requestTypes.id, t.requests.typeId))
    .leftJoin(t.documents, eq(t.documents.requestId, t.requests.id))
    .where(and(...conds)).orderBy(desc(t.requests.createdAt), desc(t.requests.id)).limit(limit + 1);
  return { items: rows.slice(0, limit), next: rows.length > limit ? rows[limit - 1] : null };
}

/** Заявка по id — только своя. Чужая/несуществующая → null → страница отдаёт 404. */
export async function getMyRequest(v: StudentViewer, id: string) {
  if (!z.uuid().safeParse(id).success) return null;
  const r = await db.query.requests.findFirst({
    where: and(eq(t.requests.id, id), eq(t.requests.studentId, v.studentId)),
    with: { type: true, events: { orderBy: asc(t.requestEvents.createdAt) }, document: true, assignee: { columns: { lastName: true, firstName: true, middleName: true } }, feedback: { columns: { rating: true, comment: true } } },
  });
  return r ?? null;
}

/**
 * Тексты ошибок для студента. По умолчанию — русские (unit-тесты, помощник); Server Action передаёт переведённые (i18n).
 */
export type RequestMsgs = {
  tooLong: (max: number) => string; chooseOption: string; required: (label: string) => string;
  noType: string; checkFields: string; createFailed: string; replyNotAllowed: string; withdrawNotAllowed: string; rateNotAllowed: string; alreadyRated: string;
};
export const RU_REQUEST_MSGS: RequestMsgs = {
  tooLong: (max) => `Не длиннее ${max} символов`, chooseOption: "Выберите вариант из списка", required: (label) => `Заполните поле «${label}»`,
  noType: "Такого вида заявки нет", checkFields: "Проверьте поля формы", createFailed: "Не удалось создать заявку",
  replyNotAllowed: "Ответить можно, когда деканат просит дополнить заявку", withdrawNotAllowed: "Отозвать можно только заявку, которую ещё не взяли в работу",
  rateNotAllowed: "Оценить можно, когда заявка закрыта", alreadyRated: "Вы уже оценили эту заявку",
};

/** zod-схема формы строится из описания полей типа заявки — сервер не доверяет клиенту. */
export function schemaForFields(fields: RequestField[], m: RequestMsgs = RU_REQUEST_MSGS) {
  const shape: Record<string, z.ZodType<string>> = {};
  for (const f of fields) {
    let s = z.string().trim().max(f.max ?? 300, m.tooLong(f.max ?? 300));
    if (f.kind === "select" && f.options) s = s.refine((x) => x === "" || f.options!.includes(x), m.chooseOption) as unknown as typeof s;
    shape[f.name] = f.required ? s.min(1, m.required(f.label)) : s.optional().transform((x) => x ?? "") as unknown as z.ZodType<string>;
  }
  return z.object(shape).strict();
}

export async function createMyRequest(v: StudentViewer, code: string, raw: Record<string, unknown>, comment: string | null, files: ReadyFile[] = [], m: RequestMsgs = RU_REQUEST_MSGS) {
  const type = await getRequestType(code);
  if (!type) return { ok: false as const, error: m.noType };
  const parsed = schemaForFields(type.fields, m).safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0] ?? "_")] = i.message;
    return { ok: false as const, error: m.checkFields, fieldErrors };
  }
  const payload = Object.fromEntries(Object.entries(parsed.data).filter(([, val]) => val !== ""));
  const created = now();
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const id = await db.transaction(async (tx) => {
        const [r] = await tx.insert(t.requests).values({
          number: newRequestNumber(), studentId: v.studentId, typeId: type.id, payload, studentComment: comment?.slice(0, 500) || null,
          dueAt: new Date(+created + type.slaDays * 86400000),
        }).returning({ id: t.requests.id, number: t.requests.number });
        await tx.insert(t.requestEvents).values({ requestId: r.id, status: "SUBMITTED", actor: "Студент", comment: [comment?.slice(0, 500), files.length ? `Приложено файлов: ${files.length}` : null].filter(Boolean).join(" · ") || null });
        await saveAttachments(tx, r.id, "STUDENT", files);
        await tx.insert(t.notifications).values({ userId: v.userId, kind: "REQUEST", title: `${type.title}: подана`, body: `Заявка ${r.number} принята. Срок — ${type.slaDays} ${type.slaDays === 1 ? "рабочий день" : "рабочих дня"}. Статус будет обновляться здесь.`, link: `/requests/${r.id}`, readAt: new Date() });
        return r.id;
      });
      return { ok: true as const, id };
    } catch (e) {
      // Раунд 7: Drizzle оборачивает ошибку PostgreSQL («Failed query: …»), код 23505 лежит в cause —
      // прежняя проверка по тексту сообщения не срабатывала, и повтор при совпадении номера не выполнялся.
      const pg = (e as { code?: string; cause?: { code?: string; constraint?: string } });
      const unique = pg.code === "23505" || pg.cause?.code === "23505";
      if (attempt === 2 || !unique) throw e;
    }
  }
  return { ok: false as const, error: m.createFailed };
}

/** Студент отвечает на «нужно дополнить» или отзывает заявку. Только свою и только в допустимом статусе. */
export async function replyToMyRequest(v: StudentViewer, id: string, comment: string, files: ReadyFile[] = [], m: RequestMsgs = RU_REQUEST_MSGS) {
  const r = await getMyRequest(v, id);
  if (!r) return { ok: false as const, notFound: true };
  if (r.status !== "NEEDS_INFO") return { ok: false as const, error: m.replyNotAllowed };
  await db.transaction(async (tx) => {
    await tx.update(t.requests).set({ status: "SUBMITTED", studentComment: comment, updatedAt: new Date() }).where(and(eq(t.requests.id, id), eq(t.requests.studentId, v.studentId)));
    await tx.insert(t.requestEvents).values({ requestId: id, status: "SUBMITTED", actor: "Студент", comment: files.length ? `${comment} · приложено файлов: ${files.length}` : comment });
    await saveAttachments(tx, id, "STUDENT", files);
  });
  return { ok: true as const };
}

export async function withdrawMyRequest(v: StudentViewer, id: string, m: RequestMsgs = RU_REQUEST_MSGS) {
  const r = await getMyRequest(v, id);
  if (!r) return { ok: false as const, notFound: true };
  if (r.status !== "SUBMITTED") return { ok: false as const, error: m.withdrawNotAllowed };
  await db.transaction(async (tx) => {
    await tx.update(t.requests).set({ status: "REJECTED", staffComment: "Отозвана студентом", updatedAt: new Date() }).where(and(eq(t.requests.id, id), eq(t.requests.studentId, v.studentId)));
    await tx.insert(t.requestEvents).values({ requestId: id, status: "REJECTED", actor: "Студент", comment: "Отозвана студентом" });
  });
  return { ok: true as const };
}

export const feedbackSchema = z.object({
  rating: z.coerce.number().int().min(1, "Поставьте оценку от 1 до 5").max(5),
  comment: z.string().trim().max(500, "Не длиннее 500 символов").optional(),
});

/** Оценка работы деканата — только своя заявка, только закрытая (выдана/отклонена), один раз. */
export async function rateMyRequest(v: StudentViewer, id: string, input: z.infer<typeof feedbackSchema>, m: RequestMsgs = RU_REQUEST_MSGS) {
  const r = await getMyRequest(v, id);
  if (!r) return { ok: false as const, notFound: true };
  if (r.status !== "ISSUED" && r.status !== "REJECTED" && !(r.status === "READY" && !r.type.producesDocument)) return { ok: false as const, error: m.rateNotAllowed };
  const res = await db.insert(t.requestFeedback).values({ requestId: r.id, studentId: v.studentId, rating: input.rating, comment: input.comment || null })
    .onConflictDoNothing({ target: t.requestFeedback.requestId }).returning({ id: t.requestFeedback.id });
  return res.length ? { ok: true as const } : { ok: false as const, error: m.alreadyRated };
}
