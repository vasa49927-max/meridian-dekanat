// Замер Lighthouse (мобильный профиль) по ключевым страницам. Вход — через форму, cookie передаётся в Lighthouse.
// Запуск: BASE_URL=http://127.0.0.1:3200 LH_BIN=<путь к lighthouse> node scripts/lighthouse.mjs
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import fs from "node:fs";

const base = process.env.BASE_URL ?? "http://127.0.0.1:3200";
// PRESET=desktop — профиль компьютера (по умолчанию — телефон: медленный 4G и процессор в 4 раза медленнее)
const preset = process.env.PRESET === "desktop" ? ["--preset=desktop"] : [];
const out = process.env.OUT ?? (preset.length ? "docs/lighthouse/desktop" : "docs/lighthouse");
fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch();
const p = await b.newPage();
await p.goto(base + "/login");
await p.fill("#login", "sokolova"); await p.fill("#password", "Demo-2026-anna");
await Promise.all([p.waitForURL((u) => !u.pathname.startsWith("/login")), p.click("button[type=submit]")]);
const cookie = (await p.context().cookies()).map((c) => `${c.name}=${c.value}`).join("; ");
await b.close();
const rows = [];
// Повторный визит (подсказки уже видел) — обычный случай; первый визит с подсказками меряем отдельно строкой «/ (первый вход)»
const returning = `${cookie}; meridian-tour-v1=done`;
for (const route of ["/login", "/?first", "/", "/schedule", "/grades", "/grades/electives", "/requests", "/portfolio", "/map"]) {
  const file = `${out}/lh${route === "/" ? "-today" : route === "/?first" ? "-today-first-visit" : route.replace(/\//g, "-")}.json`;
  execFileSync(process.env.LH_BIN ?? "lighthouse", [base + route, ...preset, "--quiet", "--output=json", `--output-path=${file}`, "--only-categories=performance,accessibility,best-practices", `--chrome-path=${chromium.executablePath()}`, "--chrome-flags=--headless=new --no-sandbox", `--extra-headers=${JSON.stringify(route === "/login" ? {} : { Cookie: route === "/?first" ? cookie : returning })}`], { stdio: "inherit" });
  const j = JSON.parse(fs.readFileSync(file, "utf8"));
  const s = (k) => Math.round(j.categories[k].score * 100);
  rows.push({ route, performance: s("performance"), accessibility: s("accessibility"), bestPractices: s("best-practices"), lcp: j.audits["largest-contentful-paint"].displayValue, cls: j.audits["cumulative-layout-shift"].displayValue, tbt: j.audits["total-blocking-time"].displayValue });
}
console.table(rows);
fs.writeFileSync(`${out}/summary.json`, JSON.stringify(rows, null, 2));
