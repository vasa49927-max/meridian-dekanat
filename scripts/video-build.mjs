// Сборка демо-видео из записанных сцен (см. docs/video/VOICEOVER.md). Пути к шрифтам — node_modules проекта.
// Сборка демо-видео: фоны и карточки — HTML → PNG (Playwright), сцены — ffmpeg, склейка — concat без перекодирования.
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import fs from "node:fs";

const DIR = process.argv[2];
const only = process.argv[3] ? process.argv[3].split(",") : null;
const F = new URL("../node_modules", import.meta.url).href;
const FONTS = `
@font-face{font-family:G;font-weight:400 900;src:url(${F}/@fontsource-variable/golos-text/files/golos-text-cyrillic-wght-normal.woff2);unicode-range:U+0400-045F,U+2116}
@font-face{font-family:G;font-weight:400 900;src:url(${F}/@fontsource-variable/golos-text/files/golos-text-latin-wght-normal.woff2);unicode-range:U+0000-00FF,U+2000-206F,U+2190-2193}
@font-face{font-family:S;font-weight:700;src:url(${F}/@fontsource/pt-serif/files/pt-serif-cyrillic-700-normal.woff2);unicode-range:U+0400-045F}
@font-face{font-family:S;font-weight:700;src:url(${F}/@fontsource/pt-serif/files/pt-serif-latin-700-normal.woff2);unicode-range:U+0000-00FF,U+2000-206F}`;
const BG = "radial-gradient(110% 90% at 100% 0%,#2c4485 0%,rgba(44,68,133,0) 55%),radial-gradient(80% 80% at 0% 100%,rgba(184,137,47,.16) 0%,rgba(184,137,47,0) 50%),linear-gradient(135deg,#172a57 0%,#0f1c3f 100%)";
const LOGO = `<svg viewBox="0 0 40 40" width="46" height="46"><circle cx="20" cy="20" r="17" fill="none" stroke="#f8f4ea" stroke-width="2.4"/><path d="M20 3c-6.5 4.5-9.5 10.2-9.5 17s3 12.5 9.5 17M20 3c6.5 4.5 9.5 10.2 9.5 17s-3 12.5-9.5 17" fill="none" stroke="#f8f4ea" stroke-width="2.4"/><path d="M5 26h30" fill="none" stroke="#f8f4ea" stroke-width="2.4"/><path d="M31.5 4.5l1.4 3.6 3.6 1.4-3.6 1.4-1.4 3.6-1.4-3.6-3.6-1.4 3.6-1.4z" fill="#e0b65c"/></svg>`;
const DISC = "Концепт для конкурса МГИМО по ИИ. Не является официальным сервисом МГИМО. Все данные вымышлены.";
const page = (body) => `<!doctype html><meta charset=utf-8><style>${FONTS}
*{box-sizing:border-box}body{margin:0;width:1920px;height:1080px;overflow:hidden;background:${BG};color:#f8f4ea;font-family:G,sans-serif;position:relative}
.brand{position:absolute;left:80px;top:56px;display:flex;align-items:center;gap:14px;font-family:S;font-size:30px}
.k{font-size:20px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#e0b65c}
h1{font-family:S;font-weight:700;margin:0;line-height:1.08}
.disc{position:absolute;left:80px;right:80px;bottom:34px;font-size:17px;color:#c9c3b4}
ul{margin:0;padding:0;list-style:none}li{position:relative;padding-left:30px;margin:0 0 18px;font-size:30px;line-height:1.3;color:#e9e4d8}
li:before{content:"";position:absolute;left:0;top:14px;width:12px;height:12px;border-radius:50%;background:#e0b65c}
.rule{width:90px;height:7px;border-radius:4px;background:#b8892f;margin:26px 0 30px}
</style><body>${body}</body>`;

