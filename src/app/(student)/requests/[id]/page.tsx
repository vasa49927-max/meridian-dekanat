import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CheckCircle2, Printer, RotateCcw } from "lucide-react";
import { requireStudent } from "@/server/auth/guards";
import { getMyRequest } from "@/server/dal/requests";
import { qrSvg, verifyUrl } from "@/server/qr";
import { Card, CardTitle } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { StatusBadge, TRACK, type ReqStatus } from "@/components/requests/status";
import { DocumentView } from "@/components/requests/document-view";
import { AttachmentsList } from "@/components/requests/attachments-list";
import { listAttachmentsMeta } from "@/server/attachments";
import { ReplyForm, WithdrawButton } from "@/components/requests/request-actions";
import { RateForm, RatingStars } from "@/components/requests/rate-form";
import { cn } from "@/lib/cn";
import { getI18n } from "@/i18n/server";
import type { I18n } from "@/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("requests.detail.title") };
}

const WITHDRAWN = "Отозвана студентом";
const OFFICE_SUFFIX = ", студенческий офис";

/** Служебные тексты, которые пишет сама система (не люди), — на языке интерфейса. Для русского — без изменений. */
function sysText({ locale, t, tn, tc }: I18n, s: string) {
  if (s === WITHDRAWN) return t("requests.sys.withdrawn");
  if (locale === "ru") return s;
  return s.split(" · ").map((part) => (/[Пп]риложено файлов: \d+/.test(part) ? part.replace(/[Пп]риложено файлов: (\d+)/, (_, n: string) => tn("requests.sys.filesAttached", Number(n))) : tc(part))).join(" · ");
}
/** Кто сделал шаг: «Студент» или «Фамилия И. О., студенческий офис». */
function actorLabel({ t, name }: I18n, a: string) {
  if (a === "Студент") return t("requests.detail.student");
  if (a.endsWith(OFFICE_SUFFIX)) return `${name(a.slice(0, -OFFICE_SUFFIX.length))}${t("requests.detail.assigneeOffice")}`;
  return name(a);
}

function Tracker({ status, events, i18n: { t, f } }: { status: ReqStatus; events: { status: ReqStatus; createdAt: Date }[]; i18n: I18n }) {
  const terminal = status === "REJECTED" ? "REJECTED" : null;
  const steps: ReqStatus[] = terminal ? ["SUBMITTED", "REJECTED"] : TRACK;
  const reached = (s: ReqStatus) => events.some((e) => e.status === s) || TRACK.indexOf(status) >= TRACK.indexOf(s);
  return (
    <ol className="grid grid-cols-4 gap-1" aria-label={t("requests.detail.progress")}>
      {steps.map((s, i) => {
        const done = reached(s);
        const current = s === status || (status === "NEEDS_INFO" && s === "IN_PROGRESS");
        const at = [...events].reverse().find((e) => e.status === s)?.createdAt;
        return (
          <li key={s} className={cn("min-w-0", terminal && "col-span-2")} aria-current={current ? "step" : undefined}>
            <div className={cn("h-1.5 rounded-full", done ? (s === "REJECTED" ? "bg-danger" : "bg-ok") : "bg-surface-2", current && !done && "bg-warn")} />
            <p className={cn("mt-2 text-xs font-semibold sm:text-sm", !done && "text-muted")}>{i + 1}. {status === "NEEDS_INFO" && s === "IN_PROGRESS" ? t("common.status.NEEDS_INFO") : t(`common.status.${s}`)}</p>
            {at && <p className="text-[11px] text-muted sm:text-xs">{f.dateTime(at)}</p>}
          </li>
        );
      })}
    </ol>
  );
}

