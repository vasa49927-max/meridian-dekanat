"use server";
import { requireStudent } from "@/server/auth/guards";
import { submitMySurvey, surveySchema } from "@/server/dal/survey";
import { getI18n } from "@/i18n/server";

export type SurveyState = { error?: string; ok?: boolean };

export async function surveyAction(_: SurveyState, form: FormData): Promise<SurveyState> {
  const v = await requireStudent();
  const { t } = await getI18n();
  const p = surveySchema.safeParse({ offeringId: form.get("offeringId"), clarity: form.get("clarity"), teacher: form.get("teacher"), workload: form.get("workload"), comment: form.get("comment") || undefined });
  if (!p.success) return { error: t("survey.errors.fill") };
  const r = await submitMySurvey(v, p.data);
  if (!r.ok) return { error: t(`survey.errors.${r.error}`) };
  // Без revalidatePath: иначе карточка курса сразу уходит в «Вы уже ответили» и студент не видит подтверждения.
  // Список обновится при следующем открытии страницы.
  return { ok: true };
}
