// Замер путей «с главного экрана до задачи» (раунд 7, аудит удобства). Запуск: node scripts/ux-paths.mjs before|after (нужен запущенный dev-сервер и демо-данные).
// Результаты: docs/research/ux-paths-*.json, отчёт — docs/research/UX_AUDIT_R7.md.
// Замер путей «с главного экрана до задачи». Для каждой задачи — реальные клики в браузере.
// Время по KLM (Card, Moran, Newell): решение M=1.35 c, навести P=1.1 c, нажать B=0.2 c; прокрутка экрана ≈ 1.0 c; ввод K=0.28 c/символ.
import { chromium } from "playwright";
const BASE = "http://localhost:3000";
const out = [];
const nav = (name) => (p, mobile) => mobile
  ? p.locator("nav[aria-label] a, footer a, [role=navigation] a").filter({ hasText: new RegExp(`^${name}`) }).last()
  : p.locator("aside a").filter({ hasText: new RegExp(`^${name}`) }).first();
const tab = (name) => (p) => p.locator("a").filter({ hasText: new RegExp(`^\\s*${name}\\s*$`) }).last();
const link = (re) => (p) => p.locator("main a, main button").filter({ hasText: re }).first();
const any = (re) => (p) => p.locator("a, button").filter({ hasText: re }).first();
const text = (re) => (p) => p.getByText(re).first();

// Шаги: ["click", locatorFn] | ["see", locatorFn] | ["type", locatorFn, "текст"]
const STUDENT = {
  desktop: [
    ["Где и когда следующая пара", [["see", text(/Следующая пара/)]]],
    ["Расписание на неделю", [["click", link(/^Неделя$/)], ["see", text(/Неделя \d+|неделя/i)]]],
    ["Баллы по «Статистике»", [["click", nav("Успеваемость")], ["see", (p) => p.getByRole("article", { name: "Статистика" })]]],
    ["Заказать справку об обучении", [["click", link(/Заказать справку/)], ["click", link(/^Справка об обучении(?! на)/)], ["see", (p) => p.locator("main button[type=submit]").first()]]],
    ["Статус своей заявки", [["click", (p) => p.locator("main a[href^='/requests/']:visible").filter({ hasText: /Справка об обучении на английском/ }).first()], ["see", text(/История|История статусов|Ход заявки/)]]],
    ["Записаться к методисту", [["click", nav("Запись к методисту")], ["see", (p) => p.locator("main label").filter({ hasText: /^\s*\d{1,2}:\d{2}\s*$/ }).first()]]],
    ["Спросить помощника", [["see", (p) => p.getByPlaceholder(/Ваш вопрос/)]]],
    ["Непрочитанные уведомления", [["click", (p) => p.locator("header a[href^='/notifications']").first()], ["see", text(/Уведомления/)]]],
    ["Как пройти к аудитории пары", [["click", (p) => p.locator("main a[href^='/map']").first()], ["see", text(/Маршрут до аудитории/)]]],
    ["Расписание сессии", [["click", nav("Расписание")], ["click", link(/^Сессия$/)], ["see", text(/Сессия|сессия/)]]],
    ["Резюме из портфолио", [["click", nav("Портфолио")], ["click", any(/Резюме \(PDF\)/)], ["see", (p) => p.getByRole("button", { name: /Распечатать/ })]]],
    ["Оценить курсы", [["click", nav("Оценка курсов")], ["see", (p) => p.locator("main fieldset").first()]]],
    ["Сменить язык", [["see", (p) => p.locator("header select, header button").filter({ hasText: /RU/ }).first()]]],
  ],
  mobile: [
    ["Где и когда следующая пара", [["see", text(/Следующая пара/)]]],
    ["Расписание на неделю", [["click", link(/^Неделя$/)], ["see", text(/Неделя \d+|неделя/i)]]],
    ["Баллы по «Статистике»", [["click", tab("Успеваемость")], ["see", (p) => p.getByRole("article", { name: "Статистика" })]]],
    ["Заказать справку об обучении", [["click", link(/Заказать справку/)], ["click", link(/^Справка об обучении(?! на)/)], ["see", (p) => p.locator("main button[type=submit]").first()]]],
    ["Статус своей заявки", [["click", (p) => p.locator("main a[href^='/requests/']:visible").filter({ hasText: /Справка об обучении на английском/ }).first()], ["see", text(/История|История статусов|Ход заявки/)]]],
    ["Записаться к методисту", [["click", tab("Ещё")], ["click", link(/Запись к методисту/)], ["see", (p) => p.locator("main label").filter({ hasText: /^\s*\d{1,2}:\d{2}\s*$/ }).first()]]],
    ["Спросить помощника", [["see", (p) => p.getByPlaceholder(/Ваш вопрос/)]]],
    ["Непрочитанные уведомления", [["click", (p) => p.locator("header a[href^='/notifications']").first()], ["see", text(/Уведомления/)]]],
    ["Как пройти к аудитории пары", [["click", (p) => p.locator("main a[href^='/map']").first()], ["see", text(/Маршрут до аудитории/)]]],
    ["Расписание сессии", [["click", tab("Расписание")], ["click", link(/^Сессия$/)], ["see", text(/Сессия|сессия/)]]],
    ["Резюме из портфолио", [["click", tab("Ещё")], ["click", link(/Портфолио/)], ["click", any(/Резюме \(PDF\)/)], ["see", (p) => p.getByRole("button", { name: /Распечатать/ })]]],
    ["Оценить курсы", [["click", tab("Ещё")], ["click", link(/Оценка курсов/)], ["see", (p) => p.locator("main fieldset").first()]]],
    ["Сменить язык", [["click", tab("Ещё")], ["click", link(/^Профиль/)], ["see", (p) => p.locator("main select").filter({ has: p.locator("option", { hasText: "English" }) }).first()]]],
  ],
};
const STAFF = [
  ["Открыть просроченную заявку", [["click", any(/Просрочен/)], ["click", (p) => p.locator("main a[href^='/staff/requests/']").first()], ["see", text(/Новый статус/)]]],
  ["Опубликовать объявление", [["click", nav("Объявления")], ["see", (p) => p.locator("main form button[type=submit]").first()]]],
  ["Перенести пару", [["click", nav("Переносы пар")], ["see", text(/Перенос|Переносы/)]]],
  ["Посмотреть риски студентов", [["click", nav("Риски студентов")], ["see", text(/Студентов с риском/i)]]],
];

