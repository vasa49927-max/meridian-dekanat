import type { Metadata } from "next";
import { Languages, LogOut, ShieldCheck } from "lucide-react";
import { desc, eq } from "drizzle-orm";
import { requireStudent } from "@/server/auth/guards";
import { getMyProfile } from "@/server/dal/student";
import { db, schema as tbl } from "@/server/db";
import { Avatar } from "@/components/avatar";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { LanguageSwitcher } from "@/components/shell/language-switcher";
import { TourButton } from "@/components/shell/onboarding";
import { logoutAction } from "../../(auth)/login/actions";
import { PasswordRow } from "@/components/profile/password-row";
import { DEMO_LOGINS } from "@/server/auth/change-password";
import { getSession } from "@/server/auth/session";
import { deviceLabel } from "@/lib/device";
import { getPrefs } from "@/server/push";
import { PushSettings } from "@/components/profile/push-settings";
import { MaxBot } from "@/components/profile/max-bot";
import { getMaxLink, maxConfig, maxEnabled } from "@/server/bot/max";
import { ConfirmForm } from "@/components/ui/confirm";
import { logoutOthersAction } from "./actions";
import { getI18n } from "@/i18n/server";

/** Языки из «языкового паспорта» (в БД — по-русски) → ключ словаря. */
const LANG_KEY = { Английский: "en", Испанский: "es", Французский: "fr", Немецкий: "de", Китайский: "zh", Русский: "ru" } as const;
const isLangKey = (x: string): x is keyof typeof LANG_KEY => x in LANG_KEY;

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("profile.title") };
}

