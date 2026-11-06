// Замер Lighthouse (мобильный профиль) по ключевым страницам. Вход — через форму, cookie передаётся в Lighthouse.
// Запуск: BASE_URL=http://127.0.0.1:3200 LH_BIN=<путь к lighthouse> node scripts/lighthouse.mjs
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import fs from "node:fs";

const base = process.env.BASE_URL ?? "http://127.0.0.1:3200";
const out = process.env.OUT ?? "docs/lighthouse";
fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch();
const p = await b.newPage();
await p.goto(base + "/login");
await p.fill("#login", "sokolova"); await p.fill("#password", "Demo-2026-anna");
await Promise.all([p.waitForURL((u) => !u.pathname.startsWith("/login")), p.click("button[type=submit]")]);
const cookie = (await p.context().cookies()).map((c) => `${c.name}=${c.value}`).join("; ");
await b.close();
const rows = [];
for (const route of ["/login", "/", "/schedule", "/grades", "/requests"]) {
  const file = `${out}/lh${route === "/" ? "-today" : route.replace(/\//g, "-")}.json`;
  execFileSync(process.env.LH_BIN ?? "lighthouse", [base + route, "--quiet", "--output=json", `--output-path=${file}`, "--only-categories=performance,accessibility,best-practices", `--chrome-path=${chromium.executablePath()}`, "--chrome-flags=--headless=new --no-sandbox", `--extra-headers=${JSON.stringify(route === "/login" ? {} : { Cookie: cookie })}`], { stdio: "inherit" });
  const j = JSON.parse(fs.readFileSync(file, "utf8"));
  const s = (k) => Math.round(j.categories[k].score * 100);
  rows.push({ route, performance: s("performance"), accessibility: s("accessibility"), bestPractices: s("best-practices"), lcp: j.audits["largest-contentful-paint"].displayValue, cls: j.audits["cumulative-layout-shift"].displayValue, tbt: j.audits["total-blocking-time"].displayValue });
}
console.table(rows);
fs.writeFileSync(`${out}/summary.json`, JSON.stringify(rows, null, 2));
