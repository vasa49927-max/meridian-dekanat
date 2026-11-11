"use client";
import { useActionState, useState } from "react";
import { Star } from "lucide-react";
import { rateRequestAction, type RateState } from "@/app/(student)/requests/actions";
import { Button } from "@/components/ui/button";
import { Label, Textarea } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { useI18n } from "@/i18n/client";

const WORDS = ["", "w1", "w2", "w3", "w4", "w5"] as const;

/** Оценка работы деканата (раунд 3): звёзды — это radio-группа, работает с клавиатуры и экранным диктором. */
export function RateForm({ id }: { id: string }) {
  const { t } = useI18n();
  const word = (n: number) => (n >= 1 && n <= 5 ? t(`requests.rate.${WORDS[n] as Exclude<(typeof WORDS)[number], "">}`) : "");
  const [state, action, pending] = useActionState<RateState, FormData>(rateRequestAction, {});
  const [val, setVal] = useState(0);
  const [hover, setHover] = useState(0);
  if (state.ok) return <p role="status" className="rounded-xl bg-ok-bg px-3.5 py-2.5 text-sm font-medium text-ok">{t("requests.rate.sent")}</p>;
  const shown = hover || val;
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="id" value={id} />
      <fieldset>
        <legend className="mb-1.5 text-sm font-semibold">{t("requests.rate.question")}</legend>
        <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="cursor-pointer rounded-lg p-1 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[var(--focus)]" onMouseEnter={() => setHover(n)}>
              <input type="radio" name="rating" value={n} className="sr-only" checked={val === n} onChange={() => setVal(n)} aria-label={t("requests.rate.radio", { n, word: word(n) })} />
              <Star className={cn("h-8 w-8 transition-colors", n <= shown ? "fill-accent text-accent" : "text-line")} aria-hidden />
            </label>
          ))}
          <span className="ml-2 text-sm text-muted" aria-hidden>{shown ? word(shown) : ""}</span>
        </div>
      </fieldset>
      <div>
        <Label htmlFor="fb-comment">{t("requests.rate.improve")} <span className="font-normal text-muted">{t("requests.rate.optional")}</span></Label>
        <Textarea id="fb-comment" name="comment" rows={2} maxLength={500} placeholder={t("requests.rate.placeholder")} />
      </div>
      {state.error && <p role="alert" className="text-sm font-medium text-danger">{state.error}</p>}
      <Button type="submit" disabled={pending || !val}>{pending ? t("requests.rate.sending") : t("requests.rate.submit")}</Button>
    </form>
  );
}

export function RatingStars({ rating }: { rating: number }) {
  const { t } = useI18n();
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={t("requests.rate.stars", { n: rating })}>
      {[1, 2, 3, 4, 5].map((n) => <Star key={n} className={cn("h-4 w-4", n <= rating ? "fill-accent text-accent" : "text-line")} aria-hidden />)}
    </span>
  );
}
