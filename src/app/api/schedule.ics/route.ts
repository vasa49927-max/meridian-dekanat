import { apiViewer } from "@/server/auth/guards";
import { calendarFor } from "@/server/calendar";
import { getLocale } from "@/i18n/server";

/** Разовая выгрузка личного расписания (.ics). Только своё — по сессии. Подписка — /api/calendar/<токен>.ics */
export async function GET() {
  const auth = await apiViewer("STUDENT");
  if ("error" in auth) return auth.error;
  return new Response(await calendarFor(auth.viewer, await getLocale()), {
    headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": 'attachment; filename="meridian-schedule.ics"', "Cache-Control": "private, no-store" },
  });
}
