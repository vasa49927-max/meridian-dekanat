import Link from "next/link";
import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";
import { requireStudent } from "@/server/auth/guards";
import { listRequestTypes } from "@/server/dal/requests";
import { PageHeader } from "@/components/ui/page-header";
import { RequestIcon } from "@/components/requests/icon";

export const metadata: Metadata = { title: "Новая заявка" };

export default async function NewRequestPage() {
  await requireStudent();
  const types = await listRequestTypes();
  const groups = [
    { title: "Справки", hint: "Электронные, с QR-кодом проверки подлинности", list: types.filter((t) => t.category === "CERTIFICATE") },
    { title: "Заявления", hint: "Рассматривает деканат, решение — в статусе заявки", list: types.filter((t) => t.category === "APPLICATION") },
  ];
  return (
    <div className="pt-2 lg:pt-0">
      <nav aria-label="Навигация" className="mb-2 text-sm"><Link href="/requests" className="tap text-muted hover:text-fg">← Заявки</Link></nav>
      <PageHeader title="Что нужно оформить?" subtitle="Выберите документ — форма займёт меньше минуты" />
      <div className="space-y-6">
        {groups.map((g) => (
          <section key={g.title} aria-labelledby={`g-${g.title}`}>
            <h2 id={`g-${g.title}`} className="font-semibold">{g.title}</h2>
            <p className="mb-3 text-sm text-muted">{g.hint}</p>
            <ul className="grid gap-2.5 md:grid-cols-2">
              {g.list.map((t) => (
                <li key={t.code}>
                  <Link href={`/requests/new/${t.code}`} className="flex h-full items-start gap-3 rounded-2xl border border-line bg-surface p-4 hover:border-primary">
                    <RequestIcon name={t.icon} />
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold leading-snug">{t.title}</span>
                      <span className="mt-0.5 block text-[13px] text-muted">{t.description}</span>
                      <span className="mt-1.5 block text-xs font-semibold text-accent-text">{t.slaDays === 1 ? "1 рабочий день" : `до ${t.slaDays} рабочих дней`}</span>
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
