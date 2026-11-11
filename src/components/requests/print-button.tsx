"use client";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";

export function PrintButton() {
  const { t } = useI18n();
  return <Button variant="secondary" size="sm" onClick={() => window.print()}><Printer className="h-4 w-4" aria-hidden />{t("requests.doc.print")}</Button>;
}
