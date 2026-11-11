"use server";
import { revalidatePath } from "next/cache";
import { requireStudent } from "@/server/auth/guards";
import { addMyPortfolioItem, deleteMyPortfolioItem, portfolioSchema } from "@/server/dal/portfolio";
import { getI18n } from "@/i18n/server";

export type PortfolioState = { error?: string; ok?: number };

export async function addPortfolioAction(_: PortfolioState, form: FormData): Promise<PortfolioState> {
  const v = await requireStudent();
  const { t } = await getI18n();
  const raw = Object.fromEntries([...form.entries()].filter(([, x]) => x !== "").map(([k, x]) => [k, String(x)]));
  const p = portfolioSchema.safeParse(raw);
  if (!p.success) {
    const f = p.error.issues[0].path[0];
    return { error: t(f === "title" ? "portfolio.errors.title" : f === "date" ? "portfolio.errors.date" : "portfolio.errors.fill") };
  }
  const r = await addMyPortfolioItem(v, p.data);
  if (!r.ok) return { error: t("portfolio.errors.limit") };
  revalidatePath("/portfolio");
  return { ok: Date.now() };
}

export async function deletePortfolioAction(form: FormData): Promise<void> {
  const v = await requireStudent();
  await deleteMyPortfolioItem(v, String(form.get("id") ?? ""));
  revalidatePath("/portfolio");
}
