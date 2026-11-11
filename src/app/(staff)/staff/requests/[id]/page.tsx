import Link from "next/link";
import { takeRequestAction } from "@/app/(staff)/staff/actions";
import { RatingStars } from "@/components/requests/rate-form";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireStaff } from "@/server/auth/guards";
import { STATUS_FLOW, staffGetRequest } from "@/server/dal/staff";
import { qrSvg, verifyUrl } from "@/server/qr";
import { fmt } from "@/lib/time";
import { Card, CardTitle } from "@/components/ui/card";
import { StatusBadge, STATUS_LABEL } from "@/components/requests/status";
import { DocumentView } from "@/components/requests/document-view";
import { AttachmentsList } from "@/components/requests/attachments-list";
import { listAttachmentsMeta } from "@/server/attachments";
import { StatusForm } from "@/components/staff/status-form";

export const metadata: Metadata = { title: "Заявка — деканат" };

export default async function StaffRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const v = await requireStaff();
  const { id } = await params;
  const r = await staffGetRequest(v, id);
  if (!r) notFound();
  const st = r.student;
  const next = STATUS_FLOW[r.status];
  const files = await listAttachmentsMeta(r.id);
  return (
    <div className="pt-2 lg:pt-0">
      <nav aria-label="Навигация" className="mb-2 text-sm"><Link href="/staff" className="tap text-muted hover:text-fg">← Очередь</Link></nav>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div><span aria-hidden className="mb-2.5 block h-[3px] w-9 rounded-full bg-gradient-to-r from-accent to-accent/30" /><h1 className="font-serif text-[26px] leading-tight lg:text-[34px]">{r.type.title}</h1><p className="mt-1 text-sm text-muted">{r.number} · подана {fmt.dateTime(r.createdAt)} · срок до {fmt.dayMonth(r.dueAt)}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted">Ведёт:</span>
            <b>{r.assignee ? (r.assignee.id === v.staffId ? "вы" : `${r.assignee.lastName} ${r.assignee.firstName[0]}. ${r.assignee.middleName ? r.assignee.middleName[0] + "." : ""}`) : "никто — заявка свободна"}</b>
            {r.assignee?.id !== v.staffId && next.length > 0 && <form action={takeRequestAction}><input type="hidden" name="id" value={r.id} /><button className="rounded-lg border border-line px-2.5 py-1 text-xs font-semibold hover:bg-surface-2">Взять себе</button></form>}
          </div></div>
        <StatusBadge status={r.status} className="text-sm" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr] [&>*]:min-w-0">
        <div className="space-y-4">
          <Card>
            <CardTitle>Студент</CardTitle>
            <p className="font-semibold">{st.lastName} {st.firstName} {st.middleName}</p>
            <p className="text-sm text-muted">{st.group.faculty.code} · {st.group.course} курс · гр. {st.group.name} · {st.group.program.code} «{st.group.program.name}»</p>
            <p className="text-sm text-muted">Зачётка {st.recordBook} · {st.basis}{st.militaryTraining ? " · ВУЦ" : ""}</p>
          </Card>
          {r.feedback && (
            <Card>
              <CardTitle>Оценка студента</CardTitle>
              <p className="flex flex-wrap items-center gap-2 text-sm"><RatingStars rating={r.feedback.rating} />{r.feedback.comment ? <span>«{r.feedback.comment}»</span> : <span className="text-muted">без комментария</span>}</p>
            </Card>
          )}
          <Card>
            <CardTitle>Данные заявки</CardTitle>
            <dl className="space-y-2 text-sm">
              {r.type.fields.map((f) => r.payload[f.name] ? <div key={f.name}><dt className="text-muted">{f.label}</dt><dd className="font-medium">{r.payload[f.name]}</dd></div> : null)}
              {r.studentComment && <div><dt className="text-muted">Комментарий студента</dt><dd className="font-medium">{r.studentComment}</dd></div>}
            </dl>
            {files.length > 0 && <div className="mt-3"><p className="mb-1.5 text-sm text-muted">Вложения студента</p><AttachmentsList items={files} viewer="STAFF" /></div>}
          </Card>
          {r.document && <DocumentView title={r.document.title} lines={r.document.body.lines} issuedAt={r.document.issuedAt} validUntil={r.document.validUntil} verifyCode={r.document.verifyCode} qr={await qrSvg(r.document.verifyCode)} verifyUrl={verifyUrl(r.document.verifyCode)} number={r.number} revoked={r.document.revoked} />}
        </div>
        <div className="space-y-4">
          <Card>
            <CardTitle>Действие</CardTitle>
            {next.length ? <StatusForm id={r.id} options={next.map((s) => ({ value: s, label: STATUS_LABEL[s] }))} producesDocument={r.type.producesDocument} /> : <p className="text-sm text-muted">Заявка закрыта — действий нет.</p>}
          </Card>
          <Card>
            <CardTitle>История</CardTitle>
            <ol className="space-y-3 border-l-2 border-line pl-4">
              {r.events.map((e) => <li key={e.id}><p className="text-sm font-semibold">{STATUS_LABEL[e.status]}</p><p className="text-xs text-muted">{fmt.dateTime(e.createdAt)} · {e.actor}</p>{e.comment && <p className="text-sm">{e.comment}</p>}</li>)}
            </ol>
          </Card>
        </div>
      </div>
    </div>
  );
}
