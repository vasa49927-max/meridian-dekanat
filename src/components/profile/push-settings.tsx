"use client";
import { useActionState, useEffect, useState } from "react";
import { BellRing, BellOff, Send } from "lucide-react";
import { savePushPrefsAction } from "@/app/(student)/profile/actions";
import { Button } from "@/components/ui/button";

type Prefs = { schedule: boolean; requests: boolean; announcements: boolean; morning: boolean };
type Status = "loading" | "unsupported" | "ios-browser" | "denied" | "off" | "on";

const b64ToBytes = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4)), (c) => c.charCodeAt(0));

/**
 * Уведомления на телефон (Web Push, раунд 3). Работает в Chrome/Яндекс/Edge/Firefox на Android и компьютере,
 * на iPhone — только если сайт добавлен на экран «Домой» (ограничение iOS 16.4+).
 */
export function PushSettings({ prefs }: { prefs: Prefs }) {
  const [status, setStatus] = useState<Status>("loading");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, save, saving] = useActionState(savePushPrefsAction, {});

  useEffect(() => {
    (async () => {
      const ios = /iPhone|iPad/.test(navigator.userAgent);
      const standalone = window.matchMedia("(display-mode: standalone)").matches;
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) { setStatus(ios && !standalone ? "ios-browser" : "unsupported"); return; }
      if (Notification.permission === "denied") { setStatus("denied"); return; }
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      setStatus(sub ? "on" : "off");
    })().catch(() => setStatus("unsupported"));
  }, []);

  async function enable() {
    setBusy(true); setMsg(null);
    try {
      if ((await Notification.requestPermission()) !== "granted") { setStatus("denied"); return; }
      const reg = (await navigator.serviceWorker.getRegistration()) ?? (await navigator.serviceWorker.register("/sw.js", { scope: "/" }));
      await navigator.serviceWorker.ready;
      const { publicKey } = await (await fetch("/api/push/subscribe")).json();
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(publicKey) });
      const res = await fetch("/api/push/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(sub.toJSON()) });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Не удалось сохранить подписку");
      setStatus("on"); setMsg("Готово! Уведомления включены на этом устройстве.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Не удалось включить уведомления");
    } finally { setBusy(false); }
  }

  async function disable() {
    setBusy(true); setMsg(null);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint }) });
        await sub.unsubscribe();
      }
      setStatus("off"); setMsg("Уведомления на этом устройстве выключены.");
    } finally { setBusy(false); }
  }

  async function test() {
    setBusy(true);
    const res = await fetch("/api/push/test", { method: "POST" });
    setMsg(res.ok ? "Отправили тестовое уведомление — оно придёт через несколько секунд." : (await res.json().catch(() => ({}))).error ?? "Не получилось");
    setBusy(false);
  }

  return (
    <div className="space-y-3 text-sm">
      {status === "loading" && <p className="text-muted">Проверяем, поддерживает ли браузер уведомления…</p>}
      {status === "unsupported" && <p className="text-muted">Этот браузер не умеет получать уведомления от сайтов. Подойдут Chrome, Яндекс Браузер, Edge или Firefox.</p>}
      {status === "ios-browser" && <p className="rounded-xl bg-info-bg px-3 py-2 text-info">На iPhone уведомления работают, только если добавить «Меридиан» на экран «Домой»: кнопка «Поделиться» → «На экран „Домой“», затем откройте его оттуда и вернитесь сюда.</p>}
      {status === "denied" && <p className="rounded-xl bg-warn-bg px-3 py-2 text-warn">Уведомления запрещены в настройках браузера. Разрешите их для этого сайта (значок замка в адресной строке) и обновите страницу.</p>}
      {status === "off" && <Button onClick={enable} disabled={busy}><BellRing className="h-4 w-4" aria-hidden />{busy ? "Включаем…" : "Включить на этом устройстве"}</Button>}
      {status === "on" && (
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-ok-bg px-3 font-medium text-ok"><BellRing className="h-4 w-4" aria-hidden />Включены на этом устройстве</span>
          <Button variant="secondary" size="sm" onClick={test} disabled={busy}><Send className="h-4 w-4" aria-hidden />Проверить</Button>
          <Button variant="ghost" size="sm" onClick={disable} disabled={busy}><BellOff className="h-4 w-4" aria-hidden />Выключить</Button>
        </div>
      )}
      {msg && <p role="status" className="text-muted">{msg}</p>}

      <form action={save} className="space-y-1.5 border-t border-line pt-3">
        <p className="font-semibold">Что присылать</p>
        {([["schedule", "Переносы и отмены пар", prefs.schedule], ["requests", "Статусы заявок и справок", prefs.requests], ["announcements", "Объявления деканата", prefs.announcements], ["morning", "Утренняя сводка в 7:30: сколько пар и где первая", prefs.morning]] as const).map(([name, label, on]) => (
          <label key={name} className="flex cursor-pointer items-center gap-2.5 py-0.5"><input type="checkbox" name={name} defaultChecked={on} className="h-4 w-4 accent-[var(--primary)]" />{label}</label>
        ))}
        <div className="flex items-center gap-3 pt-1">
          <Button type="submit" variant="secondary" size="sm" disabled={saving}>{saving ? "Сохраняем…" : "Сохранить"}</Button>
          {saved.ok && <span role="status" className="text-ok">Сохранено</span>}
        </div>
      </form>
    </div>
  );
}
