import Link from "next/link";
import type { Metadata } from "next";
import { FilePlus2, FileText, QrCode } from "lucide-react";
import { requireStudent } from "@/server/auth/guards";
import { listMyRequests, listRequestTypes } from "@/server/dal/requests";
import { fmt } from "@/lib/time";
import { PageHeader } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty";
import { StatusBadge } from "@/components/requests/status";
import { RequestIcon } from "@/components/requests/icon";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Заявки и справки" };

export default async function RequestsPage({ searchParams }: { searchParams: Promise<{ all?: string }> }) {
  const v = await requireStudent();
  const { all } = await searchParams;
  const [{ items }, types] = await Promise.all([listMyRequests(v, null, 50), listRequestTypes()]);
  const active = items.filter((r) => !["ISSUED", "REJECTED"].includes(r.status));
  const shown = all ? items : active;
  return (
    <div className="pt-2 lg:pt-0">
      <PageHeader title="Заявки и справки" subtitle="Без очереди: подайте онлайн и следите за статусом" action={<LinkButton href="/requests/new"><FilePlus2 className="h-5 w-5" aria-hidden />Новая заявка</LinkButton>} />
      <section aria-labelledby="pop-h" className="mb-6">
        <h2 id="pop-h" className="mb-2 text-sm font-semibold text-muted">Часто заказывают</h2>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0">
          {types.filter((t) => t.popular).map((t) => (
            <Link key={t.code} href={`/requests/new/${t.code}`} className="flex min-w-[240px] items-center gap-3 rounded-2xl border border-line bg-surface p-3.5 hover:border-primary">
              <RequestIcon name={t.icon} />
              <span className="min-w-0"><span className="block text-sm font-semibold leading-snug">{t.title}</span><span className="block text-xs text-muted">{t.slaDays === 1 ? "за 1 день" : `до ${t.slaDays} дней`} · с QR-кодом</span></span>
            </Link>
          ))}
        </div>
      </section>
      <div className="mb-3 flex items-center gap-2">
        <nav aria-label="Фильтр заявок" className="inline-flex rounded-xl border border-line bg-surface p-1">
          <Link aria-current={!all ? "page" : undefined} href="/requests" className={cn("rounded-lg px-4 py-1.5 text-sm font-semibold", !all ? "bg-primary text-primary-fg" : "text-muted")}>Активные · {active.length}</Link>
          <Link aria-current={all ? "page" : undefined} href="/requests?all=1" className={cn("rounded-lg px-4 py-1.5 text-sm font-semibold", all ? "bg-primary text-primary-fg" : "text-muted")}>Вся история · {items.length}</Link>
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
                    <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold leading-snug">{r.title}</h3>{r.documentId && <span className="inline-flex items-center gap-1 text-xs text-ok"><QrCode className="h-3.5 w-3.5" aria-hidden />электронный документ</span>}</div>
                    <p className="text-[13px] text-muted">{r.number} · подана {fmt.dayMonth(r.createdAt)}{["SUBMITTED", "IN_PROGRESS"].includes(r.status) ? ` · срок до ${fmt.dayMonth(r.dueAt)}` : ""}</p>
                    {r.staffComment && ["NEEDS_INFO", "REJECTED"].includes(r.status) && <p className="mt-1 line-clamp-2 text-[13px] text-warn">{r.staffComment}</p>}
                  </div>
                  <StatusBadge status={r.status} className="ml-[52px] sm:ml-0" />
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={<FileText />} title={all ? "Заявок ещё не было" : "Активных заявок нет"} action={<LinkButton href="/requests/new" variant="soft">Заказать справку</LinkButton>}>
          Справка об обучении — обычно за 1 рабочий день, в электронном виде с QR-кодом проверки.
        </EmptyState>
      )}
    </div>
  );
}
