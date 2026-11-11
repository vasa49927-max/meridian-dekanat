"use client";
import { useActionState, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { surveyAction, type SurveyState } from "@/app/(student)/survey/actions";
import { Button } from "@/components/ui/button";
import { FieldHint, Label, Textarea } from "@/components/ui/field";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/cn";

const QS = ["clarity", "teacher", "workload"] as const;

/** Форма анонимного опроса по одному курсу: три шкалы 1–5 (радиокнопки — работают с клавиатуры) и комментарий. */
export function SurveyForm({ offeringId }: { offeringId: string }) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState<SurveyState, FormData>(surveyAction, {});
  const [vals, setVals] = useState<Record<string, number>>({});
  if (state.ok) return <p role="status" className="flex items-center gap-2 rounded-xl bg-ok-bg px-3 py-2 text-sm font-semibold text-ok"><CheckCircle2 className="h-4 w-4" aria-hidden />{t("survey.done")}</p>;
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="offeringId" value={offeringId} />
      {QS.map((q) => (
        <fieldset key={q} className="min-w-0">
          <legend className="mb-1.5 text-sm font-semibold">{t(`survey.q.${q}`)}</legend>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-muted sm:inline">{t("survey.scale.low")}</span>
            {[1, 2, 3, 4, 5].map((n) => (
              <label key={n} className={cn("grid h-10 w-10 cursor-pointer place-items-center rounded-xl border text-sm font-semibold tabular has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[var(--focus)]", vals[q] === n ? "border-primary bg-primary text-primary-fg dark:border-accent dark:bg-accent dark:text-[#14182a]" : "border-line hover:bg-surface-2")}>
                <input type="radio" name={q} value={n} className="sr-only" checked={vals[q] === n} onChange={() => setVals((v) => ({ ...v, [q]: n }))} aria-label={t("survey.scale.aria", { q: t(`survey.q.${q}`), n })} />{n}
              </label>
            ))}
            <span className="hidden text-xs text-muted sm:inline">{t("survey.scale.high")}</span>
          </div>
        </fieldset>
      ))}
      <div>
        <Label htmlFor={`c-${offeringId}`}>{t("survey.q.comment")}</Label>
        <Textarea id={`c-${offeringId}`} name="comment" maxLength={500} className="min-h-20" aria-describedby={`ch-${offeringId}`} />
        <FieldHint id={`ch-${offeringId}`}>{t("survey.q.commentHint")}</FieldHint>
      </div>
      {state.error && <p role="alert" className="rounded-xl bg-danger-bg px-3 py-2 text-sm text-danger">{state.error}</p>}
      <Button type="submit" disabled={pending || QS.some((q) => !vals[q])}>{pending ? t("survey.sending") : t("survey.send")}</Button>
    </form>
  );
}
