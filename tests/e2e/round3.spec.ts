import { expect, test } from "@playwright/test";
import { login } from "./helpers";

/** Раунд 3 улучшений: подсказки, уведомления по дням, «с чего начать», повторная подача, оценка, кто ведёт заявку. */

test.describe("Подсказки при первом входе", () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  test("показываются один раз, листаются, закрываются и открываются снова из «Ещё»", async ({ page }) => {
    await login(page, "anna");
    const dlg = page.getByRole("dialog");
    await expect(dlg).toBeVisible();
    await expect(dlg).toContainText("Подсказка 1 из 4");
    await dlg.getByRole("button", { name: "Дальше" }).click();
    await expect(dlg.getByRole("heading")).toContainText("Успеваемость");
    await dlg.getByRole("button", { name: "Дальше" }).click();
    await dlg.getByRole("button", { name: "Дальше" }).click();
    await dlg.getByRole("button", { name: "Понятно, начать" }).click();
    await expect(dlg).toBeHidden();
    await page.reload();
    await page.waitForTimeout(800);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.goto("/more");
    await page.getByRole("button", { name: "Подсказки по кабинету" }).click();
    await expect(page.getByRole("dialog")).toContainText("Подсказка 1 из 4");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
});

test("уведомления разбиты по дням: «Вчера» и даты", async ({ page }) => {
  await login(page, "anna");
  await page.goto("/notifications");
  await expect(page.getByRole("heading", { level: 2, name: /^вчера\s*12 ноября/i })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: /^11 ноября\s*среда/ })).toBeVisible();
  // время внутри группы — без повторения даты
  const first = page.getByRole("region", { name: /вчера/i }).getByRole("listitem").first();
  await expect(first).toContainText(/\d{2}:\d{2}/);
});

test("«Успеваемость»: блок «С чего начать» — риск, ближайшая работа, самый лёгкий автомат", async ({ page }) => {
  await login(page, "anna");
  await page.goto("/grades");
  const focus = page.getByRole("region", { name: "С чего начать" });
  await expect(focus.getByRole("listitem")).toHaveCount(3);
  await expect(focus.getByRole("listitem").first()).toContainText("Статистика");
  await expect(focus).toContainText("24 ноября");
  await expect(page.getByRole("link", { name: "Успеваемость" }).first()).toBeVisible();
});

test("отклонённая заявка → «Подать повторно» → поля уже заполнены и видна причина отказа", async ({ page }) => {
  await login(page, "anna");
  await page.goto("/requests?all=1");
  await page.locator('main a[href^="/requests/"]').filter({ hasText: "Перезачёт дисциплины" }).first().click();
  await page.waitForURL(/\/requests\/[0-9a-f-]{36}$/);
  await page.waitForLoadState("networkidle");
  await page.getByRole("link", { name: "Подать повторно" }).click();
  await page.waitForURL(/\/requests\/new\/CREDIT_TRANSFER\?again=/, { timeout: 30_000 });
  await expect(page.getByText(/Поля перенесены из заявки/)).toBeVisible();
  await expect(page.getByText(/Причина отказа: Объём курса/)).toBeVisible();
  await expect(page.getByLabel("Дисциплина")).toHaveValue("Экономическая история");
});

test("чужая заявка в ?again= игнорируется: поля пустые", async ({ page, browser }) => {
  await login(page, "anna");
  await page.goto("/requests?all=1");
  await page.locator('main a[href^="/requests/"]').filter({ hasText: "Перезачёт дисциплины" }).first().click();
  const annaId = new URL(page.url()).pathname.split("/").pop();
  const other = await browser.newPage();
  await login(other, "timur");
  await other.goto(`/requests/new/CREDIT_TRANSFER?again=${annaId}`);
  await expect(other.getByText(/Поля перенесены/)).toHaveCount(0);
  await expect(other.getByLabel("Дисциплина")).toHaveValue("");
  await other.close();
});

