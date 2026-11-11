import { z } from "zod";
import { headers } from "next/headers";
import { apiViewer, assertSameOrigin } from "@/server/auth/guards";
import { countSubscriptions, isAllowedEndpoint, removeSubscription, saveSubscription, vapidKeys } from "@/server/push";

const sub = z.object({
  endpoint: z.string().url().max(800),
  keys: z.object({ p256dh: z.string().regex(/^[A-Za-z0-9_-]{80,100}$/), auth: z.string().regex(/^[A-Za-z0-9_-]{16,32}$/) }),
});

/** Публичный ключ VAPID — браузеру для подписки. */
export async function GET() {
  const auth = await apiViewer("STUDENT");
  if ("error" in auth) return auth.error;
  return Response.json({ publicKey: (await vapidKeys()).publicKey, devices: await countSubscriptions(auth.viewer.userId) }, { headers: { "Cache-Control": "no-store" } });
}

/** Сохранить подписку этого устройства. Владелец — из сессии; адрес — только известные push-сервисы. */
export async function POST(req: Request) {
  const bad = await assertSameOrigin();
  if (bad) return bad;
  const auth = await apiViewer("STUDENT");
  if ("error" in auth) return auth.error;
  const p = sub.safeParse(await req.json().catch(() => null));
  if (!p.success || !isAllowedEndpoint(p.data.endpoint)) return Response.json({ error: "Некорректная подписка" }, { status: 400 });
  if ((await countSubscriptions(auth.viewer.userId)) >= 10) return Response.json({ error: "Слишком много устройств — отключите уведомления на старых" }, { status: 429 });
  await saveSubscription(auth.viewer.userId, { endpoint: p.data.endpoint, p256dh: p.data.keys.p256dh, auth: p.data.keys.auth }, (await headers()).get("user-agent")?.slice(0, 300) ?? null);
  return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
  const bad = await assertSameOrigin();
  if (bad) return bad;
  const auth = await apiViewer("STUDENT");
  if ("error" in auth) return auth.error;
  const p = z.object({ endpoint: z.string().url().max(800) }).safeParse(await req.json().catch(() => null));
  if (!p.success) return Response.json({ error: "Некорректный запрос" }, { status: 400 });
  await removeSubscription(auth.viewer.userId, p.data.endpoint);
  return Response.json({ ok: true });
}
