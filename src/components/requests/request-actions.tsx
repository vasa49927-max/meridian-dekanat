"use client";
import { useActionState } from "react";
import { replyAction, withdrawAction, type FormState } from "@/app/(student)/requests/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { ConfirmForm } from "@/components/ui/confirm";
import { FieldHint, Label, Textarea } from "@/components/ui/field";
import { FileField } from "./file-field";
import { useI18n } from "@/i18n/client";

export function ReplyForm({ id }: { id: string }) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState<FormState, FormData>(replyAction, {});
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="id" value={id} />
      <Label htmlFor="reply">{t("requests.reply.label")}</Label>
      <Textarea id="reply" name="comment" required maxLength={800} placeholder={t("requests.reply.placeholder")} aria-invalid={!!state.error} aria-describedby={state.error ? "reply-err" : undefined} />
      {state.error && <FieldHint id="reply-err" error>{state.error}</FieldHint>}
      <FileField label={t("requests.reply.filesLabel")} hint={t("requests.reply.filesHint")} />
      <Button type="submit" disabled={pending}>{pending ? t("requests.reply.sending") : t("requests.reply.submit")}</Button>
    </form>
  );
}

export function WithdrawButton({ id }: { id: string }) {
  const { t } = useI18n();
  return (
    <ConfirmForm action={withdrawAction} hidden={{ id }} trigger={t("requests.withdraw.trigger")} triggerClassName={buttonVariants({ variant: "ghost", size: "sm", className: "text-danger" })}
      title={t("requests.withdraw.title")} description={t("requests.withdraw.description")} confirmLabel={t("requests.withdraw.confirm")} />
  );
}
