// Нагрузочный тест production-сборки. Только локально — на живом сайте (Amvera) не запускать: там идёт проверка жюри.
// Запуск: npm run build && (cd .next/standalone && PORT=3100 node server.js) &
//         BASE_URL=http://127.0.0.1:3100 node scripts/load-test.mjs
// autocannon (MIT) ставится на время запуска: npx -y autocannon@8 — в зависимости проекта не входит.
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";

const base = process.env.BASE_URL ?? "http://127.0.0.1:3100";
if (!/^http:\/\/(127\.0\.0\.1|localhost)/.test(base)) throw new Error("Только локальный сервер: нагрузка на живой сайт помешает жюри");
const b = await chromium.launch();
const ctx = await b.newContext();
const p = await ctx.newPage();
await p.goto(base + "/login");
await p.fill("#login", "sokolova"); await p.fill("#password", "Demo-2026-anna");
await Promise.all([p.waitForURL((u) => !u.pathname.startsWith("/login")), p.click("button[type=submit]")]);
const cookie = (await ctx.cookies()).map((c) => `${c.name}=${c.value}`).join("; ");
await b.close();

const runs = [["/", 10], ["/", 50], ["/schedule", 10], ["/grades", 10], ["/requests", 10], ["/login", 50]];
for (const [route, c] of runs) {
  const headers = route === "/login" ? [] : ["-H", `Cookie=${cookie}`];
  const out = execFileSync("npx", ["-y", "autocannon@8", "-c", String(c), "-d", "20", "-j", ...headers, base + route], { encoding: "utf8", maxBuffer: 1 << 26 });
  const r = JSON.parse(out);
  console.log(`${route.padEnd(10)} c=${String(c).padEnd(3)} rps=${r.requests.average.toFixed(1).padStart(6)}  p50=${r.latency.p50} мс  p97.5=${r.latency.p97_5} мс  ошибок=${r.errors + r.non2xx}`);
}
