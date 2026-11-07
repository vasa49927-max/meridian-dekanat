"use client";
import { useActionState } from "react";
import { replyAction, withdrawAction, type FormState } from "@/app/(student)/requests/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { ConfirmForm } from "@/components/ui/confirm";
import { FieldHint, Label, Textarea } from "@/components/ui/field";
import { FileField } from "./file-field";

export function ReplyForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(replyAction, {});
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="id" value={id} />
      <Label htmlFor="reply">Ответ деканату</Label>
      <Textarea id="reply" name="comment" required maxLength={800} placeholder="Например: письмо работодателя отправил(а) на почту офиса, номер письма…" aria-invalid={!!state.error} aria-describedby={state.error ? "reply-err" : undefined} />
      {state.error && <FieldHint id="reply-err" error>{state.error}</FieldHint>}
      <FileField label="Приложить файлы" hint="Например, письмо работодателя · PDF, JPG, PNG, DOCX · до 3 файлов по 5 МБ" />
      <Button type="submit" disabled={pending}>{pending ? "Отправляем…" : "Отправить и вернуть в работу"}</Button>
    </form>
  );
}

export function WithdrawButton({ id }: { id: string }) {
  return (
    <ConfirmForm action={withdrawAction} hidden={{ id }} trigger="Отозвать заявку" triggerClassName={buttonVariants({ variant: "ghost", size: "sm", className: "text-danger" })}
      title="Отозвать заявку?" description="Деканат перестанет её обрабатывать. Если передумаете — подайте новую, это займёт минуту." confirmLabel="Да, отозвать" />
  );
}
