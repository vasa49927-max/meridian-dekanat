"use client";
import { useActionState, useState } from "react";
import { Megaphone } from "lucide-react";
import { publishAnnouncementAction, type StaffState } from "@/app/(staff)/staff/actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/field";

export function AnnouncementForm({ faculties, groups }: { faculties: { id: string; code: string }[]; groups: { id: string; label: string }[] }) {
  const [state, action, pending] = useActionState<StaffState, FormData>(publishAnnouncementAction, {});
  const [aud, setAud] = useState("ALL");
  return (
    <form action={action} className="space-y-3" key={state.ok} noValidate>
      <div><Label htmlFor="a-title">Заголовок</Label><Input id="a-title" name="title" required maxLength={140} placeholder="Например: перенос консультации по статистике" /></div>
      <div><Label htmlFor="a-body">Текст</Label><Textarea id="a-body" name="body" required maxLength={2000} /></div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div><Label htmlFor="a-aud">Кому</Label><Select id="a-aud" name="audience" value={aud} onChange={(e) => setAud(e.target.value)}><option value="ALL">Всем студентам</option><option value="FACULTY">Факультету</option><option value="COURSE">Курсу факультета</option><option value="GROUP">Группе</option></Select></div>
        {(aud === "FACULTY" || aud === "COURSE") && <div><Label htmlFor="a-fac">Факультет</Label><Select id="a-fac" name="facultyId">{faculties.map((f) => <option key={f.id} value={f.id}>{f.code}</option>)}</Select></div>}
        {aud === "COURSE" && <div><Label htmlFor="a-course">Курс</Label><Select id="a-course" name="course">{[1, 2, 3, 4].map((c) => <option key={c} value={c}>{c} курс</option>)}</Select></div>}
        {aud === "GROUP" && <div><Label htmlFor="a-group">Группа</Label><Select id="a-group" name="groupId">{groups.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}</Select></div>}
      </div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="important" className="h-4 w-4 accent-[var(--primary)]" />Важное — выделить и поднять в ленте</label>
      {state.error && <p role="alert" className="rounded-xl bg-danger-bg px-3 py-2 text-sm text-danger">{state.error}</p>}
      {state.ok && <p role="status" className="rounded-xl bg-ok-bg px-3 py-2 text-sm text-ok">{state.ok}</p>}
      <Button type="submit" disabled={pending}><Megaphone className="h-4 w-4" aria-hidden />{pending ? "Публикуем…" : "Опубликовать"}</Button>
    </form>
  );
}
