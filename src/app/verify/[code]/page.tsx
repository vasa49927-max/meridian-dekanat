import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { BadgeCheck, ShieldX } from "lucide-react";
import { db, schema as tbl } from "@/server/db";
import { maskedName } from "@/server/documents";
import { now } from "@/lib/time";
import { Logo } from "@/components/logo";
import { Disclaimer } from "@/components/shell/disclaimer";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("auth.pages.verify.title") };
}

/**
 * Публичная проверка подлинности по QR. Без входа, поэтому показываем минимум:
 * вид документа, дату, статус и ФИО в маске «Фамилия И. О.». Код случайный (96 бит) — перебором не найти.
 */
export default async function VerifyPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  // Страница публичная (без входа): язык — из cookie. Вид документа и ФИО — как в самом (русском) документе.
  const { t, f } = await getI18n();
  const ok = /^[A-Za-z0-9_-]{10,40}$/.test(code);
  const [d] = ok ? await db.select({ title: tbl.documents.title, issuedAt: tbl.documents.issuedAt, validUntil: tbl.documents.validUntil, revoked: tbl.documents.revoked, lastName: tbl.students.lastName, firstName: tbl.students.firstName, middleName: tbl.students.middleName, number: tbl.requests.number })
    .from(tbl.documents).innerJoin(tbl.students, eq(tbl.students.id, tbl.documents.studentId)).innerJoin(tbl.requests, eq(tbl.requests.id, tbl.documents.requestId))
    .where(eq(tbl.documents.verifyCode, code)).limit(1) : [];
  const valid = d && !d.revoked && (!d.validUntil || d.validUntil > now());
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col gap-6 px-5 py-8">
      <Logo className="text-primary dark:text-fg" />
      <section className="card rounded-2xl border border-line bg-surface p-6 text-center">
        {d ? (
          <>
            {valid ? <BadgeCheck className="mx-auto h-14 w-14 text-ok" aria-hidden /> : <ShieldX className="mx-auto h-14 w-14 text-danger" aria-hidden />}
            <h1 className="mt-3 font-serif text-2xl">{valid ? t("auth.pages.verify.valid") : d.revoked ? t("auth.pages.verify.revoked") : t("auth.pages.verify.expired")}</h1>
            <dl className="mt-5 space-y-2 text-left text-sm">
              <div className="flex justify-between gap-4"><dt className="text-muted">{t("auth.pages.verify.document")}</dt><dd className="text-right font-medium">{d.title}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted">{t("auth.pages.verify.number")}</dt><dd className="font-medium">{d.number}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted">{t("auth.pages.verify.issued")}</dt><dd className="font-medium">{f.full(d.issuedAt)}</dd></div>
              {d.validUntil && <div className="flex justify-between gap-4"><dt className="text-muted">{t("auth.pages.verify.validUntil")}</dt><dd className="font-medium">{f.full(d.validUntil)}</dd></div>}
              <div className="flex justify-between gap-4"><dt className="text-muted">{t("auth.pages.verify.student")}</dt><dd className="font-medium">{maskedName(d.lastName, d.firstName, d.middleName)}</dd></div>
            </dl>
          </>
        ) : (
          <>
            <ShieldX className="mx-auto h-14 w-14 text-danger" aria-hidden />
            <h1 className="mt-3 font-serif text-2xl">{t("auth.pages.verify.notFound")}</h1>
            <p className="mt-2 text-sm text-muted">{t("auth.pages.verify.notFoundText")}</p>
          </>
        )}
      </section>
      <Disclaimer />
    </main>
  );
}
