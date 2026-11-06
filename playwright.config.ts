import { defineConfig, devices } from "@playwright/test";

/**
 * E2E: сценарии жюри и изоляция данных. Перед прогоном БД пересоздаётся сидом (global-setup),
 * время зафиксировано DEMO_NOW — тесты детерминированы.
 */
const PORT = Number(process.env.E2E_PORT ?? 3000);
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  globalSetup: "./tests/e2e/global-setup.ts",
  use: { baseURL: `http://localhost:${PORT}`, locale: "ru-RU", timezoneId: "Europe/Moscow", trace: "retain-on-failure" },
  projects: [
    // mobile.spec.ts — только для 360 px (проверки ширины и нижнего таб-бара на desktop не имеют смысла).
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } }, testIgnore: /mobile\.spec\.ts/ },
    { name: "mobile-360", use: { ...devices["Pixel 7"], viewport: { width: 360, height: 800 } }, testMatch: /(flow|mobile)\.spec\.ts/ },
  ],
  webServer: {
    command: `npx next dev -p ${PORT}`,
    url: `http://localhost:${PORT}/api/health`,
    reuseExistingServer: true,
    env: { DEMO_NOW: process.env.DEMO_NOW ?? "2026-11-13T07:15:00Z" },
    timeout: 120_000,
  },
});
