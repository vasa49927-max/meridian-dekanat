import { expect, test } from "@playwright/test";
import { login } from "./helpers";

/** Раунд 3 улучшений: подсказки, уведомления по дням, «с чего начать», повторная подача, оценка, кто ведёт заявку. */

test.describe("Подсказки при первом входе", () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  test("показываются один раз, листаются, закрываются и открываются снова из «Ещё»", async ({ page }) => {
    await login(page, "anna");
    const dlg = page.getByRole("dialog");
    await expect(dlg).toBeVisible();
    await expect(dlg).toContainText("Подсказка 1 из 4");
    await dlg.getByRole("button", { name: "Дальше" }).click();
    await expect(dlg.getByRole("heading")).toContainText("Успеваемость");
    await dlg.getByRole("button", { name: "Дальше" }).click();
    await dlg.getByRole("button", { name: "Дальше" }).click();
    await dlg.getByRole("button", { name: "Понятно, начать" }).click();
    await expect(dlg).toBeHidden();
    await page.reload();
    await page.waitForTimeout(800);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.goto("/more");
    await page.getByRole("button", { name: "Подсказки по кабинету" }).click();
    await expect(page.getByRole("dialog")).toContainText("Подсказка 1 из 4");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
});

test("уведомления разбиты по дням: «Вчера» и даты", async ({ page }) => {
  await login(page, "anna");
  await page.goto("/notifications");
  await expect(page.getByRole("heading", { level: 2, name: /^вчера\s*12 ноября/i })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: /^11 ноября\s*среда/ })).toBeVisible();
  // время внутри группы — без повторения даты
  const first = page.getByRole("region", { name: /вчера/i }).getByRole("listitem").first();
  await expect(first).toContainText(/\d{2}:\d{2}/);
});

test("«Успеваемость»: блок «С чего начать» — риск, ближайшая работа, самый лёгкий автомат", async ({ page }) => {
  await login(page, "anna");
  await page.goto("/grades");
  const focus = page.getByRole("region", { name: "С чего начать" });
  await expect(focus.getByRole("listitem")).toHaveCount(3);
  await expect(focus.getByRole("listitem").first()).toContainText("Статистика");
  await expect(focus).toContainText("24 ноября");
  await expect(page.getByRole("link", { name: "Успеваемость" }).first()).toBeVisible();
});

test("отклонённая заявка → «Подать повторно» → поля уже заполнены и видна причина отказа", async ({ page }) => {
  await login(page, "anna");
  await page.goto("/requests?all=1");
  await page.locator('main a[href^="/requests/"]').filter({ hasText: "Перезачёт дисциплины" }).first().click();
  await page.waitForURL(/\/requests\/[0-9a-f-]{36}$/);
  await page.waitForLoadState("networkidle");
  await page.getByRole("link", { name: "Подать повторно" }).click();
  await page.waitForURL(/\/requests\/new\/CREDIT_TRANSFER\?again=/, { timeout: 30_000 });
  await expect(page.getByText(/Поля перенесены из заявки/)).toBeVisible();
  await expect(page.getByText(/Причина отказа: Объём курса/)).toBeVisible();
  await expect(page.getByLabel("Дисциплина")).toHaveValue("Экономическая история");
});

test("чужая заявка в ?again= игнорируется: поля пустые", async ({ page, browser }) => {
  await login(page, "anna");
  await page.goto("/requests?all=1");
  await page.locator('main a[href^="/requests/"]').filter({ hasText: "Перезачёт дисциплины" }).first().click();
  const annaId = new URL(page.url()).pathname.split("/").pop();
  const other = await browser.newPage();
  await login(other, "timur");
  await other.goto(`/requests/new/CREDIT_TRANSFER?again=${annaId}`);
  await expect(other.getByText(/Поля перенесены/)).toHaveCount(0);
  await expect(other.getByLabel("Дисциплина")).toHaveValue("");
  await other.close();
});

test("оценка работы деканата: студент оценивает выданную справку, деканат видит оценку", async ({ page, browser }) => {
  await login(page, "mei");
  await page.goto("/requests?all=1");
  await page.locator('main a[href^="/requests/"]').filter({ hasText: "Дубликат студенческого билета" }).first().click();
  await page.waitForURL(/\/requests\/[0-9a-f-]{36}$/);
  const reqUrl = new URL(page.url()).pathname;
  await expect(page.getByText("Как вам работа деканата по этой заявке?")).toBeVisible();
  await expect(page.getByRole("button", { name: "Оценить" })).toBeDisabled();
  await page.getByRole("radio", { name: /^5 из 5/ }).check({ force: true });
  await page.getByLabel(/Что можно улучшить/).fill("e2e: быстро и понятно");
  await page.getByRole("button", { name: "Оценить" }).click();
  await expect(page.getByText("Спасибо! Ваша оценка работы деканата:")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("img", { name: "Оценка 5 из 5" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Оценить" })).toHaveCount(0);

  const staff = await browser.newPage();
  await login(staff, "staff");
  await staff.goto(`/staff/requests/${reqUrl.split("/").pop()}`);
  await expect(staff.getByText("«e2e: быстро и понятно»")).toBeVisible();
  await staff.goto("/staff");
  await expect(staff.getByText(/оценка студентов за 30 дней/)).toBeVisible();
  await staff.close();
});

test("деканат: колонка «Ведёт», фильтр «Мои», «Взять себе»", async ({ page, browser }) => {
  await login(page, "staff");
  await page.goto("/staff");
  await expect(page.getByRole("columnheader", { name: "Ведёт" })).toBeVisible();
  await expect(page.getByRole("cell", { name: /Кравченко О\. С\./ }).first()).toBeVisible();
  const take = page.getByRole("button", { name: /^Взять себе заявку/ }).first();
  const label = (await take.getAttribute("aria-label"))!;
  const number = label.replace("Взять себе заявку ", "");
  await take.click();
  await expect(page.getByRole("row").filter({ hasText: number }).getByText("Вы")).toBeVisible();
  await page.getByRole("link", { name: /^Мои · \d+/ }).click();
  await expect(page.getByRole("row").filter({ hasText: number })).toBeVisible();
  await page.getByRole("row").filter({ hasText: number }).getByRole("link").first().click();
  await page.waitForURL(/\/staff\/requests\/[0-9a-f-]{36}$/);
  await expect(page.getByText("Ведёт:")).toBeVisible();
  await expect(page.locator("b", { hasText: "вы" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Взять себе" })).toHaveCount(0);

  // Студент видит, кто ведёт его заявку
  const st = await browser.newPage();
  await login(st, "timur");
  await st.goto("/requests?all=1");
  await st.locator('main a[href^="/requests/"]').filter({ hasText: "Индивидуальный график обучения" }).first().click();
  await expect(st.getByText(/Заявку ведёт: Белова И\. П\./)).toBeVisible();
  await st.close();
});

test("профиль: в демо-аккаунте «Выйти на других устройствах» отключено с объяснением", async ({ page, browser }) => {
  const second = await browser.newPage();
  await login(second, "mei");
  await login(page, "mei");
  await page.goto("/profile");
  await expect(page.getByText(/в демо-аккаунтах отключена/)).toBeVisible();
  await expect(page.getByText("это устройство")).toBeVisible();
  await second.close();
});
