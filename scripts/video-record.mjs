// Запись демо-сцен для видео (см. docs/video/VOICEOVER.md). Требует локальный production-сервер на 127.0.0.1:3100.
// Запись демо-сцен «Меридиана» (Playwright recordVideo). Локальный production-сервер + живой сайт для GigaChat (только чтение).
import { chromium } from "playwright";
import fs from "node:fs";

const OUT = process.argv[2];
const LOCAL = "http://127.0.0.1:3100";
const LIVE = "https://meridian-iwkag.msk1.amvera.tech";
const only = process.argv[3] ? process.argv[3].split(",") : null;
fs.mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: "127.0.0.1,localhost" } : undefined });

const POINTER = () => {
  const add = () => {
    if (document.getElementById("__ptr")) return;
    const st = document.createElement("style");
    st.textContent = `#__ptr{position:fixed;z-index:2147483647;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;background:rgba(184,137,47,.35);border:2px solid rgba(184,137,47,.95);pointer-events:none;transition:transform .12s;left:-40px;top:-40px}
#__ptr.down{transform:scale(.7);background:rgba(184,137,47,.6)}
.__rip{position:fixed;z-index:2147483646;width:14px;height:14px;margin:-7px 0 0 -7px;border-radius:50%;border:2px solid rgba(184,137,47,.9);pointer-events:none;animation:__r .5s ease-out forwards}
@keyframes __r{to{transform:scale(3.4);opacity:0}}
html{scroll-behavior:smooth}`;
    document.head.appendChild(st);
    const d = document.createElement("div"); d.id = "__ptr"; document.body.appendChild(d);
    addEventListener("mousemove", (e) => { d.style.left = e.clientX + "px"; d.style.top = e.clientY + "px"; }, true);
    addEventListener("mousedown", (e) => { d.classList.add("down"); const r = document.createElement("div"); r.className = "__rip"; r.style.left = e.clientX + "px"; r.style.top = e.clientY + "px"; document.body.appendChild(r); setTimeout(() => r.remove(), 600); }, true);
    addEventListener("mouseup", () => d.classList.remove("down"), true);
  };
  if (document.readyState === "loading") addEventListener("DOMContentLoaded", add); else add();
};

async function stateFor(base, login, password) {
  const ctx = await b.newContext();
  await ctx.addCookies([{ name: "meridian-tour-v1", value: "done", url: base }]);
  const p = await ctx.newPage();
  await p.goto(base + "/login"); await p.fill("#login", login); await p.fill("#password", password);
  await Promise.all([p.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 30_000 }), p.click("button[type=submit]")]);
  const s = await ctx.storageState(); await ctx.close(); return s;
}

const DESK = { viewport: { width: 1440, height: 900 }, recordVideo: { size: { width: 1440, height: 900 } } };
const PHONE = { viewport: { width: 360, height: 780 }, deviceScaleFactor: 1, recordVideo: { size: { width: 360, height: 780 } } };

async function scene(name, opts, fn) {
  if (only && !only.includes(name)) return;
  const ctx = await b.newContext({ ...opts, recordVideo: { ...opts.recordVideo, dir: `${OUT}/raw-${name}` } });
  await ctx.addInitScript(POINTER);
  await ctx.addInitScript(() => { try { localStorage.setItem("meridian-tour-v1", "done"); } catch {} });
  const p = await ctx.newPage();
  const t0 = Date.now();
  try { await fn(p, ctx); } catch (e) { console.error(name, "FAILED", e.message); }
  const dur = (Date.now() - t0) / 1000;
  const v = p.video();
  await ctx.close();
  const path = await v.path();
  fs.renameSync(path, `${OUT}/${name}.webm`);
  fs.rmSync(`${OUT}/raw-${name}`, { recursive: true, force: true });
  console.log(name, dur.toFixed(1) + "s");
}

const w = (p, ms) => p.waitForTimeout(ms);
async function tap(p, loc, pause = 500) {
  await loc.scrollIntoViewIfNeeded();
  const bx = await loc.boundingBox();
  await p.mouse.move(bx.x + bx.width / 2, bx.y + bx.height / 2, { steps: 18 });
  await w(p, 250);
  await loc.click();
  await w(p, pause);
}
async function scrollBy(p, dy, step = 60, ms = 16) {
  const n = Math.max(1, Math.round(Math.abs(dy) / step));
  for (let i = 0; i < n; i++) { await p.mouse.wheel(0, Math.sign(dy) * step); await w(p, ms); }
}
async function type(p, loc, text) { await tap(p, loc, 200); await loc.pressSequentially(text, { delay: 55 }); }

