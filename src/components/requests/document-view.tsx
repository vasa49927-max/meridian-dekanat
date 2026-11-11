import { LogoMark } from "@/components/logo";
import { fmt } from "@/lib/time";
import { getI18n } from "@/i18n/server";

export type DocProps = { title: string; lines: string[]; issuedAt: Date; validUntil: Date | null; verifyCode: string; qr: string; verifyUrl: string; number: string; revoked: boolean };

/**
 * Электронная справка. QR ведёт на публичную страницу проверки (только факт подлинности и маска ФИО).
 * Сам документ официальный и выдаётся на русском (шапка, текст, подпись, даты — по-русски через fmt);
 * на язык интерфейса переводятся только подписи для экранного диктора, плашка-дисклеймер и отметка «аннулирована».
 */
export async function DocumentView(d: DocProps) {
  const { t } = await getI18n();
  return (
    <article aria-label={d.title} className="relative overflow-hidden rounded-2xl border border-line bg-white p-5 text-[#141b2d] shadow-sm sm:p-7 print:border-0 print:shadow-none">
      <div className="absolute inset-x-0 top-0 h-1.5 bg-[#14244b]" aria-hidden />
      <header className="flex items-start justify-between gap-4 border-b border-[#e2dbcb] pb-4">
        <div className="flex items-center gap-3 text-[#14244b]"><LogoMark className="h-10 w-10" /><div><p className="font-serif text-lg font-bold leading-none">Меридиан</p><p className="text-xs text-[#565c6b]">Студенческий офис · концепт</p></div></div>
        <div className="text-right text-xs text-[#565c6b]"><p>№ {d.number}</p><p>от {fmt.full(d.issuedAt)}</p></div>
      </header>
      <h2 className="mt-5 text-center font-serif text-xl font-bold uppercase tracking-wide">{d.title}</h2>
      <div className="mt-4 space-y-2 text-[15px] leading-relaxed">{d.lines.map((l, i) => <p key={i}>{l}</p>)}</div>
      <footer className="mt-6 flex flex-col gap-4 border-t border-[#e2dbcb] pt-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="text-sm">
          <p>Методист студенческого офиса <span className="font-serif italic">И. П. Белова</span></p>
          {d.validUntil && <p className="text-xs text-[#565c6b]">Действительна до {fmt.full(d.validUntil)}</p>}
          <p className="mt-2 max-w-xs text-xs text-[#565c6b]">Подлинность: отсканируйте QR или откройте <span className="break-all font-mono">{d.verifyUrl}</span></p>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-28 w-28 shrink-0 [&_svg]:h-full [&_svg]:w-full" role="img" aria-label={t("requests.doc.qr")} dangerouslySetInnerHTML={{ __html: d.qr }} />
        </div>
      </footer>
      <p className="mt-4 rounded-lg bg-[#fff6e3] px-3 py-2 text-center text-xs text-[#7a4e00]">{t("requests.doc.disclaimer")}</p>
      {d.revoked && <div className="absolute inset-0 grid place-items-center bg-white/70"><p className="rotate-[-12deg] rounded-xl border-4 border-[#b3261e] px-6 py-2 text-2xl font-bold text-[#b3261e]">{t("requests.doc.revoked")}</p></div>}
    </article>
  );
}
