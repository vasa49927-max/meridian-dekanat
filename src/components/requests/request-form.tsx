"use client";
import { useActionState, useEffect, useRef } from "react";
import { Send } from "lucide-react";
import type { RequestField } from "@/server/db/schema";
import { createRequestAction, type FormState } from "@/app/(student)/requests/actions";
import { Button } from "@/components/ui/button";
import { FieldHint, Input, Label, Select, Textarea } from "@/components/ui/field";
import { FileField } from "./file-field";
import { useI18n } from "@/i18n/client";

export function RequestForm({ code, fields, defaults }: { code: string; fields: RequestField[]; defaults: Record<string, string> }) {
  const { t, tr } = useI18n();
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
            <Label htmlFor={f.name}>{tr("rt", f.label)}{f.required && <span className="text-danger" aria-hidden> *</span>}</Label>
            {f.kind === "select" ? (
              <Select {...common} defaultValue={val(f.name) || (f.required ? f.options?.[0] : "")}>
                {!f.required && <option value="">{t("requests.form.notSelected")}</option>}
                {/* Значение уходит на сервер как есть (русское, из списка) — переводим только подпись. */}
                {f.options?.map((o) => <option key={o} value={o}>{tr("rt", o)}</option>)}
              </Select>
            ) : f.kind === "textarea" ? <Textarea {...common} placeholder={f.placeholder ? tr("rt", f.placeholder) : undefined} maxLength={f.max ?? 1000} /> : <Input {...common} placeholder={f.placeholder ? tr("rt", f.placeholder) : undefined} maxLength={f.max ?? 300} />}
            {f.hint && <FieldHint id={`${f.name}-hint`}>{tr("rt", f.hint)}</FieldHint>}
            {err && <FieldHint id={`${f.name}-err`} error>{err}</FieldHint>}
          </div>
        );
      })}
      <div>
        <Label htmlFor="comment">{t("requests.form.comment")}</Label>
        <Textarea id="comment" name="comment" placeholder={t("requests.form.commentPlaceholder")} maxLength={500} defaultValue={state.values?.comment ?? ""} className="min-h-20" />
      </div>
      <FileField label={t("requests.form.filesLabel")} hint={t("requests.form.filesHint")} error={state.fieldErrors?.files} />
      {state.error && <p role="alert" className="rounded-xl bg-danger-bg px-3.5 py-2.5 text-sm font-medium text-danger">{state.error}</p>}
      <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={pending}><Send className="h-5 w-5" aria-hidden />{pending ? t("requests.form.sending") : t("requests.form.submit")}</Button>
    </form>
  );
}