const anna = await stateFor(LOCAL, "sokolova", "Demo-2026-anna");
const staff = await stateFor(LOCAL, "belova", "Demo-2026-staff");
const timur = await stateFor(LOCAL, "galiev", "Demo-2026-timur");
let requestPath = fs.existsSync(`${OUT}/request-path.txt`) ? fs.readFileSync(`${OUT}/request-path.txt`, "utf8") : "";

// 1. Вход и «Сегодня» на компьютере
await scene("s1-login", DESK, async (p) => {
  await p.goto(LOCAL + "/login"); await w(p, 1500);
  await p.mouse.move(700, 450);
  await tap(p, p.getByRole("button", { name: /sokolova/ }), 600);
  await tap(p, p.getByRole("button", { name: "Войти" }), 0);
  await p.waitForURL((u) => !u.pathname.startsWith("/login"));
  await w(p, 2500);
  await p.mouse.move(600, 330, { steps: 25 }); await w(p, 1800);
  await p.mouse.move(1220, 330, { steps: 25 }); await w(p, 1800);
  await scrollBy(p, 520); await w(p, 2200);
  await scrollBy(p, 400); await w(p, 2000);
  await scrollBy(p, -920, 80); await w(p, 800);
});

// 2. Телефон: «Сегодня»
await scene("s2-today", { ...PHONE, storageState: anna }, async (p) => {
  await p.goto(LOCAL + "/"); await w(p, 2200);
  await scrollBy(p, 300); await w(p, 1800);
  await scrollBy(p, 360); await w(p, 1800);
  await scrollBy(p, 420); await w(p, 1800);
  await scrollBy(p, -1080, 90); await w(p, 600);
});

// 3. Телефон: расписание, неделя, перенос
await scene("s3-schedule", { ...PHONE, storageState: anna }, async (p) => {
  await p.goto(LOCAL + "/"); await w(p, 900);
  await tap(p, p.getByRole("navigation", { name: "Основные разделы" }).getByRole("link", { name: "Расписание" }), 1400);
  await scrollBy(p, 280); await w(p, 1500);
  await scrollBy(p, -280); await w(p, 400);
  await tap(p, p.getByRole("link", { name: "Неделя", exact: true }).first(), 1600);
  await scrollBy(p, 500); await w(p, 1500);
  await scrollBy(p, 500); await w(p, 1500);
  await scrollBy(p, 500); await w(p, 1200);
});

// 4. Телефон: успеваемость и «что, если»
await scene("s4-grades", { ...PHONE, storageState: anna }, async (p) => {
  await p.goto(LOCAL + "/grades"); await w(p, 2000);
  await scrollBy(p, 320); await w(p, 1800);
  const card = p.getByRole("article", { name: "Статистика", exact: true });
  await card.scrollIntoViewIfNeeded(); await w(p, 1500);
  await tap(p, card.getByText("Все работы и калькулятор итога"), 900);
  const exam = card.getByRole("slider", { name: /на экзамене/ });
  await exam.scrollIntoViewIfNeeded(); await scrollBy(p, 120); await w(p, 600);
  const bx = await exam.boundingBox();
  await p.mouse.move(bx.x + 6, bx.y + bx.height / 2, { steps: 12 }); await w(p, 300);
  await p.mouse.down();
  for (let i = 0; i <= 30; i++) { await p.mouse.move(bx.x + 6 + (bx.width - 12) * (i / 30) * 0.75, bx.y + bx.height / 2); await w(p, 45); }
  await p.mouse.up(); await w(p, 2200);
});

// 5. Живой сайт: ИИ-помощник на GigaChat (только вопросы)
await scene("s5-assistant", { ...PHONE }, async (p, ctx) => {
  const st = await stateFor(LIVE, "sokolova", "Demo-2026-anna");
  await ctx.addCookies(st.cookies);
  await p.goto(LIVE + "/assistant"); await w(p, 1800);
  const box = p.getByRole("textbox").first();
  await type(p, box, "Что у меня с сессией?");
  await p.keyboard.press("Enter");
  await p.getByText(/аттестац|сесси/i).nth(1).waitFor({ timeout: 40_000 }).catch(() => {});
  await w(p, 1200); await scrollBy(p, 400); await w(p, 4500);
  await type(p, box, "Мне нужна справка для визы в Испанию");
  await p.keyboard.press("Enter");
  await p.getByRole("link", { name: /Заполнить/ }).last().waitFor({ timeout: 40_000 }).catch(() => {});
  await w(p, 1000); await scrollBy(p, 600); await w(p, 3500);
  await tap(p, p.getByRole("link", { name: /Заполнить/ }).last(), 1800);
  await scrollBy(p, 300); await w(p, 2500);
});

