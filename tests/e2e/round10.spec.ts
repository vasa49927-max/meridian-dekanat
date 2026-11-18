import { expect, test } from "@playwright/test";
import { login } from "./helpers";

/** Раунд 10: скорость (подсказки по cookie на сервере) и значок сайта без входа. */

test("значок сайта отдаётся без входа (не перенаправляет на /login)", async ({ request }) => {
  const r = await request.get("/icon.svg", { maxRedirects: 0 });
  expect(r.status()).toBe(200);
  expect(r.headers()["content-type"]).toContain("image/svg");
});

test.describe("подсказки и cookie «пройдены»", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("без флага подсказки появляются, после закрытия — больше нет (сервер видит cookie)", async ({ page }) => {
    await login(page, "anna");
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 10_000 });
    await dialog.getByRole("button", { name: "Закрыть подсказки" }).click();
    await expect(dialog).toBeHidden();
    const cookies = await page.context().cookies();
    expect(cookies.find((c) => c.name === "meridian-tour-v1")?.value).toBe("done");
    // Чистим localStorage: остаётся только cookie — подсказки всё равно не должны всплыть
    await page.evaluate(() => localStorage.clear());
    await page.goto("/schedule");
    await page.waitForLoadState("load");
    await page.waitForTimeout(1500);
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
});