async function run(login, password, tasks, mobile, who) {
  const b = await chromium.launch();
  for (const [name, steps] of tasks) {
    const ctx = await b.newContext(mobile ? { viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true } : { viewport: { width: 1440, height: 900 } });
    await ctx.addInitScript(() => localStorage.setItem("meridian-tour-v1", "done"));
    const p = await ctx.newPage();
    await p.goto(BASE + "/login"); await p.fill("#login", login); await p.fill("#password", password);
    await p.click("button[type=submit]"); await p.waitForURL((u) => !String(u).includes("/login")); await p.waitForLoadState("networkidle");
    const vh = mobile ? 740 : 900;
    let clicks = 0, screens = 0, ms = 0, ok = true, err = "";
    try {
      for (const [kind, fn] of steps) {
        const loc = fn(p, mobile);
        await loc.waitFor({ state: "attached", timeout: 6000 });
        const box = await loc.evaluate((el) => { const r = el.getBoundingClientRect(); return { top: r.top + window.scrollY, fixed: getComputedStyle(el.closest("nav,header,footer,aside") ?? el).position === "fixed" || getComputedStyle(el.closest("nav,header,footer,aside") ?? el).position === "sticky" }; });
        if (!box.fixed && box.top > vh * 0.85) screens += Math.ceil((box.top - vh * 0.85) / (vh * 0.8));
        if (kind === "click") {
          const t0 = Date.now(); clicks++;
          await loc.click(); await p.waitForLoadState("networkidle"); ms += Date.now() - t0;
        }
      }
    } catch (e) { ok = false; err = String(e.message).split("\n")[0].slice(0, 120); }
    const klm = clicks * (1.35 + 1.1 + 0.2) + screens * 1.0 + 1.35; // +1.35 — найти глазами итог
    out.push({ who, mobile, name, clicks, screens, klm: Math.round(klm * 10) / 10, loadMs: ms, ok, err });
    await ctx.close();
  }
  await b.close();
}
const tag = process.argv[2] ?? "before";
if (tag === "after") {
  const q = (re) => (p) => p.locator("nav[aria-label='Быстрые действия'] a").filter({ hasText: re }).first();
  for (const list of [STUDENT.desktop, STUDENT.mobile]) {
    const set = (name, steps) => { const i = list.findIndex((x) => x[0] === name); list[i] = [name, steps]; };
    set("Расписание на неделю", [["click", q(/неделю/)], ["see", text(/Неделя \d+|неделя/i)]]);
    set("Заказать справку об обучении", [["click", q(/Заказать справку/)], ["click", link(/^Справка об обучении(?! на)/)], ["see", (p) => p.locator("main button[type=submit]").first()]]);
    set("Как пройти к аудитории пары", [["click", q(/Как пройти/)], ["see", text(/Маршрут до аудитории/)]]);
  }
  const m = STUDENT.mobile;
  const set = (name, steps) => { const i = m.findIndex((x) => x[0] === name); m[i] = [name, steps]; };
  set("Записаться к методисту", [["click", q(/методисту/)], ["see", (p) => p.locator("main label").filter({ hasText: /^\s*\d{1,2}:\d{2}\s*$/ }).first()]]);
  set("Статус своей заявки", [["click", (p) => p.locator("nav[aria-label='Быстрые действия'] a[href^='/requests/']:not([href='/requests/new'])").first()], ["see", text(/История|История статусов|Ход заявки/)]]);
  set("Сменить язык", [["click", tab("Ещё")], ["see", (p) => p.locator("main select").first()]]);
}
await run("sokolova", "Demo-2026-anna", STUDENT.desktop, false, "student");
await run("sokolova", "Demo-2026-anna", STUDENT.mobile, true, "student");
await run("belova", "Demo-2026-staff", STAFF, false, "staff");
const fs = await import("node:fs");
fs.writeFileSync(`docs/research/ux-paths-${tag}.json`, JSON.stringify(out, null, 1));
for (const r of out) console.log([r.who, r.mobile ? "360" : "1440", r.name, `клики ${r.clicks}`, `прокр ${r.screens}`, `≈${r.klm} c`, `${r.loadMs} мс`, r.ok ? "" : "FAIL " + r.err].join(" | "));
