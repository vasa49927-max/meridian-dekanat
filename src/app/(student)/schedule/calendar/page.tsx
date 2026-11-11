import Link from "next/link";
import type { Metadata } from "next";
import { CalendarArrowDown, CalendarCheck2, RefreshCw } from "lucide-react";
import { requireStudent } from "@/server/auth/guards";
import { getCalendarFeed } from "@/server/calendar";
import { fmt } from "@/lib/time";
import { Card, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { ConfirmForm } from "@/components/ui/confirm";
import { FeedLink } from "@/components/schedule/feed-link";
import { disableFeedAction } from "./actions";

export const metadata: Metadata = { title: "Расписание в календаре телефона" };

/** Подписка на календарь (раунд 3): переносы и отмены сами появляются в календаре телефона. */
export default async function CalendarPage() {
  const v = await requireStudent();
  const feed = await getCalendarFeed(v.userId);
  return (
    <div className="mx-auto max-w-2xl pt-2 lg:pt-0">
      <nav aria-label="Навигация" className="mb-2 text-sm"><Link href="/schedule" className="tap text-muted hover:text-fg">← Расписание</Link></nav>
      <PageHeader title="Расписание в календаре телефона" subtitle="Подпишитесь один раз — переносы, отмены и сессия появятся в календаре сами" />
      <Card className="mb-4">
        <CardTitle>{feed ? "Подписка включена" : "Подписка"}</CardTitle>
        {feed && (
          <p className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span className="inline-flex items-center gap-1.5 text-ok"><CalendarCheck2 className="h-4 w-4" aria-hidden />ссылка создана {fmt.dateTime(feed.createdAt)}</span>
            <span className="inline-flex items-center gap-1.5 text-muted"><RefreshCw className="h-4 w-4" aria-hidden />{feed.lastFetchedAt ? `календарь обновлялся ${fmt.dateTime(feed.lastFetchedAt)}` : "календарь ещё не обращался"}</span>
          </p>
        )}
        <FeedLink active={!!feed} />
        {feed && (
          <div className="mt-4 border-t border-line pt-3">
            <ConfirmForm action={disableFeedAction} hidden={{}} trigger="Отключить подписку" triggerClassName="h-10 rounded-lg px-3 text-sm font-medium text-danger hover:bg-danger-bg"
              title="Отключить подписку?" description="Ссылка перестанет работать, и календарь на телефоне больше не будет получать обновления. Уже загруженные пары останутся до удаления календаря." confirmLabel="Да, отключить" />
          </div>
        )}
      </Card>
      <Card>
        <CardTitle>Как это работает</CardTitle>
        <ul className="list-disc space-y-1.5 pl-5 text-sm">
          <li>Календарь телефона сам забирает расписание по личной ссылке. Перенос — пара сдвигается, отмена — помечается «[ОТМЕНА]».</li>
          <li>Как часто — решает приложение календаря: iPhone и Яндекс — примерно раз в час, Google — до нескольких раз в сутки. Поэтому о срочных изменениях мы дополнительно пишем в уведомления.</li>
          <li>Ссылка секретная: в нашей базе хранится только её отпечаток. Если отправили её кому-то по ошибке — получите новую, старая перестанет работать.</li>
        </ul>
        <p className="mt-3 text-sm"><Link href="/api/schedule.ics" prefetch={false} className="inline-flex items-center gap-1.5 font-semibold text-primary dark:text-accent-text"><CalendarArrowDown className="h-4 w-4" aria-hidden />Скачать файл .ics один раз (без обновлений)</Link></p>
      </Card>
    </div>
  );
}
