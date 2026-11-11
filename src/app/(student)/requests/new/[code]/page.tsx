import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Clock, QrCode, UserCheck } from "lucide-react";
import { requireStudent } from "@/server/auth/guards";
import { getMyRequest, getRequestType } from "@/server/dal/requests";
import { getMyProfile } from "@/server/dal/student";
import { Card } from "@/components/ui/card";
import { RequestIcon } from "@/components/requests/icon";
import { RequestForm } from "@/components/requests/request-form";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("requests.form.title") };
}

export default async function NewRequestForm({ params, searchParams }: { params: Promise<{ code: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const v = await requireStudent();
  const { t, tn, tr, name } = await getI18n();
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
  // «Подать повторно» (раунд 3): поля берём из СВОЕЙ прошлой заявки того же вида; чужая/несуществующая — просто игнорируется.
  const again = sp.again ? await getMyRequest(v, sp.again) : null;
  const prev = again && again.typeId === type.id ? again : null;
  if (prev) {
    for (const f of type.fields) {
      const val = prev.payload[f.name];
      if (typeof val === "string" && val.length <= 300 && (f.kind !== "select" || f.options?.includes(val))) defaults[f.name] = val;
    }
  }
  return (
    <div className="mx-auto max-w-2xl pt-2 lg:pt-0">
      <nav aria-label={t("requests.nav.label")} className="mb-2 text-sm"><Link href="/requests/new" className="tap text-muted hover:text-fg">{t("requests.nav.allTypes")}</Link></nav>
      <div className="mb-5 flex items-start gap-3">
        <RequestIcon name={type.icon} className="h-12 w-12" />
        <div><span aria-hidden className="mb-2.5 block h-[3px] w-9 rounded-full bg-gradient-to-r from-accent to-accent/30" /><h1 className="font-serif text-[26px] leading-tight lg:text-[34px]">{tr("rt", type.title)}</h1><p className="mt-1 text-muted">{tr("rt", type.description)}</p></div>
      </div>
      <ul className="mb-5 flex flex-wrap gap-2 text-sm">
        <li className="flex items-center gap-2 rounded-xl bg-surface-2 px-3 py-1.5"><Clock className="h-4 w-4 text-accent-text" aria-hidden />{type.slaDays === 1 ? t("requests.sla.oneWorkDay") : tn("requests.sla.upToWorkDays", type.slaDays)}</li>
        {type.producesDocument && <li className="flex items-center gap-2 rounded-xl bg-surface-2 px-3 py-1.5"><QrCode className="h-4 w-4 text-accent-text" aria-hidden />{t("requests.form.electronic")}</li>}
        <li className="flex items-center gap-2 rounded-xl bg-surface-2 px-3 py-1.5"><UserCheck className="h-4 w-4 text-accent-text" aria-hidden />{t("requests.form.regulation", { ref: (type.regulationRef ?? "").replace(/^п\.\s*/, t("requests.form.clausePrefix")) })}</li>
      </ul>
      {prev && <div className="mb-4 rounded-xl border border-info/30 bg-info-bg px-3.5 py-2.5 text-sm text-info"><p className="font-semibold">{t("requests.form.copied", { number: prev.number })}</p>{prev.staffComment && <p>{t("requests.form.copiedReason", { reason: prev.staffComment === "Отозвана студентом" ? t("requests.sys.withdrawn") : prev.staffComment })}</p>}</div>}
      {!prev && !fromAssistant && Object.keys(defaults).length > 0 && <p className="mb-4 rounded-xl border border-warn-line bg-warn-bg px-3.5 py-2.5 text-sm text-warn">{t("requests.form.fromLink")}</p>}
      {fromAssistant && <p className="mb-4 rounded-xl border border-info/30 bg-info-bg px-3.5 py-2.5 text-sm text-info">{t("requests.form.fromAssistant")}</p>}
      <Card>
        <div className="mb-4 rounded-xl bg-bg p-3 text-sm">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted">{t("requests.form.fromProfile")}</p>
          <p className="font-medium">{name(p.student.lastName)} {name(p.student.firstName)} {name(p.student.middleName)}</p>
          <p className="text-muted">{tr("faculties", p.faculty.code)} · {t("requests.form.profileLine", { course: p.group.course, group: p.group.name, book: name(p.student.recordBook) })}</p>
        </div>
        <RequestForm code={type.code} fields={type.fields} defaults={defaults} />
      </Card>
    </div>
  );
}
