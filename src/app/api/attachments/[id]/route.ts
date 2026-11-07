import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getViewer } from "@/server/auth/guards";
import { db, schema as t } from "@/server/db";

/**
 * Скачивание вложения. Студент — только из СВОЕЙ заявки (условие student_id из сессии в том же запросе),
 * сотрудник деканата — любое. Чужое и несуществующее → одинаковый 404.
 */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const v = await getViewer();
  if (!v) return Response.json({ error: "Требуется вход" }, { status: 401 });
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return new Response("Не найдено", { status: 404 });
  const owner = v.role === "STUDENT" ? eq(t.requests.studentId, v.studentId) : undefined;
  const [a] = await db.select({ fileName: t.attachments.fileName, mime: t.attachments.mime, data: t.attachments.data })
    .from(t.attachments).innerJoin(t.requests, eq(t.requests.id, t.attachments.requestId))
    .where(and(eq(t.attachments.id, id), owner)).limit(1);
  if (!a) return new Response("Не найдено", { status: 404 });
  const ascii = a.fileName.replace(/[^\x20-\x7e]/g, "_").replace(/"/g, "");
  return new Response(new Uint8Array(a.data), {
    headers: {
      "Content-Type": a.mime,
      "Content-Disposition": `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(a.fileName)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
