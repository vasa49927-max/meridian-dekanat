"use client";
import { useActionState, useState } from "react";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { loginAction, type LoginState } from "./actions";
import { Button } from "@/components/ui/button";
import { FieldHint, Input, Label } from "@/components/ui/field";

const DEMO = [
  { login: "sokolova", password: "Demo-2026-anna", who: "Анна, МЭО, 2 курс" },
  { login: "galiev", password: "Demo-2026-timur", who: "Тимур, МП, 4 курс, ВУЦ" },
  { login: "lin", password: "Demo-2026-mei", who: "Мэй, ФЛМК, 1 курс, Одинцово" },
  { login: "belova", password: "Demo-2026-staff", who: "Ирина Павловна, деканат" },
];

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, {});
  const [show, setShow] = useState(false);
  const [login, setLogin] = useState(state.login ?? "");
  const [password, setPassword] = useState("");
  return (
    <>
      <form action={action} className="space-y-4" noValidate>
        <input type="hidden" name="next" value={next ?? ""} />
        <div>
          <Label htmlFor="login">Логин</Label>
          <Input id="login" name="login" autoComplete="username" autoCapitalize="none" spellCheck={false} required value={login} onChange={(e) => setLogin(e.target.value)}
            aria-invalid={!!state.fields?.login} aria-describedby={state.fields?.login ? "login-err" : undefined} />
          {state.fields?.login && <FieldHint id="login-err" error>{state.fields.login}</FieldHint>}
        </div>
        <div>
          <Label htmlFor="password">Пароль</Label>
          <div className="relative">
            <Input id="password" name="password" type={show ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="pr-12"
              aria-invalid={!!state.fields?.password} aria-describedby={state.fields?.password ? "pw-err" : undefined} />
            <button type="button" onClick={() => setShow(!show)} className="absolute right-1 top-1 grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-surface-2" aria-label={show ? "Скрыть пароль" : "Показать пароль"}>
              {show ? <EyeOff className="h-5 w-5" aria-hidden /> : <Eye className="h-5 w-5" aria-hidden />}
            </button>
          </div>
          {state.fields?.password && <FieldHint id="pw-err" error>{state.fields.password}</FieldHint>}
        </div>
        {state.error && <p role="alert" className="rounded-xl bg-danger-bg px-3.5 py-2.5 text-sm font-medium text-danger">{state.error}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          <LogIn className="h-5 w-5" aria-hidden /> {pending ? "Входим…" : "Войти"}
        </Button>
      </form>
      <div className="mt-6 rounded-2xl border border-line bg-surface-2/60 p-4">
        <p className="mb-2 text-sm font-semibold">Демо-доступ для жюри</p>
        <p className="mb-3 text-[13px] text-muted">Вымышленные аккаунты. Нажмите, чтобы подставить логин и пароль.</p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {DEMO.map((d) => (
            <li key={d.login}>
              <button type="button" onClick={() => { setLogin(d.login); setPassword(d.password); }} className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-left hover:border-primary">
                <span className="block text-sm font-semibold">{d.login}</span>
                <span className="block text-xs text-muted">{d.who}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
