"use client";
import { WifiOff } from "lucide-react";
import { useSyncExternalStore } from "react";
import { useI18n } from "@/i18n/client";

const subscribe = (cb: () => void) => {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => { window.removeEventListener("online", cb); window.removeEventListener("offline", cb); };
};

export function OfflineBanner() {
  const { t } = useI18n();
  const online = useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
  if (online) return null;
  return (
    <div role="status" className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-warn-bg px-4 py-2 text-sm font-medium text-warn">
      <WifiOff className="h-4 w-4" aria-hidden /> {t("common.offline")}
    </div>
  );
}
