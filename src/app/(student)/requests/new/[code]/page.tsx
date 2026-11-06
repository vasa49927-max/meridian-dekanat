import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Clock, QrCode, UserCheck } from "lucide-react";
import { requireStudent } from "@/server/auth/guards";
import { getRequestType } from "@/server/dal/requests";
import { getMyProfile } from "@/server/dal/student";
import { Card } from "@/components/ui/card";
import { RequestIcon } from "@/components/requests/icon";
import { RequestForm } from "@/components/requests/request-form";

export const metadata: Metadata = { title: "Оформление заявки" };

export default async function NewRequestForm({ params, searchParams }: { params: Promise<{ code: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const v = await requireStudent();
  const { code } = await params;
  const sp = await searchParams;
  const type = await getRequestType(code);
  if (!type) notFound();
  const p = await getMyProfile(v);
  // Предзаполнение из ссылки помощника: берём только известные поля, значения селектов — только из списка.
  const defaults: Record<string, string> = {};
  for (const f of type.fields) {
    const val = sp[f.name];
    if (typeof val === "string" && val.length <= 300 && (f.kind !== "select" || f.options?.includes(val))) defaults[f.name] = val;
  }
  const fromAssistant = sp.from === "assistant";
  return (
    <div className="mx-auto max-w-2xl pt-2 lg:pt-0">
      <nav aria-label="Навигация" className="mb-2 text-sm"><Link href="/requests/new" className="tap text-muted hover:text-fg">← Все виды заявок</Link></nav>
      <div className="mb-5 flex items-start gap-3">
        <RequestIcon name={type.icon} className="h-12 w-12" />
        <div><h1 className="font-serif text-[26px] leading-tight">{type.title}</h1><p className="mt-1 text-muted">{type.description}</p></div>
      </div>
      <ul className="mb-5 flex flex-wrap gap-2 text-sm">
        <li className="flex items-center gap-2 rounded-xl bg-surface-2 px-3 py-1.5"><Clock className="h-4 w-4 text-accent-text" aria-hidden />{type.slaDays === 1 ? "1 рабочий день" : `до ${type.slaDays} рабочих дней`}</li>
        {type.producesDocument && <li className="flex items-center gap-2 rounded-xl bg-surface-2 px-3 py-1.5"><QrCode className="h-4 w-4 text-accent-text" aria-hidden />электронный, с QR</li>}
        <li className="flex items-center gap-2 rounded-xl bg-surface-2 px-3 py-1.5"><UserCheck className="h-4 w-4 text-accent-text" aria-hidden />{type.regulationRef} Положения</li>
      </ul>
      {!fromAssistant && Object.keys(defaults).length > 0 && <p className="mb-4 rounded-xl border border-warn-line bg-warn-bg px-3.5 py-2.5 text-sm text-warn">Часть полей подставлена из ссылки — проверьте их перед отправкой.</p>}
      {fromAssistant && <p className="mb-4 rounded-xl border border-info/30 bg-info-bg px-3.5 py-2.5 text-sm text-info">Поля заполнил помощник по вашему вопросу — проверьте их перед отправкой.</p>}
      <Card>
        <div className="mb-4 rounded-xl bg-bg p-3 text-sm">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted">Подставим из профиля</p>
          <p className="font-medium">{p.student.lastName} {p.student.firstName} {p.student.middleName}</p>
          <p className="text-muted">{p.faculty.code} · {p.group.course} курс · группа {p.group.name} · зачётка {p.student.recordBook}</p>
        </div>
        <RequestForm code={type.code} fields={type.fields} defaults={defaults} />
      </Card>
    </div>
  );
}