export default async function RequestPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const v = await requireStudent();
  const i18n = await getI18n();
  const { t, tr, name, f } = i18n;
  const { id } = await params;
  const { created } = await searchParams;
  const r = await getMyRequest(v, id);
  if (!r) notFound(); // чужая или несуществующая заявка — одинаковый ответ 404
  const doc = r.document;
  const qr = doc ? await qrSvg(doc.verifyCode) : null;
  const files = await listAttachmentsMeta(r.id); // доступ к заявке уже проверен выше
  return (
    <div className="mx-auto max-w-3xl pt-2 lg:pt-0">
      <nav aria-label={t("requests.nav.label")} className="mb-2 text-sm"><Link href="/requests" className="tap text-muted hover:text-fg">{t("requests.nav.myRequests")}</Link></nav>
      {created && <p role="status" className="mb-4 flex items-center gap-2 rounded-xl bg-ok-bg px-4 py-3 font-medium text-ok"><CheckCircle2 className="h-5 w-5" aria-hidden />{t("requests.detail.created")}</p>}
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div><span aria-hidden className="mb-2.5 block h-[3px] w-9 rounded-full bg-gradient-to-r from-accent to-accent/30" /><h1 className="font-serif text-[26px] leading-tight lg:text-[34px]">{tr("rt", r.type.title)}</h1><p className="mt-1 text-sm text-muted">{t("requests.detail.meta", { number: i18n.name(r.number), date: f.dateTime(r.createdAt) })}</p>
          {r.assignee && <p className="mt-0.5 text-sm text-muted">{t("requests.detail.assignee")} <span className="font-medium text-fg">{name(r.assignee.lastName)} {name(r.assignee.firstName)[0]}. {r.assignee.middleName ? `${name(r.assignee.middleName)[0]}.` : ""}</span>{t("requests.detail.assigneeOffice")}</p>}</div>
        <StatusBadge status={r.status} className="text-sm" />
      </div>
      <Card className="mb-4">
        <Tracker status={r.status} events={r.events} i18n={i18n} />
        {["SUBMITTED", "IN_PROGRESS"].includes(r.status) && <p className="mt-4 text-sm text-muted">{t("requests.detail.dueLead")}<b className="text-fg">{t("requests.detail.dueValue", { date: f.dayMonth(r.dueAt) })}</b>{t("requests.detail.dueEnd")}</p>}
        {r.status === "NEEDS_INFO" && <div className="mt-4 rounded-xl border border-warn-line bg-warn-bg p-3.5 text-sm text-warn"><p className="font-semibold">{t("requests.detail.needsInfo")}</p><p className="mt-1">{sysText(i18n, r.staffComment ?? "")}</p></div>}
        {r.status === "REJECTED" && r.staffComment && <div className="mt-4 rounded-xl bg-danger-bg p-3.5 text-sm text-danger"><p className="font-semibold">{t("requests.detail.rejectReason")}</p><p className="mt-1">{sysText(i18n, r.staffComment)}</p></div>}
        {r.status === "REJECTED" && <div className="mt-3"><LinkButton href={`/requests/new/${r.type.code}?again=${r.id}`} variant="soft"><RotateCcw className="h-4 w-4" aria-hidden />{t("requests.detail.again")}</LinkButton><p className="mt-1.5 text-xs text-muted">{t("requests.detail.againHint")}</p></div>}
        {r.status === "NEEDS_INFO" && <div className="mt-4"><ReplyForm id={r.id} /></div>}
        {r.status === "SUBMITTED" && <div className="mt-4"><WithdrawButton id={r.id} /></div>}
      </Card>

      {/* Раунд 3: оценка работы деканата — когда заявка закрыта; отозванную самим студентом не оцениваем */}
      {(r.status === "ISSUED" || (r.status === "REJECTED" && r.staffComment !== WITHDRAWN) || (r.status === "READY" && !r.type.producesDocument)) && (
        <Card className="mb-4">
          {r.feedback ? (
            <p className="flex flex-wrap items-center gap-2 text-sm"><span className="text-muted">{t("requests.rate.thanks")}</span><RatingStars rating={r.feedback.rating} />{r.feedback.comment && <span className="text-muted">{t("requests.rate.quoted", { text: r.feedback.comment })}</span>}</p>
          ) : <RateForm id={r.id} />}
        </Card>
      )}

      {doc && qr && (
        <section aria-labelledby="doc-h" className="mb-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 id="doc-h" className="font-semibold">{t("requests.detail.document")}</h2>
            <LinkButton href={`/requests/${r.id}/document`} variant="secondary" size="sm"><Printer className="h-4 w-4" aria-hidden />{t("requests.detail.openPrint")}</LinkButton>
          </div>
          <DocumentView title={doc.title} lines={doc.body.lines} issuedAt={doc.issuedAt} validUntil={doc.validUntil} verifyCode={doc.verifyCode} qr={qr} verifyUrl={verifyUrl(doc.verifyCode)} number={r.number} revoked={doc.revoked} />
        </section>
      )}

      <div className="grid gap-4 md:grid-cols-2 [&>*]:min-w-0">
        <Card>
          <CardTitle>{t("requests.detail.data")}</CardTitle>
          <dl className="space-y-2 text-sm">
            {r.type.fields.map((x) => r.payload[x.name] ? <div key={x.name}><dt className="text-muted">{tr("rt", x.label)}</dt><dd className="font-medium">{x.kind === "select" ? tr("rt", r.payload[x.name]) : i18n.tc(r.payload[x.name])}</dd></div> : null)}
            {r.studentComment && <div><dt className="text-muted">{t("requests.detail.yourComment")}</dt><dd className="font-medium">{r.studentComment}</dd></div>}
          </dl>
          {files.length > 0 && <div className="mt-3"><p className="mb-1.5 text-sm text-muted">{t("requests.detail.attachments")}</p><AttachmentsList items={files} viewer="STUDENT" /></div>}
        </Card>
        <Card>
          <CardTitle>{t("requests.detail.history")}</CardTitle>
          <ol className="relative space-y-3 border-l-2 border-line pl-4">
            {r.events.map((e) => (
              <li key={e.id} className="relative">
                <span className="absolute -left-[23px] top-1 h-3 w-3 rounded-full border-2 border-surface bg-accent" aria-hidden />
                <p className="text-sm font-semibold">{t(`common.status.${e.status}`)}</p>
                <p className="text-xs text-muted">{f.dateTime(e.createdAt)} · {actorLabel(i18n, e.actor)}</p>
                {e.comment && <p className="mt-0.5 text-sm">{sysText(i18n, e.comment)}</p>}
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </div>
  );
}
