"use client";
import { AlertDialog } from "radix-ui";
import { useRef, useState } from "react";
import { buttonVariants } from "./button";
import { cn } from "@/lib/cn";
import { useI18n } from "@/i18n/client";

/**
 * Подтверждение необратимых действий (правка капитана №6): отмена записи, отзыв заявки, отмена пары, сброс.
 * Доступный диалог (Radix AlertDialog): фокус внутри, Esc закрывает, по умолчанию фокус на «Нет».
 */
export function ConfirmForm({
  action, hidden, trigger, title, description, confirmLabel, cancelLabel, triggerClassName, danger = true,
}: {
  action: (form: FormData) => void | Promise<void>;
  hidden: Record<string, string>;
  trigger: React.ReactNode;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  triggerClassName?: string;
  danger?: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const { t } = useI18n();
  return (
    <form ref={formRef} action={action}>
      {Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <AlertDialog.Root open={open} onOpenChange={setOpen}>
        <AlertDialog.Trigger asChild>
          <button type="button" className={triggerClassName}>{trigger}</button>
        </AlertDialog.Trigger>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px]" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(440px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-line bg-surface p-5 text-fg shadow-2xl">
            <AlertDialog.Title className="font-serif text-xl">{title}</AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm text-muted">{description}</AlertDialog.Description>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <AlertDialog.Cancel className={buttonVariants({ variant: "secondary" })}>{cancelLabel ?? t("common.confirm.keep")}</AlertDialog.Cancel>
              <AlertDialog.Action className={cn(buttonVariants({ variant: danger ? "danger" : "primary" }))} onClick={() => formRef.current?.requestSubmit()}>{confirmLabel ?? t("common.confirm.yes")}</AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </form>
  );
}

/** Кнопка отправки формы с подтверждением — для форм с полями (отмена пары, отказ по заявке). */
export function ConfirmSubmit({ children, title, description, confirmLabel, className, disabled }: {
  children: React.ReactNode; title: string; description: string; confirmLabel?: string; className?: string; disabled?: boolean;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const { t } = useI18n();
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger asChild>
        <button ref={ref} type="button" className={className} disabled={disabled}>{children}</button>
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px]" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(440px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-line bg-surface p-5 text-fg shadow-2xl">
          <AlertDialog.Title className="font-serif text-xl">{title}</AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm text-muted">{description}</AlertDialog.Description>
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialog.Cancel className={buttonVariants({ variant: "secondary" })}>{t("common.confirm.back")}</AlertDialog.Cancel>
            <AlertDialog.Action className={buttonVariants({ variant: "danger" })} onClick={() => ref.current?.form?.requestSubmit()}>{confirmLabel ?? t("common.confirm.yes")}</AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
