"use client";
import { useActionState, useState } from "react";
import { changeLessonAction, type StaffState } from "@/app/(staff)/staff/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/field";

type L = { id: string; title: string; time: string; date: string; room: string; building: string; type: string; status: string; subgroup: number | null; prev: string | null; past: boolean };

export function LessonEditor({ lesson: l }: { lesson: L }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"move" | "cancel">("move");
  const [state, action, pending] = useActionState<StaffState, FormData>(changeLessonAction, {});
  return (
    <div>
      <div className="flex items-start gap-3">
        <span className={`w-12 shrink-0 pt-0.5 font-semibold tabular ${l.past ? "text-muted" : ""}`}>{l.time}</span>
        <div className="min-w-0 flex-1">
          <p className="font-medium leading-snug">{l.title}</p>
          <p className="text-xs text-muted">{l.type} · ауд. {l.room}, корп. {l.building}{l.subgroup ? (l.subgroup === 9 ? " · только ВУЦ" : ` · подгр. ${l.subgroup}`) : ""}</p>
          {l.status !== "SCHEDULED" && <p className="mt-0.5 text-xs text-warn"><Badge tone={l.status === "CANCELLED" ? "danger" : "warn"}>{l.status === "CANCELLED" ? "отменена" : "изменена"}</Badge>{l.prev ? ` было: ${l.prev}` : ""}</p>}
        </div>
        {l.status !== "CANCELLED" && !l.past && <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(!open)} aria-expanded={open}>{open ? "Закрыть" : "Изменить"}</Button>}
      </div>
      {open && (
        <form action={action} className="mt-3 space-y-3 rounded-xl bg-bg p-3">
          <input type="hidden" name="lessonId" value={l.id} />
          <div className="flex gap-2" role="radiogroup" aria-label="Тип изменения">
            {(["move", "cancel"] as const).map((m) => <label key={m} className={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm font-semibold ${mode === m ? "border-primary bg-primary text-primary-fg" : "border-line"}`}><input type="radio" name="action" value={m} checked={mode === m} onChange={() => setMode(m)} className="sr-only" />{m === "move" ? "Перенести / сменить аудиторию" : "Отменить"}</label>)}
          </div>
          {mode === "move" && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <div className="col-span-2 sm:col-span-1"><Label htmlFor={`d-${l.id}`}>Дата</Label><Input id={`d-${l.id}`} type="date" name="date" defaultValue={l.date} /></div>
              <div><Label htmlFor={`t-${l.id}`}>Время</Label><Select id={`t-${l.id}`} name="time" defaultValue={l.time}>{["09:00", "10:40", "12:55", "14:30", "16:10", "17:40"].map((t) => <option key={t}>{t}</option>)}</Select></div>
              <div><Label htmlFor={`r-${l.id}`}>Аудитория</Label><Input id={`r-${l.id}`} name="room" defaultValue={l.room} maxLength={30} /></div>
            </div>
          )}
          <div><Label htmlFor={`n-${l.id}`}>Причина (увидят студенты)</Label><Input id={`n-${l.id}`} name="note" required maxLength={300} placeholder="Например: преподаватель на конференции" /></div>
          {state.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}
          {state.ok && <p role="status" className="text-sm text-ok">{state.ok}</p>}
          <Button type="submit" size="sm" disabled={pending}>{pending ? "Сохраняем…" : "Сохранить и уведомить группу"}</Button>
        </form>
      )}
    </div>
  );
}
