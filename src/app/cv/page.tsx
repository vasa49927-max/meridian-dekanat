import { ArrowLeft, Mail } from "lucide-react";
import { requireStudent } from "@/server/auth/guards";
import { getMyGrades, getMyProfile } from "@/server/dal/student";
import { listMyPortfolio } from "@/server/dal/portfolio";
import { averagePoints } from "@/lib/brs";
import { getI18n } from "@/i18n/server";
import { INTL_LOCALE } from "@/i18n/config";
import { LinkButton } from "@/components/ui/button";
import { Disclaimer } from "@/components/shell/disclaimer";
import { PrintButton } from "@/components/portfolio/print-button";

export async function generateMetadata() {
  const { t } = await getI18n();
  return { title: t("portfolio.cvPage.title") };
}

const LANG_KEY = { Английский: "en", Испанский: "es", Французский: "fr", Немецкий: "de", Китайский: "zh", Русский: "ru" } as const;
const isLangKey = (x: string): x is keyof typeof LANG_KEY => x in LANG_KEY;
const KIND_ORDER = ["INTERNSHIP", "OLYMPIAD", "CONFERENCE", "PUBLICATION", "CERTIFICATE", "VOLUNTEER"] as const;

/**
 * Резюме из портфолио (раунд 6, №7): отдельная страница без оболочки кабинета, чтобы печать/«Сохранить как PDF»
 * давали чистый лист A4. Данные — только свои (viewer из сессии). Дисклеймер концепта остаётся и на печати.
 */
export default async function CvPage() {
  const v = await requireStudent();
  const { t, tr, tc, name, locale } = await getI18n();
  const [p, items, grades] = await Promise.all([getMyProfile(v), listMyPortfolio(v), getMyGrades(v)]);
  const s = p.student;
  const avg = averagePoints(grades.past.map((g) => g.points));
  const month = (ym: string) => { const [y, m] = ym.split("-").map(Number); return new Intl.DateTimeFormat(INTL_LOCALE[locale], { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, 15))); };
  const full = name(`${s.lastName} ${s.firstName}${s.middleName ? ` ${s.middleName}` : ""}`);
  const suffix = locale === "ru" ? (s.gender === "F" ? "ка" : "") : locale === "fr" ? (s.gender === "F" ? "e" : "") : "";
  const groups = KIND_ORDER.map((k) => ({ k, list: items.filter((i) => i.kind === k) })).filter((g) => g.list.length);
  return (
    <main className="mx-auto max-w-[820px] px-4 py-6 print:max-w-none print:p-0">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 print:hidden">
        <LinkButton href="/portfolio" variant="ghost"><ArrowLeft className="h-4 w-4" aria-hidden />{t("portfolio.cvPage.back")}</LinkButton>
        <PrintButton label={t("portfolio.cvPage.print")} />
      </div>
      <article className="paper rounded-2xl border border-line bg-surface p-5 text-fg shadow-[var(--shadow-card)] sm:p-10">
        <header className="border-b-2 border-primary pb-4">
          <h1 className="font-serif text-2xl leading-tight sm:text-3xl">{full}</h1>
          <p className="mt-1 text-muted">{t("portfolio.cvPage.student", { suffix, course: p.group.course })} · {tr("faculties", p.faculty.name)}</p>
          <p className="mt-2 inline-flex items-center gap-1.5 text-sm"><Mail className="h-4 w-4 text-muted" aria-hidden />{s.email}</p>
        </header>
        <section className="mt-5">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-accent-text">{t("portfolio.cvPage.education")}</h2>
          <p className="font-semibold">{t("portfolio.cvPage.program", { code: p.program.code, name: tr("programs", p.program.name) })}</p>
          <p className="text-sm text-muted">{tr("faculties", p.faculty.name)} · {t("portfolio.cvPage.since", { year: s.enrollmentYear })}{avg !== null ? ` · ${t("portfolio.cvPage.avg", { avg: avg.toLocaleString(INTL_LOCALE[locale]) })}` : ""}</p>
        </section>
        {groups.length > 0 && (
          <section className="mt-5">
            <h2 className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-accent-text">{t("portfolio.cvPage.achievements")}</h2>
            <div className="space-y-3">
              {groups.map((g) => (
                <div key={g.k} className="break-inside-avoid">
                  <h3 className="text-sm font-semibold text-muted">{t(`portfolio.kinds.${g.k}`)}</h3>
                  <ul className="mt-1 space-y-1.5">
                    {g.list.map((it) => (
                      <li key={it.id} className="grid gap-x-3 text-sm sm:grid-cols-[104px_minmax(0,1fr)]">
                        <span className="whitespace-nowrap tabular text-muted">{month(it.date)}</span>
                        <span className="min-w-0 break-words"><b>{tc(it.title)}</b>{it.org ? ` — ${tc(it.org)}` : ""}{it.verified && <span className="ml-1.5 whitespace-nowrap text-xs text-ok">{t("portfolio.cvPage.verifiedMark")}</span>}{it.description && <span className="block text-muted">{tc(it.description)}</span>}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}
        {s.languages.length > 0 && (
          <section className="mt-5">
            <h2 className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-accent-text">{t("portfolio.cvPage.languages")}</h2>
            <p className="text-sm">{s.languages.map((l) => `${isLangKey(l.lang) ? t(`profile.langs.${LANG_KEY[l.lang]}`) : l.lang} — ${l.level === "родной" ? t("profile.native") : l.level}`).join(" · ")}</p>
          </section>
        )}
        <p className="mt-8 text-xs text-muted">{t("portfolio.cvPage.generated")}</p>
      </article>
      <Disclaimer className="mt-4" />
    </main>
  );
}
