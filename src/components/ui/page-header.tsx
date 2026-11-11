/** Заголовок страницы. Раунд 7б: латунная черта над заголовком — общий элемент всех разделов (как «листок календаря» на главной). */
export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3 max-sm:mb-4">
      <div className="min-w-0">
        <span aria-hidden className="mb-2.5 block h-[3px] w-9 rounded-full bg-gradient-to-r from-accent to-accent/30" />
        <h1 className="font-serif text-[26px] leading-tight lg:text-[34px]">{title}</h1>
        {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
