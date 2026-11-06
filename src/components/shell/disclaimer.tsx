import { cn } from "@/lib/cn";

/** Обязательная плашка: на странице входа и в футере каждой страницы. */
export function Disclaimer({ className }: { className?: string }) {
  return (
    <p role="note" className={cn("rounded-xl border border-dashed border-line px-4 py-3 text-center text-xs text-muted", className)}>
      <strong className="font-semibold">Концепт для конкурса МГИМО по ИИ.</strong> Не является официальным сервисом МГИМО. Все люди и данные вымышлены.
    </p>
  );
}
