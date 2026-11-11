// Service worker «Меридиана»: офлайн-кэш статики и последних открытых страниц.
// Персональные страницы НЕ кэшируются (на общем компьютере после выхода никто не увидит чужие данные офлайн):
// без сети показываем экран /offline.
const VERSION = "meridian-v2";
const SHELL = ["/offline", "/manifest.webmanifest", "/icons/icon-192.png"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin || url.pathname.startsWith("/api/")) return;
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); return res; })));
    return;
  }
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).catch(() => caches.match("/offline")));
  }
});

// Web Push (раунд 3): сервер присылает зашифрованное сообщение {title, body, url, tag}. Показываем системное уведомление.
self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { title: "Меридиан", body: e.data ? e.data.text() : "" }; }
  e.waitUntil(self.registration.showNotification(d.title || "Меридиан", {
    body: d.body || "", tag: d.tag || undefined, renotify: !!d.tag, icon: "/icons/icon-192.png", badge: "/icons/icon-192.png",
    data: { url: typeof d.url === "string" && d.url.startsWith("/") ? d.url : "/" }, lang: "ru",
  }));
});
// Нажатие на уведомление: открываем нужный раздел (только адреса своего сайта) или переключаемся на открытую вкладку.
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = new URL(e.notification.data?.url || "/", location.origin).href;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
    const same = list.find((c) => c.url.startsWith(location.origin));
    if (same) return same.navigate(url).then((c) => (c || same).focus());
    return self.clients.openWindow(url);
  }));
});
