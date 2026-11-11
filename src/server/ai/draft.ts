import "server-only";
import { eq } from "drizzle-orm";
import { db, schema as t } from "@/server/db";
import { env } from "@/server/env";
import type { StaffViewer } from "@/server/auth/guards";
import { staffGetRequest } from "@/server/dal/staff";
import { fmt } from "@/lib/time";
import { REGULATION } from "./regulation";
import { gigachat } from "./assistant";

/**
 * ИИ-черновик ответа методиста (раунд 6, улучшение №3).
 * Черновик — только подсказка: текст попадает в поле комментария, методист правит его и сам решает, отправлять ли.
 * В модель НЕ уходят ФИО, номер зачётки и другие персональные данные — только вид заявки, выбранный статус,
 * поля заявки и пункт Положения. Обращение по имени подставляется уже после ответа модели, на нашем сервере.
 */
export type DraftStatus = "IN_PROGRESS" | "NEEDS_INFO" | "READY" | "ISSUED" | "REJECTED";
export type Draft = { text: string; mode: "llm" | "offline" };

const STATUS_RU: Record<DraftStatus, string> = { IN_PROGRESS: "в работе", NEEDS_INFO: "нужно дополнить", READY: "готова", ISSUED: "выдана", REJECTED: "отклонена" };

const SYSTEM = `Ты помогаешь методисту студенческого офиса вуза написать короткий комментарий студенту к смене статуса заявки (концепт «Меридиан», не официальный сервис).
Правила: по-русски, на «вы», вежливо и по делу, 2–4 предложения, до 60 слов. Без приветствия и подписи — их добавит система.
Не выдумывай сроки, суммы, номера кабинетов и документы, которых нет во входных данных. Если чего-то не знаешь — поставь заметку в квадратных скобках, например [уточните причину], чтобы методист дописал.
Ссылайся на пункт Положения, если он дан, в виде [п. 6.3]. Верни только текст комментария.`;

function offline(r: NonNullable<Awaited<ReturnType<typeof staffGetRequest>>>, status: DraftStatus, office: string): string {
  const type = r.type.title;
  const ref = r.type.regulationRef ? ` [${r.type.regulationRef}]` : "";
  switch (status) {
    case "IN_PROGRESS":
      return `Заявку «${type}» взяли в работу. Постараемся подготовить до ${fmt.dayMonth(r.dueAt)}; если понадобятся уточнения, напишем здесь.`;
    case "NEEDS_INFO":
      return `Чтобы оформить «${type}», не хватает сведений: [укажите, что нужно дополнить]. Ответьте, пожалуйста, прямо в этой заявке — срок продолжится после ответа.`;
    case "READY":
      return r.type.producesDocument
        ? `Документ готов: электронный экземпляр с QR-кодом — в этой заявке. Бумажный можно забрать в студенческом офисе (${office}) в будни с 10:00 до 17:00, при себе — студенческий билет.`
        : `Заявление «${type}» рассмотрено положительно${ref}. [Укажите, что дальше: приказ, сроки, куда подойти.]`;
    case "ISSUED":
      return "Документ выдан. Если понадобится ещё экземпляр — подайте новую заявку в кабинете.";
    case "REJECTED":
      return `К сожалению, не можем выполнить заявку «${type}»: [укажите причину]${ref}. Если есть вопросы, запишитесь на консультацию к методисту в разделе «Запись к методисту».`;
  }
}

export async function draftReply(v: StaffViewer, requestId: string, status: DraftStatus): Promise<Draft | null> {
  const r = await staffGetRequest(v, requestId);
  if (!r) return null;
  const [me] = await db.select({ office: t.staff.office }).from(t.staff).where(eq(t.staff.id, v.staffId)).limit(1);
  const office = (me?.office ?? "").replace(/^Студенческий офис, /, "");
  const greet = `${r.student.firstName}, здравствуйте!`;
  if (!env.GIGACHAT_AUTH_KEY) return { text: `${greet} ${offline(r, status, office)}`, mode: "offline" };
  try {
    const labels = new Map(r.type.fields.map((f) => [f.name, f.label]));
    const fields = Object.entries(r.payload).filter(([, x]) => x).map(([k, x]) => `${labels.get(k) ?? k}: ${String(x).slice(0, 200)}`).join("; ");
    const point = REGULATION.find((p) => r.type.regulationRef?.includes(p.id));
    const input = [
      `Вид заявки: «${r.type.title}»${r.type.producesDocument ? " (документ формируется автоматически, электронный экземпляр с QR-кодом появляется в заявке)" : ""}.`,
      `Новый статус: «${STATUS_RU[status]}».`,
      `Срок по регламенту: до ${fmt.dayMonth(r.dueAt)}.`,
      fields && `Поля заявки: ${fields}.`,
      r.studentComment && `Комментарий студента: ${r.studentComment.slice(0, 300)}`,
      `Где выдают документы: студенческий офис, ${office}, будни 10:00–17:00.`,
      point && `Положение [п. ${point.id}] ${point.section}: ${point.text}`,
    ].filter(Boolean).join("\n");
    const out = (await gigachat([{ role: "system", content: SYSTEM }, { role: "user", content: input }])).trim().replace(/^["«]|["»]$/g, "").slice(0, 800);
    if (!out) throw new Error("пустой ответ");
    return { text: `${greet} ${out}`.slice(0, 800), mode: "llm" };
  } catch (e) {
    console.error("[draft] GigaChat недоступен, шаблон:", e instanceof Error ? e.message : e);
    return { text: `${greet} ${offline(r, status, office)}`, mode: "offline" };
  }
}
