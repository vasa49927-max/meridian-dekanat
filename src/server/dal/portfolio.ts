import "server-only";
import { and, count, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema as t } from "@/server/db";
import type { StudentViewer } from "@/server/auth/guards";

/** Портфолио студента (раунд 6, №7). Только свои записи: всё фильтруется по viewer.studentId. */
export const PORTFOLIO_KINDS = ["OLYMPIAD", "CONFERENCE", "INTERNSHIP", "CERTIFICATE", "VOLUNTEER", "PUBLICATION"] as const;
export const MAX_ITEMS = 50;
export const portfolioSchema = z.object({
  kind: z.enum(PORTFOLIO_KINDS),
  title: z.string().trim().min(3).max(200),
  org: z.string().trim().max(200).optional(),
  date: z.string().regex(/^(19|20)\d{2}-(0[1-9]|1[0-2])$/),
  description: z.string().trim().max(600).optional(),
});

export async function listMyPortfolio(v: StudentViewer) {
  return db.select().from(t.portfolioItems).where(eq(t.portfolioItems.studentId, v.studentId)).orderBy(desc(t.portfolioItems.date), desc(t.portfolioItems.createdAt));
}

export async function addMyPortfolioItem(v: StudentViewer, d: z.infer<typeof portfolioSchema>) {
  const [{ n }] = await db.select({ n: count() }).from(t.portfolioItems).where(eq(t.portfolioItems.studentId, v.studentId));
  if (n >= MAX_ITEMS) return { ok: false as const, error: "limit" as const };
  // verified всегда false: подтверждает только деканат
  await db.insert(t.portfolioItems).values({ studentId: v.studentId, kind: d.kind, title: d.title, org: d.org || null, date: d.date, description: d.description || null, verified: false });
  return { ok: true as const };
}

/** Удалить можно только свою неподтверждённую запись (подтверждённую ведёт деканат); чужая — «не найдена». */
export async function deleteMyPortfolioItem(v: StudentViewer, id: string) {
  if (!z.uuid().safeParse(id).success) return false;
  const r = await db.delete(t.portfolioItems).where(and(eq(t.portfolioItems.id, id), eq(t.portfolioItems.studentId, v.studentId), eq(t.portfolioItems.verified, false))).returning({ id: t.portfolioItems.id });
  return r.length > 0;
}
