import { CheckCircle2, ChevronDown, ShieldCheck } from "lucide-react";
import { requireStudent } from "@/server/auth/guards";
import { listMySurveyCourses } from "@/server/dal/survey";
import { getI18n } from "@/i18n/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty";
import { SurveyForm } from "@/components/survey/survey-form";

export async function generateMetadata() {
  const { t } = await getI18n();
  return { title: t("survey.title") };
}

/** Анонимная оценка курсов (раунд 6, №6). */
export default async function SurveyPage() {
  const v = await requireStudent();
  const { t, tn, tr, name } = await getI18n();
  const courses = await listMySurveyCourses(v);
  const left = courses.filter((c) => !c.voted);
  return (
    <div className="pt-2 lg:pt-0">
      <PageHeader title={t("survey.title")} subtitle={t("survey.subtitle")} />
      <section aria-labelledby="how-h" className="mb-4 rounded-2xl border border-line bg-surface p-4 text-sm">
        <h2 id="how-h" className="mb-2 flex items-center gap-2 font-semibold"><ShieldCheck className="h-5 w-5 text-ok" aria-hidden />{t("survey.how.title")}</h2>
        <ul className="list-disc space-y-1 pl-5 text-muted"><li>{t("survey.how.p1")}</li><li>{t("survey.how.p2")}</li><li>{t("survey.how.p3")}</li></ul>
      </section>
      {!courses.length ? <EmptyState title={t("survey.empty")} /> : (
        <>
          <p className="mb-3 font-semibold">{left.length ? tn("survey.left", left.length) : t("survey.allDone")}</p>
          <div className="grid items-start gap-3 xl:grid-cols-2">
            {left.map((c, i) => (
              <Card key={c.id} as="article" aria-label={tr("subjects", c.name)} className="p-0">
                {/* Курсы свёрнуты, первый открыт: длинная страница из 7 форм утомляет */}
                <details open={i === 0} className="group">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-3 p-4 [&::-webkit-details-marker]:hidden">
                    <span className="min-w-0"><span className="block font-semibold leading-snug">{tr("subjects", c.name)}</span><span className="block text-[13px] text-muted">{tr("titles", c.teacherTitle)} {name(c.teacherLast)} {name(c.teacherFirst)[0]}.{c.teacherMiddle ? ` ${name(c.teacherMiddle)[0]}.` : ""}</span></span>
                    <ChevronDown className="mt-0.5 h-5 w-5 shrink-0 text-muted transition-transform group-open:rotate-180" aria-hidden />
                  </summary>
                  <div className="px-4 pb-4"><SurveyForm offeringId={c.id} /></div>
                </details>
              </Card>
            ))}
          </div>
          {courses.some((c) => c.voted) && (
            <ul className="mt-4 overflow-hidden rounded-2xl border border-line bg-surface text-sm">
              {courses.filter((c) => c.voted).map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 last:border-0"><span>{tr("subjects", c.name)}</span><span className="inline-flex shrink-0 items-center gap-1 text-ok"><CheckCircle2 className="h-4 w-4" aria-hidden />{t("survey.voted")}</span></li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
