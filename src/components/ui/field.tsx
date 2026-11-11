import { cn } from "@/lib/cn";

const base = "control w-full rounded-xl border border-line bg-surface px-3.5 text-[15px] text-fg placeholder:text-muted/80 focus:border-primary focus:outline-none focus-visible:outline-2 aria-[invalid=true]:border-danger";

export function Input({ className, ...p }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(base, "h-11", className)} {...p} />;
}
export function Textarea({ className, ...p }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(base, "min-h-28 py-2.5", className)} {...p} />;
}
export function Select({ className, children, ...p }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  // [background-color:…] задаём отдельным свойством: tailwind-merge принимал картинку-стрелку за цвет фона и выбрасывал цвет поверхности —
  // у списка становился прозрачный фон, и Windows рисовал выпадающий список белым под светлым текстом тёмной темы (раунд 5).
  return <select className={cn(base, "[background-color:var(--surface)] h-11 appearance-none bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-9", "bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23888%22 stroke-width=%222%22><path d=%22m6 9 6 6 6-6%22/></svg>')]", className)} {...p}>{children}</select>;
}
export function Label({ className, ...p }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("mb-1.5 block text-sm font-semibold", className)} {...p} />;
}
export function FieldHint({ id, children, error }: { id?: string; children: React.ReactNode; error?: boolean }) {
  return <p id={id} className={cn("mt-1.5 text-[13px]", error ? "font-medium text-danger" : "text-muted")}>{children}</p>;
}
