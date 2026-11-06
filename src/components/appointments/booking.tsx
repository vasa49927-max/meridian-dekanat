"use client";
import { useActionState, useState } from "react";
import { CheckCircle2, MapPin } from "lucide-react";
import { bookAction, type BookState } from "@/app/(student)/appointments/actions";
import { Button } from "@/components/ui/button";
import { FieldHint, Label, Select, Textarea } from "@/components/ui/field";
import { cn } from "@/lib/cn";

const TOPICS = ["Справки и документы", "Индивидуальный график", "Пересдача / академическая разница", "Перевод, восстановление, академический отпуск", "Оформление темы ВКР", "Другое"];

type Day = { key: string; label: string; date: string; slots: { id: string; time: string }[] };

export function Booking({ days, staff, location }: { days: Day[]; staff: string; location: string }) {
  const [state, action, pending] = useActionState<BookState, FormData>(bookAction, {});
  const [day, setDay] = useState(days[0]?.key);
  const [slot, setSlot] = useState<string | null>(null);
  const current = days.find((d) => d.key === day);
  if (state.ok) return <p role="status" className="flex items-center gap-2 rounded-xl bg-ok-bg px-4 py-3 font-medium text-ok"><CheckCircle2 className="h-5 w-5" aria-hidden />Готово! Запись появилась выше, напоминание придёт в уведомления.</p>;
  return (
    <form action={action} className="space-y-4">
      <p className="text-sm text-muted">{staff}<br /><span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" aria-hidden />{location}</span></p>
      <fieldset className="min-w-0">
        <legend className="mb-2 text-sm font-semibold">День</legend>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          {days.map((d) => (
            <button key={d.key} type="button" onClick={() => { setDay(d.key); setSlot(null); }} aria-pressed={d.key === day}
              className={cn("min-w-[104px] rounded-xl border px-3 py-2 text-left", d.key === day ? "border-primary bg-primary text-primary-fg" : "border-line bg-surface hover:bg-surface-2")}>
              <span className="block text-sm font-semibold first-letter:uppercase">{d.label}</span><span className="block text-xs opacity-80">{d.date} · {d.slots.length} окон</span>
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="min-w-0">
        <legend className="mb-2 text-sm font-semibold">Время (20 минут)</legend>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {current?.slots.map((s) => (
            <label key={s.id} className={cn("cursor-pointer rounded-xl border py-2 text-center text-sm font-semibold tabular has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[var(--focus)]", slot === s.id ? "border-primary bg-primary-soft text-primary dark:text-accent-text" : "border-line hover:bg-surface-2")}>
              <input type="radio" name="slotId" value={s.id} className="sr-only" checked={slot === s.id} onChange={() => setSlot(s.id)} />{s.time}
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <Label htmlFor="topic">Тема визита</Label>
        <Select id="topic" name="topic" defaultValue={TOPICS[0]}>{TOPICS.map((t) => <option key={t}>{t}</option>)}</Select>
      </div>
      <div>
        <Label htmlFor="ap-comment">Что взять с собой / подробности</Label>
        <Textarea id="ap-comment" name="comment" maxLength={500} className="min-h-20" placeholder="Необязательно" />
      </div>
      {state.error && <FieldHint error>{state.error}</FieldHint>}
      <Button type="submit" disabled={!slot || pending}>{pending ? "Записываем…" : slot ? "Записаться" : "Выберите время"}</Button>
    </form>
  );
}
