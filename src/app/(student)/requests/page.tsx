import Link from "next/link";
import type { Metadata } from "next";
import { FilePlus2, FileText, QrCode } from "lucide-react";
import { requireStudent } from "@/server/auth/guards";
import { listMyRequests, listRequestTypes } from "@/server/dal/requests";
import { PageHeader } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty";
import { StatusBadge } from "@/components/requests/status";
import { RequestIcon } from "@/components/requests/icon";
import { cn } from "@/lib/cn";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("requests.list.title") };
}

export default async function RequestsPage({ searchParams }: { searchParams: Promise<{ all?: string }> }) {
  const v = await requireStudent();
  const { t, tn, tr, tc, f, name } = await getI18n();
  const { all } = await searchParams;
  const [{ items }, types] = await Promise.all([listMyRequests(v, null, 50), listRequestTypes()]);
  const active = items.filter((r) => !["ISSUED", "REJECTED"].includes(r.status));
  const shown = all ? items : active;
  return (
    <div className="pt-2 lg:pt-0">
      <PageHeader title={t("requests.list.title")} subtitle={t("requests.list.subtitle")} action={<LinkButton href="/requests/new"><FilePlus2 className="h-5 w-5" aria-hidden />{t("requests.list.newRequest")}</LinkButton>} />
      <section aria-labelledby="pop-h" className="mb-6">
        <h2 id="pop-h" className="mb-2 text-sm font-semibold text-muted">{t("requests.list.popular")}</h2>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0">
          {types.filter((x) => x.popular).map((x) => (
            <Link key={x.code} href={`/requests/new/${x.code}`} className="flex min-w-[240px] items-center gap-3 rounded-2xl border border-line bg-surface p-3.5 hover:border-primary">
              <RequestIcon name={x.icon} />
              <span className="min-w-0"><span className="block text-sm font-semibold leading-snug">{tr("rt", x.title)}</span><span className="block text-xs text-muted">{x.slaDays === 1 ? t("requests.list.slaOneDay") : tn("requests.list.slaUpTo", x.slaDays)} · {t("requests.list.withQr")}</span></span>
            </Link>
          ))}
        </div>
      </section>
      <div className="mb-3 flex items-center gap-2">
        <nav aria-label={t("requests.list.filter")} className="inline-flex rounded-xl border border-line bg-surface p-1">
          <Link aria-current={!all ? "page" : undefined} href="/requests" className={cn("rounded-lg px-4 py-1.5 text-sm font-semibold", !all ? "bg-primary text-primary-fg" : "text-muted")}>{t("requests.list.active", { n: active.length })}</Link>
          <Link aria-current={all ? "page" : undefined} href="/requests?all=1" className={cn("rounded-lg px-4 py-1.5 text-sm font-semibold", all ? "bg-primary text-primary-fg" : "text-muted")}>{t("requests.list.history", { n: items.length })}</Link>
        </nav>
      </div>
      {shown.length ? (
        <ul className="grid grid-cols-[minmax(0,1fr)] gap-2.5">
          {shown.map((r) => (
            <li key={r.id}>
              <Link href={`/requests/${r.id}`} className="block">
                <Card as="div" className="flex flex-wrap items-start gap-3 transition-colors hover:border-primary sm:flex-nowrap">
                  <RequestIcon name={r.icon} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold leading-snug">{tr("rt", r.title)}</h3>{r.documentId && <span className="inline-flex items-center gap-1 text-xs text-ok"><QrCode className="h-3.5 w-3.5" aria-hidden />{t("requests.list.eDoc")}</span>}</div>
                    <p className="text-[13px] text-muted">{t("requests.list.meta", { number: name(r.number), date: f.dayMonth(r.createdAt) })}{["SUBMITTED", "IN_PROGRESS"].includes(r.status) ? t("requests.list.due", { date: f.dayMonth(r.dueAt) }) : ""}</p>
                    {r.staffComment && ["NEEDS_INFO", "REJECTED"].includes(r.status) && <p className="mt-1 line-clamp-2 text-[13px] text-warn">{r.staffComment === "Отозвана студентом" ? t("requests.sys.withdrawn") : tc(r.staffComment)}</p>}
                  </div>
                  <StatusBadge status={r.status} className="ml-[52px] sm:ml-0" />
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={<FileText />} title={all ? t("requests.list.emptyAll") : t("requests.list.emptyActive")} action={<LinkButton href="/requests/new" variant="soft">{t("requests.list.order")}</LinkButton>}>
          {t("requests.list.emptyText")}
        </EmptyState>
      )}
    </div>
  );
}
