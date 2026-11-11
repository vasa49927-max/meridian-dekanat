import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema as t } from "@/server/db";
import type { StaffViewer, StudentViewer } from "@/server/auth/guards";
import { getMyGrades } from "@/server/dal/student";
import { dayKey, now } from "@/lib/time";

/**
 * Анонимный опрос о курсах (раунд 6, улучшение №6).
 * 1. Ответ (survey_responses) НЕ содержит studentId и точного времени — только день.
 * 2. Повторный ответ блокирует отдельная запись survey_votes с хэшем sha256(секрет:студент:курс).
 *    Секрет хранится в app_settings и в клиент не попадает; по хэшу нельзя найти ответ — между таблицами нет связи.
 * 3. Деканат видит итоги курса только при ≥ MIN_RESPONSES ответах (k-анонимность), комментарии — тоже.
 */
export const MIN_RESPONSES = 3;
export const surveySchema = z.object({
  offeringId: z.uuid(),
  clarity: z.coerce.number().int().min(1).max(5),
  teacher: z.coerce.number().int().min(1).max(5),
  workload: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(500).optional(),
});

let secret: string | null = null;
async function surveySecret() {
  if (secret) return secret;
  const [row] = await db.select().from(t.appSettings).where(eq(t.appSettings.key, "survey_secret"));
  if (row) return (secret = row.value);
  await db.insert(t.appSettings).values({ key: "survey_secret", value: randomBytes(32).toString("base64url") }).onConflictDoNothing();
  const [again] = await db.select().from(t.appSettings).where(eq(t.appSettings.key, "survey_secret"));
  return (secret = again.value);
}

const voterHash = async (studentId: string, offeringId: string) => createHash("sha256").update(`${await surveySecret()}:${studentId}:${offeringId}`).digest("hex");

/** Курсы студента для опроса и отметка «уже ответил» (по хэшу). */
export async function listMySurveyCourses(v: StudentViewer) {
  const { current } = await getMyGrades(v);
  const hashes = await Promise.all(current.map((d) => voterHash(v.studentId, d.id)));
  const voted = hashes.length ? new Set((await db.select().from(t.surveyVotes).where(inArray(t.surveyVotes.voterHash, hashes))).map((x) => x.voterHash)) : new Set<string>();
  return current.map((d, i) => ({ id: d.id, name: d.name, teacherLast: d.teacherLast, teacherFirst: d.teacherFirst, teacherMiddle: d.teacherMiddle, teacherTitle: d.teacherTitle, voted: voted.has(hashes[i]) }));
}

export async function submitMySurvey(v: StudentViewer, input: z.infer<typeof surveySchema>) {
  const { current } = await getMyGrades(v);
  if (!current.some((d) => d.id === input.offeringId)) return { ok: false as const, error: "notFound" as const }; // только свои курсы
  const hash = await voterHash(v.studentId, input.offeringId);
  try {
    await db.transaction(async (tx) => {
      await tx.insert(t.surveyVotes).values({ voterHash: hash }); // PK: второй ответ упадёт здесь
      await tx.insert(t.surveyResponses).values({ offeringId: input.offeringId, clarity: input.clarity, teacher: input.teacher, workload: input.workload, comment: input.comment || null, day: dayKey(now()) });
    });
  } catch {
    return { ok: false as const, error: "already" as const };
  }
  return { ok: true as const };
}

/** Итоги для деканата: только агрегаты; курсы с < MIN_RESPONSES ответами — без цифр и комментариев. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- viewer нужен как «пропуск»: вызвать без роли STAFF нельзя по типам
export async function staffSurveyResults(_v: StaffViewer) {
  const rows = (await db.execute(sql`
    select o.id, d.name, g.name as grp, f.code as faculty, te.last_name, te.first_name, te.middle_name, te.title,
      count(r.id)::int as n, avg(r.clarity) as clarity, avg(r.teacher) as teacher, avg(r.workload) as workload
    from course_offerings o
    join disciplines d on d.id = o.discipline_id join groups g on g.id = o.group_id join faculties f on f.id = g.faculty_id join teachers te on te.id = o.teacher_id
    left join survey_responses r on r.offering_id = o.id
    group by o.id, d.name, g.name, f.code, te.last_name, te.first_name, te.middle_name, te.title
    order by count(r.id) desc, d.name`)).rows as Record<string, unknown>[];
  const open = rows.filter((r) => Number(r.n) >= MIN_RESPONSES).map((r) => String(r.id));
  const comments = open.length
    ? await db.select({ offeringId: t.surveyResponses.offeringId, comment: t.surveyResponses.comment }).from(t.surveyResponses).where(and(inArray(t.surveyResponses.offeringId, open), sql`${t.surveyResponses.comment} is not null`))
    : [];
  const num = (x: unknown) => (x == null ? null : Math.round(Number(x) * 10) / 10);
  return rows.map((r) => {
    const n = Number(r.n);
    const shown = n >= MIN_RESPONSES;
    return {
      id: String(r.id), name: String(r.name), group: `${r.faculty} · ${r.grp}`,
      teacher: `${r.title} ${r.last_name} ${String(r.first_name)[0]}.${r.middle_name ? ` ${String(r.middle_name)[0]}.` : ""}`,
      n, shown,
      clarity: shown ? num(r.clarity) : null, teacherScore: shown ? num(r.teacher) : null, workload: shown ? num(r.workload) : null,
      // Комментарии перемешаны (порядок вставки не раскрываем)
      comments: shown ? comments.filter((c) => c.offeringId === r.id).map((c) => c.comment!).sort() : [],
    };
  });
}
