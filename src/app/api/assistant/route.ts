import { z } from "zod";
import { apiViewer, assertSameOrigin } from "@/server/auth/guards";
import { LIMITS, countRecent, record } from "@/server/auth/rate-limit";
import { askAssistant } from "@/server/ai/assistant";

const body = z.object({
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(1200) })).min(1).max(12),
}).refine((b) => b.messages[b.messages.length - 1].role === "user", "Последнее сообщение должно быть от студента");

/** Помощник: только для студента, только тот же Origin, лимит 30 вопросов в час. Ключ ИИ живёт только здесь, на сервере. */
export async function POST(req: Request) {
  const bad = await assertSameOrigin();
  if (bad) return bad;
  const auth = await apiViewer("STUDENT");
  if ("error" in auth) return auth.error;
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Некорректный запрос" }, { status: 400 });
  const bucket = `ai:${auth.viewer.userId}`;
  if ((await countRecent(bucket, LIMITS.aiPerUser.windowMs)) >= LIMITS.aiPerUser.max) {
    return Response.json({ error: "Слишком много вопросов за час. Попробуйте позже или запишитесь к методисту." }, { status: 429 });
  }
  await record(bucket);
  const reply = await askAssistant(auth.viewer, parsed.data.messages);
  return Response.json(reply, { headers: { "Cache-Control": "no-store" } });
}
