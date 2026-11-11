"use client";
import { useActionState, useState } from "react";
import { Eye, EyeOff, KeyRound, ShieldCheck } from "lucide-react";
import { changePasswordAction, type PwState } from "@/app/(student)/profile/actions";
import { Button } from "@/components/ui/button";
import { FieldHint, Input, Label } from "@/components/ui/field";
import { useI18n } from "@/i18n/client";

/**
 * Строка «Пароль» в профиле (правка капитана №7). Показываем точки, а не сам пароль:
 * сервер его НЕ ЗНАЕТ — в базе только хэш argon2id. Поэтому вместо «показать» — «сменить».
 */
export function PasswordRow({ demo }: { demo: boolean }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [show, setShow] = useState(false);
  const [state, action, pending] = useActionState<PwState, FormData>(changePasswordAction, {});
  const type = show ? "text" : "password";
  const err = (f: PwState["field"]) => (state.field === f ? state.error : undefined);
  return (
    <div className="py-2">
      <div className="grid gap-0.5 sm:grid-cols-[180px_1fr] sm:gap-3">
        <span className="text-sm text-muted">{t("profile.password.label")}</span>
        <span className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-medium tracking-[0.25em]" aria-label={t("profile.password.hidden")}>••••••••••</span>
          <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="tap inline-flex items-center gap-1.5 text-sm font-semibold text-primary dark:text-accent-text"><KeyRound className="h-4 w-4" aria-hidden />{open ? t("profile.password.hide") : t("profile.password.change")}</button>
        </span>
      </div>
      <p className="mt-1 flex items-start gap-1.5 text-xs text-muted sm:ml-[192px]"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ok" aria-hidden />{t("profile.password.note")}</p>
      {open && (
        <form action={action} className="mt-3 space-y-3 rounded-xl bg-bg p-3 sm:ml-[192px]" noValidate>
          {demo && <p className="rounded-lg bg-info-bg px-3 py-2 text-[13px] text-info">{t("profile.password.demo")}</p>}
          {state.ok ? <p role="status" className="rounded-lg bg-ok-bg px-3 py-2 text-sm font-medium text-ok">{t("profile.password.changed")}</p> : null}
          <div><Label htmlFor="pw-cur">{t("profile.password.current")}</Label><Input id="pw-cur" name="current" type={type} autoComplete="current-password" required aria-invalid={!!err("current")} />{err("current") && <FieldHint error>{err("current")}</FieldHint>}</div>
          <div><Label htmlFor="pw-new">{t("profile.password.next")}</Label><Input id="pw-new" name="next" type={type} autoComplete="new-password" required minLength={10} aria-invalid={!!err("next")} aria-describedby="pw-hint" />
            <FieldHint id="pw-hint" error={!!err("next")}>{err("next") ?? t("profile.password.hint")}</FieldHint></div>
          <div><Label htmlFor="pw-rep">{t("profile.password.repeat")}</Label><Input id="pw-rep" name="repeat" type={type} autoComplete="new-password" required aria-invalid={!!err("repeat")} />{err("repeat") && <FieldHint error>{err("repeat")}</FieldHint>}</div>
          {state.error && !state.field && <p role="alert" className="text-sm font-medium text-danger">{state.error}</p>}
          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" size="sm" disabled={pending}>{pending ? t("profile.password.saving") : t("profile.password.change")}</Button>
            <button type="button" onClick={() => setShow(!show)} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-sm text-muted hover:bg-surface-2" aria-pressed={show}>{show ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}{show ? t("profile.password.hideInput") : t("profile.password.showInput")}</button>
          </div>
        </form>
      )}
    </div>
  );
}
