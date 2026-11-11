/**
 * Чат-бот MAX (D-031): бот выключен без ключа; с ключом — проверка секрета вебхука, привязка по коду,
 * команды и рассылка. Сеть подменяем: проверяем, ЧТО и КУДА бот отправил бы в API MAX.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { db, schema as t } from "@/server/db";
import { seedDemo } from "@/server/seed/seed";
import { checkSecret, createLinkCode, handleText, handleUpdate, maxEnabled } from "@/server/bot/max";
import { pushToUsers } from "@/server/push";

const sent: { url: string; auth: string | null; text: string }[] = [];
let annaId = "";
beforeAll(async () => {
  process.env.DEMO_NOW = "2026-11-13T07:15:00Z"; // «сейчас» как в сиде
  await seedDemo(db, { now: new Date("2026-11-13T07:15:00Z") });
  annaId = (await db.select().from(t.users).where(eq(t.users.login, "sokolova")))[0].id;
  vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
    sent.push({ url, auth: new Headers(init.headers).get("authorization"), text: JSON.parse(String(init.body)).text });
    return new Response("{}", { status: 200 });
  });
}, 60_000);
afterAll(() => { vi.unstubAllGlobals(); delete process.env.DEMO_NOW; delete process.env.MAX_BOT_TOKEN; delete process.env.MAX_BOT_SECRET; });

describe("Чат-бот MAX", () => {
  it("без ключа бот выключен и ничего не отправляет", async () => {
    delete process.env.MAX_BOT_TOKEN;
    expect(maxEnabled()).toBe(false);
    expect(checkSecret("anything")).toBe(false);
    await pushToUsers([annaId], "schedule", { title: "x", body: "y", url: "/" });
    expect(sent).toHaveLength(0);
  });

  it("с ключом: привязка по коду, команды, рассылка, отвязка", async () => {
    process.env.MAX_BOT_TOKEN = "test-token";
    process.env.MAX_BOT_SECRET = "test-secret-123";
    process.env.MAX_API_URL = "https://platform-api2.max.ru";
    expect(maxEnabled()).toBe(true);
    expect(checkSecret("test-secret-123")).toBe(true);
    expect(checkSecret("test-secret-124")).toBe(false);

    expect(await handleText("777", "/today")).toMatch(/привязать аккаунт/);
    expect(await handleText("777", "000000")).toMatch(/Код не подошёл/);
    const code = await createLinkCode(annaId);
    await handleUpdate({ update_type: "message_created", message: { sender: { user_id: 777 }, body: { text: `/link ${code}` } } });
    expect(sent.at(-1)).toMatchObject({ url: "https://platform-api2.max.ru/messages?user_id=777", auth: "test-token" });
    expect(sent.at(-1)!.text).toMatch(/^Готово, Анна! Аккаунт привязан/);
    expect(await handleText("777", code)).toMatch(/Код не подошёл/); // одноразовый

    expect(await handleText("777", "/today")).toMatch(/^Сегодня, 13 ноября \(пт\):\n10:40–12:00 Международные финансовые рынки/);
    expect(await handleText("777", "/requests")).toMatch(/Справка об обучении на английском — В работе/);

    await pushToUsers([annaId], "schedule", { title: "Перенос: Статистика", body: "Теперь 19 ноября (чт), 17:40", url: "/schedule" });
    expect(sent.at(-1)).toMatchObject({ url: "https://platform-api2.max.ru/messages?user_id=777", text: "Перенос: Статистика\nТеперь 19 ноября (чт), 17:40" });

    expect(await handleText("777", "/unlink")).toMatch(/отвязан/);
    const before = sent.length;
    await pushToUsers([annaId], "schedule", { title: "x", body: "y", url: "/" });
    expect(sent.length).toBe(before);
  });

  it("перебор кодов ограничен: не больше 5 попыток за 15 минут", async () => {
    for (let i = 0; i < 5; i++) await handleText("888", "123456");
    expect(await handleText("888", "654321")).toMatch(/Слишком много попыток/);
  });
});
