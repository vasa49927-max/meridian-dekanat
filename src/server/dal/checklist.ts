import "server-only";
import { and, eq } from "drizzle-orm";
import { db, schema as t } from "@/server/db";
import type { StudentViewer } from "@/server/auth/guards";
import { isChecklistKey } from "@/lib/checklist";

/** Отметки чек-листа — только свои (studentId из сессии). */
export async function listMyChecklist(v: StudentViewer) {
  const rows = await db.select({ item: t.checklistDone.item }).from(t.checklistDone).where(eq(t.checklistDone.studentId, v.studentId));
  return new Set(rows.map((r) => r.item));
}

export async function toggleMyChecklist(v: StudentViewer, item: string, done: boolean) {
  if (!isChecklistKey(item)) return false;
  if (done) await db.insert(t.checklistDone).values({ studentId: v.studentId, item }).onConflictDoNothing();
  else await db.delete(t.checklistDone).where(and(eq(t.checklistDone.studentId, v.studentId), eq(t.checklistDone.item, item)));
  return true;
}
