"use client";
import { useActionState, useState } from "react";
import { changeStatusAction, type StaffState } from "@/app/(staff)/staff/actions";
import { Button } from "@/components/ui/button";
import { FieldHint, Label, Textarea } from "@/components/ui/field";
import { cn } from "@/lib/cn";

const HINT: Record<string, string> = {
  IN_PROGRESS: "Студент увидит, что заявку взяли в работу.",
  NEEDS_INFO: "Обязательно напишите, чего не хватает.",
  READY: "Для справок автоматически сформируется электронный документ с QR-кодом.",
  ISSUED: "Бумажный экземпляр выдан студенту.",
  REJECTED: "Обязательно укажите причину — студент увидит её.",
};

export function StatusForm({ id, options, producesDocument }: { id: string; options: { value: string; label: string }[]; producesDocument: boolean }) {
  const [state, action, pending] = useActionState<StaffState, FormData>(changeStatusAction, {});
  const [sel, setSel] = useState(options[0].value);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="id" value={id} />
      <fieldset className="min-w-0">
        <legend className="mb-2 text-sm font-semibold">Новый статус</legend>
        <div className="flex flex-wrap gap-2">
          {options.map((o) => (
            <label key={o.value} className={cn("cursor-pointer rounded-xl border px-3 py-2 text-sm font-semibold has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[var(--focus)]", sel === o.value ? "border-primary bg-primary text-primary-fg" : "border-line hover:bg-surface-2", o.value === "REJECTED" && sel !== o.value && "text-danger")}>
              <input type="radio" name="status" value={o.value} checked={sel === o.value} onChange={() => setSel(o.value)} className="sr-only" />{o.label}
            </label>
          ))}
        </div>
        <FieldHint>{sel === "READY" && !producesDocument ? "Заявление рассмотрено положительно." : HINT[sel]}</FieldHint>
      </fieldset>
      <div>
        <Label htmlFor="st-comment">Комментарий для студента{["NEEDS_INFO", "REJECTED"].includes(sel) && <span className="text-danger"> *</span>}</Label>
        <Textarea id="st-comment" name="comment" maxLength={800} className="min-h-24" placeholder={sel === "REJECTED" ? "Причина отказа" : "Необязательно"} />
      </div>
      {state.error && <p role="alert" className="rounded-xl bg-danger-bg px-3 py-2 text-sm text-danger">{state.error}</p>}
      {state.ok && <p role="status" className="rounded-xl bg-ok-bg px-3 py-2 text-sm text-ok">{state.ok}</p>}
      <Button type="submit" disabled={pending} className="w-full">{pending ? "Сохраняем…" : "Сохранить и уведомить студента"}</Button>
    </form>
  );
}
