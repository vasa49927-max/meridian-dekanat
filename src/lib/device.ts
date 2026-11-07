/** «Chrome · Windows» из строки User-Agent — для списка активных сессий в профиле (вместо сырой строки браузера). */
export function deviceLabel(ua: string | null | undefined): string {
  if (!ua) return "Неизвестное устройство";
  const browser =
    /YaBrowser\//.test(ua) ? "Яндекс Браузер" : /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : /Firefox\//.test(ua) ? "Firefox"
    : /HeadlessChrome/.test(ua) ? "Автотест (Chrome)" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "Браузер";
  const os =
    /iPhone|iPad/.test(ua) ? "iPhone/iPad" : /Android/.test(ua) ? "Android" : /Windows/.test(ua) ? "Windows"
    : /Mac OS X|Macintosh/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : null;
  return os ? `${browser} · ${os}` : browser;
}
