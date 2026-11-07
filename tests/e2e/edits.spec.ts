import { expect, test } from "@playwright/test";
import { login } from "./helpers";

/** Правки капитана после ручного теста (этап 13): вложения, подтверждения, пароль в профиле. */
test.describe("Вложения к заявкам", () => {
  test("студент прикладывает файл к ответу деканату → деканат видит и скачивает; чужой студент получает 404", async ({ page, browser }) => {
    await login(page, "timur");
    await page.goto("/requests?all=1");
    await page.locator('a[href^="/requests/"]').filter({ hasText: "Индивидуальный график обучения" }).first().click();
    await expect(page).toHaveURL(/\/requests\/[0-9a-f-]{36}$/);
    const url = new URL(page.url()).pathname;
    await expect(page.getByText("Деканат просит дополнить:")).toBeVisible();

    // Подделка: текст с расширением .pdf — сервер отклоняет по содержимому
    await page.getByLabel("Ответ деканату").fill("Прикладываю письмо работодателя");
    await page.locator('input[name="files"]').setInputFiles("tests/e2e/fixtures/fake.pdf");
    await page.getByRole("button", { name: "Отправить и вернуть в работу" }).click();
    await expect(page.getByText(/подходят только PDF, JPG, PNG или DOCX/)).toBeVisible();

    // Убираем неподходящий файл из списка и прикладываем настоящий
    await page.getByRole("button", { name: "Убрать файл fake.pdf" }).click();
    await page.getByLabel("Ответ деканату").fill("Прикладываю письмо работодателя");
    await page.locator('input[name="files"]').setInputFiles("tests/e2e/fixtures/letter.png");
    await page.getByRole("button", { name: "Отправить и вернуть в работу" }).click();
    await expect(page.getByRole("link", { name: /letter\.png/ })).toBeVisible();
    const href = (await page.getByRole("link", { name: /letter\.png/ }).getAttribute("href"))!;
    expect(href).toMatch(/^\/api\/attachments\/[0-9a-f-]{36}$/);
    const own = await page.request.get(href);
    expect(own.status()).toBe(200);
    expect(own.headers()["content-type"]).toBe("image/png");
    expect(own.headers()["content-disposition"]).toContain("attachment");

    // Другой студент: ни файла, ни заявки
    const anna = await browser.newPage();
    await login(anna, "anna");
    expect((await anna.request.get(href)).status()).toBe(404);
    const res = await anna.goto(url);
    expect(res?.status()).toBe(404);
    await anna.close();

    // Деканат видит вложение в заявке
    const staff = await browser.newPage();
    await login(staff, "staff");
    await staff.goto(url.replace("/requests/", "/staff/requests/"));
    await expect(staff.getByRole("link", { name: /letter\.png/ })).toBeVisible();
    expect((await staff.request.get(href)).status()).toBe(200);
    await staff.close();
  });

  test("без входа файл не скачать", async ({ request }) => {
    expect((await request.get("/api/attachments/00000000-0000-4000-8000-000000000000")).status()).toBe(401);
  });
});

test.describe("Подтверждение отмены", () => {
  test("отзыв заявки — только после подтверждения в диалоге", async ({ page }) => {
    await login(page, "mei");
    await page.goto("/requests/new/STUDY_CERT");
    await page.getByRole("button", { name: "Отправить заявку" }).click();
    await expect(page.getByText("Заявка отправлена")).toBeVisible();
    await page.getByRole("button", { name: "Отозвать заявку" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Нет, оставить" }).click();
    await expect(page.getByText("Подана").first()).toBeVisible();
    await page.getByRole("button", { name: "Отозвать заявку" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Да, отозвать" }).click();
    await expect(page.getByText("Отклонена").first()).toBeVisible();
  });
});

test.describe("Пароль в профиле", () => {
  test("пароль показан точками; смена в демо-аккаунте защищена и объяснена", async ({ page }) => {
    await login(page, "anna");
    await page.goto("/profile");
    await expect(page.getByLabel("Пароль скрыт")).toHaveText("••••••••••");
    await expect(page.getByText("Demo-2026-anna")).toHaveCount(0);
    await page.getByRole("button", { name: "Сменить пароль" }).click();
    await page.getByLabel("Текущий пароль").fill("Demo-2026-anna");
    await page.getByLabel("Новый пароль", { exact: true }).fill("NewPassw0rd-2026");
    await page.getByLabel("Повторите новый пароль").fill("другой");
    await page.getByRole("button", { name: "Сменить пароль" }).last().click();
    await expect(page.getByText("Новые пароли не совпадают")).toBeVisible();
    // После ответа сервера поля паролей очищаются (React сбрасывает форму) — вводим заново
    await page.getByLabel("Текущий пароль").fill("Demo-2026-anna");
    await page.getByLabel("Новый пароль", { exact: true }).fill("NewPassw0rd-2026");
    await page.getByLabel("Повторите новый пароль").fill("NewPassw0rd-2026");
    await page.getByRole("button", { name: "Сменить пароль" }).last().click();
    await expect(page.getByText(/В демо-аккаунтах для жюри смена пароля отключена/)).toBeVisible();
  });
});
