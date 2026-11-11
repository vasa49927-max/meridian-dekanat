"use client";
import { useEffect, useState } from "react";
import { Dialog } from "radix-ui";
import { ArrowLeftRight, FileText, Search, Target, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

/**
 * Подсказки при первом входе (раунд 3). Флаг «уже видел» — в localStorage этого браузера:
 * демо-аккаунты общие, и каждый проверяющий должен увидеть подсказки у себя хотя бы раз.
 * Повторно открыть: кнопка «Подсказки по кабинету» (событие meridian:tour).
 */
export const TOUR_KEY = "meridian-tour-v1";

const STEPS = [
  { icon: ArrowLeftRight, title: "Главное — на экране «Сегодня»", text: "Следующая пара с аудиторией и отсчётом, а сразу под ней — переносы и отмены на неделю. Больше не нужно искать их в чате группы." },
  { icon: Target, title: "«Успеваемость» подскажет, с чего начать", text: "Сколько баллов уже есть, сколько не хватает до автомата и какая работа ближайшая. Калькулятор «что, если» — в каждой карточке." },
  { icon: FileText, title: "Справки — без очереди", text: "«Заявки» → выберите документ → форма на одну минуту. Статус меняется здесь же, а готовая справка приходит с QR-кодом для проверки." },
  { icon: Search, title: "Поиск и помощник", text: "Ctrl+K (или лупа вверху) — быстрый переход куда угодно. «Помощник» ответит по Положению и сам заполнит заявку — отправите её вы." },
];

export function Onboarding({ firstName }: { firstName: string }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  useEffect(() => {
    let seen = true;
    try { seen = localStorage.getItem(TOUR_KEY) === "done"; } catch { /* приватный режим — подсказки просто не показываем автоматически */ }
    const t = seen ? undefined : setTimeout(() => setOpen(true), 400);
    const reopen = () => { setStep(0); setOpen(true); };
    window.addEventListener("meridian:tour", reopen);
    return () => { if (t) clearTimeout(t); window.removeEventListener("meridian:tour", reopen); };
  }, []);
  const close = (o: boolean) => {
    setOpen(o);
    if (!o) try { localStorage.setItem(TOUR_KEY, "done"); } catch { /* не критично */ }
  };
  const S = STEPS[step];
  const last = step === STEPS.length - 1;
  return (
    <Dialog.Root open={open} onOpenChange={close}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px]" />
        <Dialog.Content aria-describedby="tour-text" className="fixed left-1/2 top-1/2 z-50 w-[min(460px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-line bg-surface p-5 text-fg shadow-2xl">
          <div className="flex items-start justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent-text">Подсказка {step + 1} из {STEPS.length}{step === 0 ? ` · ${firstName}, добро пожаловать` : ""}</p>
            <Dialog.Close className="-m-1 rounded-lg p-1 text-muted hover:text-fg" aria-label="Закрыть подсказки"><X className="h-5 w-5" aria-hidden /></Dialog.Close>
          </div>
          <div className="mt-3 flex gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary dark:text-accent-text"><S.icon className="h-6 w-6" aria-hidden /></span>
            <div>
              <Dialog.Title className="font-serif text-xl leading-snug">{S.title}</Dialog.Title>
              <p id="tour-text" className="mt-1.5 text-sm text-muted">{S.text}</p>
            </div>
          </div>
          <div className="mt-5 flex items-center justify-between gap-3">
            <div className="flex gap-1.5" aria-hidden>{STEPS.map((_, i) => <span key={i} className={cn("h-1.5 rounded-full transition-all", i === step ? "w-6 bg-primary dark:bg-accent" : "w-1.5 bg-line")} />)}</div>
            <div className="flex gap-2">
              {step > 0 && <Button variant="ghost" onClick={() => setStep(step - 1)}>Назад</Button>}
              {last ? <Button onClick={() => close(false)}>Понятно, начать</Button> : <Button onClick={() => setStep(step + 1)}>Дальше</Button>}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** Кнопка «Подсказки по кабинету» — открывает их снова. */
export function TourButton({ className }: { className?: string }) {
  return <button type="button" onClick={() => window.dispatchEvent(new Event("meridian:tour"))} className={className}>Подсказки по кабинету</button>;
}
