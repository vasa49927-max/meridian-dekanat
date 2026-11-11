import { studentViewerByUserId } from "@/server/auth/guards";
import { calendarFor, feedOwner } from "@/server/calendar";
import { isLocale } from "@/i18n/config";

/**
 * Подписка на календарь: GET /api/calendar/<секретный-токен>.ics — без cookie (её не отправит календарь телефона).
 * Владелец определяется только по токену; неверный/отозванный токен → 404 без подробностей.
 */
export async function GET(req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const token = file.replace(/\.ics$/, "");
  const userId = await feedOwner(token);
  const v = userId ? await studentViewerByUserId(userId) : null;
  if (!v) return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  const lang = new URL(req.url).searchParams.get("lang");
  return new Response(await calendarFor(v, isLocale(lang) ? lang : "ru"), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": 'inline; filename="meridian.ics"',
      "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex",
    },
  });
}
