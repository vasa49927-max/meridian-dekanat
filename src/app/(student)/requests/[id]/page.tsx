import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CheckCircle2, Printer } from "lucide-react";
import { requireStudent } from "@/server/auth/guards";
import { getMyRequest } from "@/server/dal/requests";
import { qrSvg, verifyUrl } from "@/server/qr";
import { fmt } from "@/lib/time";
import { Card, CardTitle } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { StatusBadge, STATUS_LABEL, TRACK, type ReqStatus } from "@/components/requests/status";
import { DocumentView } from "@/components/requests/document-view";
import { AttachmentsList } from "@/components/requests/attachments-list";
import { listAttachmentsMeta } from "@/server/attachments";
import { ReplyForm, WithdrawButton } from "@/components/requests/request-actions";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Заявка" };

function Tracker({ status, events }: { status: ReqStatus; events: { status: ReqStatus; createdAt: Date }[] }) {
  const terminal = status === "REJECTED" ? "REJECTED" : null;
  const steps: ReqStatus[] = terminal ? ["SUBMITTED", "REJECTED"] : TRACK;
  const reached = (s: ReqStatus) => events.some((e) => e.status === s) || TRACK.indexOf(status) >= TRACK.indexOf(s);
  return (
    <ol className="grid grid-cols-4 gap-1" aria-label="Ход заявки">
      {steps.map((s, i) => {
        const done = reached(s);
        const current = s === status || (status === "NEEDS_INFO" && s === "IN_PROGRESS");
        const at = [...events].reverse().find((e) => e.status === s)?.createdAt;
        return (
          <li key={s} className={cn("min-w-0", terminal && "col-span-2")} aria-current={current ? "step" : undefined}>
            <div className={cn("h-1.5 rounded-full", done ? (s === "REJECTED" ? "bg-danger" : "bg-ok") : "bg-surface-2", current && !done && "bg-warn")} />
            <p className={cn("mt-2 text-xs font-semibold sm:text-sm", !done && "text-muted")}>{i + 1}. {status === "NEEDS_INFO" && s === "IN_PROGRESS" ? "Нужно дополнить" : STATUS_LABEL[s]}</p>
            {at && <p className="text-[11px] text-muted sm:text-xs">{fmt.dateTime(at)}</p>}
          </li>
        );
      })}
    </ol>
  );
}

export default async function RequestPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const v = await requireStudent();
  const { id } = await params;
  const { created } = await searchParams;
  const r = await getMyRequest(v, id);
  if (!r) notFound(); // чужая или несуществующая заявка — одинаковый ответ 404
  const doc = r.document;
  const qr = doc ? await qrSvg(doc.verifyCode) : null;
  const files = await listAttachmentsMeta(r.id); // доступ к заявке уже проверен выше
  return (
    <div className="mx-auto max-w-3xl pt-2 lg:pt-0">
      <nav aria-label="Навигация" className="mb-2 text-sm"><Link href="/requests" className="tap text-muted hover:text-fg">← Мои заявки</Link></nav>
      {created && <p role="status" className="mb-4 flex items-center gap-2 rounded-xl bg-ok-bg px-4 py-3 font-medium text-ok"><CheckCircle2 className="h-5 w-5" aria-hidden />Заявка отправлена. Статус будет меняться здесь и в уведомлениях.</p>}
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div><h1 className="font-serif text-[26px] leading-tight">{r.type.title}</h1><p className="mt-1 text-sm text-muted">{r.number} · подана {fmt.dateTime(r.createdAt)}</p></div>
        <StatusBadge status={r.status} className="text-sm" />
      </div>
      <Card className="mb-4">
        <Tracker status={r.status} events={r.events} />
        {["SUBMITTED", "IN_PROGRESS"].includes(r.status) && <p className="mt-4 text-sm text-muted">Ожидаемый срок готовности — <b className="text-fg">до {fmt.dayMonth(r.dueAt)}</b>.</p>}
        {r.status === "NEEDS_INFO" && <div className="mt-4 rounded-xl border border-warn-line bg-warn-bg p-3.5 text-sm text-warn"><p className="font-semibold">Деканат просит дополнить:</p><p className="mt-1">{r.staffComment}</p></div>}
        {r.status === "REJECTED" && r.staffComment && <div className="mt-4 rounded-xl bg-danger-bg p-3.5 text-sm text-danger"><p className="font-semibold">Причина отказа:</p><p className="mt-1">{r.staffComment}</p></div>}
        {r.status === "NEEDS_INFO" && <div className="mt-4"><ReplyForm id={r.id} /></div>}
        {r.status === "SUBMITTED" && <div className="mt-4"><WithdrawButton id={r.id} /></div>}
      </Card>

      {doc && qr && (
        <section aria-labelledby="doc-h" className="mb-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 id="doc-h" className="font-semibold">Электронный документ</h2>
            <LinkButton href={`/requests/${r.id}/document`} variant="secondary" size="sm"><Printer className="h-4 w-4" aria-hidden />Открыть для печати</LinkButton>
          </div>
          <DocumentView title={doc.title} lines={doc.body.lines} issuedAt={doc.issuedAt} validUntil={doc.validUntil} verifyCode={doc.verifyCode} qr={qr} verifyUrl={verifyUrl(doc.verifyCode)} number={r.number} revoked={doc.revoked} />
        </section>
      )}

      <div className="grid gap-4 md:grid-cols-2 [&>*]:min-w-0">
        <Card>
          <CardTitle>Данные заявки</CardTitle>
          <dl className="space-y-2 text-sm">
            {r.type.fields.map((f) => r.payload[f.name] ? <div key={f.name}><dt className="text-muted">{f.label}</dt><dd className="font-medium">{r.payload[f.name]}</dd></div> : null)}
            {r.studentComment && <div><dt className="text-muted">Ваш комментарий</dt><dd className="font-medium">{r.studentComment}</dd></div>}
          </dl>
          {files.length > 0 && <div className="mt-3"><p className="mb-1.5 text-sm text-muted">Вложения</p><AttachmentsList items={files} viewer="STUDENT" /></div>}
        </Card>
        <Card>
          <CardTitle>История</CardTitle>
          <ol className="relative space-y-3 border-l-2 border-line pl-4">
            {r.events.map((e) => (
              <li key={e.id} className="relative">
                <span className="absolute -left-[23px] top-1 h-3 w-3 rounded-full border-2 border-surface bg-accent" aria-hidden />
                <p className="text-sm font-semibold">{STATUS_LABEL[e.status]}</p>
                <p className="text-xs text-muted">{fmt.dateTime(e.createdAt)} · {e.actor}</p>
                {e.comment && <p className="mt-0.5 text-sm">{e.comment}</p>}
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </div>
  );
}
