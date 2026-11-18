"use client";
import Link from "next/link";
import { useOptimistic, useTransition } from "react";
import { Check, ChevronRight, Sparkles } from "lucide-react";
import { toggleChecklistAction } from "./actions";
import { useI18n } from "@/i18n/client";
import { CHECKLIST } from "@/lib/checklist";
import { cn } from "@/lib/cn";

/** «Первые шаги» для первокурсника (раунд 8): отметки сохраняются в БД, прогресс — кольцом. */
export function ChecklistCard({ done }: { done: string[] }) {
  const { t, tn } = useI18n();
  const [, start] = useTransition();
  const [state, apply] = useOptimistic(new Set(done), (s: Set<string>, a: { key: string; on: boolean }) => { const n = new Set(s); if (a.on) n.add(a.key); else n.delete(a.key); return n; });
  const n = CHECKLIST.filter((x) => state.has(x.key)).length;
  const pct = n / CHECKLIST.length;
  const toggle = (key: string, on: boolean) => start(async () => { apply({ key, on }); await toggleChecklistAction(key, on); });
  const C = 2 * Math.PI * 18;
  return (
    <section aria-labelledby="cl-h" className="card rounded-[var(--radius-card)] border border-line bg-surface p-4 lg:p-5">
      <div className="mb-3 flex items-center gap-3">
        <svg viewBox="0 0 44 44" className="h-12 w-12 shrink-0 -rotate-90" aria-hidden>
          <circle cx="22" cy="22" r="18" fill="none" strokeWidth="5" className="stroke-surface-2" />
          <circle cx="22" cy="22" r="18" fill="none" strokeWidth="5" strokeLinecap="round" className="stroke-accent transition-[stroke-dashoffset] duration-500" strokeDasharray={C} strokeDashoffset={C * (1 - pct)} />
        </svg>
        <div className="min-w-0">
          <h2 id="cl-h" className="flex items-center gap-1.5 font-semibold"><Sparkles className="h-4 w-4 text-accent-text" aria-hidden />{t("today.checklist.title")}</h2>
          <p className="text-sm text-muted" aria-live="polite">{n === CHECKLIST.length ? t("today.checklist.allDone") : tn("today.checklist.left", CHECKLIST.length - n)}</p>
        </div>
      </div>
      <ul className="grid gap-1 sm:grid-cols-2">
        {CHECKLIST.map((x) => {
          const on = state.has(x.key);
          return (
            <li key={x.key} className={cn("flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-colors", on ? "text-muted" : "hover:bg-surface-2/60")}>
              <button type="button" role="checkbox" aria-checked={on} onClick={() => toggle(x.key, !on)} aria-label={t(`today.checklist.items.${x.key}`)}
                className={cn("grid h-6 w-6 shrink-0 place-items-center rounded-lg border-2 transition-colors", on ? "border-ok bg-ok text-white dark:text-[#0b1020]" : "border-line hover:border-primary")}>
                {on && <Check className="h-4 w-4" strokeWidth={3} aria-hidden />}
              </button>
              <span className={cn("min-w-0 flex-1 text-sm", on && "line-through decoration-muted/60")}>{t(`today.checklist.items.${x.key}`)}</span>
              {x.link && !on && <Link href={x.link} className="tap shrink-0 text-muted hover:text-fg" aria-label={t("today.checklist.go", { item: t(`today.checklist.items.${x.key}`) })}><ChevronRight className="h-4 w-4" aria-hidden /></Link>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
