"use client";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Печать резюме: браузер предложит принтер или «Сохранить как PDF». */
export function PrintButton({ label }: { label: string }) {
  return <Button type="button" onClick={() => window.print()}><Printer className="h-4 w-4" aria-hidden />{label}</Button>;
}
