"use server";
import { revalidatePath } from "next/cache";
import { requireStudent } from "@/server/auth/guards";
import { chooseElective, dropElective } from "@/server/dal/electives";
import { getI18n } from "@/i18n/server";

export type ElectiveState = { error?: string; ok?: string };

export async function electiveAction(_: ElectiveState, form: FormData): Promise<ElectiveState> {
  const v = await requireStudent();
  const { t } = await getI18n();
  const id = String(form.get("id") ?? "");
  if (form.get("op") === "drop") {
    const r = await dropElective(v, id);
    if (!r.ok) return { error: t(`electives.errors.${r.error}`) };
    revalidatePath("/grades/electives");
    return { ok: t("electives.done.drop") };
  }
  const r = await chooseElective(v, id);
  if (!r.ok) return { error: t(`electives.errors.${r.error}`) };
  revalidatePath("/grades/electives");
  return { ok: t(`electives.done.${r.status}`) };
}
