import { expect, test } from "@playwright/test";
import { login } from "./helpers";

/** Раунд 7 (аудит удобства): быстрые действия, группы меню, очередь «сначала то, что требует действия», язык в «Ещё». */

test("быстрые действия на главной ведут в нужные разделы за одно нажатие", async ({ page }) => {
  await login(page, "anna");
  const quick = page.getByRole("navigation", { name: "Быстрые действия" });
  await quick.getByRole("link", { name: "Расписание на неделю" }).click();
  await expect(page).toHaveURL(/view=week/);
  await page.goto("/");
  await quick.getByRole("link", { name: "Заказать справку" }).click();
  await expect(page).toHaveURL(/\/requests\/new$/);
  await page.goto("/");
  await quick.getByRole("link", { name: "Записаться к методисту" }).click();
  await expect(page).toHaveURL(/\/appointments/);
  await page.goto("/");
  await quick.getByRole("link", { name: "Как пройти на пару" }).click();
  await expect(page).toHaveURL(/\/map\?room=/);
});

test("меню сгруппировано: Учёба, Деканат, Моё", async ({ page }) => {
  await login(page, "anna");
  for (const g of ["Учёба", "Деканат", "Моё"]) await expect(page.getByRole("group", { name: g })).toBeVisible();
  await expect(page.getByRole("group", { name: "Деканат" }).getByRole("link", { name: /Заявки и справки/ })).toBeVisible();
});

test("очередь деканата: «готовые к выдаче» — после заявок, требующих действия", async ({ page }) => {
  await login(page, "staff");
  await page.goto("/staff");
  const statuses = await page.locator("main tbody tr").evaluateAll((rows) => rows.map((r) => (r.textContent ?? "").includes("Готова")));
  const firstReady = statuses.indexOf(true);
  expect(firstReady).toBeGreaterThan(0);
  expect(statuses.slice(firstReady).every(Boolean)).toBe(true);
});

test.describe("телефон", () => {
  test.use({ viewport: { width: 360, height: 740 } });
  test("статус заявки и язык — без долгой прокрутки", async ({ page }) => {
    await login(page, "anna");
    const quick = page.getByRole("navigation", { name: "Быстрые действия" });
    await expect(quick.locator("a[href^='/requests/']:not([href='/requests/new'])")).toBeVisible();
    await page.goto("/more");
    await expect(page.getByRole("combobox", { name: "Язык" })).toBeVisible();
  });
});