// Сцены: kind desk|phone|card; dur — итоговая длительность (под озвучку), speed — ускорение записи
const SCENES = [
  { id: "c0-intro", kind: "card", dur: 14, html: `<div class="brand">${LOGO}Меридиан</div>
     <div style="position:absolute;left:80px;top:300px;width:1100px"><p class="k">Конкурс МГИМО по ИИ · «Цифровой деканат будущего»</p>
     <h1 style="font-size:96px;margin-top:20px">Меридиан</h1><p style="font-size:40px;color:#c9c3b4;margin:18px 0 0">личный кабинет студента и деканата — демонстрация за 4 минуты</p></div>
     <div class="disc">${DISC}</div>` },
  { id: "s1-login", kind: "desk", dur: 27, title: "Вход и главный экран «Сегодня»", sub: "следующая пара, аудитория и преподаватель · быстрые действия · изменения недели" },
  { id: "s2-today", kind: "phone", dur: 16, title: "Сначала — телефон", bullets: ["73 % однокурсников заходят с телефона", "экран 360 px и нижнее меню", "сроки, заявки, объявления — одной лентой"] },
  { id: "s3-schedule", kind: "phone", dur: 17, title: "Расписание", bullets: ["день · неделя · сессия", "отмены и переносы подсвечены", "и сразу приходят уведомлением", "подписка в календарь телефона"] },
  { id: "s4-grades", kind: "phone", dur: 19, title: "Успеваемость: что мне сделать", bullets: ["сколько баллов до автомата", "какой нужен темп", "калькулятор «что, если»", "прогноз стипендии"] },
  { id: "s5-assistant", kind: "phone", dur: 29, speed: 1.5, title: "ИИ-помощник на GigaChat", bullets: ["видит только данные этого студента", "ссылается на пункты Положения", "заполняет заявку — отправляет студент"], note: "живой сайт · запись ускорена в 1,5 раза" },
  { id: "s6-request", kind: "phone", dur: 15, title: "Заявка за один экран", bullets: ["данные — из профиля", "номер, срок и кто ведёт", "статус виден сразу"] },
  { id: "s7-staff", kind: "desk", dur: 22, title: "Деканат: очередь → статус → справка", sub: "ИИ-черновик комментария (без ФИО студента) · электронная справка с QR-кодом" },
  { id: "s8-result", kind: "phone", dur: 17, title: "Студент видит результат", bullets: ["уведомление в кабинете и на телефон", "статус «Готова»", "справка с QR-проверкой подлинности"] },
  { id: "s9-isolation", kind: "desk", dur: 13, title: "Безопасность: чужая заявка не откроется", sub: "Тимур вставляет адрес заявки Анны → «Страница не найдена» · владелец данных — только из сессии" },
  { id: "s10-more", kind: "phone", dur: 17, title: "И ещё", bullets: ["«Как пройти» до аудитории", "курсы по выбору с листом ожидания", "тёмная тема", "4 языка: ru · en · zh · fr"] },
  { id: "c11-process", kind: "card", dur: 21, html: `<div class="brand">${LOGO}Меридиан</div>
     <div style="position:absolute;left:80px;top:200px;width:1760px"><p class="k">Как это сделано</p><h1 style="font-size:66px;margin-top:14px">Код, тесты и документы написал ИИ.<br>Задачи, решения и проверку — человек.</h1>
     <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:28px;margin-top:70px">
     ${[["27", "этапов в журнале процесса"], ["15+", "запусков субагентов: безопасность, UX, QA, «жюри»"], ["50", "ошибок ИИ записаны и превращены в правила"], ["143", "автотеста, включая телефон 360 px"]].map(([n, t]) => `<div style="background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);border-radius:22px;padding:28px 30px"><div style="font-family:S;font-size:76px;color:#fff">${n}</div><div style="font-size:26px;color:#c9c3b4;margin-top:8px;line-height:1.3">${t}</div></div>`).join("")}</div>
     <p style="font-size:26px;color:#c9c3b4;margin-top:50px">Claude (Anthropic) с субагентами · GigaChat внутри продукта · подробно — в PDF «Описание процесса создания»</p></div>
     <div class="disc">${DISC}</div>` },
  { id: "c12-end", kind: "card", dur: 9, html: `<div class="brand">${LOGO}Меридиан</div>
     <div style="position:absolute;left:80px;top:290px;width:1760px"><h1 style="font-size:72px">Попробуйте сами</h1><div class="rule"></div>
     <p style="font-size:38px;margin:0 0 18px">meridian-iwkag.msk1.amvera.tech</p>
     <p style="font-size:30px;color:#c9c3b4;margin:0 0 12px">студенты: sokolova / Demo-2026-anna · galiev / Demo-2026-timur · lin / Demo-2026-mei</p>
     <p style="font-size:30px;color:#c9c3b4;margin:0 0 40px">деканат: belova / Demo-2026-staff</p>
     <p style="font-size:26px;color:#c9c3b4">код: github.com/vasa49927-max/meridian-dekanat</p></div>
     <div class="disc">${DISC}</div>` },
];

