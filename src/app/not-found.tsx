import Link from "next/link";
import { Compass } from "lucide-react";
import { Disclaimer } from "@/components/shell/disclaimer";

/** Одинаковый ответ и для несуществующего, и для чужого объекта — не подтверждаем, что он есть. */
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-2xl bg-surface-2 text-accent-text" aria-hidden><Compass className="h-8 w-8" /></span>
      <h1 className="font-serif text-3xl">Страница не найдена</h1>
      <p className="text-muted">Такой страницы нет или у вас нет к ней доступа. Проверьте адрес или вернитесь на главную.</p>
      <Link href="/" className="inline-flex h-11 items-center rounded-xl bg-primary px-5 font-semibold text-primary-fg">На главную</Link>
      <Disclaimer className="mt-8" />
    </main>
  );
}
