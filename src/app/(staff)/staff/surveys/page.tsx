import type { Metadata } from "next";
import { EyeOff, MessageSquareQuote } from "lucide-react";
import { requireStaff } from "@/server/auth/guards";
import { MIN_RESPONSES, staffSurveyResults } from "@/server/dal/survey";
import { plural } from "@/lib/time";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Опросы о курсах" };

const Score = ({ label, v }: { label: string; v: number | null }) => (
  <div className="min-w-0">
    <p className="text-xs text-muted">{label}</p>
    <div className="mt-1 flex items-center gap-2">
      <div className="h-2 flex-1 rounded-full bg-surface-2"><div className="h-full rounded-full bg-primary dark:bg-accent/80" style={{ width: `${((v ?? 0) / 5) * 100}%` }} /></div>
      <span className="w-8 text-right text-sm font-semibold tabular">{v === null ? "—" : v.toLocaleString("ru-RU")}</span>
    </div>
  </div>
);

/** Итоги анонимного опроса (раунд 6, №6): только агрегаты и только при ≥ 3 ответах. */
export default async function SurveysPage() {
  const v = await requireStaff();
  const rows = await staffSurveyResults(v);
  const withAnswers = rows.filter((r) => r.n > 0);
  return (
    <div className="pt-2 lg:pt-0">
      <PageHeader title="Опросы о курсах" subtitle={`Анонимные ответы студентов. Итоги курса видны от ${MIN_RESPONSES} ответов — чтобы нельзя было догадаться, кто что написал.`} />
      {!withAnswers.length ? <p className="text-sm text-muted">Пока нет ответов.</p> : (
        <ul className="grid gap-3 xl:grid-cols-2">
          {withAnswers.map((r) => (
            <Card as="li" key={r.id} className={cn("p-4", !r.shown && "opacity-80")}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0"><p className="font-semibold leading-snug">{r.name}</p><p className="text-sm text-muted">{r.group} · {r.teacher}</p></div>
                <span className="shrink-0 rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-semibold tabular">{r.n} {plural(r.n, "ответ", "ответа", "ответов")}</span>
              </div>
              {r.shown ? (
                <>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <Score label="Понятность" v={r.clarity} /><Score label="Преподаватель" v={r.teacherScore} /><Score label="Посильность нагрузки" v={r.workload} />
                  </div>
                  {r.comments.length > 0 && (
                    <details className="mt-3 text-sm">
                      <summary className="cursor-pointer font-semibold"><MessageSquareQuote className="mr-1 inline h-4 w-4" aria-hidden />Комментарии ({r.comments.length})</summary>
                      <ul className="mt-2 space-y-1.5">{r.comments.map((c, i) => <li key={i} className="rounded-lg bg-surface-2 px-3 py-2">{c}</li>)}</ul>
                    </details>
                  )}
                </>
              ) : <p className="mt-3 flex items-center gap-2 text-sm text-muted"><EyeOff className="h-4 w-4" aria-hidden />Меньше {MIN_RESPONSES} ответов — итоги скрыты ради анонимности.</p>}
            </Card>
          ))}
        </ul>
      )}
    </div>
  );
}
