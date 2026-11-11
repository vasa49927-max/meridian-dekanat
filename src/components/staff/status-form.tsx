"use client";
import { useActionState, useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { changeStatusAction, draftReplyAction, type StaffState } from "@/app/(staff)/staff/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { ConfirmSubmit } from "@/components/ui/confirm";
import { FieldHint, Label, Textarea } from "@/components/ui/field";
import { cn } from "@/lib/cn";

const HINT: Record<string, string> = {
  IN_PROGRESS: "Студент увидит, что заявку взяли в работу.",
  NEEDS_INFO: "Обязательно напишите, чего не хватает.",
  READY: "Для справок автоматически сформируется электронный документ с QR-кодом.",
  ISSUED: "Бумажный экземпляр выдан студенту.",
  REJECTED: "Обязательно укажите причину — студент увидит её.",
};

export function StatusForm({ id, options, producesDocument }: { id: string; options: { value: string; label: string }[]; producesDocument: boolean }) {
  const [sel, setSel] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [draft, setDraft] = useState<{ mode?: string; error?: string } | null>(null);
  const [state, action, pending] = useActionState<StaffState, FormData>(async (prev, fd) => {
    const r = await changeStatusAction(prev, fd);
    if (r.ok) { setComment(""); setDraft(null); setSel(null); }
    return r;
  }, {});
  const [drafting, startDraft] = useTransition();
  const askDraft = () => startDraft(async () => {
    const r = await draftReplyAction(id, sel ?? "");
    if (r.text) setComment(r.text);
    setDraft({ mode: r.mode, error: r.error });
  });
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="id" value={id} />
      <fieldset className="min-w-0">
        <legend className="mb-2 text-sm font-semibold">Новый статус</legend>
        <div className="flex flex-wrap gap-2">
          {options.map((o) => (
            <label key={o.value} className={cn("cursor-pointer rounded-xl border px-3 py-2 text-sm font-semibold has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[var(--focus)]", sel === o.value ? "border-primary bg-primary text-primary-fg" : "border-line hover:bg-surface-2", o.value === "REJECTED" && sel !== o.value && "text-danger")}>
              <input type="radio" name="status" value={o.value} checked={sel === o.value} onChange={() => setSel(o.value)} className="sr-only" />{o.label}
            </label>
          ))}
        </div>
        <FieldHint>{!sel ? "Выберите, что сделать с заявкой." : sel === "READY" && !producesDocument ? "Заявление рассмотрено положительно." : HINT[sel]}</FieldHint>
      </fieldset>
      <div>
        <div className="flex items-end justify-between gap-2">
          <Label htmlFor="st-comment">Комментарий для студента{sel && ["NEEDS_INFO", "REJECTED"].includes(sel) && <span className="text-danger"> *</span>}</Label>
          <Button type="button" size="sm" variant="ghost" className="mb-1 h-8 px-2 text-primary dark:text-accent-text" disabled={!sel || drafting} onClick={askDraft} title={!sel ? "Сначала выберите статус" : undefined}>
            <Sparkles className="h-4 w-4" aria-hidden />{drafting ? "Пишем…" : "Черновик ИИ"}
          </Button>
        </div>
        <Textarea id="st-comment" name="comment" maxLength={800} className="min-h-32" value={comment} onChange={(e) => setComment(e.target.value)} placeholder={sel === "REJECTED" ? "Причина отказа" : "Необязательно"} aria-describedby={draft ? "draft-note" : undefined} />
        {draft && (draft.error
          ? <p id="draft-note" role="alert" className="mt-1 text-xs text-danger">{draft.error}</p>
          : <p id="draft-note" role="status" className="mt-1 text-xs text-muted">{draft.mode === "llm" ? "Черновик от GigaChat" : "Черновик по шаблону"} — проверьте и замените пометки в [квадратных скобках] перед отправкой.</p>)}
      </div>
      {state.error && <p role="alert" className="rounded-xl bg-danger-bg px-3 py-2 text-sm text-danger">{state.error}</p>}
      {state.ok && <p role="status" className="rounded-xl bg-ok-bg px-3 py-2 text-sm text-ok">{state.ok}</p>}
      {sel === "REJECTED" ? (
        <ConfirmSubmit className={buttonVariants({ variant: "danger", className: "w-full" })} disabled={pending} title="Отклонить заявку?" description="Студент получит уведомление с вашей причиной. Вернуть заявку в работу после отказа нельзя — студенту придётся подать новую." confirmLabel="Да, отклонить">
          {pending ? "Сохраняем…" : "Отклонить и уведомить студента"}
        </ConfirmSubmit>
      ) : <Button type="submit" disabled={pending || !sel} className="w-full">{pending ? "Сохраняем…" : "Сохранить и уведомить студента"}</Button>}
    </form>
  );
}
