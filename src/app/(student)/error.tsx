"use client";
import { RefreshCw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";

export default function StudentError({ reset }: { error: Error; reset: () => void }) {
  const { t } = useI18n();
  return (
    <div role="alert" className="mx-auto mt-10 max-w-md card rounded-2xl border border-line bg-surface p-6 text-center">
      <TriangleAlert className="mx-auto h-10 w-10 text-warn" aria-hidden />
      <h1 className="mt-3 font-serif text-2xl">{t("auth.pages.error.title")}</h1>
      <p className="mt-2 text-sm text-muted">{t("auth.pages.error.text")}</p>
      <Button className="mt-4" onClick={reset}><RefreshCw className="h-4 w-4" aria-hidden />{t("auth.pages.error.retry")}</Button>
    </div>
  );
}
