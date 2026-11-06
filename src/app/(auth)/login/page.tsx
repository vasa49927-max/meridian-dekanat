import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CalendarDays, FileCheck2, GraduationCap, Sparkles } from "lucide-react";
import { getViewer } from "@/server/auth/guards";
import { LogoMark } from "@/components/logo";
import { Disclaimer } from "@/components/shell/disclaimer";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Вход" };

const FEATURES = [
  { icon: CalendarDays, text: "Расписание с переносами «было → стало»" },
  { icon: GraduationCap, text: "Баллы БРС и путь к «автомату»" },
  { icon: FileCheck2, text: "Справки онлайн с QR-проверкой" },
  { icon: Sparkles, text: "ИИ-помощник по правилам деканата" },
];

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; reset?: string }> }) {
  const v = await getViewer();
  if (v) redirect(v.role === "STAFF" ? "/staff" : "/");
  const { next, reset } = await searchParams;
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_minmax(480px,560px)]">
      <section className="relative hidden overflow-hidden bg-hero p-12 text-hero-fg lg:flex lg:flex-col" aria-label="О сервисе">
        <svg className="absolute -right-40 -top-24 h-[720px] w-[720px] opacity-[0.08]" viewBox="0 0 40 40" aria-hidden>
          <circle cx="20" cy="20" r="17" fill="none" stroke="currentColor" strokeWidth=".4" />
          <path d="M20 3c-6.5 4.5-9.5 10.2-9.5 17s3 12.5 9.5 17M20 3c6.5 4.5 9.5 10.2 9.5 17s-3 12.5-9.5 17M3 20h34M5 26h30M5 14h30" fill="none" stroke="currentColor" strokeWidth=".4" />
        </svg>
        <div className="flex items-center gap-3"><LogoMark className="h-10 w-10" /><span className="font-serif text-2xl font-bold">Меридиан</span></div>
        <div className="mt-auto max-w-lg">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-accent">Цифровой деканат будущего</p>
          <h1 className="font-serif text-5xl leading-[1.08]">Вся учёба — в одном месте и за пару касаний</h1>
          <ul className="mt-10 grid gap-4">
            {FEATURES.map((f) => (
              <li key={f.text} className="flex items-center gap-3 text-lg text-hero-fg/90"><span className="grid h-10 w-10 place-items-center rounded-xl bg-hero-2"><f.icon className="h-5 w-5 text-accent" aria-hidden /></span>{f.text}</li>
            ))}
          </ul>
        </div>
      </section>
      <main className="flex flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-primary lg:invisible dark:text-fg"><LogoMark className="h-9 w-9" /><span className="font-serif text-xl font-bold">Меридиан</span></span>
          <ThemeToggle />
        </div>
        <div className="mx-auto my-auto w-full max-w-md py-8">
          <h1 className="font-serif text-3xl lg:text-[34px]">Вход в кабинет</h1>
          <p className="mb-6 mt-2 text-muted">Студенты и сотрудники деканата — по логину и паролю.</p>
          {reset && <p role="status" className="mb-4 rounded-xl bg-ok-bg px-3.5 py-2.5 text-sm font-medium text-ok">Демо-данные пересозданы. Войдите снова.</p>}
          <LoginForm next={next} />
        </div>
        <Disclaimer className="mx-auto w-full max-w-md" />
      </main>
    </div>
  );
}
