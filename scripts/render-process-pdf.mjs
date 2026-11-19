// Сборка PDF «Описание процесса создания» из docs/process/process-source.html (Playwright, печать Chromium).
// Картинки — сжатые копии docs/screenshots и свежие скриншоты (папка jpg/ рядом с HTML на время сборки).
// Запуск: node scripts/render-process-pdf.mjs <абсолютный путь к html> <куда положить pdf>
import { chromium } from "playwright";
const [,, html, out] = process.argv;
const b = await chromium.launch();
const p = await b.newPage();
await p.goto("file://" + html, { waitUntil: "load" });
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(500);
await p.pdf({
  path: out, format: "A4", printBackground: true, preferCSSPageSize: true,
  displayHeaderFooter: true,
  headerTemplate: "<div></div>",
  footerTemplate: `<div style="width:100%;font-size:7px;color:#565c6b;padding:0 15mm;display:flex;justify-content:space-between;font-family:sans-serif"><span>«Меридиан» — описание процесса создания · концепт для конкурса МГИМО по ИИ, не официальный сервис</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`,
});
await b.close();
