import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireStudent } from "@/server/auth/guards";
import { getMyRequest } from "@/server/dal/requests";
import { qrSvg, verifyUrl } from "@/server/qr";
import { DocumentView } from "@/components/requests/document-view";
import { PrintButton } from "@/components/requests/print-button";

export const metadata: Metadata = { title: "Документ" };

export default async function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const v = await requireStudent();
  const { id } = await params;
  const r = await getMyRequest(v, id);
  if (!r?.document) notFound();
  const d = r.document;
  return (
    <div className="mx-auto max-w-3xl pt-2 lg:pt-0">
      <div className="mb-3 flex items-center justify-between print:hidden"><Link href={`/requests/${r.id}`} className="text-sm text-muted hover:text-fg">← К заявке</Link><PrintButton /></div>
      <DocumentView title={d.title} lines={d.body.lines} issuedAt={d.issuedAt} validUntil={d.validUntil} verifyCode={d.verifyCode} qr={await qrSvg(d.verifyCode)} verifyUrl={verifyUrl(d.verifyCode)} number={r.number} revoked={d.revoked} />
    </div>
  );
}
