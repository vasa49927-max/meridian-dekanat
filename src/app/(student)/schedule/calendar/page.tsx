import Link from "next/link";
import type { Metadata } from "next";
import { CalendarArrowDown, CalendarCheck2, RefreshCw } from "lucide-react";
import { requireStudent } from "@/server/auth/guards";
import { getCalendarFeed } from "@/server/calendar";
import { Card, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { ConfirmForm } from "@/components/ui/confirm";
import { FeedLink } from "@/components/schedule/feed-link";
import { disableFeedAction } from "./actions";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("schedule.calendar.title") };
}

/** Подписка на календарь (раунд 3): переносы и отмены сами появляются в календаре телефона. */
export default async function CalendarPage() {
  const v = await requireStudent();
  const feed = await getCalendarFeed(v.userId);
  const { t, f } = await getI18n();
  return (
    <div className="mx-auto max-w-2xl pt-2 lg:pt-0">
      <nav aria-label={t("schedule.calendar.navLabel")} className="mb-2 text-sm"><Link href="/schedule" className="tap text-muted hover:text-fg">{t("schedule.calendar.back")}</Link></nav>
      <PageHeader title={t("schedule.calendar.title")} subtitle={t("schedule.calendar.subtitle")} />
      <Card className="mb-4">
        <CardTitle>{feed ? t("schedule.calendar.subscriptionOn") : t("schedule.calendar.subscription")}</CardTitle>
        {feed && (
          <p className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span className="inline-flex items-center gap-1.5 text-ok"><CalendarCheck2 className="h-4 w-4" aria-hidden />{t("schedule.calendar.created", { date: f.dateTime(feed.createdAt) })}</span>
            <span className="inline-flex items-center gap-1.5 text-muted"><RefreshCw className="h-4 w-4" aria-hidden />{feed.lastFetchedAt ? t("schedule.calendar.fetched", { date: f.dateTime(feed.lastFetchedAt) }) : t("schedule.calendar.notFetched")}</span>
          </p>
        )}
        <FeedLink active={!!feed} />
        {feed && (
          <div className="mt-4 border-t border-line pt-3">
            <ConfirmForm action={disableFeedAction} hidden={{}} trigger={t("schedule.calendar.disable")} triggerClassName="h-10 rounded-lg px-3 text-sm font-medium text-danger hover:bg-danger-bg"
              title={t("schedule.calendar.disableTitle")} description={t("schedule.calendar.disableText")} confirmLabel={t("schedule.calendar.disableConfirm")} />
          </div>
        )}
      </Card>
      <Card>
        <CardTitle>{t("schedule.calendar.howTitle")}</CardTitle>
        <ul className="list-disc space-y-1.5 pl-5 text-sm">
          <li>{t("schedule.calendar.how1")}</li>
          <li>{t("schedule.calendar.how2")}</li>
          <li>{t("schedule.calendar.how3")}</li>
        </ul>
        <p className="mt-3 text-sm"><Link href="/api/schedule.ics" prefetch={false} className="inline-flex items-center gap-1.5 font-semibold text-primary dark:text-accent-text"><CalendarArrowDown className="h-4 w-4" aria-hidden />{t("schedule.calendar.download")}</Link></p>
      </Card>
    </div>
  );
}
