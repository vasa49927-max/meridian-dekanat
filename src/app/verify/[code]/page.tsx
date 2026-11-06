import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { BadgeCheck, ShieldX } from "lucide-react";
import { db, schema as t } from "@/server/db";
import { maskedName } from "@/server/documents";
import { fmt, now } from "@/lib/time";
import { Logo } from "@/components/logo";
import { Disclaimer } from "@/components/shell/disclaimer";

export const metadata: Metadata = { title: "Проверка документа" };

/**
 * Публичная проверка подлинности по QR. Без входа, поэтому показываем минимум:
 * вид документа, дату, статус и ФИО в маске «Фамилия И. О.». Код случайный (96 бит) — перебором не найти.
 */
export default async function VerifyPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const ok = /^[A-Za-z0-9_-]{10,40}$/.test(code);
  const [d] = ok ? await db.select({ title: t.documents.title, issuedAt: t.documents.issuedAt, validUntil: t.documents.validUntil, revoked: t.documents.revoked, lastName: t.students.lastName, firstName: t.students.firstName, middleName: t.students.middleName, number: t.requests.number })
    .from(t.documents).innerJoin(t.students, eq(t.students.id, t.documents.studentId)).innerJoin(t.requests, eq(t.requests.id, t.documents.requestId))
    .where(eq(t.documents.verifyCode, code)).limit(1) : [];
  const valid = d && !d.revoked && (!d.validUntil || d.validUntil > now());
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col gap-6 px-5 py-8">
      <Logo className="text-primary dark:text-fg" />
      <section className="rounded-2xl border border-line bg-surface p-6 text-center">
        {d ? (
          <>
            {valid ? <BadgeCheck className="mx-auto h-14 w-14 text-ok" aria-hidden /> : <ShieldX className="mx-auto h-14 w-14 text-danger" aria-hidden />}
            <h1 className="mt-3 font-serif text-2xl">{valid ? "Документ подлинный" : d.revoked ? "Документ аннулирован" : "Срок действия истёк"}</h1>
            <dl className="mt-5 space-y-2 text-left text-sm">
              <div className="flex justify-between gap-4"><dt className="text-muted">Документ</dt><dd className="text-right font-medium">{d.title}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted">Номер</dt><dd className="font-medium">{d.number}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted">Выдан</dt><dd className="font-medium">{fmt.full(d.issuedAt)}</dd></div>
              {d.validUntil && <div className="flex justify-between gap-4"><dt className="text-muted">Действителен до</dt><dd className="font-medium">{fmt.full(d.validUntil)}</dd></div>}
              <div className="flex justify-between gap-4"><dt className="text-muted">Студент</dt><dd className="font-medium">{maskedName(d.lastName, d.firstName, d.middleName)}</dd></div>
            </dl>
          </>
        ) : (
          <>
            <ShieldX className="mx-auto h-14 w-14 text-danger" aria-hidden />
            <h1 className="mt-3 font-serif text-2xl">Документ не найден</h1>
            <p className="mt-2 text-sm text-muted">Проверьте ссылку или QR-код. Если документ получен от студента — запросите новый.</p>
          </>
        )}
      </section>
      <Disclaimer />
    </main>
  );
}
