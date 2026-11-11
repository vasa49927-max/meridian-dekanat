import type { Metadata } from "next";
import { Languages, LogOut, ShieldCheck } from "lucide-react";
import { desc, eq } from "drizzle-orm";
import { requireStudent } from "@/server/auth/guards";
import { getMyProfile } from "@/server/dal/student";
import { db, schema as t } from "@/server/db";
import { fmt } from "@/lib/time";
import { Avatar } from "@/components/avatar";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { TourButton } from "@/components/shell/onboarding";
import { logoutAction } from "../../(auth)/login/actions";
import { PasswordRow } from "@/components/profile/password-row";
import { DEMO_LOGINS } from "@/server/auth/change-password";
import { getSession } from "@/server/auth/session";
import { deviceLabel } from "@/lib/device";
import { getPrefs } from "@/server/push";
import { PushSettings } from "@/components/profile/push-settings";
import { ConfirmForm } from "@/components/ui/confirm";
import { logoutOthersAction } from "./actions";

export const metadata: Metadata = { title: "Профиль" };

export default async function ProfilePage() {
  const v = await requireStudent();
  const current = await getSession();
  const pushPrefs = await getPrefs(v.userId);
  const p = await getMyProfile(v);
  const s = p.student;
  const sessions = await db.select({ id: t.sessions.id, createdAt: t.sessions.createdAt, lastSeenAt: t.sessions.lastSeenAt, userAgent: t.sessions.userAgent })
    .from(t.sessions).where(eq(t.sessions.userId, v.userId)).orderBy(desc(t.sessions.lastSeenAt)).limit(5);
  const rows: [string, string][] = [
    ["Факультет", p.faculty.name], ["Направление", `${p.program.code} «${p.program.name}»`], ["Курс и группа", `${p.group.course} курс, группа ${p.group.name}, языковая подгруппа ${s.subgroup}`],
    ["Номер зачётной книжки", s.recordBook], ["Форма и основа обучения", `очная, ${s.basis}`], ["Год поступления", String(s.enrollmentYear)], ["Кампус", p.faculty.campus === "ODINTSOVO" ? "Одинцово, ул. Новоспортивная, 3" : "Москва, пр-т Вернадского, 76"],
    ["Учебная почта", s.email], ["Логин", p.login],
  ];
  return (
    <div className="mx-auto max-w-3xl pt-2 lg:pt-0">
      <Card className="mb-4 flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
        <Avatar name={`${s.firstName} ${s.lastName}`} hue={s.avatarHue} size={88} />
        <div className="min-w-0">
          <h1 className="font-serif text-[26px] leading-tight">{s.lastName} {s.firstName} {s.middleName}</h1>
          <p className="mt-1 text-muted">{p.faculty.code} · {p.group.course} курс · группа {p.group.name}</p>
          <div className="mt-2 flex flex-wrap justify-center gap-1.5 sm:justify-start">
            <Badge tone="primary">студент{s.gender === "F" ? "ка" : ""}</Badge>
            {s.militaryTraining && <Badge tone="info">ВУЦ</Badge>}
            {p.faculty.campus === "ODINTSOVO" && <Badge>кампус Одинцово</Badge>}
          </div>
        </div>
      </Card>
      <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardTitle>Учебные данные</CardTitle>
          <dl className="divide-y divide-line text-sm">
            {rows.map(([k, val]) => <div key={k} className="grid gap-0.5 py-2 sm:grid-cols-[180px_1fr] sm:gap-3"><dt className="text-muted">{k}</dt><dd className="font-medium break-words">{val}</dd></div>)}
          </dl>
          <div className="border-t border-line"><PasswordRow demo={DEMO_LOGINS.has(p.login)} /></div>
          <p className="mt-3 text-xs text-muted">Нашли ошибку в данных? Напишите в «Помощник» или запишитесь к методисту — исправление вносит деканат.</p>
        </Card>
        <div className="space-y-4">
          <Card>
            <CardTitle>Языковой паспорт</CardTitle>
            <ul className="space-y-2">
              {s.languages.map((l) => <li key={l.lang} className="flex items-center justify-between text-sm"><span className="flex items-center gap-2"><Languages className="h-4 w-4 text-accent-text" aria-hidden />{l.lang}</span><Badge>{l.level}</Badge></li>)}
            </ul>
          </Card>
          <Card id="push">
            <CardTitle>Уведомления на телефон</CardTitle>
            <PushSettings prefs={pushPrefs} />
          </Card>
          <Card>
            <CardTitle>Безопасность</CardTitle>
            <p className="mb-2 flex items-center gap-2 text-sm"><ShieldCheck className="h-4 w-4 text-ok" aria-hidden />Активные сессии: {sessions.length}</p>
            <ul className="mb-3 space-y-1.5 text-xs text-muted">
              {sessions.map((x) => <li key={x.id}><span className="font-medium text-fg">{deviceLabel(x.userAgent)}</span>{x.id === current?.sessionId && <span className="ml-1.5 rounded bg-ok-bg px-1.5 py-0.5 font-semibold text-ok">это устройство</span>} · вход {fmt.dateTime(x.createdAt)}</li>)}
            </ul>
            {sessions.length > 1 && (DEMO_LOGINS.has(p.login) ? (
              <p className="mb-3 rounded-lg bg-surface-2 px-3 py-2 text-xs text-muted">Кнопка «Выйти на других устройствах» в демо-аккаунтах отключена: под этим логином работают и другие проверяющие.</p>
            ) : (
              <div className="mb-3">
                <ConfirmForm action={logoutOthersAction} hidden={{}} trigger="Выйти на других устройствах"
                  triggerClassName="h-10 rounded-lg border border-line px-3 text-sm font-semibold hover:bg-surface-2"
                  title="Выйти на других устройствах?" description="Все остальные браузеры и телефоны, где открыт ваш кабинет, разлогинятся. Это устройство останется в системе."
                  confirmLabel="Да, выйти на остальных" />
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              <ThemeToggle withLabel />
              <TourButton className="inline-flex h-11 items-center gap-2 rounded-xl border border-line bg-surface px-4 text-sm font-medium hover:bg-surface-2" />
              <form action={logoutAction}><Button variant="secondary"><LogOut className="h-4 w-4" aria-hidden />Выйти</Button></form>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