// 6. Телефон: подача заявки
await scene("s6-request", { ...PHONE, storageState: anna }, async (p) => {
  await p.goto(LOCAL + "/requests"); await w(p, 1500);
  await tap(p, p.getByRole("link", { name: /Новая заявка/ }).first(), 1300);
  await tap(p, p.getByRole("link", { name: /Справка об обучении\s+Подтверждает/ }), 1300);
  await type(p, p.locator("#purpose"), "Для банка — открытие счёта");
  await w(p, 600);
  await tap(p, p.getByRole("button", { name: "Отправить заявку" }), 0);
  await p.getByText("Заявка отправлена").waitFor();
  await w(p, 2500);
  requestPath = new URL(p.url()).pathname;
  fs.writeFileSync(`${OUT}/request-path.txt`, requestPath);
  await scrollBy(p, 300); await w(p, 1800);
});

// 7. Деканат: очередь → черновик ИИ → «Готова»
await scene("s7-staff", { ...DESK, storageState: staff }, async (p) => {
  await p.goto(LOCAL + "/staff"); await w(p, 2500);
  await p.mouse.move(700, 420, { steps: 20 }); await w(p, 1200);
  const id = requestPath.split("/").pop();
  await p.goto(LOCAL + "/staff/requests/" + id); await w(p, 2200);
  await tap(p, p.getByText("В работе", { exact: true }), 700);
  await tap(p, p.getByRole("button", { name: "Сохранить и уведомить студента" }), 0);
  await p.getByRole("status").filter({ hasText: "Статус обновлён" }).waitFor({ timeout: 15_000 }).catch(() => {});
  await w(p, 1800);
  await tap(p, p.getByText("Готова", { exact: true }), 900);
  await tap(p, p.getByRole("button", { name: "Черновик ИИ" }), 2500);
  await tap(p, p.getByRole("button", { name: "Сохранить и уведомить студента" }), 0);
  await p.getByRole("img", { name: "QR-код проверки подлинности" }).or(p.getByText("Электронный документ")).first().waitFor({ timeout: 15_000 }).catch(() => {});
  await w(p, 1500); await scrollBy(p, 400); await w(p, 2500);
});

// 8. Телефон: студент видит статус, уведомление и справку с QR
await scene("s8-result", { ...PHONE, storageState: anna }, async (p) => {
  await p.goto(LOCAL + "/"); await w(p, 1500);
  await tap(p, p.locator('header a[href="/notifications"]').first(), 2600);
  await p.goto(LOCAL + requestPath); await w(p, 1800);
  await scrollBy(p, 380); await w(p, 2000);
  await scrollBy(p, 380); await w(p, 2200);
  const code = (await p.locator("span.font-mono").first().textContent().catch(() => "")).split("/verify/")[1];
  if (code) { await p.goto(LOCAL + "/verify/" + code.trim()); await w(p, 3500); }
});

// 9. Изоляция: Тимур открывает адрес заявки Анны
await scene("s9-isolation", { ...DESK, storageState: timur }, async (p) => {
  await p.goto(LOCAL + "/"); await w(p, 1500);
  await p.goto(LOCAL + requestPath); await w(p, 4000);
});

// 10. Ещё: тёмная тема, английский, «Как пройти», курсы по выбору
await scene("s10-more", { ...PHONE, storageState: anna }, async (p) => {
  await p.goto(LOCAL + "/map"); await w(p, 1800); await scrollBy(p, 400); await w(p, 1800);
  await p.goto(LOCAL + "/grades/electives"); await w(p, 1800); await scrollBy(p, 380); await w(p, 1600);
  await p.goto(LOCAL + "/"); await w(p, 600);
  await p.evaluate(() => localStorage.setItem("theme", "dark")); await p.reload(); await w(p, 2000);
  await scrollBy(p, 400); await w(p, 1400); await scrollBy(p, -400); await w(p, 600);
  await p.evaluate(() => localStorage.setItem("theme", "light"));
  await p.context().addCookies([{ name: "lang", value: "en", url: LOCAL }]);
  await p.goto(LOCAL + "/"); await w(p, 2600);
  await p.context().addCookies([{ name: "lang", value: "ru", url: LOCAL }]);
});

await b.close();
