"use client";
import { useFormStatus } from "react-dom";
import { RotateCcw } from "lucide-react";
import { resetDemoAction } from "@/app/(staff)/staff/actions";
import { Button } from "@/components/ui/button";

function Submit() {
  const { pending } = useFormStatus();
  return <Button type="submit" variant="danger" disabled={pending}><RotateCcw className="h-4 w-4" aria-hidden />{pending ? "Пересоздаём…" : "Сбросить демо-данные"}</Button>;
}

export function ResetButton() {
  return <form action={resetDemoAction} onSubmit={(e) => { if (!window.confirm("Сбросить все демо-данные? Все пользователи выйдут из кабинета.")) e.preventDefault(); }}><Submit /></form>;
}
