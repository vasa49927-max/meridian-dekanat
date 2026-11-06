import { expect, test } from "@playwright/test";
import { login } from "./helpers";

/** Сквозной сценарий жюри: студент подал → деканат обработал → студент увидел статус, уведомление и справку с QR. */
test("полный цикл заявки: студент → деканат → студент", async ({ page, browser }) => {
  await login(page, "mei");
  await page.goto("/requests/new");
  await page.getByRole("link", { name: /Справка об обучении\s+Подтверждает/ }).click();
  await page.fill("#purpose", "Банк — открытие счёта");
  await page.getByRole("button", { name: "Отправить заявку" }).click();
  await expect(page.getByText("Заявка отправлена")).toBeVisible();
  const requestUrl = new URL(page.url()).pathname;
  const number = (await page.locator("p", { hasText: /З-26-\d{5}/ }).first().textContent())!.match(/З-26-\d{5}/)![0];

  const staffCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const staff = await staffCtx.newPage();
  await login(staff, "staff");
  await staff.goto(`/staff?q=${encodeURIComponent(number)}`);
  await staff.getByRole("link", { name: "Справка об обучении" }).first().click();
  await staff.getByText("В работе", { exact: true }).click();
  await staff.getByRole("button", { name: "Сохранить и уведомить студента" }).click();
  await expect(staff.getByRole("status")).toContainText("Статус обновлён");
  await staff.getByText("Готова", { exact: true }).click();
  await staff.fill("#st-comment", "Готово, бумажный экземпляр — в ауд. 1012");
  await staff.getByRole("button", { name: "Сохранить и уведомить студента" }).click();
  await expect(staff.getByText("Электронный документ").or(staff.getByRole("img", { name: "QR-код проверки подлинности" }))).toBeVisible();
  await staffCtx.close();

  await page.goto(requestUrl);
  await expect(page.getByText("Готова").first()).toBeVisible();
  await expect(page.getByRole("img", { name: "QR-код проверки подлинности" })).toBeVisible();
  const verify = await page.locator("span.font-mono").first().textContent();
  await page.goto("/notifications?f=unread");
  await expect(page.getByText("Справка об обучении: готова").first()).toBeVisible();

  const code = verify!.split("/verify/")[1];
  const pub = await browser.newPage();
  await pub.goto(`/verify/${code}`);
  await expect(pub.getByRole("heading", { name: "Документ подлинный" })).toBeVisible();
  await expect(pub.getByText("Лин М.")).toBeVisible();
  await pub.close();
});
