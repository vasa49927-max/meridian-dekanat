import { expect, type Page } from "@playwright/test";

export const ACCOUNTS = {
  anna: { login: "sokolova", password: "Demo-2026-anna" },
  timur: { login: "galiev", password: "Demo-2026-timur" },
  mei: { login: "lin", password: "Demo-2026-mei" },
  staff: { login: "belova", password: "Demo-2026-staff" },
} as const;

export async function login(page: Page, who: keyof typeof ACCOUNTS) {
  await page.goto("/login");
  await page.fill("#login", ACCOUNTS[who].login);
  await page.fill("#password", ACCOUNTS[who].password);
  await page.click("button[type=submit]");
  await expect(page).not.toHaveURL(/\/login/);
}

export async function logout(page: Page) {
  await page.context().clearCookies();
}
