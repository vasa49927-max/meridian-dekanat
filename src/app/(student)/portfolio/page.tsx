import { Award, BadgeCheck, BookOpen, Briefcase, FileBadge, FileDown, HeartHandshake, Mic, Trash2 } from "lucide-react";
import { requireStudent } from "@/server/auth/guards";
import { listMyPortfolio } from "@/server/dal/portfolio";
import { dayKey, now } from "@/lib/time";
import { getI18n } from "@/i18n/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty";
import { LinkButton, buttonVariants } from "@/components/ui/button";
import { ConfirmSubmit } from "@/components/ui/confirm";
import { PortfolioAddForm } from "@/components/portfolio/add-form";
import { deletePortfolioAction } from "./actions";

export async function generateMetadata() {
  const { t } = await getI18n();
  return { title: t("portfolio.title") };
}

const ICON = { OLYMPIAD: Award, CONFERENCE: Mic, INTERNSHIP: Briefcase, CERTIFICATE: FileBadge, VOLUNTEER: HeartHandshake, PUBLICATION: BookOpen } as const;

/** Портфолио (раунд 6, №7): свои достижения + резюме для печати. */
export default async function PortfolioPage() {
  const v = await requireStudent();
  const { t, tc, locale } = await getI18n();
  const items = await listMyPortfolio(v);
  const month = (ym: string) => { const [y, m] = ym.split("-").map(Number); return new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : locale === "zh" ? "zh-CN" : locale === "fr" ? "fr-FR" : "en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, 15))); };
  const maxMonth = dayKey(now()).slice(0, 7);
  return (
    <div className="pt-2 lg:pt-0">
      <PageHeader title={t("portfolio.title")} subtitle={t("portfolio.subtitle")} action={<LinkButton href="/cv" variant="secondary" prefetch={false}><FileDown className="h-4 w-4" aria-hidden />{t("portfolio.cv")}</LinkButton>} />
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr] [&>*]:min-w-0">
        <div>
          {!items.length ? <EmptyState icon={<Award className="h-6 w-6" />} title={t("portfolio.empty.title")}>{t("portfolio.empty.text")}</EmptyState> : (
            <ul className="space-y-3">
              {items.map((it) => {
                const I = ICON[it.kind];
                return (
                  <Card as="li" key={it.id} className="flex gap-3 p-4">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary dark:text-accent-text" aria-hidden><I className="h-5 w-5" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted">{t(`portfolio.kinds.${it.kind}`)} · {month(it.date)}</p>
                      <p className="font-semibold leading-snug">{tc(it.title)}</p>
                      {it.org && <p className="text-sm text-muted">{tc(it.org)}</p>}
                      {it.description && <p className="mt-1 text-sm">{tc(it.description)}</p>}
                      <p className={`mt-1.5 inline-flex items-center gap-1 text-xs font-semibold ${it.verified ? "text-ok" : "text-muted"}`}>{it.verified && <BadgeCheck className="h-3.5 w-3.5" aria-hidden />}{it.verified ? t("portfolio.verified") : t("portfolio.unverified")}</p>
                    </div>
                    {!it.verified && (
                      <form action={deletePortfolioAction} className="shrink-0">
                        <input type="hidden" name="id" value={it.id} />
                        <ConfirmSubmit className={buttonVariants({ variant: "ghost", size: "icon", className: "h-9 w-9 text-muted hover:text-danger" })} title={t("portfolio.removeConfirm.title")} description={t("portfolio.removeConfirm.body")} confirmLabel={t("portfolio.removeConfirm.ok")}>
                          <Trash2 className="h-4 w-4" aria-hidden /><span className="sr-only">{t("portfolio.removeAria", { title: it.title })}</span>
                        </ConfirmSubmit>
                      </form>
                    )}
                  </Card>
                );
              })}
            </ul>
          )}
        </div>
        <Card><CardTitle>{t("portfolio.add.title")}</CardTitle><PortfolioAddForm maxMonth={maxMonth} /></Card>
      </div>
    </div>
  );
}
