"use client";
import { useState, useTransition } from "react";
import { Bot, Link2Off, MessageCircle } from "lucide-react";
import { createMaxCodeAction, unlinkMaxAction } from "@/app/(student)/profile/actions";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";

/** Чат-бот MAX в профиле (D-031): честно показывает, что бот ждёт ключ платформы; с ключом — код привязки. */
export function MaxBot({ enabled, linked, botName }: { enabled: boolean; linked: boolean; botName: string | null }) {
  const { t } = useI18n();
  const [code, setCode] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="space-y-2.5 text-sm">
      {!enabled && <p className="flex gap-2 rounded-xl bg-surface-2 px-3 py-2.5 text-muted"><Bot className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />{t("profile.max.sleeping")}</p>}
      <p className="text-muted">{t("profile.max.what")}</p>
      {enabled && linked && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-ok-bg px-3 font-medium text-ok"><MessageCircle className="h-4 w-4" aria-hidden />{t("profile.max.linked")}</span>
          <Button variant="ghost" size="sm" disabled={pending} onClick={() => start(() => unlinkMaxAction())}><Link2Off className="h-4 w-4" aria-hidden />{t("profile.max.unlink")}</Button>
        </div>
      )}
      {enabled && !linked && (code ? (
        <div role="status" className="rounded-xl border border-line bg-bg p-3">
          <p>{t("profile.max.codeHint")}</p>
          <p className="mt-1 font-mono text-2xl font-bold tracking-[0.3em]">{code}</p>
          {botName && <a href={`https://max.ru/${encodeURIComponent(botName)}?start=${code}`} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex font-semibold text-primary underline dark:text-accent-text">{t("profile.max.openBot")}</a>}
        </div>
      ) : (
        <Button variant="secondary" size="sm" disabled={pending} onClick={() => start(async () => { const r = await createMaxCodeAction(); if (r.code) setCode(r.code); })}>{t("profile.max.getCode")}</Button>
      ))}
      <p className="text-xs text-muted">{t("profile.max.telegram")}</p>
    </div>
  );
}
