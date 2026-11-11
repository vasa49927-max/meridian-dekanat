import { checkSecret, handleUpdate, maxEnabled } from "@/server/bot/max";

/**
 * Вебхук чат-бота MAX. Пока ключа нет — 404 (бот «спит»). С ключом: проверка секрета из заголовка
 * X-Max-Bot-Api-Secret (задаётся при подписке POST /subscriptions), иначе 401.
 * Origin здесь не проверяем: запрос приходит от серверов MAX, а не из браузера.
 */
export async function POST(req: Request) {
  if (!maxEnabled()) return new Response("Not found", { status: 404 });
  if (!checkSecret(req.headers.get("x-max-bot-api-secret"))) return new Response("Unauthorized", { status: 401 });
  const body = await req.json().catch(() => null);
  if (body && typeof body === "object") await handleUpdate(body);
  return Response.json({ ok: true });
}