export default async function ProfilePage() {
  const v = await requireStudent();
  const { t, tr, name, f } = await getI18n();
  const current = await getSession();
  const pushPrefs = await getPrefs(v.userId);
  const maxLink = await getMaxLink(v.userId);
  const p = await getMyProfile(v);
  const s = p.student;
  const sessions = await db.select({ id: tbl.sessions.id, createdAt: tbl.sessions.createdAt, lastSeenAt: tbl.sessions.lastSeenAt, userAgent: tbl.sessions.userAgent })
    .from(tbl.sessions).where(eq(tbl.sessions.userId, v.userId)).orderBy(desc(tbl.sessions.lastSeenAt)).limit(5);
  const basis = s.basis === "бюджет" ? t("profile.values.budget") : s.basis === "договор" ? t("profile.values.contract") : s.basis;
  const rows: [string, string][] = [
    [t("profile.rows.faculty"), tr("faculties", p.faculty.name)], [t("profile.rows.program"), t("profile.values.program", { code: p.program.code, name: tr("programs", p.program.name) })],
    [t("profile.rows.courseGroup"), t("profile.values.courseGroup", { course: p.group.course, group: p.group.name, sub: s.subgroup })],
    [t("profile.rows.recordBook"), name(s.recordBook)], [t("profile.rows.form"), t("profile.values.form", { basis })], [t("profile.rows.year"), String(s.enrollmentYear)],
    [t("profile.rows.campus"), p.faculty.campus === "ODINTSOVO" ? t("profile.values.odintsovo") : t("profile.values.moscow")],
    [t("profile.rows.email"), s.email], [t("profile.rows.login"), p.login],
  ];
  // Подпись устройства (lib/device) — по-русски; переводим известные слова.
  const device = (ua: string | null) => deviceLabel(ua)
    .replace("Неизвестное устройство", t("profile.device.unknown")).replace("Яндекс Браузер", t("profile.device.yandex"))
    .replace("Автотест (Chrome)", t("profile.device.autotest")).replace(/^Браузер/, t("profile.device.browser"));
  return (
    <div className="mx-auto max-w-3xl pt-2 lg:pt-0">
      <Card className="mb-4 flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
        <Avatar name={name(`${s.firstName} ${s.lastName}`)} hue={s.avatarHue} size={88} />
        <div className="min-w-0">
          <h1 className="font-serif text-[26px] leading-tight">{name(s.lastName)} {name(s.firstName)} {name(s.middleName)}</h1>
          <p className="mt-1 text-muted">{tr("faculties", p.faculty.code)} · {t("profile.course", { course: p.group.course, group: p.group.name })}</p>
          <div className="mt-2 flex flex-wrap justify-center gap-1.5 sm:justify-start">
            <Badge tone="primary">{s.gender === "F" ? t("profile.student.F") : t("profile.student.M")}</Badge>
            {s.militaryTraining && <Badge tone="info">{t("profile.military")}</Badge>}
            {p.faculty.campus === "ODINTSOVO" && <Badge>{t("profile.campusOdintsovo")}</Badge>}
          </div>
        </div>
      </Card>
      <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardTitle>{t("profile.study")}</CardTitle>
          <dl className="divide-y divide-line text-sm">
            {rows.map(([k, val]) => <div key={k} className="grid gap-0.5 py-2 sm:grid-cols-[180px_1fr] sm:gap-3"><dt className="text-muted">{k}</dt><dd className="font-medium break-words">{val}</dd></div>)}
          </dl>
          <div className="border-t border-line"><PasswordRow demo={DEMO_LOGINS.has(p.login)} /></div>
          <p className="mt-3 text-xs text-muted">{t("profile.fixHint")}</p>
        </Card>
        <div className="space-y-4">
          <Card>
            <CardTitle>{t("profile.languages")}</CardTitle>
            <ul className="space-y-2">
              {s.languages.map((l) => <li key={l.lang} className="flex items-center justify-between text-sm"><span className="flex items-center gap-2"><Languages className="h-4 w-4 text-accent-text" aria-hidden />{isLangKey(l.lang) ? t(`profile.langs.${LANG_KEY[l.lang]}`) : l.lang}</span><Badge>{l.level === "родной" ? t("profile.native") : l.level}</Badge></li>)}
            </ul>
          </Card>
          <Card id="push">
            <CardTitle>{t("profile.push")}</CardTitle>
            <PushSettings prefs={pushPrefs} />
          </Card>
          <Card id="max">
            <CardTitle>{t("profile.max.title")}</CardTitle>
            <MaxBot enabled={maxEnabled()} linked={!!maxLink} botName={maxConfig().botName} />
          </Card>
          <Card>
            <CardTitle>{t("profile.security")}</CardTitle>
            <p className="mb-2 flex items-center gap-2 text-sm"><ShieldCheck className="h-4 w-4 text-ok" aria-hidden />{t("profile.sessions", { n: sessions.length })}</p>
            <ul className="mb-3 space-y-1.5 text-xs text-muted">
              {sessions.map((x) => <li key={x.id}><span className="font-medium text-fg">{device(x.userAgent)}</span>{x.id === current?.sessionId && <span className="ml-1.5 rounded bg-ok-bg px-1.5 py-0.5 font-semibold text-ok">{t("profile.thisDevice")}</span>}{t("profile.signedIn", { date: f.dateTime(x.createdAt) })}</li>)}
            </ul>
            {sessions.length > 1 && (DEMO_LOGINS.has(p.login) ? (
              <p className="mb-3 rounded-lg bg-surface-2 px-3 py-2 text-xs text-muted">{t("profile.demoLogoutOff")}</p>
            ) : (
              <div className="mb-3">
                <ConfirmForm action={logoutOthersAction} hidden={{}} trigger={t("profile.logoutOthers")}
                  triggerClassName="h-10 rounded-lg border border-line px-3 text-sm font-semibold hover:bg-surface-2"
                  title={t("profile.logoutOthersTitle")} description={t("profile.logoutOthersText")}
                  confirmLabel={t("profile.logoutOthersConfirm")} />
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              <ThemeToggle withLabel />
              <LanguageSwitcher />
              <TourButton className="inline-flex h-11 items-center gap-2 rounded-xl border border-line bg-surface px-4 text-sm font-medium hover:bg-surface-2" />
              <form action={logoutAction}><Button variant="secondary"><LogOut className="h-4 w-4" aria-hidden />{t("profile.logout")}</Button></form>
            </div>
            <p className="mt-2 text-xs text-muted">{t("common.lang.note")}</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
