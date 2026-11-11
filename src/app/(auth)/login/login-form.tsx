"use client";
import { useActionState, useState } from "react";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { loginAction, type LoginState } from "./actions";
import { Button } from "@/components/ui/button";
import { FieldHint, Input, Label } from "@/components/ui/field";
import { useI18n } from "@/i18n/client";

const DEMO = [
  { login: "sokolova", password: "Demo-2026-anna", name: "Анна", faculty: "МЭО", course: 2 },
  { login: "galiev", password: "Demo-2026-timur", name: "Тимур", faculty: "МП", course: 4, extra: "military" },
  { login: "lin", password: "Demo-2026-mei", name: "Мэй", faculty: "ФЛМК", course: 1, extra: "odintsovo" },
  { login: "belova", password: "Demo-2026-staff", name: "Ирина Павловна" },
] as const;

export function LoginForm({ next }: { next?: string }) {
  const { t, tr, name } = useI18n();
  const who = (d: (typeof DEMO)[number]) => {
    if (!("faculty" in d)) return t("auth.login.demoStaff", { name: name(d.name) });
    const base = t("auth.login.demoStudent", { name: name(d.name), faculty: tr("faculties", d.faculty), course: d.course });
    if (!("extra" in d)) return base;
    return t("auth.login.demoWithExtra", { base, extra: d.extra === "military" ? t("auth.login.demoMilitary") : t("auth.login.demoOdintsovo") });
  };
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, {});
  const [show, setShow] = useState(false);
  const [login, setLogin] = useState(state.login ?? "");
  const [password, setPassword] = useState("");
  return (
    <>
      <form action={action} className="space-y-4" noValidate>
        <input type="hidden" name="next" value={next ?? ""} />
        <div>
          <Label htmlFor="login">{t("auth.login.login")}</Label>
          <Input id="login" name="login" autoComplete="username" autoCapitalize="none" spellCheck={false} required value={login} onChange={(e) => setLogin(e.target.value)}
            aria-invalid={!!state.fields?.login} aria-describedby={state.fields?.login ? "login-err" : undefined} />
          {state.fields?.login && <FieldHint id="login-err" error>{state.fields.login}</FieldHint>}
        </div>
        <div>
          <Label htmlFor="password">{t("auth.login.password")}</Label>
          <div className="relative">
            <Input id="password" name="password" type={show ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="pr-12"
              aria-invalid={!!state.fields?.password} aria-describedby={state.fields?.password ? "pw-err" : undefined} />
            <button type="button" onClick={() => setShow(!show)} className="absolute right-1 top-1 grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-surface-2" aria-label={show ? t("auth.login.hidePassword") : t("auth.login.showPassword")}>
              {show ? <EyeOff className="h-5 w-5" aria-hidden /> : <Eye className="h-5 w-5" aria-hidden />}
            </button>
          </div>
          {state.fields?.password && <FieldHint id="pw-err" error>{state.fields.password}</FieldHint>}
        </div>
        {state.error && <p role="alert" className="rounded-xl bg-danger-bg px-3.5 py-2.5 text-sm font-medium text-danger">{state.error}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          <LogIn className="h-5 w-5" aria-hidden /> {pending ? t("auth.login.signingIn") : t("auth.login.signIn")}
        </Button>
      </form>
      <div className="mt-6 rounded-2xl border border-line bg-surface-2/60 p-4">
        <p className="mb-2 text-sm font-semibold">{t("auth.login.demoTitle")}</p>
        <p className="mb-3 text-[13px] text-muted">{t("auth.login.demoText")}</p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {DEMO.map((d) => (
            <li key={d.login}>
              <button type="button" onClick={() => { setLogin(d.login); setPassword(d.password); }} className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-left hover:border-primary">
                <span className="block text-sm font-semibold">{d.login}</span>
                <span className="block text-xs text-muted">{who(d)}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
