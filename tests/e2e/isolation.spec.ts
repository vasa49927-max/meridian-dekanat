import { expect, test } from "@playwright/test";
import { login, logout } from "./helpers";

/**
 * Изоляция данных (требование ТЗ): студент A не может открыть профиль/заявку/оценки студента B
 * ни через интерфейс, ни через API, даже подставив id в адрес.
 */
test.describe("Изоляция данных между студентами", () => {
  let annaRequestUrl = "";
  let annaDocumentUrl = "";

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await login(page, "anna");
    await page.goto("/requests?all=1");
    // Выданная справка Анны (с документом) — ссылка вида /requests/<uuid>
    await page.locator('a[href^="/requests/"]').filter({ hasText: "электронный документ" }).first().click();
    await expect(page).toHaveURL(/\/requests\/[0-9a-f-]{36}$/);
    annaRequestUrl = new URL(page.url()).pathname;
    annaDocumentUrl = `${annaRequestUrl}/document`;
    await expect(page.getByText("Электронный документ")).toBeVisible();
    await page.close();
  });

  test("чужая заявка по прямой ссылке → 404", async ({ page }) => {
    await login(page, "timur");
    const res = await page.goto(annaRequestUrl);
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "Страница не найдена" })).toBeVisible();
    await expect(page.getByText("Соколова")).toHaveCount(0);
  });

  test("чужой электронный документ → 404", async ({ page }) => {
    await login(page, "timur");
    const res = await page.goto(annaDocumentUrl);
    expect(res?.status()).toBe(404);
  });

  test("несуществующий и некорректный id → тот же 404 (не подтверждаем существование)", async ({ page }) => {
    await login(page, "timur");
    expect((await page.goto("/requests/00000000-0000-4000-8000-000000000000"))?.status()).toBe(404);
    expect((await page.goto("/requests/1%20or%201=1"))?.status()).toBe(404);
  });

  test("оценки, профиль и расписание показывают только свои данные", async ({ page }) => {
    await login(page, "timur");
    await page.goto("/grades");
    await expect(page.getByRole("heading", { name: "Международное частное право" })).toBeVisible();
    await expect(page.getByText("Макроэкономика")).toHaveCount(0);
    await page.goto("/profile");
    await expect(page.getByText("МП-23-0291")).toBeVisible();
    await expect(page.getByText("МЭО-25-0417")).toHaveCount(0);
  });

  test("API .ics отдаёт только своё расписание и требует вход", async ({ page, request }) => {
    const anon = await request.get("/api/schedule.ics");
    expect(anon.status()).toBe(401);
    await login(page, "timur");
    const res = await page.request.get("/api/schedule.ics");
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain("Международное частное право");
    expect(body).not.toContain("Макроэкономика");
  });

  test("студент не попадает в кабинет деканата", async ({ page }) => {
    await login(page, "anna");
    await page.goto("/staff");
    await expect(page).toHaveURL(/\/$/);
    await page.goto("/staff/requests/00000000-0000-4000-8000-000000000000");
    await expect(page).not.toHaveURL(/\/staff/);
  });

  test("API помощника: без входа 401, с чужого сайта 403", async ({ page, request }) => {
    const anon = await request.post("/api/assistant", { data: { messages: [{ role: "user", content: "привет" }] }, headers: { Origin: "http://localhost:3000" } });
    expect(anon.status()).toBe(401);
    await login(page, "anna");
    const evil = await page.request.post("/api/assistant", { data: { messages: [{ role: "user", content: "привет" }] }, headers: { Origin: "https://evil.example" } });
    expect(evil.status()).toBe(403);
  });

  test("выход аннулирует сессию: старый cookie больше не работает", async ({ page, browser }) => {
    await login(page, "anna");
    const cookies = await page.context().cookies();
    await page.goto("/profile");
    await page.getByRole("button", { name: "Выйти" }).last().click();
    await expect(page).toHaveURL(/\/login/);
    const ctx = await browser.newContext();
    await ctx.addCookies(cookies);
    const p2 = await ctx.newPage();
    await p2.goto("/profile");
    await expect(p2).toHaveURL(/\/login/);
    await ctx.close();
    await logout(page);
  });
});
