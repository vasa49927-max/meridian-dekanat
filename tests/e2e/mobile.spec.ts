import { expect, test, type Page } from "@playwright/test";
import { login } from "./helpers";

/**
 * Мобильная версия (проект mobile-360, ширина 360 px): нет горизонтального скролла, нижний таб-бар, «Ещё».
 * В проекте desktop файл исключён через testIgnore в playwright.config.ts; страховка — skip ниже.
 */
test.beforeEach(({}, info) => {
  test.skip(info.project.name !== "mobile-360", "только для проекта mobile-360");
});

async function expectNoHorizontalScroll(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
  const { scrollWidth, clientWidth, wide } = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    // Для диагностики: какие элементы вылезают за правый край
    const wide = [...document.querySelectorAll<HTMLElement>("body *")]
      .filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.right > vw + 1 && getComputedStyle(el).position !== "fixed"; })
      .filter((el) => !el.closest("[class*=overflow-x-auto]"))
      .slice(0, 5)
      .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 60)}`);
    return { scrollWidth: document.documentElement.scrollWidth, clientWidth: vw, wide };
  });
  expect(clientWidth, path).toBe(360);
  expect(scrollWidth, `${path}: горизонтальный скролл, вылезают: ${wide.join(" | ")}`).toBeLessThanOrEqual(360);
}

const STUDENT_PAGES = [
  "/", "/schedule", "/schedule?view=week", "/schedule?d=2026-11-14", "/grades", "/grades?tab=record",
  "/requests", "/requests/new", "/requests/new/STUDY_CERT_EN", "/notifications", "/assistant", "/appointments", "/profile", "/more",
];

test("студент: на 360 px у ключевых страниц нет горизонтального скролла", async ({ page }) => {
  await login(page, "anna");
  for (const path of STUDENT_PAGES) await expectNoHorizontalScroll(page, path);
  // Заявка с вложением: длинное имя файла раньше распирало карточку до 380 px (найдено при обзоре раунда 2)
  await page.goto("/requests?all=1");
  const href = await page.locator("main a[href^='/requests/']").filter({ hasText: "Перезачёт дисциплины" }).first().getAttribute("href");
  await expectNoHorizontalScroll(page, href!);
});

test("деканат: на 360 px у ключевых страниц нет горизонтального скролла", async ({ page }) => {
  await login(page, "staff");
  for (const path of ["/staff", "/staff/announcements", "/staff/schedule", "/staff/appointments"]) await expectNoHorizontalScroll(page, path);
});

test("вход: на 360 px нет горизонтального скролла", async ({ page }) => {
  await expectNoHorizontalScroll(page, "/login");
});

test("нижний таб-бар ведёт в разделы", async ({ page }) => {
  await login(page, "anna");
  await page.goto("/");
  const tabs = page.getByRole("navigation", { name: "Основные разделы" });
  await expect(tabs).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Разделы", exact: true })).toBeHidden(); // боковое меню на мобильном скрыто

  const cases: [string, RegExp, string][] = [
    ["Расписание", /\/schedule$/, "Расписание"],
    ["Успеваемость", /\/grades$/, "Успеваемость"],
    ["Заявки", /\/requests$/, "Заявки и справки"],
    ["Ещё", /\/more$/, "Ещё"],
    ["Сегодня", /localhost:\d+\/$/, "Доброе утро, Анна"],
  ];
  for (const [tab, url, heading] of cases) {
    await tabs.getByRole("link", { name: tab }).click();
    await expect(page).toHaveURL(url);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(heading);
    await expect(tabs.getByRole("link", { name: tab })).toHaveAttribute("aria-current", "page");
  }
});

test("«Ещё» открывает уведомления, помощник и профиль", async ({ page }) => {
  await login(page, "anna");
  const tabs = page.getByRole("navigation", { name: "Основные разделы" });
  const cases: [RegExp, RegExp, string][] = [
    [/^Уведомления/, /\/notifications$/, "Уведомления"],
    [/^Помощник деканата/, /\/assistant$/, "Помощник деканата"],
    [/^Профиль/, /\/profile$/, ""],
  ];
  for (const [link, url, heading] of cases) {
    await page.goto("/");
    await tabs.getByRole("link", { name: "Ещё" }).click();
    await expect(page).toHaveURL(/\/more$/);
    await page.locator("main").getByRole("link", { name: link }).click();
    await expect(page).toHaveURL(url);
    if (heading) await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
    // Подразделы «Ещё» подсвечивают вкладку «Ещё»
    await expect(tabs.getByRole("link", { name: "Ещё" })).toHaveAttribute("aria-current", "page");
  }
  await expect(page.getByText("МЭО-25-0417")).toBeVisible(); // профиль Анны
});
