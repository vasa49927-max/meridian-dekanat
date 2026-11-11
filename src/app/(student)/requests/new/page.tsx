import Link from "next/link";
import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";
import { requireStudent } from "@/server/auth/guards";
import { listRequestTypes } from "@/server/dal/requests";
import { PageHeader } from "@/components/ui/page-header";
import { RequestIcon } from "@/components/requests/icon";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("requests.new.title") };
}

export default async function NewRequestPage() {
  await requireStudent();
  const { t, tn, tr } = await getI18n();
  const types = await listRequestTypes();
  const groups = [
    { id: "cert", title: t("requests.new.certificates"), hint: t("requests.new.certificatesHint"), list: types.filter((x) => x.category === "CERTIFICATE") },
    { id: "app", title: t("requests.new.applications"), hint: t("requests.new.applicationsHint"), list: types.filter((x) => x.category === "APPLICATION") },
  ];
  return (
    <div className="pt-2 lg:pt-0">
      <nav aria-label={t("requests.nav.label")} className="mb-2 text-sm"><Link href="/requests" className="tap text-muted hover:text-fg">{t("requests.nav.toRequests")}</Link></nav>
      <PageHeader title={t("requests.new.heading")} subtitle={t("requests.new.subtitle")} />
      <div className="space-y-6">
        {groups.map((g) => (
          <section key={g.id} aria-labelledby={`g-${g.id}`}>
            <h2 id={`g-${g.id}`} className="font-semibold">{g.title}</h2>
            <p className="mb-3 text-sm text-muted">{g.hint}</p>
            <ul className="grid gap-2.5 md:grid-cols-2">
              {g.list.map((x) => (
                <li key={x.code}>
                  <Link href={`/requests/new/${x.code}`} className="lift card flex h-full items-start gap-3 rounded-2xl border border-line bg-surface p-4 hover:border-primary">
                    <RequestIcon name={x.icon} />
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold leading-snug">{tr("rt", x.title)}</span>
                      <span className="mt-0.5 block text-[13px] text-muted">{tr("rt", x.description)}</span>
                      <span className="mt-1.5 block text-xs font-semibold text-accent-text">{x.slaDays === 1 ? t("requests.sla.oneWorkDay") : tn("requests.sla.upToWorkDays", x.slaDays)}</span>
                    </span>
                    <ChevronRight className="mt-2 h-5 w-5 shrink-0 text-muted" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
