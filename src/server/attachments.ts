import "server-only";
import { asc, count, eq } from "drizzle-orm";
import { db, schema as t } from "@/server/db";

/** Правила вложений: только документы и фото, проверка по содержимому (сигнатуре), а не по расширению. */
export const ATTACH_LIMITS = { maxFileBytes: 5 * 1024 * 1024, maxPerUpload: 3, maxPerRequest: 10 } as const;
export const ATTACH_ACCEPT = ".pdf,.jpg,.jpeg,.png,.docx";

function sniff(buf: Buffer, name: string): string | null {
  if (buf.subarray(0, 5).toString("latin1") === "%PDF-") return "application/pdf";
  if (buf[0] === 0x89 && buf.subarray(1, 4).toString("latin1") === "PNG") return "image/png";
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  // DOCX — это ZIP-архив; принимаем только с расширением .docx
  if (buf[0] === 0x50 && buf[1] === 0x4b && /\.docx$/i.test(name)) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  return null;
}

/** Имя файла без путей и управляющих символов. */
const cleanName = (n: string) => n.replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_").replace(/^\.+/, "").slice(-120) || "файл";

export type ReadyFile = { fileName: string; mime: string; size: number; data: Buffer };

/** Проверяет файлы из FormData. Пустые поля (файл не выбран) пропускаются. */
export async function readUploads(entries: FormDataEntryValue[]): Promise<{ ok: true; files: ReadyFile[] } | { ok: false; error: string }> {
  const files = entries.filter((e): e is File => typeof e === "object" && "arrayBuffer" in e && e.size > 0);
  if (files.length > ATTACH_LIMITS.maxPerUpload) return { ok: false, error: `Можно приложить не больше ${ATTACH_LIMITS.maxPerUpload} файлов за раз` };
  const out: ReadyFile[] = [];
  for (const f of files) {
    if (f.size > ATTACH_LIMITS.maxFileBytes) return { ok: false, error: `Файл «${cleanName(f.name)}» больше 5 МБ` };
    const data = Buffer.from(await f.arrayBuffer());
    const mime = sniff(data, f.name);
    if (!mime) return { ok: false, error: `Файл «${cleanName(f.name)}»: подходят только PDF, JPG, PNG или DOCX` };
    out.push({ fileName: cleanName(f.name), mime, size: data.length, data });
  }
  return { ok: true, files: out };
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function saveAttachments(tx: Tx, requestId: string, role: "STUDENT" | "STAFF", files: ReadyFile[]) {
  if (!files.length) return;
  const [r] = await tx.select({ n: count() }).from(t.attachments).where(eq(t.attachments.requestId, requestId));
  if ((r?.n ?? 0) + files.length > ATTACH_LIMITS.maxPerRequest) throw new AttachmentLimitError();
  await tx.insert(t.attachments).values(files.map((f) => ({ requestId, uploaderRole: role, ...f })));
}

export class AttachmentLimitError extends Error {
  constructor() { super(`К одной заявке — не больше ${ATTACH_LIMITS.maxPerRequest} файлов`); }
}

/** Список вложений без содержимого. Вызывать только ПОСЛЕ проверки доступа к заявке. */
export function listAttachmentsMeta(requestId: string) {
  return db.select({ id: t.attachments.id, fileName: t.attachments.fileName, mime: t.attachments.mime, size: t.attachments.size, uploaderRole: t.attachments.uploaderRole, createdAt: t.attachments.createdAt })
    .from(t.attachments).where(eq(t.attachments.requestId, requestId)).orderBy(asc(t.attachments.createdAt));
}

export const fmtSize = (n: number) => (n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} КБ` : `${(n / 1024 / 1024).toFixed(1).replace(".", ",")} МБ`);
