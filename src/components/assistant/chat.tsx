"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowUp, BookOpenText, FilePlus2, Sparkles, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/cn";

type Msg = { role: "user" | "assistant"; content: string; sources?: { id: string; section: string }[]; action?: { code: string; title: string; fields: Record<string, string> } | null; mode?: "llm" | "offline"; error?: boolean };

const SUGGEST = ["Что у меня с сессией?", "Какую справку взять для визы в Испанию?", "Как получить зачёт автоматом?", "Мне нужна справка для военкомата", "Можно ли перенести экзамен из-за олимпиады?", "Когда принимает методист?"];

/** Чат с помощником. Ответы — со ссылками на пункты Положения; кнопка «Заполнить заявку» открывает предзаполненную форму. */
export function Chat({ firstName, initialQuestion, llm }: { firstName: string; initialQuestion: string | null; llm: boolean }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const sentInitial = useRef(false);

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    const history = [...msgs.filter((m) => !m.error), { role: "user" as const, content: q }];
    setMsgs((m) => [...m, { role: "user", content: q }]);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/assistant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: history.slice(-8).map(({ role, content }) => ({ role, content })) }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Ошибка");
      setMsgs((m) => [...m, { role: "assistant", content: j.text, sources: j.sources, action: j.action, mode: j.mode }]);
    } catch (e) {
      setMsgs((m) => [...m, { role: "assistant", content: e instanceof Error && e.message !== "Failed to fetch" ? e.message : "Нет связи с сервером. Проверьте интернет и повторите.", error: true }]);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => { if (initialQuestion && !sentInitial.current) { sentInitial.current = true; void send(initialQuestion); } }); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [msgs, busy]);

  const href = (a: NonNullable<Msg["action"]>) => `/requests/new/${a.code}?${new URLSearchParams({ ...a.fields, from: "assistant" })}`;
  return (
    <div className="flex min-h-[calc(100dvh-220px)] flex-col">
      <div className="mb-4 flex items-start gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-hero text-accent" aria-hidden><Sparkles className="h-6 w-6" /></span>
        <div>
          <h1 className="font-serif text-[26px] leading-tight">Помощник деканата</h1>
          <p className="text-sm text-muted">{llm ? "GigaChat · " : "Режим поиска по Положению · "}отвечает по Положению и вашим данным, ссылается на пункты. Видит только ваши данные.</p>
        </div>
      </div>

      <div className="flex-1 space-y-3" aria-live="polite" aria-busy={busy}>
        {msgs.length === 0 && (
          <div className="rounded-2xl border border-line bg-surface p-4">
            <p className="font-medium">Здравствуйте, {firstName}! Спросите о справках, сессии, расписании или правилах — или попросите оформить заявку.</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {SUGGEST.map((s) => <li key={s}><button type="button" onClick={() => send(s)} className="rounded-full border border-line bg-bg px-3 py-1.5 text-sm hover:border-primary">{s}</button></li>)}
            </ul>
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div className={cn("max-w-[88%] rounded-2xl px-4 py-3 text-[15px]", m.role === "user" ? "rounded-br-md bg-primary text-primary-fg" : m.error ? "rounded-bl-md border border-danger/30 bg-danger-bg text-danger" : "rounded-bl-md border border-line bg-surface")}>
              {m.error && <TriangleAlert className="mb-1 h-4 w-4" aria-hidden />}
              <p className="whitespace-pre-line">{m.content}</p>
              {!!m.sources?.length && (
                <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-muted"><BookOpenText className="h-3.5 w-3.5" aria-hidden />Положение: {m.sources.map((s) => <span key={s.id} className="rounded-md bg-surface-2 px-1.5 py-0.5" title={s.section}>п. {s.id}</span>)}</p>
              )}
              {m.action && (
                <Link href={href(m.action)} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-sm font-semibold text-primary-fg hover:opacity-90"><FilePlus2 className="h-4 w-4" aria-hidden />Заполнить: {m.action.title}</Link>
              )}
              {m.mode === "offline" && <p className="mt-2 text-[11px] text-muted">Ответ собран из Положения без нейросети</p>}
            </div>
          </div>
        ))}
        {busy && <div className="flex gap-1.5 px-2 py-3" role="status" aria-label="Помощник печатает">{[0, 1, 2].map((d) => <span key={d} className="h-2 w-2 animate-bounce rounded-full bg-muted" style={{ animationDelay: `${d * 120}ms` }} />)}</div>}
        <div ref={endRef} />
      </div>

      <form onSubmit={(e) => { e.preventDefault(); void send(input); }} className="sticky bottom-[84px] mt-4 flex gap-2 rounded-2xl border border-line bg-surface p-2 shadow-[var(--shadow-card)] lg:bottom-4">
        <label htmlFor="ask" className="sr-only">Ваш вопрос</label>
        <textarea id="ask" rows={1} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(input); } }}
          maxLength={1200} placeholder="Например: какую справку взять для военкомата?" className="max-h-32 min-h-11 flex-1 resize-none bg-transparent px-2 py-2.5 text-[15px] outline-none placeholder:text-muted" />
        <button type="submit" disabled={!input.trim() || busy} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-fg disabled:opacity-40" aria-label="Отправить"><ArrowUp className="h-5 w-5" aria-hidden /></button>
      </form>
      <p className="mt-2 text-center text-xs text-muted">Помощник может ошибаться — сверяйтесь с Положением. Он не подаёт заявки сам: вы проверяете форму и отправляете.</p>
    </div>
  );
}
