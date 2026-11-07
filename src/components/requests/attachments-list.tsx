import { FileImage, FileText, Paperclip } from "lucide-react";
import { fmt } from "@/lib/time";

type A = { id: string; fileName: string; mime: string; size: number; uploaderRole: "STUDENT" | "STAFF"; createdAt: Date };
const sz = (n: number) => (n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} КБ` : `${(n / 1024 / 1024).toFixed(1).replace(".", ",")} МБ`);

/** Список вложений заявки со ссылками на скачивание (доступ проверяет /api/attachments/[id]). */
export function AttachmentsList({ items, viewer }: { items: A[]; viewer: "STUDENT" | "STAFF" }) {
  if (!items.length) return null;
  return (
    <ul className="space-y-1.5">
      {items.map((a) => {
        const Icon = a.mime.startsWith("image/") ? FileImage : a.mime === "application/pdf" ? FileText : Paperclip;
        return (
          <li key={a.id}>
            <a href={`/api/attachments/${a.id}`} className="flex items-center gap-3 rounded-xl border border-line px-3 py-2 hover:border-primary">
              <Icon className="h-5 w-5 shrink-0 text-accent-text" aria-hidden />
              <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{a.fileName}</span>
                <span className="block text-xs text-muted">{sz(a.size)} · {a.uploaderRole === "STUDENT" ? (viewer === "STUDENT" ? "вы" : "студент") : "деканат"} · {fmt.dateTime(a.createdAt)}</span></span>
              <span className="shrink-0 text-xs font-semibold text-primary dark:text-accent-text">Скачать</span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
