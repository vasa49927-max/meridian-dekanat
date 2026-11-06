"use client";
import { useActionState } from "react";
import { RotateCcw } from "lucide-react";
import { resetDemoAction, type StaffState } from "@/app/(staff)/staff/actions";
import { Button } from "@/components/ui/button";

export function ResetButton() {
  const [state, action, pending] = useActionState<StaffState, FormData>(resetDemoAction, {});
  return (
    <form action={action} onSubmit={(e) => { if (!window.confirm("Сбросить все демо-данные? Все пользователи выйдут из кабинета.")) e.preventDefault(); }} className="space-y-2">
      <Button type="submit" variant="danger" disabled={pending}><RotateCcw className="h-4 w-4" aria-hidden />{pending ? "Пересоздаём…" : "Сбросить демо-данные"}</Button>
      {state.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}
    </form>
  );
}
