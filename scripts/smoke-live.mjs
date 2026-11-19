// Дымовая проверка живого сайта: только чтение. Ничего не создаёт и не меняет, входит с ВЕРНЫМИ паролями
// (неверные пароли могли бы заблокировать вход жюри). Запуск: node scripts/smoke-live.mjs [BASE_URL]
// Выход с кодом 1, если что-то сломано; отчёт — в консоль.
import { chromium } from "playwright";

const base = (process.argv[2] ?? process.env.BASE_URL ?? "https://meridian-iwkag.msk1.amvera.tech").replace(/\/$/, "");
const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined;
const ACCOUNTS = [
  { login: "sokolova", password: "Demo-2026-anna", pages: ["/", "/schedule", "/schedule?view=week", "/schedule?view=session", "/grades", "/grades?tab=record", "/grades/electives", "/requests", "/requests/new", "/notifications", "/assistant", "/appointments", "/profile", "/portfolio", "/survey", "/map"] },
  { login: "galiev", password: "Demo-2026-timur", pages: ["/", "/requests", "/schedule?view=week"] },
  { login: "lin", password: "Demo-2026-mei", pages: ["/", "/grades"] },
  { login: "belova", password: "Demo-2026-staff", pages: ["/staff", "/staff/analytics", "/staff/risks", "/staff/surveys", "/staff/electives", "/staff/announcements", "/staff/schedule"] },
];
const problems = [];
const b = await chromium.launch({ proxy });

// Публичные адреса без входа
const anon = await b.newContext();
for (const [path, want] of [["/login", 200], ["/icon.svg", 200], ["/manifest.webmanifest", 200], ["/api/health", 200], ["/requests", 307]]) {
  let st = 0;
  for (let attempt = 0; attempt < 2 && st !== want; attempt++) st = await anon.request.get(base + path, { maxRedirects: 0 }).then((r) => r.status()).catch(() => 0);
  if (st !== want) problems.push(`${path}: статус ${st || "нет ответа"} вместо ${want}`);
}
await anon.close();

for (const a of ACCOUNTS) {
  const ctx = await b.newContext({ viewport: { width: 360, height: 780 } });
  await ctx.addCookies([{ name: "meridian-tour-v1", value: "done", url: base }]);
  const p = await ctx.newPage();
  const errs = [];
  p.on("pageerror", (e) => errs.push(String(e)));
  p.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  await p.goto(base + "/login");
  await p.fill("#login", a.login); await p.fill("#password", a.password);
  await Promise.all([p.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 30_000 }).catch(() => problems.push(`${a.login}: не удалось войти`)), p.click("button[type=submit]")]);
  for (const path of a.pages) {
   // Облачная сеть проверки иногда сама отдаёт 502/504 на статику (проверено: из России те же 400+ файлов — все 200).
   // Поэтому страница с такими ошибками проверяется второй раз; в отчёт попадает, только если сломалась дважды.
   for (let attempt = 1; attempt <= 2; attempt++) {
    errs.length = 0;
    const before = problems.length;
    const t0 = Date.now();
    const r = await p.goto(base + path, { waitUntil: "load" }).catch((e) => { problems.push(`${a.login} ${path}: ${e.message.split("\n")[0]}`); return null; });
    if (!r) { if (attempt === 1) { problems.pop(); continue; } break; }
    const ms = Date.now() - t0;
    const width = await p.evaluate(() => document.documentElement.scrollWidth);
    if (r.status() !== 200) problems.push(`${a.login} ${path}: статус ${r.status()}`);
    if (width > 360) problems.push(`${a.login} ${path}: горизонтальная прокрутка (${width} px на 360)`);
    if (errs.length) problems.push(`${a.login} ${path}: ошибки в консоли — ${errs.slice(0, 2).join(" | ").slice(0, 200)}`);
    if (!(await p.getByText("Концепт для конкурса МГИМО по ИИ").first().isVisible().catch(() => false)) && !(await p.getByText(/Concept for the MGIMO/).first().isVisible().catch(() => false))) {
      const txt = await p.locator("footer").innerText().catch(() => "");
      if (!/Концепт|Concept/.test(txt)) problems.push(`${a.login} ${path}: нет пометки «концепт»`);
    }
    const flaky = problems.length > before && errs.some((e) => /50[24]/.test(e));
    if (flaky && attempt === 1) { problems.length = before; continue; }
    console.log(`${problems.length > before ? "ERR" : "ok "} ${a.login.padEnd(9)} ${path.padEnd(24)} ${String(r.status())} ${ms} мс${attempt === 2 ? " (со 2-й попытки)" : ""}`);
    break;
   }
  }
  await ctx.close();
}
await b.close();
if (problems.length) { console.log(`\nПРОБЛЕМЫ (${problems.length}):\n- ` + problems.join("\n- ")); process.exit(1); }
console.log("\nВсё в порядке: сайт открывается, разделы работают, ошибок нет.");
