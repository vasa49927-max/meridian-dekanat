"use client";
import { useActionState, useState } from "react";
import { CheckCircle2, MapPin } from "lucide-react";
import { bookAction, type BookState } from "@/app/(student)/appointments/actions";
import { Button } from "@/components/ui/button";
import { Label, Select, Textarea } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { useI18n } from "@/i18n/client";

type Day = { key: string; label: string; date: string; slots: { id: string; time: string }[] };
/** Тема визита: value — русское значение (сохраняется в БД), label — подпись на языке интерфейса. */
type Topic = { value: string; label: string };

export function Booking({ days, staff, location, topics }: { days: Day[]; staff: string; location: string; topics: Topic[] }) {
  const { t, tn } = useI18n();
  const [state, action, pending] = useActionState<BookState, FormData>(bookAction, {});
  const [day, setDay] = useState(days[0]?.key);
  const [slot, setSlot] = useState<string | null>(null);
  const current = days.find((d) => d.key === day);
  if (state.ok) return <div role="status" className="flex flex-wrap items-center gap-3 rounded-xl bg-ok-bg px-4 py-3 font-medium text-ok"><CheckCircle2 className="h-5 w-5" aria-hidden />{t("appointments.book.success")}<a href="/appointments" className="ml-auto underline">{t("appointments.book.again")}</a></div>;
  return (
    <form action={action} className="space-y-4">
      <p className="text-sm text-muted">{staff}<br /><span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" aria-hidden />{location}</span></p>
      <fieldset className="min-w-0">
        <legend className="mb-2 text-sm font-semibold">{t("appointments.book.day")}</legend>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          {days.map((d) => (
            <button key={d.key} type="button" onClick={() => { setDay(d.key); setSlot(null); }} aria-pressed={d.key === day}
              className={cn("min-w-[120px] shrink-0 whitespace-nowrap rounded-xl border px-3 py-2 text-left", d.key === day ? "border-primary bg-primary text-primary-fg" : "border-line bg-surface hover:bg-surface-2")}>
              <span className="block text-[15px] font-semibold tabular">{d.label}</span><span className="block text-xs opacity-80">{d.date} · {tn("appointments.book.slots", d.slots.length)}</span>
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="min-w-0">
        <legend className="mb-2 text-sm font-semibold">{t("appointments.book.time")}</legend>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {current?.slots.map((s) => (
            <label key={s.id} className={cn("cursor-pointer rounded-xl border py-2 text-center text-sm font-semibold tabular has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[var(--focus)]", slot === s.id ? "border-primary bg-primary-soft text-primary dark:text-accent-text" : "border-line hover:bg-surface-2")}>
              <input type="radio" name="slotId" value={s.id} className="sr-only" checked={slot === s.id} onChange={() => setSlot(s.id)} />{s.time}
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <Label htmlFor="topic">{t("appointments.book.topic")}</Label>
        <Select id="topic" name="topic" defaultValue={topics[0]?.value}>{topics.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}</Select>
      </div>
      <div>
        <Label htmlFor="ap-comment">{t("appointments.book.comment")}</Label>
        <Textarea id="ap-comment" name="comment" maxLength={500} className="min-h-20" placeholder={t("appointments.book.optional")} />
      </div>
      {state.error && <p role="alert" className="text-sm font-medium text-danger">{state.error}</p>}
      <Button type="submit" disabled={!slot || pending}>{pending ? t("appointments.book.submitting") : slot ? t("appointments.book.submit") : t("appointments.book.pick")}</Button>
    </form>
  );
}