test("оценка работы деканата: студент оценивает выданную справку, деканат видит оценку", async ({ page, browser }) => {
  await login(page, "mei");
  await page.goto("/requests?all=1");
  await page.locator('main a[href^="/requests/"]').filter({ hasText: "Дубликат студенческого билета" }).first().click();
  await page.waitForURL(/\/requests\/[0-9a-f-]{36}$/);
  const reqUrl = new URL(page.url()).pathname;
  await expect(page.getByText("Как вам работа деканата по этой заявке?")).toBeVisible();
  await expect(page.getByRole("button", { name: "Оценить" })).toBeDisabled();
  await page.getByRole("radio", { name: /^5 из 5/ }).check({ force: true });
  await page.getByLabel(/Что можно улучшить/).fill("e2e: быстро и понятно");
  await page.getByRole("button", { name: "Оценить" }).click();
  await expect(page.getByText("Спасибо! Ваша оценка работы деканата:")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("img", { name: "Оценка 5 из 5" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Оценить" })).toHaveCount(0);

  const staff = await browser.newPage();
  await login(staff, "staff");
  await staff.goto(`/staff/requests/${reqUrl.split("/").pop()}`);
  await expect(staff.getByText("«e2e: быстро и понятно»")).toBeVisible();
  await staff.goto("/staff");
  await expect(staff.getByText(/оценка студентов за 30 дней/)).toBeVisible();
  await staff.close();
});

test("деканат: колонка «Ведёт», фильтр «Мои», «Взять себе»", async ({ page, browser }) => {
  await login(page, "staff");
  await page.goto("/staff");
  await expect(page.getByRole("columnheader", { name: "Ведёт" })).toBeVisible();
  await expect(page.getByRole("cell", { name: /Кравченко О\. С\./ }).first()).toBeVisible();
  const take = page.getByRole("button", { name: /^Взять себе заявку/ }).first();
  const label = (await take.getAttribute("aria-label"))!;
  const number = label.replace("Взять себе заявку ", "");
  await take.click();
  await expect(page.getByRole("row").filter({ hasText: number }).getByText("Вы")).toBeVisible();
  await page.getByRole("link", { name: /^Мои · \d+/ }).click();
  await expect(page.getByRole("row").filter({ hasText: number })).toBeVisible();
  await page.getByRole("row").filter({ hasText: number }).getByRole("link").first().click();
  await page.waitForURL(/\/staff\/requests\/[0-9a-f-]{36}$/);
  await expect(page.getByText("Ведёт:")).toBeVisible();
  await expect(page.locator("b", { hasText: "вы" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Взять себе" })).toHaveCount(0);

  // Студент видит, кто ведёт его заявку
  const st = await browser.newPage();
  await login(st, "timur");
  await st.goto("/requests?all=1");
  await st.locator('main a[href^="/requests/"]').filter({ hasText: "Индивидуальный график обучения" }).first().click();
  await expect(st.getByText(/Заявку ведёт: Белова И\. П\./)).toBeVisible();
  await st.close();
});

test("профиль: в демо-аккаунте «Выйти на других устройствах» отключено с объяснением", async ({ page, browser }) => {
  const second = await browser.newPage();
  await login(second, "mei");
  await login(page, "mei");
  await page.goto("/profile");
  await expect(page.getByText(/в демо-аккаунтах отключена/)).toBeVisible();
  await expect(page.getByText("это устройство")).toBeVisible();
  await second.close();
});

test.describe("Часть 2: календарь, сессия, уведомления на телефон", () => {
  test("подписка на календарь: ссылка работает без входа, новая ссылка отключает старую, «Отключить» — всё", async ({ page, playwright }) => {
    await login(page, "anna");
    await page.goto("/schedule");
    await page.getByRole("link", { name: "В календарь телефона" }).click();
    await page.waitForURL(/\/schedule\/calendar$/);
    await page.getByRole("button", { name: "Получить ссылку для подписки" }).click();
    const url1 = await page.getByLabel("Ссылка на календарь").inputValue();
    expect(url1).toMatch(/\/api\/calendar\/[A-Za-z0-9_-]{32}\.ics$/);
    await expect(page.getByRole("link", { name: "Google Календарь (Android)" })).toHaveAttribute("href", /calendar\.google\.com.*webcal/);

    const anon = await playwright.request.newContext(); // календарь телефона приходит без cookie
    const r1 = await anon.get(new URL(url1).pathname);
    expect(r1.status()).toBe(200);
    expect(r1.headers()["content-type"]).toContain("text/calendar");
    const ics = await r1.text();
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("Международные финансовые рынки");
    expect(ics).toContain("[ОТМЕНА] Макроэкономика");
    expect(ics).toContain("Экзамен"); // сессия тоже в календаре

    await page.reload();
    await expect(page.getByText(/календарь обновлялся/)).toBeVisible();
    await page.getByRole("button", { name: "Получить новую ссылку" }).click();
    const url2 = await page.getByLabel("Ссылка на календарь").inputValue();
    expect(url2).not.toBe(url1);
    expect((await anon.get(new URL(url1).pathname)).status()).toBe(404);
    expect((await anon.get(new URL(url2).pathname)).status()).toBe(200);
    expect((await anon.get("/api/calendar/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA.ics")).status()).toBe(404);

    await page.reload();
    await page.getByRole("button", { name: "Отключить подписку" }).click();
    await page.getByRole("button", { name: "Да, отключить" }).click();
    await expect(page.getByRole("button", { name: "Получить ссылку для подписки" })).toBeVisible();
    expect((await anon.get(new URL(url2).pathname)).status()).toBe(404);
    await anon.dispose();
  });

  test("вкладка «Сессия»: зачёты и экзамены, консультации, автомат", async ({ page }) => {
    await login(page, "anna");
    await page.goto("/schedule");
    await page.getByRole("link", { name: "Сессия" }).click();
    await expect(page.getByRole("heading", { name: "Зачётная неделя" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Экзамены" })).toBeVisible();
    const hist = page.getByRole("listitem").filter({ hasText: "История международных отношений" });
    await expect(hist).toContainText("автомат — можно не сдавать");
    const stat = page.getByRole("listitem").filter({ hasText: "Статистика" });
    await expect(stat).toContainText("Консультация: 29 декабря (вт)");
    await expect(stat.getByRole("link", { name: /Нужно подтянуть баллы/ })).toHaveAttribute("href", /\/grades#/);
  });

  test("уведомления на телефон: API принимает только свои подписки на известные push-сервисы; настройки сохраняются", async ({ page, playwright }) => {
    await login(page, "anna");
    await page.goto("/profile");
    await expect(page.getByRole("heading", { name: "Уведомления на телефон" })).toBeVisible();
    const key = await (await page.request.get("/api/push/subscribe")).json();
    expect(key.publicKey).toMatch(/^[A-Za-z0-9_-]{87}$/);
    const p256dh = "B" + "A".repeat(86), auth = "A".repeat(22);
    const ok = await page.request.post("/api/push/subscribe", { headers: { Origin: "http://localhost:3000" }, data: { endpoint: "https://fcm.googleapis.com/fcm/send/e2e-test", keys: { p256dh, auth } } });
    expect(ok.status()).toBe(200);
    const evil = await page.request.post("/api/push/subscribe", { headers: { Origin: "http://localhost:3000" }, data: { endpoint: "https://169.254.169.254/x", keys: { p256dh, auth } } });
    expect(evil.status()).toBe(400);
    const foreign = await page.request.post("/api/push/subscribe", { headers: { Origin: "https://evil.example" }, data: { endpoint: "https://fcm.googleapis.com/fcm/send/x", keys: { p256dh, auth } } });
    expect(foreign.status()).toBe(403);
    const anon = await playwright.request.newContext({ baseURL: "http://localhost:3000" });
    expect((await anon.post("/api/push/subscribe", { headers: { Origin: "http://localhost:3000" }, data: {} })).status()).toBe(401);
    await anon.dispose();

    const morning = page.getByLabel(/Утренняя сводка/);
    await expect(morning).not.toBeChecked();
    await morning.check();
    await page.getByRole("button", { name: "Сохранить" }).click();
    await expect(page.getByText("Сохранено")).toBeVisible();
    await page.reload();
    await expect(page.getByLabel(/Утренняя сводка/)).toBeChecked();
  });
});

test.describe("Часть 3: языки интерфейса", () => {
  test("переключение языка на входе и в кабинете: английский → китайский → русский; данные из БД переводятся", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Язык").selectOption("en");
    await expect(page.getByRole("heading", { name: "Sign in to your account" })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByRole("note")).toContainText("Concept for the MGIMO AI contest.");
    await page.fill("#login", "sokolova");
    await page.fill("#password", "Demo-2026-anna");
    await page.click("button[type=submit]");
    await page.waitForURL((u) => !u.pathname.startsWith("/login"));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Good morning, Anna");
    await expect(page.getByRole("heading", { name: "International Financial Markets" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Sections" }).getByRole("link", { name: "Timetable" })).toBeVisible();

    await page.getByLabel("Language").selectOption("zh");
    await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
    await expect(page.getByRole("heading", { name: "国际金融市场" })).toBeVisible();
    await page.goto("/grades");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("成绩");

    await page.getByLabel("语言").selectOption("ru");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Успеваемость");
    await expect(page.locator("html")).toHaveAttribute("lang", "ru");
  });
});

test("Часть 4: бот MAX «спит» без ключа — честный статус в профиле, вебхук отвечает 404", async ({ page, playwright }) => {
  await login(page, "anna");
  await page.goto("/profile");
  await expect(page.getByRole("heading", { name: "Чат-бот в MAX" })).toBeVisible();
  await expect(page.getByText(/Бот готов к подключению/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Получить код привязки" })).toHaveCount(0);
  const anon = await playwright.request.newContext({ baseURL: "http://localhost:3000" });
  expect((await anon.post("/api/bot/max", { data: { update_type: "message_created" } })).status()).toBe(404);
  await anon.dispose();
});

test.describe("Раунд 4: правки капитана", () => {
  test("карточка пары: плашка с должностью и ФИО преподавателя", async ({ page }) => {
    await login(page, "anna");
    const next = page.getByRole("region", { name: /^Следующая пара/ });
    // Раунд 7: плашка вынесена из <dl> (axe: definition-list) — проверяем по тексту
    await expect(next.getByText("Ковалёва Марина Романовна", { exact: true })).toBeVisible();
    await expect(next.getByText("Доцент", { exact: true })).toBeVisible();
  });

  test("экран входа на компьютере помещается без прокрутки (1440×760 и 1366×680)", async ({ browser }) => {
    for (const [width, height] of [[1440, 760], [1366, 680]]) {
      const ctx = await browser.newContext({ viewport: { width, height }, storageState: { cookies: [], origins: [] } });
      const p = await ctx.newPage();
      await p.goto("/login");
      const { sh, ih } = await p.evaluate(() => ({ sh: document.documentElement.scrollHeight, ih: innerHeight }));
      expect(sh, `${width}×${height}`).toBeLessThanOrEqual(ih);
      await expect(p.getByRole("note")).toContainText("Концепт для конкурса МГИМО по ИИ.");
      await ctx.close();
    }
  });

  test("тёмная тема: пункты выпадающего списка читаемы (тёмный фон, светлый текст)", async ({ browser }) => {
    const ctx = await browser.newContext({ colorScheme: "dark" });
    const p = await ctx.newPage();
    await login(p, "anna");
    await p.goto("/appointments");
    const colors = await p.locator("select option").first().evaluate((o) => { const s = getComputedStyle(o); return { bg: s.backgroundColor, fg: s.color }; });
    expect(colors.bg).toBe("rgb(18, 26, 46)");
    expect(colors.fg).toBe("rgb(238, 233, 221)");
    await ctx.close();
  });

  test("заявление об оплате обучения: есть в каталоге, подаётся, попадает в очередь деканата", async ({ page, browser }) => {
    await login(page, "timur");
    await page.goto("/requests/new");
    await page.getByRole("link", { name: /Заявление об оплате обучения/ }).click();
    await page.waitForURL(/\/requests\/new\/TUITION_PAYMENT$/);
    await page.getByLabel("Что нужно").selectOption("Отсрочка платежа");
    await page.getByLabel("За какой период").selectOption("Весенний семестр 2026/27");
    await page.getByLabel("Обоснование").fill("e2e: прошу отсрочку платежа до 15 февраля");
    await page.getByRole("button", { name: /Отправить/ }).click();
    await page.waitForURL(/\/requests\/[0-9a-f-]{36}\?created=1$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Заявление об оплате обучения");
    const staff = await browser.newPage();
    await login(staff, "staff");
    await staff.goto("/staff?q=Галиев");
    await expect(staff.getByRole("row").filter({ hasText: "Заявление об оплате обучения" }).first()).toBeVisible();
    await staff.close();
  });

  test("английский: системные уведомления и объявления переведены", async ({ page }) => {
    await page.context().addCookies([{ name: "lang", value: "en", url: "http://localhost:3000" }]);
    await login(page, "anna");
    await page.goto("/notifications");
    await expect(page.getByText("Rescheduled: Spanish (second foreign language)")).toBeVisible();
    await expect(page.getByText("Was: 18 November (Wed), 14:30, room 506. Now: 19 November (Thu), 17:40, room 1018.")).toBeVisible();
    await expect(page.getByText("Model UN: delegate registration is open").first()).toBeVisible();
    await page.goto("/");
    await expect(page.getByText("Electives sign-up (spring)")).toBeVisible();
  });
});

test("Раунд 5: в тёмной теме у ВСЕХ выпадающих списков свой непрозрачный фон (иначе Windows рисует список белым)", async ({ browser }) => {
  const ctx = await browser.newContext({ colorScheme: "dark" });
  const p = await ctx.newPage();
  const check = async (path: string) => {
    await p.goto(path);
    await p.waitForLoadState("networkidle");
    const bad = await p.evaluate(() => [...document.querySelectorAll("select")].filter((s) => {
      const bg = getComputedStyle(s).backgroundColor, ob = s.options[0] ? getComputedStyle(s.options[0]).backgroundColor : bg;
      return bg === "rgba(0, 0, 0, 0)" || bg === "transparent" || ob === "rgba(0, 0, 0, 0)";
    }).map((s) => s.name || s.id || "select"));
    expect(bad, `${path}: прозрачный фон у ${bad.join(", ")}`).toEqual([]);
  };
  await check("/login");
  await login(p, "anna");
  for (const path of ["/requests/new/TUITION_PAYMENT", "/appointments", "/profile"]) await check(path);
  await p.context().clearCookies();
  await login(p, "staff");
  for (const path of ["/staff", "/staff/announcements", "/staff/schedule"]) await check(path);
  await ctx.close();
});
