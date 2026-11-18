"use client";
import { useActionState } from "react";
import { electiveAction, type ElectiveState } from "@/app/(student)/grades/electives/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { ConfirmSubmit } from "@/components/ui/confirm";
import { useI18n } from "@/i18n/client";

/** Запись / лист ожидания / отказ. Результат — прямо под кнопкой (role=status / alert). */
export function ElectiveButton({ id, mine, full, disabled }: { id: string; mine: "ENROLLED" | "WAITLIST" | null; full: boolean; disabled: boolean }) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState<ElectiveState, FormData>(electiveAction, {});
  return (
    <form action={action} className="flex flex-col items-stretch gap-1.5 sm:items-end">
      <input type="hidden" name="id" value={id} />
      {mine ? (
        <>
          <input type="hidden" name="op" value="drop" />
          <ConfirmSubmit className={buttonVariants({ variant: "secondary", size: "sm" })} disabled={disabled || pending}
            title={t("electives.actions.dropConfirm.title")} description={t("electives.actions.dropConfirm.body")} confirmLabel={t("electives.actions.dropConfirm.ok")}>
            {t("electives.actions.drop")}
          </ConfirmSubmit>
        </>
      ) : (
        <Button size="sm" variant={full ? "secondary" : "primary"} disabled={disabled || pending}>{full ? t("electives.actions.waitlist") : t("electives.actions.enroll")}</Button>
      )}
      {state.error && <p role="alert" className="text-xs text-danger">{state.error}</p>}
      {state.ok && <p role="status" className="text-xs font-semibold text-ok">{state.ok}</p>}
    </form>
  );
}
