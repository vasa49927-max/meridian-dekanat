import { expect, test } from "@playwright/test";

test.describe("Вход", () => {
  test("неверный пароль — общая формулировка, без подсказки, что логин существует", async ({ page }) => {
    await page.goto("/login");
    await page.fill("#login", "sokolova");
    await page.fill("#password", "wrong-password");
    await page.click("button[type=submit]");
    await expect(page.locator("p[role=alert]")).toContainText("Неверный логин или пароль");
    await page.fill("#login", "no-such-user");
    await page.fill("#password", "wrong-password");
    await page.click("button[type=submit]");
    await expect(page.locator("p[role=alert]")).toContainText("Неверный логин или пароль");
  });

  test("защита от перебора: после 5 неудач логин временно блокируется", async ({ page }) => {
    const login = `bruteforce-${Date.now()}`;
    await page.goto("/login");
    for (let i = 0; i < 5; i++) {
      await page.fill("#login", login);
      await page.fill("#password", `guess-${i}`);
      await page.click("button[type=submit]");
      await expect(page.locator("p[role=alert]")).toBeVisible();
    }
    await page.fill("#login", login);
    await page.fill("#password", "guess-last");
    await page.click("button[type=submit]");
    await expect(page.locator("p[role=alert]")).toContainText("Слишком много неудачных попыток");
  });

  test("без входа кабинет недоступен", async ({ page }) => {
    await page.goto("/grades");
    await expect(page).toHaveURL(/\/login\?next=%2Fgrades/);
  });

  test("заголовки безопасности на месте", async ({ request }) => {
    const res = await request.get("/login");
    const h = res.headers();
    expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(h["content-security-policy"]).toMatch(/script-src 'self' 'nonce-/);
    expect(h["x-frame-options"]).toBe("DENY");
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["x-powered-by"]).toBeUndefined();
  });
});
