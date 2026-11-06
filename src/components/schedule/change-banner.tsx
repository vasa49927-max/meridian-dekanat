import Link from "next/link";
import { ArrowLeftRight, Ban } from "lucide-react";
import { fmt } from "@/lib/time";
import type { LessonView } from "@/server/dal/student";

/** Плашка изменений «было → стало». Перенос и отмена видны сразу, без поиска по расписанию. */
export function ChangeBanner({ changes }: { changes: LessonView[] }) {
  if (!changes.length) return null;
  return (
    <section aria-label="Изменения в расписании" className="rounded-[var(--radius-card)] border border-warn-line bg-warn-bg p-4 text-warn lg:p-5">
      <h2 className="mb-2 flex items-center gap-2 font-semibold"><ArrowLeftRight className="h-5 w-5" aria-hidden /> {changes.length === 1 ? "Изменение в расписании" : `Изменения в расписании: ${changes.length}`}</h2>
      <ul className="space-y-2">
        {changes.slice(0, 3).map((c) => {
          const prev = c.prevStartsAt ?? c.startsAt;
          const key = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Moscow" }).format(c.startsAt);
          return (
            <li key={c.id} className="text-sm leading-relaxed">
              <Link href={`/schedule?d=${key}`} className="hover:underline">
                <b>{c.title}</b>{": "}
                {c.status === "CANCELLED" ? (
                  <><Ban className="inline h-3.5 w-3.5" aria-hidden /> {fmt.shortDay(c.startsAt)}, {fmt.time(c.startsAt)} — <b>отменена</b></>
                ) : (
                  <><s>{fmt.shortDay(prev)}, {fmt.time(prev)}, ауд. {c.prevRoom}</s>{" → "}<b>{fmt.shortDay(c.startsAt)}, {fmt.time(c.startsAt)}, ауд. {c.room}</b></>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
