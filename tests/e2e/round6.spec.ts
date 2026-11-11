import { expect, test } from "@playwright/test";
import { login, logout } from "./helpers";

/** Раунд 6: панель руководителя, риски, ИИ-черновик, «Как пройти», анонимный опрос, портфолио и резюме. */

test.describe("Кабинет деканата: новые разделы", () => {
  test("панель руководителя: показатели, график, период", async ({ page }) => {
    await login(page, "staff");
    await page.getByRole("link", { name: "Панель руководителя" }).first().click();
    await expect(page.getByRole("heading", { name: "Панель руководителя" })).toBeVisible();
    await expect(page.getByText("Поступило", { exact: true })).toBeVisible();
    await expect(page.getByRole("img", { name: /Заявок в день за 30 дн/ })).toBeVisible();
    await page.getByRole("link", { name: "7 дн." }).click();
    await expect(page).toHaveURL(/d=7/);
    await expect(page.getByRole("img", { name: /за 7 дн/ })).toBeVisible();
    await expect(page.getByRole("table")).toContainText("Белова И. П.");
  });

  test("риски: приглашение на консультацию доходит до студента", async ({ page }) => {
    await login(page, "staff");
    await page.goto("/staff/risks");
    const card = page.getByRole("listitem").filter({ hasText: "Соколова Анна" }).filter({ hasText: "Статистика" });
    await card.getByRole("button", { name: /Пригласить Соколова Анна Викторовна на консультацию/ }).click();
    await expect(card).toContainText("Приглашение отправлено");
    await page.reload();
    await expect(page.getByRole("listitem").filter({ hasText: "Соколова Анна" }).filter({ hasText: "Статистика" })).toContainText(/Приглашён\(а\)/);
    await logout(page);
    await login(page, "anna");
    await page.goto("/grades");
    const stat = page.getByRole("article", { name: "Статистика" });
    await expect(stat).toContainText("Деканат приглашает на консультацию");
    await stat.getByRole("link", { name: "Записаться" }).click();
    await expect(page).toHaveURL(/\/appointments/);
  });

  test("ИИ-черновик: заполняет комментарий, пометку в скобках отправить нельзя", async ({ page }) => {
    await login(page, "staff");
    await page.goto("/staff?status=SUBMITTED");
    await page.locator("a[href^='/staff/requests/']").first().click();
    await page.locator("label", { hasText: "Нужно дополнить" }).click();
    await page.getByRole("button", { name: "Черновик ИИ" }).click();
    await expect(page.locator("#st-comment")).toHaveValue(/здравствуйте!.*\[укажите, что нужно дополнить\]/);
    await expect(page.getByText(/Черновик по шаблону/)).toBeVisible();
    await page.getByRole("button", { name: "Сохранить и уведомить студента" }).click();
    await expect(page.getByText(/осталась пометка в \[квадратных скобках\]/)).toBeVisible();
    await page.locator("#st-comment").fill("Приложите, пожалуйста, скан приглашения от принимающей стороны.");
    await page.getByRole("button", { name: "Сохранить и уведомить студента" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Статус обновлён" })).toBeVisible();
  });

  test("опросы: деканат видит только агрегаты", async ({ page }) => {
    await login(page, "staff");
    await page.goto("/staff/surveys");
    await expect(page.getByRole("heading", { name: "Опросы о курсах" })).toBeVisible();
    await expect(page.getByText("Понятность").first()).toBeVisible();
    await expect(page.getByText(/Соколова|Галиев/)).toHaveCount(0);
  });

  test("студенту разделы деканата недоступны", async ({ page }) => {
    await login(page, "anna");
    for (const p of ["/staff/analytics", "/staff/risks", "/staff/surveys"]) {
      await page.goto(p);
      await expect(page).not.toHaveURL(/\/staff/);
    }
  });
});

test.describe("Кабинет студента: новые разделы", () => {
  test("«Как пройти» из карточки занятия", async ({ page }) => {
    await login(page, "anna");
    await page.goto("/schedule");
    await page.locator("main a[href^='/map?room=']").first().click();
    await expect(page).toHaveURL(/\/map\?room=/);
    await expect(page.getByRole("heading", { name: /Маршрут до аудитории/ })).toBeVisible();
    await expect(page.getByRole("img", { name: "Условная схема кампуса" })).toBeVisible();
    await expect(page.getByText(/Схема условная и вымышленная/)).toBeVisible();
    await page.fill("#m-room", "412");
    await page.selectOption("#m-b", "Б");
    await page.getByRole("button", { name: "Показать путь" }).click();
    await expect(page.getByText("переход в корпус Б")).toBeVisible();
  });

  test("анонимный опрос: ответ один раз", async ({ page }) => {
    await login(page, "anna");
    await page.goto("/survey");
    const first = page.getByRole("article").first();
    const send = first.getByRole("button", { name: "Отправить анонимно" });
    await expect(send).toBeDisabled();
    await first.getByRole("radio", { name: /Понятно ли объясняют материал: 4 из 5/ }).check({ force: true });
    await first.getByRole("radio", { name: /работу преподавателя: 5 из 5/ }).check({ force: true });
    await first.getByRole("radio", { name: /Посильна ли нагрузка: 3 из 5/ }).check({ force: true });
    await send.click();
    await expect(first.getByRole("status")).toContainText("Ответ учтён анонимно");
    await page.reload();
    await expect(page.getByText("Вы уже ответили").first()).toBeVisible();
  });

  test("портфолио: добавить, удалить, резюме", async ({ page }) => {
    await login(page, "timur");
    await page.goto("/portfolio");
    await page.selectOption("#pf-kind", "PUBLICATION");
    await page.fill("#pf-date", "2026-10");
    await page.fill("#pf-title", "Статья о третейских оговорках");
    await page.fill("#pf-org", "Студенческий юридический журнал");
    await page.getByRole("button", { name: "Добавить", exact: true }).click();
    await expect(page.getByText("Добавлено в портфолио")).toBeVisible();
    const item = page.getByRole("listitem").filter({ hasText: "Статья о третейских оговорках" });
    await expect(item).toContainText("Добавлено вами");
    await page.getByRole("link", { name: "Резюме (PDF)" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Галиев");
    await expect(page.getByText("Статья о третейских оговорках")).toBeVisible();
    await expect(page.getByText(/Концепт для конкурса МГИМО по ИИ/)).toBeVisible();
    await page.goto("/portfolio");
    await item.getByRole("button", { name: /Удалить: Статья/ }).click();
    await page.getByRole("button", { name: "Удалить", exact: true }).click();
    await expect(item).toHaveCount(0);
  });

  test("новые разделы на английском", async ({ page, context }) => {
    await context.addCookies([{ name: "lang", value: "en", url: "http://localhost:3000" }]);
    await login(page, "anna");
    await page.goto("/survey");
    await expect(page.getByRole("heading", { name: "Course feedback" })).toBeVisible();
    await page.goto("/portfolio");
    await expect(page.getByText("Meridian-2026 Economics Olympiad")).toBeVisible();
    await page.goto("/map?room=2110&b=%D0%90");
    await expect(page.getByText("Turn right — east wing.")).toBeVisible();
  });
});
