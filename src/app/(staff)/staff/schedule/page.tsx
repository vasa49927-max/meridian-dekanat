import Link from "next/link";
import type { Metadata } from "next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { requireStaff } from "@/server/auth/guards";
import { staffAudienceOptions, staffListLessons } from "@/server/dal/staff";
import { addDays, dayKey, fmt, isSameDay, mskParts, now, parseDayKey, startOfWeek } from "@/lib/time";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { LessonEditor } from "@/components/staff/lesson-editor";
import { LESSON_TYPE } from "@/components/schedule/lesson-meta";

export const metadata: Metadata = { title: "Переносы пар — деканат" };

export default async function StaffSchedulePage({ searchParams }: { searchParams: Promise<{ g?: string; w?: string }> }) {
  await requireStaff();
  const sp = await searchParams;
  const { groups } = await staffAudienceOptions();
  const group = groups.find((g) => g.id === sp.g) ?? groups[0];
  const at = now();
  // В воскресенье сразу показываем следующую учебную неделю.
  const week = startOfWeek(parseDayKey(sp.w) ?? (mskParts(at).weekday === 7 ? addDays(at, 1) : at));
  const lessons = group ? await staffListLessons(group.id, week, addDays(week, 7)) : [];
  const days = Array.from({ length: 6 }, (_, i) => addDays(week, i));
  const link = (w: Date) => `/staff/schedule?g=${group?.id}&w=${dayKey(w)}`;
  return (
    <div className="pt-2 lg:pt-0">
      <PageHeader title="Переносы и отмены" subtitle="Изменение сразу видно студентам в расписании и приходит им уведомлением" />
      <form className="mb-4 flex flex-wrap items-end gap-2">
        <label className="min-w-[220px] flex-1 sm:flex-none"><span className="mb-1.5 block text-sm font-semibold">Группа</span><Select name="g" defaultValue={group?.id}>{groups.map((g) => <option key={g.id} value={g.id}>{g.faculty} · {g.course} курс · гр. {g.name}</option>)}</Select></label>
        <input type="hidden" name="w" value={dayKey(week)} />
        <Button variant="secondary" type="submit">Показать</Button>
        <div className="ml-auto flex items-center gap-1">
          <Link href={link(addDays(week, -7))} aria-label="Предыдущая неделя" className="grid h-11 w-11 place-items-center rounded-xl border border-line bg-surface"><ChevronLeft className="h-5 w-5" aria-hidden /></Link>
          <span className="px-2 text-sm font-semibold">{fmt.dayMonthShort(week)} — {fmt.dayMonthShort(addDays(week, 5))}</span>
          <Link href={link(addDays(week, 7))} aria-label="Следующая неделя" className="grid h-11 w-11 place-items-center rounded-xl border border-line bg-surface"><ChevronRight className="h-5 w-5" aria-hidden /></Link>
        </div>
      </form>
      <div className="grid gap-4 lg:grid-cols-2">
        {days.map((d) => {
          const list = lessons.filter((l) => isSameDay(l.startsAt, d));
          return (
            <Card key={+d} aria-label={fmt.longDay(d)}>
              <h2 className="mb-2 font-semibold">{fmt.longDay(d)}</h2>
              {list.length ? (
                <ul className="divide-y divide-line">
                  {list.map((l) => (
                    <li key={l.id} className="py-2.5">
                      <LessonEditor lesson={{ id: l.id, title: l.title, time: fmt.time(l.startsAt), date: dayKey(l.startsAt), room: l.room, building: l.building, type: LESSON_TYPE[l.type], status: l.status, subgroup: l.subgroup, past: l.endsAt < at, prev: l.prevStartsAt ? `${fmt.shortDay(l.prevStartsAt)} ${fmt.time(l.prevStartsAt)}, ауд. ${l.prevRoom}` : null }} />
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-muted">Нет занятий</p>}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
