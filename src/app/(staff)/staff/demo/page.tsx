import type { Metadata } from "next";
import { RotateCcw } from "lucide-react";
import { requireStaff } from "@/server/auth/guards";
import { env } from "@/server/env";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { ResetButton } from "@/components/staff/reset-button";

export const metadata: Metadata = { title: "Демо-данные" };

export default async function DemoPage() {
  await requireStaff();
  return (
    <div className="mx-auto max-w-2xl pt-2 lg:pt-0">
      <PageHeader title="Демо-данные" subtitle="Для жюри: вернуть кабинет к исходному состоянию" />
      <Card>
        <p>Сброс пересоздаёт все вымышленные данные: студентов, расписание с переносами на ближайшие недели, оценки, заявки, уведомления и слоты записи. Все сеансы завершатся — нужно будет войти заново.</p>
        <p className="mt-2 text-sm text-muted">Сроки, переносы и уведомления строятся относительно текущей даты, поэтому после сброса кабинет снова выглядит «свежим».</p>
        <div className="mt-4">{env.DEMO_RESET_ENABLED === "true" ? <ResetButton /> : <p className="flex items-center gap-2 text-sm text-muted"><RotateCcw className="h-4 w-4" aria-hidden />Сброс отключён администратором.</p>}</div>
      </Card>
    </div>
  );
}
