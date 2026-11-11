import { FileImage, FileText, Paperclip } from "lucide-react";
import { getI18n } from "@/i18n/server";
import { INTL_LOCALE } from "@/i18n/config";

type A = { id: string; fileName: string; mime: string; size: number; uploaderRole: "STUDENT" | "STAFF"; createdAt: Date };

/** Список вложений заявки со ссылками на скачивание (доступ проверяет /api/attachments/[id]). */
export async function AttachmentsList({ items, viewer }: { items: A[]; viewer: "STUDENT" | "STAFF" }) {
  if (!items.length) return null;
  const { t, f, locale } = await getI18n();
  const mb = new Intl.NumberFormat(INTL_LOCALE[locale], { minimumFractionDigits: 1, maximumFractionDigits: 1, useGrouping: false });
  const sz = (n: number) => (n < 1024 * 1024 ? t("requests.files.kb", { n: Math.max(1, Math.round(n / 1024)) }) : t("requests.files.mb", { n: mb.format(n / 1024 / 1024) }));
  return (
    <ul className="space-y-1.5">
      {items.map((a) => {
        const Icon = a.mime.startsWith("image/") ? FileImage : a.mime === "application/pdf" ? FileText : Paperclip;
        return (
          <li key={a.id}>
            <a href={`/api/attachments/${a.id}`} className="flex items-center gap-3 rounded-xl border border-line px-3 py-2 hover:border-primary">
              <Icon className="h-5 w-5 shrink-0 text-accent-text" aria-hidden />
              <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{a.fileName}</span>
                <span className="block text-xs text-muted">{sz(a.size)} · {a.uploaderRole === "STUDENT" ? (viewer === "STUDENT" ? t("requests.files.you") : t("requests.files.student")) : t("requests.files.office")} · {f.dateTime(a.createdAt)}</span></span>
              <span className="shrink-0 text-xs font-semibold text-primary dark:text-accent-text">{t("requests.files.download")}</span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
