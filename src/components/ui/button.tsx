import { cva, type VariantProps } from "class-variance-authority";
import Link from "next/link";
import { cn } from "@/lib/cn";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none select-none whitespace-nowrap",
  {
    variants: {
      variant: {
        primary: "btn-primary bg-primary text-primary-fg",
        secondary: "control bg-surface text-fg border border-line hover:bg-surface-2",
        ghost: "text-fg hover:bg-surface-2",
        danger: "control bg-danger-bg text-danger border border-danger/30 hover:opacity-90",
        soft: "bg-primary-soft text-primary hover:opacity-90 dark:text-accent-text",
      },
      size: { sm: "h-9 px-3 text-sm", md: "h-11 px-4 text-[15px]", lg: "h-12 px-5 text-base", icon: "h-11 w-11" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;
export function Button({ className, variant, size, ...p }: BtnProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...p} />;
}

type LinkBtnProps = React.ComponentProps<typeof Link> & VariantProps<typeof buttonVariants>;
export function LinkButton({ className, variant, size, ...p }: LinkBtnProps) {
  return <Link className={cn(buttonVariants({ variant, size }), className)} {...p} />;
}
