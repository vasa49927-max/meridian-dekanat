"use client";
import { useActionState, useState } from "react";
import { Star } from "lucide-react";
import { rateRequestAction, type RateState } from "@/app/(student)/requests/actions";
import { Button } from "@/components/ui/button";
import { Label, Textarea } from "@/components/ui/field";
import { cn } from "@/lib/cn";

const WORDS = ["", "Плохо", "Так себе", "Нормально", "Хорошо", "Отлично"];

/** Оценка работы деканата (раунд 3): звёзды — это radio-группа, работает с клавиатуры и экранным диктором. */
export function RateForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState<RateState, FormData>(rateRequestAction, {});
  const [val, setVal] = useState(0);
  const [hover, setHover] = useState(0);
  if (state.ok) return <p role="status" className="rounded-xl bg-ok-bg px-3.5 py-2.5 text-sm font-medium text-ok">Спасибо! Оценка ушла в студенческий офис — так деканат видит, что работает хорошо, а что нет.</p>;
  const shown = hover || val;
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="id" value={id} />
      <fieldset>
        <legend className="mb-1.5 text-sm font-semibold">Как вам работа деканата по этой заявке?</legend>
        <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="cursor-pointer rounded-lg p-1 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[var(--focus)]" onMouseEnter={() => setHover(n)}>
              <input type="radio" name="rating" value={n} className="sr-only" checked={val === n} onChange={() => setVal(n)} aria-label={`${n} из 5 — ${WORDS[n]}`} />
              <Star className={cn("h-8 w-8 transition-colors", n <= shown ? "fill-accent text-accent" : "text-line")} aria-hidden />
            </label>
          ))}
          <span className="ml-2 text-sm text-muted" aria-hidden>{shown ? WORDS[shown] : ""}</span>
        </div>
      </fieldset>
      <div>
        <Label htmlFor="fb-comment">Что можно улучшить? <span className="font-normal text-muted">(необязательно)</span></Label>
        <Textarea id="fb-comment" name="comment" rows={2} maxLength={500} placeholder="Например: долго ждал ответа, всё понятно объяснили…" />
      </div>
      {state.error && <p role="alert" className="text-sm font-medium text-danger">{state.error}</p>}
      <Button type="submit" disabled={pending || !val}>{pending ? "Отправляем…" : "Оценить"}</Button>
    </form>
  );
}

export function RatingStars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`Оценка ${rating} из 5`}>
      {[1, 2, 3, 4, 5].map((n) => <Star key={n} className={cn("h-4 w-4", n <= rating ? "fill-accent text-accent" : "text-line")} aria-hidden />)}
    </span>
  );
}
