"use client";
import { useActionState, useEffect, useRef } from "react";
import { Send } from "lucide-react";
import type { RequestField } from "@/server/db/schema";
import { createRequestAction, type FormState } from "@/app/(student)/requests/actions";
import { Button } from "@/components/ui/button";
import { FieldHint, Input, Label, Select, Textarea } from "@/components/ui/field";

export function RequestForm({ code, fields, defaults }: { code: string; fields: RequestField[]; defaults: Record<string, string> }) {
  const [state, action, pending] = useActionState<FormState, FormData>(createRequestAction.bind(null, code), {});
  const formRef = useRef<HTMLFormElement>(null);
  // После ошибки — фокус на первое неверное поле (UX-ревью №10).
  useEffect(() => { formRef.current?.querySelector<HTMLElement>("[aria-invalid=true]")?.focus(); }, [state]);
  const val = (n: string) => state.values?.[n] ?? defaults[n] ?? "";
  return (
    <form ref={formRef} action={action} className="space-y-4" noValidate>
      {fields.map((f) => {
        const err = state.fieldErrors?.[f.name];
        const describedBy = [f.hint ? `${f.name}-hint` : "", err ? `${f.name}-err` : ""].filter(Boolean).join(" ") || undefined;
        const common = { id: f.name, name: f.name, required: f.required, "aria-invalid": !!err, "aria-describedby": describedBy, defaultValue: val(f.name) };
        return (
          <div key={f.name}>
            <Label htmlFor={f.name}>{f.label}{f.required && <span className="text-danger" aria-hidden> *</span>}</Label>
            {f.kind === "select" ? (
              <Select {...common} defaultValue={val(f.name) || (f.required ? f.options?.[0] : "")}>
                {!f.required && <option value="">Не выбрано</option>}
                {f.options?.map((o) => <option key={o}>{o}</option>)}
              </Select>
            ) : f.kind === "textarea" ? <Textarea {...common} placeholder={f.placeholder} maxLength={f.max ?? 1000} /> : <Input {...common} placeholder={f.placeholder} maxLength={f.max ?? 300} />}
            {f.hint && <FieldHint id={`${f.name}-hint`}>{f.hint}</FieldHint>}
            {err && <FieldHint id={`${f.name}-err`} error>{err}</FieldHint>}
          </div>
        );
      })}
      <div>
        <Label htmlFor="comment">Комментарий для деканата</Label>
        <Textarea id="comment" name="comment" placeholder="Необязательно. Например, к какому сроку нужен документ" maxLength={500} defaultValue={state.values?.comment ?? ""} className="min-h-20" />
      </div>
      {state.error && <p role="alert" className="rounded-xl bg-danger-bg px-3.5 py-2.5 text-sm font-medium text-danger">{state.error}</p>}
      <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={pending}><Send className="h-5 w-5" aria-hidden />{pending ? "Отправляем…" : "Отправить заявку"}</Button>
    </form>
  );
}
