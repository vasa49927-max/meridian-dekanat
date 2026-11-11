"use client";
import { useActionState, useEffect, useState } from "react";
import { BellRing, BellOff, Send } from "lucide-react";
import { savePushPrefsAction } from "@/app/(student)/profile/actions";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";

type Prefs = { schedule: boolean; requests: boolean; announcements: boolean; morning: boolean };
type Status = "loading" | "unsupported" | "ios-browser" | "denied" | "off" | "on";

const b64ToBytes = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4)), (c) => c.charCodeAt(0));

/**
 * Уведомления на телефон (Web Push, раунд 3). Работает в Chrome/Яндекс/Edge/Firefox на Android и компьютере,
 * на iPhone — только если сайт добавлен на экран «Домой» (ограничение iOS 16.4+).
 */
export function PushSettings({ prefs }: { prefs: Prefs }) {
  const { t } = useI18n();
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
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? t("profile.pushSettings.saveFailed"));
      setStatus("on"); setMsg(t("profile.pushSettings.enabledMsg"));
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t("profile.pushSettings.enableFailed"));
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
      setStatus("off"); setMsg(t("profile.pushSettings.disabledMsg"));
    } finally { setBusy(false); }
  }

  async function test() {
    setBusy(true);
    const res = await fetch("/api/push/test", { method: "POST" });
    setMsg(res.ok ? t("profile.pushSettings.testSent") : (await res.json().catch(() => ({}))).error ?? t("profile.pushSettings.testFailed"));
    setBusy(false);
  }

  return (
    <div className="space-y-3 text-sm">
      {status === "loading" && <p className="text-muted">{t("profile.pushSettings.checking")}</p>}
      {status === "unsupported" && <p className="text-muted">{t("profile.pushSettings.unsupported")}</p>}
      {status === "ios-browser" && <p className="rounded-xl bg-info-bg px-3 py-2 text-info">{t("profile.pushSettings.ios")}</p>}
      {status === "denied" && <p className="rounded-xl bg-warn-bg px-3 py-2 text-warn">{t("profile.pushSettings.denied")}</p>}
      {status === "off" && <Button onClick={enable} disabled={busy}><BellRing className="h-4 w-4" aria-hidden />{busy ? t("profile.pushSettings.enabling") : t("profile.pushSettings.enable")}</Button>}
      {status === "on" && (
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-ok-bg px-3 font-medium text-ok"><BellRing className="h-4 w-4" aria-hidden />{t("profile.pushSettings.on")}</span>
          <Button variant="secondary" size="sm" onClick={test} disabled={busy}><Send className="h-4 w-4" aria-hidden />{t("profile.pushSettings.test")}</Button>
          <Button variant="ghost" size="sm" onClick={disable} disabled={busy}><BellOff className="h-4 w-4" aria-hidden />{t("profile.pushSettings.disable")}</Button>
        </div>
      )}
      {msg && <p role="status" className="text-muted">{msg}</p>}

      <form action={save} className="space-y-1.5 border-t border-line pt-3">
        <p className="font-semibold">{t("profile.pushSettings.what")}</p>
        {([["schedule", t("profile.pushSettings.schedule"), prefs.schedule], ["requests", t("profile.pushSettings.requests"), prefs.requests], ["announcements", t("profile.pushSettings.announcements"), prefs.announcements], ["morning", t("profile.pushSettings.morning"), prefs.morning]] as const).map(([name, label, on]) => (
          <label key={name} className="flex cursor-pointer items-center gap-2.5 py-0.5"><input type="checkbox" name={name} defaultChecked={on} className="h-4 w-4 accent-[var(--primary)]" />{label}</label>
        ))}
        <div className="flex items-center gap-3 pt-1">
          <Button type="submit" variant="secondary" size="sm" disabled={saving}>{saving ? t("profile.pushSettings.saving") : t("profile.pushSettings.save")}</Button>
          {saved.ok && <span role="status" className="text-ok">{t("profile.pushSettings.saved")}</span>}
        </div>
      </form>
    </div>
  );
}
