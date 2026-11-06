import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { login } from "./helpers";

/**
 * Ключевые сценарии кабинета студента (проект desktop).
 * Время зафиксировано DEMO_NOW = пт, 13 ноября 2026, 10:15 МСК; данные — после сида (global-setup).
 * Тесты не полагаются на результаты других файлов: счётчики и списки читаются из интерфейса.
 */

test.beforeEach(async ({ page }) => {
  await login(page, "anna");
});

/** «Непрочитанных: N» из подзаголовка страницы уведомлений; «Всё прочитано» → 0. */
async function unreadCount(page: Page) {
  const header = page.locator("main h1", { hasText: "Уведомления" }).locator("xpath=following-sibling::p[1]");
  const text = (await header.textContent()) ?? "";
  if (text.includes("Всё прочитано")) return 0;
  return Number(text.match(/Непрочитанных: (\d+)/)![1]);
}

test.describe("Сегодня", () => {
  test("следующая пара с отсчётом, баннер изменений «было → стало», карточка рисков", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Доброе утро, Анна");

    const next = page.getByRole("region", { name: "Следующая пара" });
    await expect(next.getByRole("heading", { name: "Международные финансовые рынки" })).toBeVisible();
    await expect(next).toContainText(/через \d+ мин/);
    await expect(next).toContainText("10:40–12:00 · Семинар · ауд. 3047");

    const banner = page.getByRole("region", { name: "Изменения в расписании" });
    await expect(banner.getByRole("heading")).toContainText("Изменени");
    // Перенос: зачёркнутое «было» → жирное «стало»
    const moved = banner.getByRole("listitem").filter({ hasText: "Испанский язык (второй иностранный)" });
    await expect(moved).toContainText("ср, 18 нояб., 14:30, ауд. 506 → чт, 19 нояб., 17:40, ауд. 1018");
    await expect(moved.locator("s")).toHaveText("ср, 18 нояб., 14:30, ауд. 506");
    // Отмена тоже в баннере
    // (staff.spec может добавить ещё один перенос «Макроэкономики» — поэтому фильтр по дате)
    await expect(banner.getByRole("listitem").filter({ hasText: /Макроэкономика:\s+пн, 16 нояб\., 09:00/ })).toContainText("отменена");

    const study = page.getByRole("region", { name: "Как дела с учёбой" });
    await expect(study.getByText("Риск:")).toBeVisible();
    await expect(study).toContainText("Статистика");
    await expect(study.getByRole("link", { name: "Подробнее" })).toHaveAttribute("href", "/grades");
  });
});

test.describe("Расписание", () => {
  test("день/неделя, перенос подсвечен, переход по дням, пустой день с кнопкой «Показать …»", async ({ page }) => {
    await page.goto("/schedule");
    const views = page.getByRole("navigation", { name: "Вид расписания" });
    await expect(views.getByRole("link", { name: "День" })).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("heading", { name: "Пятница, 13 ноября · сегодня" })).toBeVisible();
    await expect(page.getByRole("article", { name: "10:40 Международные финансовые рынки" })).toBeVisible();

    // Неделя: перенос выделен цветом и бейджем «перенос», видно «было»
    await views.getByRole("link", { name: "Неделя" }).click();
    await expect(page).toHaveURL(/view=week/);
    await expect(views.getByRole("link", { name: "Неделя" })).toHaveAttribute("aria-current", "page");
    const movedCard = page.getByRole("article", { name: "17:40 Статистика, изменение" });
    await expect(movedCard).toBeVisible();
    await expect(movedCard.getByText("перенос", { exact: true })).toBeVisible();
    await expect(movedCard).toHaveClass(/border-warn-line/);
    await expect(movedCard.locator("s")).toHaveText("вт, 10 нояб., 09:00, ауд. 1018");
    // Замена аудитории тоже выделена, с отдельным бейджем
    const roomCard = page.getByRole("region", { name: "Среда, 11 ноября" }).getByRole("article", { name: "10:40 Макроэкономика, изменение" });
    await expect(roomCard.getByText("новая аудитория", { exact: true })).toBeVisible();
    await expect(roomCard.locator("s")).toHaveText("ср, 11 нояб., 10:40, ауд. 3015");

    // Обратно в день, следующий день → суббота без пар → «Показать пн, 16 нояб. →»
    await views.getByRole("link", { name: "День" }).click();
    await expect(page).not.toHaveURL(/view=week/);
    await page.getByRole("link", { name: "Следующий день" }).click();
    await expect(page).toHaveURL(/d=2026-11-14/);
    await expect(page.getByRole("heading", { name: "Суббота, 14 ноября" })).toBeVisible();
    await expect(page.getByText("Занятий нет")).toBeVisible();
    await page.getByRole("link", { name: "Показать пн, 16 нояб. →" }).click();
    await expect(page).toHaveURL(/d=2026-11-16/);
    await expect(page.getByRole("heading", { name: "Понедельник, 16 ноября" })).toBeVisible();
    await expect(page.getByRole("link", { name: /^Пн 16 — понедельник, 16 ноября/ })).toHaveAttribute("aria-current", "date");

    // «Сегодня» возвращает к текущему дню
    await page.getByRole("link", { name: "Сегодня", exact: true }).last().click();
    await expect(page.getByRole("heading", { name: "Пятница, 13 ноября · сегодня" })).toBeVisible();
  });

  test(".ics скачивается и содержит VEVENT", async ({ page }) => {
    await page.goto("/schedule");
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("link", { name: "В календарь (.ics)" }).click(),
    ]);
    expect(download.suggestedFilename()).toBe("meridian-schedule.ics");
    const body = readFileSync((await download.path())!, "utf8");
    expect(body.startsWith("BEGIN:VCALENDAR")).toBe(true);
    expect(body).toContain("BEGIN:VEVENT");
    expect(body).toContain("END:VEVENT");
    expect(body).toMatch(/SUMMARY:Международные финансовые рынки/);
    expect(body.trimEnd().endsWith("END:VCALENDAR")).toBe(true);
  });
});