const PHONE = { x: 1250, y: 40, h: 1000 }; PHONE.w = Math.round((PHONE.h * 360) / 780 / 2) * 2;
const DESK = { x: 192, y: 22, w: 1536, h: 960 };
function bgHtml(s) {
  if (s.kind === "card") return page(s.html);
  if (s.kind === "phone") return page(`<div class="brand">${LOGO}Меридиан</div>
    <div style="position:absolute;left:80px;top:250px;width:1060px"><h1 style="font-size:64px">${s.title}</h1><div class="rule"></div><ul>${s.bullets.map((b) => `<li>${b}</li>`).join("")}</ul>
    ${s.note ? `<p style="font-size:20px;color:#c9c3b4;margin-top:30px">${s.note}</p>` : ""}</div>
    <div style="position:absolute;left:${PHONE.x - 14}px;top:${PHONE.y - 14}px;width:${PHONE.w + 28}px;height:${PHONE.h + 28}px;border-radius:44px;background:#0a1124;box-shadow:0 40px 80px -30px rgba(0,0,0,.7),0 0 0 2px rgba(255,255,255,.12)"></div>
    <div class="disc">${DISC}</div>`);
  return page(`<div style="position:absolute;left:${DESK.x - 8}px;top:${DESK.y - 8}px;width:${DESK.w + 16}px;height:${DESK.h + 16}px;border-radius:18px;background:#0a1124;box-shadow:0 40px 80px -30px rgba(0,0,0,.7),0 0 0 2px rgba(255,255,255,.12)"></div>
    <div style="position:absolute;left:${DESK.x}px;right:${1920 - DESK.x - DESK.w}px;top:${DESK.y + DESK.h + 18}px;display:flex;align-items:baseline;gap:22px;white-space:nowrap;overflow:hidden">
    <span style="font-family:S;font-weight:700;font-size:34px">${s.title}</span><span style="font-size:22px;color:#c9c3b4;overflow:hidden;text-overflow:ellipsis">${s.sub}</span></div>`);
}

const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: 1920, height: 1080 } });
const run = (args) => execFileSync("ffmpeg", ["-v", "error", "-y", ...args], { stdio: "inherit" });
const ENC = ["-c:v", "libx264", "-crf", "20", "-preset", "veryfast", "-pix_fmt", "yuv420p", "-r", "30"];
const list = [];
let t = 0;
for (const s of SCENES) {
  list.push(s);
  if (only && !only.includes(s.id)) { t += s.dur; continue; }
  fs.writeFileSync(`${DIR}/bg-${s.id}.html`, bgHtml(s));
  await pg.goto(`file://${DIR}/bg-${s.id}.html`); await pg.evaluate(() => document.fonts.ready);
  await pg.screenshot({ path: `${DIR}/bg-${s.id}.png` });
  const out = `${DIR}/part-${s.id}.tmp.mp4`;
  const fade = `fade=t=in:st=0:d=0.35,fade=t=out:st=${s.dur - 0.35}:d=0.35`;
  if (s.kind === "card") {
    run(["-framerate", "30", "-i", `${DIR}/bg-${s.id}.png`, "-vf", `format=yuv420p,loop=-1:1,trim=duration=${s.dur},${fade}`, ...ENC, out]);
  } else {
    const box = s.kind === "phone" ? PHONE : DESK;
    const sp = s.speed ?? 1;
    const fc = `[1:v]trim=start=0.5,setpts=(PTS-STARTPTS)/${sp},fps=30,scale=${box.w}:${box.h}:flags=lanczos,tpad=stop_mode=clone:stop_duration=${s.dur}[v];[0:v][v]overlay=${box.x}:${box.y},trim=duration=${s.dur},format=yuv420p,${fade}[o]`;
    run(["-framerate", "30", "-loop", "1", "-t", String(s.dur + 1), "-i", `${DIR}/bg-${s.id}.png`, "-i", `${DIR}/${s.id}.webm`, "-filter_complex", fc, "-map", "[o]", "-an", ...ENC, out]);
  }
  fs.renameSync(out, `${DIR}/part-${s.id}.mp4`);
  const real = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", `${DIR}/part-${s.id}.mp4`]).toString());
  console.log(`${s.id.padEnd(14)} ${fmt(t)}–${fmt(t + s.dur)}  (${real.toFixed(2)} с)`);
  t += s.dur;
}
await b.close();
function fmt(x) { const m = Math.floor(x / 60), sec = Math.round(x % 60); return `${m}:${String(sec).padStart(2, "0")}`; }
if (!only) {
fs.writeFileSync(`${DIR}/concat.txt`, list.map((s) => `file 'part-${s.id}.mp4'`).join("\n"));
run(["-f", "concat", "-safe", "0", "-i", `${DIR}/concat.txt`, "-c", "copy", "-movflags", "+faststart", `${DIR}/Meridian-demo.tmp.mp4`]);
fs.renameSync(`${DIR}/Meridian-demo.tmp.mp4`, `${DIR}/Meridian-demo.mp4`);
console.log("итого", fmt(t));
}
