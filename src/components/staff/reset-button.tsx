"use client";
import { useActionState, useRef, useState } from "react";
import { AlertDialog } from "radix-ui";
import { RotateCcw } from "lucide-react";
import { resetDemoAction, type StaffState } from "@/app/(staff)/staff/actions";
import { Button, buttonVariants } from "@/components/ui/button";

export function ResetButton() {
  const [state, action, pending] = useActionState<StaffState, FormData>(resetDemoAction, {});
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  return (
    <form ref={formRef} action={action} className="space-y-2">
      <AlertDialog.Root open={open} onOpenChange={setOpen}>
        <AlertDialog.Trigger asChild><Button type="button" variant="danger" disabled={pending}><RotateCcw className="h-4 w-4" aria-hidden />{pending ? "Пересоздаём…" : "Сбросить демо-данные"}</Button></AlertDialog.Trigger>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/45" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(440px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-line bg-surface p-5 shadow-2xl">
            <AlertDialog.Title className="font-serif text-xl">Сбросить все демо-данные?</AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm text-muted">Заявки, записи и уведомления вернутся к исходным. Все пользователи, включая вас, выйдут из кабинета.</AlertDialog.Description>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <AlertDialog.Cancel className={buttonVariants({ variant: "secondary" })}>Нет, оставить</AlertDialog.Cancel>
              <AlertDialog.Action className={buttonVariants({ variant: "danger" })} onClick={() => formRef.current?.requestSubmit()}>Да, сбросить</AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
      {state.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}
    </form>
  );
}