test.describe("Успеваемость", () => {
  test("«Контрольные точки и «что, если»»: ползунок меняет итог", async ({ page }) => {
    await page.goto("/grades");
    const card = page.getByRole("article", { name: "Статистика", exact: true });
    const summary = card.getByText("Контрольные точки и «что, если»");
    await summary.click();
    await expect(card.getByRole("table", { name: "Контрольные точки: Статистика" })).toBeVisible();

    const result = card.locator("p", { hasText: "Итог:" });
    await expect(result).toBeVisible();
    const before = await result.textContent();

    const exam = card.getByRole("slider", { name: /на экзамене/ });
    await exam.focus();
    await exam.press("End");
    await expect(exam).toHaveValue("40");
    await expect(card.getByText("40 из 40")).toBeVisible();
    await expect(result).not.toHaveText(before!);

    // И в обратную сторону: ноль на экзамене → неудовлетворительно
    await exam.press("Home");
    await expect(exam).toHaveValue("0");
    await expect(result).toContainText("неудовлетворительно");
  });
});

test.describe("Уведомления", () => {
  test("фильтр «Непрочитанные», клик помечает прочитанным, «Прочитать все»", async ({ page }) => {
    await page.goto("/notifications");
    const n = await unreadCount(page);
    expect(n).toBeGreaterThan(1);

    const filters = page.getByRole("navigation", { name: "Фильтры" });
    await filters.getByRole("link", { name: `Непрочитанные · ${n}` }).click();
    await expect(page).toHaveURL(/f=unread/);
    const items = page.locator("main ul > li");
    await expect(items).toHaveCount(n);
    await expect(page.locator("main ul").getByLabel("Не прочитано")).toHaveCount(n);

    // Клик по уведомлению: помечается прочитанным (и открывается его ссылка)
    const first = items.first().getByRole("button");
    const title = (await first.locator("span.block").first().textContent())!.trim();
    await first.click();
    await page.waitForURL((u) => u.pathname !== "/notifications" || u.search !== "?f=unread");
    await page.goto("/notifications?f=unread");
    expect(await unreadCount(page)).toBe(n - 1);
    await expect(page.getByRole("link", { name: `Уведомления: ${n - 1} непрочитанных` })).toBeVisible();
    await expect(page.locator("main ul").getByText(title, { exact: true })).toHaveCount(0);

    // «Прочитать все»
    await page.getByRole("button", { name: "Прочитать все" }).click();
    await expect(page.getByText("Всё прочитано")).toBeVisible();
    await expect(page.locator("main").getByText("Непрочитанных нет", { exact: true })).toBeVisible();
    await expect(page.locator("main ul > li")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Прочитать все" })).toHaveCount(0);
    await expect(page.locator("header").getByRole("link", { name: "Уведомления", exact: true })).toBeVisible();
  });
});

test.describe("Запись к методисту", () => {
  test("запись → появилась в «Мои записи» → отмена", async ({ page }) => {
    await page.goto("/appointments");
    await expect(page.getByText("Мои записи")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Выберите время" })).toBeDisabled();

    const day = page.getByRole("group", { name: "День" }).getByRole("button").first();
    await expect(day).toHaveAttribute("aria-pressed", "true");
    const dayDate = (await day.locator("span").nth(1).textContent())!.split(" · ")[0]; // «вт, 17 нояб.»
    const slot = page.getByRole("group", { name: "Время (20 минут)" }).locator("label").first();
    const time = (await slot.textContent())!.trim();
    await slot.click();
    await page.getByLabel("Тема визита").selectOption("Справки и документы");
    await page.getByLabel("Что взять с собой / подробности").fill("e2e: справка для визы");
    await page.getByRole("button", { name: "Записаться" }).click();
    await expect(page.locator("main").getByRole("status")).toContainText("Готово! Запись появилась выше");

    const mine = page.locator("section", { has: page.getByRole("heading", { name: "Мои записи" }) });
    const row = mine.getByRole("listitem").filter({ hasText: `${dayDate}, ${time}–` });
    await expect(row).toBeVisible();
    await expect(row).toContainText("Справки и документы");

    await row.getByRole("button", { name: "Отменить" }).click();
    await expect(page.getByRole("heading", { name: "Мои записи" })).toHaveCount(0);
    await page.getByText("Прошлые и отменённые записи").click();
    await expect(page.getByText(`${dayDate}, ${time} — Справки и документы · отменена`)).toBeVisible();
  });
});

test.describe("Помощник без ключа ИИ", () => {
  test("режим поиска по Положению: ответ со ссылкой на пункт и кнопкой «Заполнить» → форма предзаполнена", async ({ page }) => {
    await page.goto("/assistant");
    await expect(page.getByText(/Режим поиска по Положению/)).toBeVisible();
    await page.getByLabel("Ваш вопрос").fill("Какую справку взять для визы в Испанию?");
    await page.getByLabel("Ваш вопрос").press("Enter");
    const answer = page.locator("div.rounded-bl-md").last();
    await expect(answer).toContainText("[п. 6.3]");
    await expect(answer.getByText("п. 6.3", { exact: true })).toBeVisible();
    await expect(answer.getByText("Ответ собран из Положения без нейросети")).toBeVisible();
    await answer.getByRole("link", { name: "Заполнить: Справка об обучении на английском" }).click();
    await expect(page).toHaveURL(/\/requests\/new\/STUDY_CERT_EN\?.*from=assistant/);
    await expect(page.getByText("Поля заполнил помощник по вашему вопросу")).toBeVisible();
    await expect(page.getByLabel(/^Страна/)).toHaveValue("Испания");
    await expect(page.getByLabel(/^Цель/)).toHaveValue("Виза");
    await expect(page.getByText("Соколова Анна Викторовна")).toBeVisible();
  });

  // БАГ-1: на вопрос из подсказок «Мне нужна справка для военкомата» помощник отвечает п. 8.1 (ВУЦ)
  // и не предлагает «Заполнить: Справка для военкомата». Ожидается ответ по п. 6.4 с кнопкой.
  test("«Мне нужна справка для военкомата» → п. 6.4 и «Заполнить» → форма справки для военкомата", async ({ page }) => {
    await page.goto("/assistant");
    await page.getByLabel("Ваш вопрос").fill("Мне нужна справка для военкомата");
    await page.getByLabel("Ваш вопрос").press("Enter");
    const answer = page.locator("div.rounded-bl-md").last();
    await expect(answer).toContainText("[п. 6.4]");
    await answer.getByRole("link", { name: "Заполнить: Справка для военкомата" }).click();
    await expect(page).toHaveURL(/\/requests\/new\/MILITARY_CERT\?.*from=assistant/);
    await expect(page.getByRole("heading", { name: "Справка для военкомата" })).toBeVisible();
    await expect(page.getByText("Поля заполнил помощник по вашему вопросу")).toBeVisible();
    await expect(page.getByText("Соколова Анна Викторовна")).toBeVisible();
  });
});

test.describe("Палитра команд", () => {
  test("Ctrl+K находит «Статистика» и переходит к дисциплине", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.keyboard.press("Control+k");
    const input = page.getByPlaceholder("Раздел, дисциплина, справка, действие…");
    await expect(input).toBeVisible();
    await input.fill("Статистика");
    const option = page.getByRole("option", { name: /Статистика/ });
    await expect(option).toHaveCount(1);
    await expect(option).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/grades#/);
    expect(decodeURIComponent(new URL(page.url()).hash)).toBe("#Статистика");
    await expect(input).toBeHidden();
    await expect(page.getByRole("article", { name: "Статистика", exact: true })).toBeInViewport();
  });
});

test.describe("Заявка: ошибки формы", () => {
  test("пустое обязательное поле → сообщение и фокус на поле", async ({ page }) => {
    await page.goto("/requests/new/MILITARY_CERT");
    await expect(page.getByRole("heading", { name: "Справка для военкомата" })).toBeVisible();
    const field = page.getByLabel(/^Военный комиссариат/);
    await expect(field).toHaveValue("");
    await page.getByRole("button", { name: "Отправить заявку" }).click();
    await expect(page.locator("main form").getByRole("alert")).toHaveText("Проверьте поля формы");
    await expect(page.getByText("Заполните поле «Военный комиссариат»")).toBeVisible();
    await expect(field).toHaveAttribute("aria-invalid", "true");
    await expect(field).toHaveAttribute("aria-describedby", /commissariat-err/);
    await expect(field).toBeFocused();
    await expect(page).toHaveURL(/\/requests\/new\/MILITARY_CERT$/);
  });
});
