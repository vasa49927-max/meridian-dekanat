// Генерирует PNG-иконки PWA из SVG-логотипа: node scripts/gen-icons.mjs
import { chromium } from "playwright";
const svg = (pad) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="${pad ? 0 : 96}" fill="#14244b"/><g transform="translate(${pad ? 128 : 76} ${pad ? 128 : 76}) scale(${pad ? 6.4 : 9})" fill="none" stroke="#f8f4ea" stroke-width="2.4"><circle cx="20" cy="20" r="17"/><path d="M20 3c-6.5 4.5-9.5 10.2-9.5 17s3 12.5 9.5 17M20 3c6.5 4.5 9.5 10.2 9.5 17s-3 12.5-9.5 17M5 26h30"/><path d="M31.5 4.5l1.4 3.6 3.6 1.4-3.6 1.4-1.4 3.6-1.4-3.6-3.6-1.4 3.6-1.4z" fill="#e0b65c" stroke="none"/></g></svg>`;
const b = await chromium.launch(); const p = await b.newPage();
for (const [name, size, pad] of [["icon-192", 192, false], ["icon-512", 512, false], ["maskable-512", 512, true], ["apple-touch-icon", 180, false]]) {
  await p.setViewportSize({ width: size, height: size });
  await p.setContent(`<style>*{margin:0}</style><img src="data:image/svg+xml;base64,${Buffer.from(svg(pad)).toString("base64")}" width="${size}" height="${size}">`);
  await p.screenshot({ path: `public/icons/${name}.png`, omitBackground: true });
}
await b.close();
import fs from "node:fs"; fs.writeFileSync("src/app/icon.svg", svg(false));
