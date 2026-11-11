import { expect, test, type Browser } from "@playwright/test";
import { ACCOUNTS, login } from "./helpers";

/**
 * Кабинет деканата (проект desktop): объявления, переносы пар, фильтры очереди, защита staff-разделов.
 * Время зафиксировано DEMO_NOW = пт, 13 ноября 2026, 10:15 МСК.
 */

async function studentPage(browser: Browser, who: Exclude<keyof typeof ACCOUNTS, "staff">) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await login(page, who);
  return page;
}

test.describe("Деканат", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "staff");
    await expect(page).toHaveURL(/\/staff$/);
  });

  test("объявление группе МЭО 2.2: видит студент этой группы, не видит студент другой", async ({ page, browser }) => {
    const title = `E2E: консультация по статистике ${Date.now()}`;
    await page.goto("/staff/announcements");
    await page.getByLabel("Заголовок").fill(title);
    await page.getByLabel("Текст").fill("Консультация переносится в ауд. 1018, начало в 16:10.");
    await page.getByLabel("Кому").selectOption("GROUP");
    await page.getByLabel("Группа").selectOption({ label: "МЭО · гр. 2.2" });
    await page.getByRole("button", { name: "Опубликовать" }).click();
    const ok = page.locator("main").getByRole("status");
    await expect(ok).toContainText("Опубликовано. Уведомление получили студентов:");
    const recipients = Number((await ok.textContent())!.match(/(\d+)/)![1]);
    expect(recipients).toBeGreaterThan(0);
    await expect(page.locator("main li", { hasText: title })).toContainText("группе");

    const anna = await studentPage(browser, "anna");
    await anna.goto("/notifications?f=ANNOUNCEMENT");
    const item = anna.getByRole("button", { name: new RegExp(title) });
    await expect(item).toBeVisible();
    await expect(item.getByLabel("Не прочитано")).toBeVisible();
    await anna.context().close();

    const timur = await studentPage(browser, "timur");
    await timur.goto("/notifications?f=ANNOUNCEMENT");
    await expect(timur.getByRole("heading", { name: "Уведомления" })).toBeVisible();
    await expect(timur.getByText(title)).toHaveCount(0);
    await timur.goto("/notifications");
    await expect(timur.getByText(title)).toHaveCount(0);
    await timur.context().close();
  });

  test("перенос пары: у студентов группы уведомление и пометка «перенос» в расписании", async ({ page, browser }) => {
    await page.goto("/staff/schedule");
    await page.getByLabel("Группа").selectOption({ label: "МЭО · 2 курс · гр. 2.2" });
    await page.getByRole("button", { name: "Показать" }).click();
    await expect(page).toHaveURL(/g=[0-9a-f-]{36}/);
    await page.getByRole("link", { name: "Следующая неделя" }).click();
    await expect(page).toHaveURL(/w=2026-11-16/);

    const wed = page.locator('[aria-label="Среда, 18 ноября"]');
    const lesson = wed.getByRole("listitem").filter({ hasText: "Макроэкономика" });
    await expect(lesson).toContainText("10:40");
    await lesson.getByRole("button", { name: "Изменить" }).click();
    await expect(lesson.getByLabel("Дата")).toHaveValue("2026-11-18");
    await lesson.getByLabel("Время").selectOption("16:10");
    await lesson.getByLabel("Аудитория").fill("3020");
    await lesson.getByLabel("Причина (увидят студенты)").fill("Преподаватель на конференции");
    await lesson.getByRole("button", { name: "Сохранить и уведомить группу" }).click();
    const ok = lesson.getByRole("status");
    await expect(ok).toContainText("Сохранено. Уведомление получили студентов:");
    expect(Number((await ok.textContent())!.match(/(\d+)/)![1])).toBeGreaterThan(0);

    const anna = await studentPage(browser, "anna");
    await anna.goto("/notifications?f=SCHEDULE");
    const n = anna.getByRole("button", { name: /Перенос: Макроэкономика/ }).first();
    await expect(n).toContainText("Было: 18 ноября (ср), 10:40, ауд. 3015. Стало: 18 ноября (ср), 16:10, ауд. 3020. Преподаватель на конференции");
    await expect(n).toContainText("важное");

    await anna.goto("/schedule?d=2026-11-18");
    const card = anna.getByRole("article", { name: "16:10 Макроэкономика, перенос" });
    await expect(card).toBeVisible();
    await expect(card.getByText("Перенос", { exact: true })).toBeVisible();
    await expect(card).toContainText("вместо 18 ноября (ср) · 10:40 · ауд. 3015");
    await expect(card).toContainText("Преподаватель на конференции");
    await expect(anna.getByRole("article", { name: /^10:40 Макроэкономика/ })).toHaveCount(0);
    await anna.context().close();

    // Студент другой группы уведомления не получает
    const mei = await studentPage(browser, "mei");
    await mei.goto("/notifications?f=SCHEDULE");
    await expect(mei.getByRole("heading", { name: "Уведомления" })).toBeVisible();
    await expect(mei.getByText("Перенос: Макроэкономика")).toHaveCount(0);
    await mei.context().close();
  });

  test("фильтры очереди: статус «Новые» и поиск по фамилии", async ({ page }) => {
    const statusNav = page.getByRole("navigation", { name: "Статус" });
    const newTab = statusNav.getByRole("link", { name: /^Новые · \d+$/ });
    const count = Number((await newTab.textContent())!.match(/(\d+)/)![1]);
    await newTab.click();
    await expect(page).toHaveURL(/status=SUBMITTED/);
    await expect(statusNav.getByRole("link", { name: /^Новые/ })).toHaveAttribute("aria-current", "page");
    const rows = page.locator("main tbody tr");
    await expect(rows).toHaveCount(Math.min(count, 25));
    for (const row of await rows.all()) await expect(row).toContainText("Подана");

    // Поиск по фамилии в пределах статуса «Новые»
    await page.getByPlaceholder("Фамилия, № заявки, зачётка").fill("Галиев");
    await page.getByRole("button", { name: "Применить" }).click();
    await expect(page).toHaveURL(/q=%D0%93%D0%B0%D0%BB%D0%B8%D0%B5%D0%B2/);
    await expect(page).toHaveURL(/status=SUBMITTED/);
    await expect(rows.first()).toBeVisible();
    for (const row of await rows.all()) {
      await expect(row).toContainText("Галиев Т. Р.");
      await expect(row).toContainText("Подана");
    }

    // Поиск без фильтра статуса находит больше заявок студента (в т.ч. в других статусах).
    // edits.spec мог вернуть «Нужно дополнить» в «Подана», поэтому проверяем количество, а не конкретный статус.
    await page.goto(`/staff?q=${encodeURIComponent("Галиев")}`);
    expect(await rows.count()).toBeGreaterThanOrEqual(2);
    for (const row of await rows.all()) await expect(row).toContainText("Галиев Т. Р.");

    // Несуществующая фамилия → пустое состояние
    await page.goto(`/staff?q=${encodeURIComponent("Несуществующий")}`);
    await expect(page.getByText("Заявок по фильтру нет")).toBeVisible();
  });

  // БАГ-2: при DEMO_NOW счётчик «Просрочены · N» и фильтр overdue считаются по реальному времени БД (SQL now()),
  // а бейджи «просрочена» в строках — по DEMO_NOW. Счётчик 0, а в списке есть просроченные.
  test("счётчик «Просрочены» совпадает с числом просроченных заявок в списке", async ({ page }) => {
    const badges = page.locator("main tbody tr").getByText(/^просрочена ·/);
    const visible = await badges.count();
    expect(visible).toBeGreaterThan(0);
    const tab = page.getByRole("navigation", { name: "Статус" }).getByRole("link", { name: /^Просрочены · \d+$/ });
    await expect(tab).toHaveText(`Просрочены · ${visible}`);
    await tab.click();
    await expect(page.locator("main tbody tr")).toHaveCount(visible);
  });
});

test.describe("Роли", () => {
  test("студент не может открыть staff-разделы: /staff/demo и др. → редирект в свой кабинет", async ({ page }) => {
    await login(page, "anna");
    for (const path of ["/staff/demo", "/staff/announcements", "/staff/schedule", "/staff/appointments"]) {
      await page.goto(path);
      await expect(page).toHaveURL(/localhost:\d+\/$/);
      await expect(page.getByRole("heading", { name: "Демо-данные" })).toHaveCount(0);
      await expect(page.getByRole("button", { name: /Сбросить/ })).toHaveCount(0);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText("Доброе утро, Анна");
    }
  });

  test("сотрудник не попадает в кабинет студента", async ({ page }) => {
    await login(page, "staff");
    await page.goto("/grades");
    await expect(page).toHaveURL(/\/staff$/);
  });
});
