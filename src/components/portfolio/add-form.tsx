"use client";
import { useActionState, useEffect, useRef } from "react";
import { addPortfolioAction, type PortfolioState } from "@/app/(student)/portfolio/actions";
import { Button } from "@/components/ui/button";
import { FieldHint, Input, Label, Select, Textarea } from "@/components/ui/field";
import { useI18n } from "@/i18n/client";

const KINDS = ["OLYMPIAD", "CONFERENCE", "INTERNSHIP", "CERTIFICATE", "VOLUNTEER", "PUBLICATION"] as const;

export function PortfolioAddForm({ maxMonth }: { maxMonth: string }) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState<PortfolioState, FormData>(addPortfolioAction, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.ok) ref.current?.reset(); }, [state.ok]);
  return (
    <form ref={ref} action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div><Label htmlFor="pf-kind">{t("portfolio.add.kind")}</Label><Select id="pf-kind" name="kind" defaultValue="OLYMPIAD">{KINDS.map((k) => <option key={k} value={k}>{t(`portfolio.kinds.${k}`)}</option>)}</Select></div>
        <div><Label htmlFor="pf-date">{t("portfolio.add.date")}</Label><Input id="pf-date" name="date" type="month" required max={maxMonth} min="2015-01" /></div>
      </div>
      <div><Label htmlFor="pf-title">{t("portfolio.add.name")}</Label><Input id="pf-title" name="title" required minLength={3} maxLength={200} placeholder={t("portfolio.add.namePlaceholder")} /></div>
      <div><Label htmlFor="pf-org">{t("portfolio.add.org")}</Label><Input id="pf-org" name="org" maxLength={200} /></div>
      <div><Label htmlFor="pf-desc">{t("portfolio.add.description")}</Label><Textarea id="pf-desc" name="description" maxLength={600} className="min-h-20" aria-describedby="pf-note" /><FieldHint id="pf-note">{t("portfolio.add.note")}</FieldHint></div>
      {state.error && <p role="alert" className="rounded-xl bg-danger-bg px-3 py-2 text-sm text-danger">{state.error}</p>}
      {state.ok && !state.error && <p role="status" className="rounded-xl bg-ok-bg px-3 py-2 text-sm text-ok">{t("portfolio.add.done")}</p>}
      <Button type="submit" disabled={pending}>{pending ? t("portfolio.add.sending") : t("portfolio.add.submit")}</Button>
    </form>
  );
}
