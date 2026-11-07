"use client";
import { useActionState, useState } from "react";
import { Eye, EyeOff, KeyRound, ShieldCheck } from "lucide-react";
import { changePasswordAction, type PwState } from "@/app/(student)/profile/actions";
import { Button } from "@/components/ui/button";
import { FieldHint, Input, Label } from "@/components/ui/field";

/**
 * Строка «Пароль» в профиле (правка капитана №7). Показываем точки, а не сам пароль:
 * сервер его НЕ ЗНАЕТ — в базе только хэш argon2id. Поэтому вместо «показать» — «сменить».
 */
export function PasswordRow({ demo }: { demo: boolean }) {
  const [open, setOpen] = useState(false);
  const [show, setShow] = useState(false);
  const [state, action, pending] = useActionState<PwState, FormData>(changePasswordAction, {});
  const type = show ? "text" : "password";
  const err = (f: PwState["field"]) => (state.field === f ? state.error : undefined);
  return (
    <div className="py-2">
      <div className="grid gap-0.5 sm:grid-cols-[180px_1fr] sm:gap-3">
        <span className="text-sm text-muted">Пароль</span>
        <span className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-medium tracking-[0.25em]" aria-label="Пароль скрыт">••••••••••</span>
          <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="tap inline-flex items-center gap-1.5 text-sm font-semibold text-primary dark:text-accent-text"><KeyRound className="h-4 w-4" aria-hidden />{open ? "Скрыть" : "Сменить пароль"}</button>
        </span>
      </div>
      <p className="mt-1 flex items-start gap-1.5 text-xs text-muted sm:ml-[192px]"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ok" aria-hidden />Пароль не хранится и не показывается: в базе только его хэш (argon2id), восстановить пароль из него нельзя — даже нам.</p>
      {open && (
        <form action={action} className="mt-3 space-y-3 rounded-xl bg-bg p-3 sm:ml-[192px]" noValidate>
          {demo && <p className="rounded-lg bg-info-bg px-3 py-2 text-[13px] text-info">Это демо-аккаунт жюри: форма работает, но сохранение пароля отключено, чтобы вход оставался доступен всем проверяющим.</p>}
          {state.ok ? <p role="status" className="rounded-lg bg-ok-bg px-3 py-2 text-sm font-medium text-ok">Пароль изменён. На остальных устройствах выполнен выход.</p> : null}
          <div><Label htmlFor="pw-cur">Текущий пароль</Label><Input id="pw-cur" name="current" type={type} autoComplete="current-password" required aria-invalid={!!err("current")} />{err("current") && <FieldHint error>{err("current")}</FieldHint>}</div>
          <div><Label htmlFor="pw-new">Новый пароль</Label><Input id="pw-new" name="next" type={type} autoComplete="new-password" required minLength={10} aria-invalid={!!err("next")} aria-describedby="pw-hint" />
            <FieldHint id="pw-hint" error={!!err("next")}>{err("next") ?? "Не короче 10 символов, буквы и цифры, без логина."}</FieldHint></div>
          <div><Label htmlFor="pw-rep">Повторите новый пароль</Label><Input id="pw-rep" name="repeat" type={type} autoComplete="new-password" required aria-invalid={!!err("repeat")} />{err("repeat") && <FieldHint error>{err("repeat")}</FieldHint>}</div>
          {state.error && !state.field && <p role="alert" className="text-sm font-medium text-danger">{state.error}</p>}
          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" size="sm" disabled={pending}>{pending ? "Сохраняем…" : "Сменить пароль"}</Button>
            <button type="button" onClick={() => setShow(!show)} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-sm text-muted hover:bg-surface-2" aria-pressed={show}>{show ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}{show ? "Скрыть ввод" : "Показать ввод"}</button>
          </div>
        </form>
      )}
    </div>
  );
}
