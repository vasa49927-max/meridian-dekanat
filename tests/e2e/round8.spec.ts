import { expect, test } from "@playwright/test";
import { login, logout } from "./helpers";

/** Раунд 8: курсы по выбору, прогноз стипендии, чек-лист первокурсника. */

test("курсы по выбору: записаться, увидеть «Выбрано 1 из 2», отказаться", async ({ page }) => {
  await login(page, "anna");
  await page.goto("/grades");
  await page.getByRole("link", { name: "Курсы по выбору" }).click();
  await expect(page).toHaveURL(/\/grades\/electives/);
  await expect(page.getByText(/Запись открыта до/)).toBeVisible();
  await expect(page.getByText("Выбрано 0 из 2")).toBeVisible();
  const course = page.getByRole("listitem").filter({ hasText: "Python для аналитики" });
  await course.getByRole("button", { name: "Записаться" }).click();
  await expect(course.getByRole("status")).toContainText("Вы записаны на курс");
  await page.reload();
  await expect(page.getByText("Выбрано 1 из 2")).toBeVisible();
  await expect(page.getByRole("listitem").filter({ hasText: "Python для аналитики" })).toContainText("Вы зачислены");
  await page.getByRole("listitem").filter({ hasText: "Python для аналитики" }).getByRole("button", { name: "Отказаться" }).click();
  await page.getByRole("button", { name: "Да, отказаться" }).click();
  await expect(page.getByText("Выбрано 0 из 2")).toBeVisible();
});

test("курсы по выбору: место освободилось — первый из листа ожидания зачислен и получил уведомление", async ({ page }) => {
  // В демо Тимур стоит в листе ожидания «Цифровой дипломатии» (25 из 25). Анна записывается в лист после него.
  await login(page, "anna");
  await page.goto("/grades/electives");
  const dip = page.getByRole("listitem").filter({ hasText: "Цифровая дипломатия" });
  await dip.getByRole("button", { name: "Встать в лист ожидания" }).click();
  await expect(dip.getByRole("status")).toContainText("лист");
  await page.reload();
  await expect(page.getByRole("listitem").filter({ hasText: "Цифровая дипломатия" })).toContainText("Вы в листе ожидания: 2-й");
  await logout(page);
  await login(page, "timur");
  await page.goto("/grades/electives");
  await expect(page.getByRole("listitem").filter({ hasText: "Цифровая дипломатия" })).toContainText("Вы в листе ожидания: 1-й");
});

test("прогноз стипендии виден на «Успеваемости»; у договорника — пояснение", async ({ page }) => {
  await login(page, "anna");
  await page.goto("/grades");
  const card = page.getByRole("region", { name: "Прогноз стипендии" });
  await expect(card).toContainText("Стипендия под угрозой");
  await expect(card).toContainText("Статистика");
  await expect(card).toContainText("ориентир, а не обещание");
});

test("чек-лист первокурсника: отметка сохраняется после перезагрузки", async ({ page }) => {
  await login(page, "mei");
  const card = page.getByRole("region", { name: "Первые шаги в университете" });
  const box = card.getByRole("checkbox", { name: "Найти студенческий клуб или кружок" });
  await expect(box).toHaveAttribute("aria-checked", "false");
  await box.click();
  await expect(box).toHaveAttribute("aria-checked", "true");
  await page.waitForLoadState("networkidle");
  await page.reload();
  await expect(page.getByRole("region", { name: "Первые шаги в университете" }).getByRole("checkbox", { name: "Найти студенческий клуб или кружок" })).toHaveAttribute("aria-checked", "true");
});

test("чек-лист показывается только первокурсникам", async ({ page }) => {
  await login(page, "anna");
  await expect(page.getByRole("region", { name: "Первые шаги в университете" })).toHaveCount(0);
});

test("деканат видит заполненность курсов; студенту раздел недоступен", async ({ page }) => {
  await login(page, "staff");
  await page.goto("/staff/electives");
  await expect(page.getByRole("heading", { name: "Курсы по выбору" })).toBeVisible();
  await expect(page.getByRole("table")).toContainText("Цифровая дипломатия");
  await logout(page);
  await login(page, "anna");
  await page.goto("/staff/electives");
  await expect(page).not.toHaveURL(/\/staff/);
});
