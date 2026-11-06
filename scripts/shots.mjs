// Скриншоты для документации и самопроверки: node scripts/shots.mjs <префикс> <логин> <пароль> <маршрут>[,<маршрут>…] [--dark] [--full]
// Пример: node scripts/shots.mjs 03-today sokolova Demo-2026-anna /,/schedule
import { chromium } from "playwright";

const [prefix, login, password, routes = "/", ...flags] = process.argv.slice(2);
const base = process.env.BASE_URL ?? "http://localhost:3000";
const out = process.env.OUT ?? "docs/screenshots";
const dark = flags.includes("--dark");
const full = flags.includes("--full");
const widths = (process.env.WIDTHS ?? "360,1440").split(",").map(Number);
const browser = await chromium.launch();
for (const w of widths) {
  const ctx = await browser.newContext({ viewport: { width: w, height: w < 800 ? 800 : 900 }, deviceScaleFactor: Number(process.env.DSF ?? 2), colorScheme: dark ? "dark" : "light", locale: "ru-RU", timezoneId: "Europe/Moscow" });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));
  if (login && login !== "-") {
    await page.goto(base + "/login");
    await page.fill("#login", login);
    await page.fill("#password", password);
    await Promise.all([page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 30000 }), page.click("button[type=submit]")]);
  }
  for (const r of routes.split(",")) {
    await page.goto(base + r, { waitUntil: "networkidle" });
    await page.waitForTimeout(400);
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    const name = `${out}/${prefix}${r === "/" ? "" : r.replace(/[/?=&]+/g, "-")}${dark ? "-dark" : ""}-${w}.png`;
    await page.screenshot({ path: name, fullPage: full || w > 800 });
    console.log(`${name}  scrollWidth=${sw}${sw > w ? "  ⚠ ГОРИЗОНТАЛЬНЫЙ СКРОЛЛ" : ""}`);
  }
  if (errors.length) console.log("Ошибки в консоли:", [...new Set(errors)].slice(0, 5));
  await ctx.close();
}
await browser.close();
