"use client";
import { useActionState, useState } from "react";
import { Check, Copy, Link2 } from "lucide-react";
import { createFeedAction, type FeedState } from "@/app/(student)/schedule/calendar/actions";
import { Button } from "@/components/ui/button";

/** Получение секретной ссылки и кнопки «добавить в календарь» для разных приложений. */
export function FeedLink({ active }: { active: boolean }) {
  const [state, action, pending] = useActionState<FeedState, FormData>(createFeedAction, {});
  const [copied, setCopied] = useState(false);
  if (state.url) {
    const webcal = state.url.replace(/^https?:/, "webcal:");
    const google = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcal)}`;
    const copy = async () => { try { await navigator.clipboard.writeText(state.url!); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* браузер запретил — ссылку можно выделить вручную */ } };
    return (
      <div className="space-y-3" role="status">
        <p className="text-sm font-semibold text-ok">Ссылка готова. Она личная — не публикуйте её: по ней видно ваше расписание.</p>
        <div className="flex gap-2">
          <input readOnly value={state.url} aria-label="Ссылка на календарь" onFocus={(e) => e.currentTarget.select()} className="h-11 min-w-0 flex-1 rounded-xl border border-line bg-bg px-3 font-mono text-xs" />
          <Button type="button" variant="secondary" onClick={copy} aria-label="Скопировать ссылку">{copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}{copied ? "Скопировано" : "Копировать"}</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={webcal} className="inline-flex h-11 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-fg">iPhone / Mac / Outlook</a>
          <a href={google} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center rounded-xl border border-line bg-surface px-4 text-sm font-semibold hover:bg-surface-2">Google Календарь (Android)</a>
        </div>
        <p className="text-xs text-muted">Яндекс Календарь: «Настройки» → «Импорт» → «По ссылке» → вставьте ссылку и включите «Обновлять».</p>
      </div>
    );
  }
  return (
    <form action={action}>
      <Button disabled={pending}><Link2 className="h-4 w-4" aria-hidden />{pending ? "Создаём…" : active ? "Получить новую ссылку" : "Получить ссылку для подписки"}</Button>
      {active && <p className="mt-1.5 text-xs text-muted">Старая ссылка перестанет работать — календарь на других устройствах нужно будет подписать заново.</p>}
    </form>
  );
}
