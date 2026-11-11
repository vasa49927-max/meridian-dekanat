"use client";
import { useActionState } from "react";
import { CalendarPlus, Check } from "lucide-react";
import { inviteAtRiskAction, type StaffState } from "@/app/(staff)/staff/actions";
import { Button } from "@/components/ui/button";

/** Кнопка «Пригласить на консультацию» с результатом прямо в строке (без перезагрузки страницы). */
export function InviteButton({ studentId, offeringId, invited, label }: { studentId: string; offeringId: string; invited: string | null; label: string }) {
  const [state, action, pending] = useActionState<StaffState, FormData>(inviteAtRiskAction, {});
  if (invited || state.ok) {
    return <p className="inline-flex items-center gap-1.5 text-sm text-ok"><Check className="h-4 w-4" aria-hidden />{state.ok ?? invited}</p>;
  }
  return (
    <form action={action} className="flex flex-col items-start gap-1">
      <input type="hidden" name="studentId" value={studentId} />
      <input type="hidden" name="offeringId" value={offeringId} />
      <Button size="sm" variant="soft" disabled={pending} aria-label={`${label}`}><CalendarPlus className="h-4 w-4" aria-hidden />{pending ? "Отправляем…" : "Пригласить на консультацию"}</Button>
      {state.error && <p role="alert" className="text-xs text-danger">{state.error}</p>}
    </form>
  );
}
