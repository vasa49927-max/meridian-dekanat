import Link from "next/link";
import { AlertTriangle, Award, CheckCircle2, Info } from "lucide-react";
import type { StipendForecast } from "@/lib/brs";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";

type T = (k: string, v?: Record<string, string | number>) => string;

/** Прогноз стипендии (раунд 8): итог одной строкой, ниже — что сделать по каждой «угрожающей» дисциплине. */
export function StipendCard({ f, t, tr, num }: { f: StipendForecast; t: T; tr: (g: string, v: string) => string; num: (n: number) => string }) {
  if (!f.applicable) {
    return <Card className="flex items-start gap-3 text-sm"><Info className="mt-0.5 h-5 w-5 shrink-0 text-muted" aria-hidden /><p><b>{t("grades.stipend.title")}.</b> {t("grades.stipend.contract")}</p></Card>;
  }
  const risk = f.status === "risk";
  return (
    <Card className={cn(risk ? "border-warn-line" : "border-ok/40")} aria-labelledby="stip-h">
      <div className="flex items-start gap-3">
        <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", risk ? "bg-warn-bg text-warn" : "bg-ok-bg text-ok")} aria-hidden>{risk ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}</span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-accent-text" id="stip-h">{t("grades.stipend.title")}</p>
          <p className="font-semibold">{risk ? t("grades.stipend.risk") : t("grades.stipend.keep")}</p>
          {risk ? (
            <ul className="mt-1.5 space-y-1 text-sm">
              {f.risks.map((r) => (
                <li key={r.name}>{r.kind === "exam" ? t(r.control === "CREDIT" ? "grades.stipend.riskItemCredit" : "grades.stipend.riskItem", { name: tr("subjects", r.name), pred: num(r.predicted), need: num(r.need) }) : r.kind === "pace" ? t("grades.stipend.riskPace", { name: tr("subjects", r.name), pred: num(r.predicted), need: num(r.need), rem: num(r.rem) }) : t("grades.stipend.riskImpossible", { name: tr("subjects", r.name), pred: num(r.predicted) })}</li>
              ))}
            </ul>
          ) : <p className="mt-0.5 text-sm text-muted">{t("grades.stipend.keepDetail")}</p>}
          <p className="mt-2 flex flex-wrap items-center gap-x-1.5 text-sm"><Award className="h-4 w-4 text-accent-text" aria-hidden />{t("grades.stipend.increased")} <Link href="/portfolio" className="font-semibold text-primary underline-offset-2 hover:underline dark:text-accent-text">→</Link></p>
          <p className="mt-1 text-xs text-muted">{t("grades.stipend.note")}</p>
        </div>
      </div>
    </Card>
  );
}
