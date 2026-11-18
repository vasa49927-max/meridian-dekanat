import Link from "next/link";
import { cn } from "@/lib/cn";

/** Вкладки «Успеваемости»: текущий семестр, зачётка, курсы по выбору (раунд 8). */
export function GradesTabs({ active, labels }: { active: "current" | "record" | "electives"; labels: { aria: string; current: string; record: string; electives: string } }) {
  const tabs = [
    { key: "current", href: "/grades", label: labels.current },
    { key: "record", href: "/grades?tab=record", label: labels.record },
    { key: "electives", href: "/grades/electives", label: labels.electives },
  ] as const;
  return (
    <div className="mb-4">
      {/* На телефоне — три равные вкладки на всю ширину с переносом (раньше третья обрезалась краем экрана) */}
      <nav aria-label={labels.aria} className="seg flex w-full rounded-xl border border-line p-1 sm:inline-flex sm:w-auto">
        {tabs.map((x) => (
          <Link key={x.key} aria-current={active === x.key ? "page" : undefined} href={x.href}
            className={cn("flex flex-1 items-center justify-center rounded-lg px-2 py-1.5 text-center text-[13px] font-semibold leading-tight sm:flex-none sm:whitespace-nowrap sm:px-4 sm:text-sm", active === x.key ? "bg-primary text-primary-fg" : "text-muted hover:text-fg")}>{x.label}</Link>
        ))}
      </nav>
    </div>
  );
}
