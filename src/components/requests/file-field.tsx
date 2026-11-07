"use client";
import { useId, useRef, useState } from "react";
import { Paperclip, X } from "lucide-react";

const ACCEPT = ".pdf,.jpg,.jpeg,.png,.docx";
const MAX = 3;
const size = (n: number) => (n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} КБ` : `${(n / 1024 / 1024).toFixed(1).replace(".", ",")} МБ`);

/** Поле вложений: до 3 файлов, PDF/JPG/PNG/DOCX, до 5 МБ. Окончательная проверка — на сервере. */
export function FileField({ label = "Вложения", hint, error }: { label?: string; hint?: string; error?: string }) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const sync = (list: File[]) => {
    setFiles(list);
    const dt = new DataTransfer();
    list.forEach((f) => dt.items.add(f));
    if (input.current) input.current.files = dt.files;
  };
  const tooBig = files.find((f) => f.size > 5 * 1024 * 1024);
  return (
    <div>
      <p className="mb-1.5 text-sm font-semibold" id={`${id}-l`}>{label}</p>
      <label htmlFor={id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-line bg-bg px-3.5 py-3 hover:border-primary has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[var(--focus)]">
        <Paperclip className="h-5 w-5 shrink-0 text-accent-text" aria-hidden />
        <span className="text-sm"><b>Выбрать файлы</b><span className="block text-xs text-muted">{hint ?? "PDF, JPG, PNG или DOCX · до 3 файлов по 5 МБ"}</span></span>
        <input ref={input} id={id} name="files" type="file" multiple accept={ACCEPT} className="sr-only" aria-labelledby={`${id}-l`}
          onChange={(e) => sync([...files, ...Array.from(e.target.files ?? [])].slice(0, MAX))} />
      </label>
      {files.length > 0 && (
        <ul className="mt-2 space-y-1.5">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center gap-2 rounded-lg bg-surface-2 px-3 py-1.5 text-sm">
              <span className="min-w-0 flex-1 truncate">{f.name}</span>
              <span className="shrink-0 text-xs text-muted">{size(f.size)}</span>
              <button type="button" onClick={() => sync(files.filter((_, j) => j !== i))} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-surface" aria-label={`Убрать файл ${f.name}`}><X className="h-4 w-4" aria-hidden /></button>
            </li>
          ))}
        </ul>
      )}
      {(error || tooBig) && <p className="mt-1.5 text-[13px] font-medium text-danger" role="alert">{error ?? `Файл «${tooBig!.name}» больше 5 МБ`}</p>}
    </div>
  );
}
