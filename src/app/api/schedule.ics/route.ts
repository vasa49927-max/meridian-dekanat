import { apiViewer } from "@/server/auth/guards";
import { listMyLessons } from "@/server/dal/student";
import { addDays, now, startOfWeek } from "@/lib/time";
import { LESSON_TYPE } from "@/components/schedule/lesson-meta";

/** Экспорт личного расписания в календарь (iCalendar, RFC 5545). Только своё — по сессии. */
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
const dt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const fold = (line: string) => line.match(/.{1,70}/g)?.join("\r\n ") ?? line;

export async function GET() {
  const auth = await apiViewer("STUDENT");
  if ("error" in auth) return auth.error;
  const from = addDays(startOfWeek(now()), -7);
  const lessons = await listMyLessons(auth.viewer, from, addDays(from, 120));
  const stamp = dt(new Date());
  const lines = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Meridian concept//RU", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    "X-WR-CALNAME:Меридиан — расписание", "X-WR-TIMEZONE:Europe/Moscow",
  ];
  for (const l of lessons) {
    const teacher = l.teacherLast ? `${l.teacherTitle} ${l.teacherLast} ${l.teacherFirst} ${l.teacherMiddle ?? ""}`.trim() : "";
    const note = l.status === "MOVED" ? `Изменение: ${l.changeNote ?? ""}` : l.status === "CANCELLED" ? `Отменено: ${l.changeNote ?? ""}` : "";
    lines.push(
      "BEGIN:VEVENT", `UID:${l.id}@meridian`, `DTSTAMP:${stamp}`, `DTSTART:${dt(l.startsAt)}`, `DTEND:${dt(l.endsAt)}`,
      fold(`SUMMARY:${esc(`${l.status === "CANCELLED" ? "[ОТМЕНА] " : ""}${l.title} (${LESSON_TYPE[l.type]})`)}`),
      fold(`LOCATION:${esc(`ауд. ${l.room}, ${l.buildingName}, ${l.buildingAddress}`)}`),
      fold(`DESCRIPTION:${esc([teacher, note].filter(Boolean).join("\n"))}`),
      `STATUS:${l.status === "CANCELLED" ? "CANCELLED" : "CONFIRMED"}`, "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return new Response(lines.join("\r\n"), {
    headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": 'attachment; filename="meridian-schedule.ics"', "Cache-Control": "private, no-store" },
  });
}
