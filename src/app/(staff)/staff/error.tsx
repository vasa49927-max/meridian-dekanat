"use client";
import { RefreshCw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Scene } from "@/components/ui/scene";

export default function StudentError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div role="alert" className="mx-auto mt-10 max-w-md card rounded-2xl border border-line bg-surface p-6 text-center">
      <Scene tone="warn" icon={<TriangleAlert />} />
      <h1 className="mt-3 font-serif text-2xl">Что-то пошло не так</h1>
      <p className="mt-2 text-sm text-muted">Мы не смогли загрузить раздел. Данные в безопасности — попробуйте ещё раз через пару секунд.</p>
      <Button className="mt-4" onClick={reset}><RefreshCw className="h-4 w-4" aria-hidden />Повторить</Button>
    </div>
  );
}
