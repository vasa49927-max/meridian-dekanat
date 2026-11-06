"use client";
import { useActionState } from "react";
import { replyAction, withdrawAction, type FormState } from "@/app/(student)/requests/actions";
import { Button } from "@/components/ui/button";
import { FieldHint, Label, Textarea } from "@/components/ui/field";

export function ReplyForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(replyAction, {});
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="id" value={id} />
      <Label htmlFor="reply">Ответ деканату</Label>
      <Textarea id="reply" name="comment" required maxLength={800} placeholder="Например: письмо работодателя отправил(а) на почту офиса, номер письма…" aria-invalid={!!state.error} aria-describedby={state.error ? "reply-err" : undefined} />
      {state.error && <FieldHint id="reply-err" error>{state.error}</FieldHint>}
      <Button type="submit" disabled={pending}>{pending ? "Отправляем…" : "Отправить и вернуть в работу"}</Button>
    </form>
  );
}

export function WithdrawButton({ id }: { id: string }) {
  return (
    <form action={withdrawAction} onSubmit={(e) => { if (!window.confirm("Отозвать заявку? Её можно будет подать заново.")) e.preventDefault(); }}>
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="ghost" size="sm" className="text-danger">Отозвать заявку</Button>
    </form>
  );
}
