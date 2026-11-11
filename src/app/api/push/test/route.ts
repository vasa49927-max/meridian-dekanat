import { apiViewer, assertSameOrigin } from "@/server/auth/guards";
import { countRecent, record } from "@/server/auth/rate-limit";
import { pushToUsers } from "@/server/push";
import { getI18n } from "@/i18n/server";

/** Тестовое уведомление себе — не чаще 5 раз в час. */
export async function POST() {
  const bad = await assertSameOrigin();
  if (bad) return bad;
  const auth = await apiViewer("STUDENT");
  if ("error" in auth) return auth.error;
  const bucket = `push-test:${auth.viewer.userId}`;
  if ((await countRecent(bucket, 3600_000)) >= 5) return Response.json({ error: (await getI18n()).t("profile.pushSettings.testLimit") }, { status: 429 });
  await record(bucket);
  await pushToUsers([auth.viewer.userId], "test", { title: "Меридиан: уведомления работают", body: `${auth.viewer.firstName}, сюда будут приходить переносы пар и статусы заявок.`, url: "/notifications", tag: "test" });
  return Response.json({ ok: true });
}
