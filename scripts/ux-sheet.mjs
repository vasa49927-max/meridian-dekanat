// Контактный лист всех страниц в одном разрешении (раунд 7б): node scripts/ux-sheet.mjs <light|dark> <W> <H> <папка>
// Контактный лист: все страницы в одном разрешении, чтобы сравнить стиль
import { chromium } from "playwright";
const [,, theme = "dark", W = "1536", H = "800", outDir] = process.argv;
const b = await chromium.launch();
async function shoot(user, pass, pages, tag) {
  const ctx = await b.newContext({ viewport: { width: +W, height: +H }, colorScheme: theme });
  await ctx.addInitScript(() => localStorage.setItem("meridian-tour-v1", "done"));
  const p = await ctx.newPage();
  if (user) { await p.goto("http://localhost:3000/login"); await p.fill("#login", user); await p.fill("#password", pass); await p.click("button[type=submit]"); await p.waitForURL(u => !String(u).includes("/login")); }
  const files = [];
  for (const [i, path] of pages.entries()) {
    let url = path;
    if (path === "REQ") { await p.goto("http://localhost:3000/requests?all=1"); url = await p.locator("main a[href^='/requests/']:not([href='/requests/new'])").first().getAttribute("href"); }
    if (path === "SREQ") { await p.goto("http://localhost:3000/staff"); url = await p.locator("main a[href^='/staff/requests/']").first().getAttribute("href"); }
    await p.goto("http://localhost:3000" + url); await p.waitForLoadState("networkidle"); await p.waitForTimeout(650);
    const f = `${outDir}/${tag}-${String(i).padStart(2, "0")}.png`; await p.screenshot({ path: f }); files.push(f);
  }
  await ctx.close(); return files;
}
const S = await shoot("sokolova", "Demo-2026-anna", ["/", "/schedule", "/schedule?view=week", "/schedule?view=session", "/grades", "/grades?tab=record", "/requests", "/requests/new", "/requests/new/STUDY_CERT", "REQ", "/notifications", "/assistant", "/appointments", "/profile", "/portfolio", "/survey", "/map?room=412&b=%D0%91", "/schedule/calendar"], "s");
const T = await shoot("belova", "Demo-2026-staff", ["/staff", "SREQ", "/staff/analytics", "/staff/risks", "/staff/surveys", "/staff/announcements", "/staff/schedule", "/staff/appointments", "/staff/demo"], "t");
const L = await shoot(null, null, ["/login"], "l");
await b.close();
console.log(JSON.stringify({ S, T, L }));
