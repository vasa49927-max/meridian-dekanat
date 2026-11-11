import { studentViewerByUserId } from "@/server/auth/guards";
import { calendarFor, feedOwner } from "@/server/calendar";

/**
 * Подписка на календарь: GET /api/calendar/<секретный-токен>.ics — без cookie (её не отправит календарь телефона).
 * Владелец определяется только по токену; неверный/отозванный токен → 404 без подробностей.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const token = file.replace(/\.ics$/, "");
  const userId = await feedOwner(token);
  const v = userId ? await studentViewerByUserId(userId) : null;
  if (!v) return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  return new Response(await calendarFor(v), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": 'inline; filename="meridian.ics"',
      "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex",
    },
  });
}
