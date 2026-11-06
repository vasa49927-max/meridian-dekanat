import { cn } from "@/lib/cn";

/** Сгенерированный аватар: инициалы на градиенте с «меридианами». Без фотографий реальных людей. */
export function Avatar({ name, hue = 220, size = 40, className }: { name: string; hue?: number; size?: number; className?: string }) {
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  const id = `av-${hue}-${initials}`;
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className={cn("shrink-0 rounded-full", className)} role="img" aria-label={`Аватар: ${name}`}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={`hsl(${hue} 45% 32%)`} />
          <stop offset="1" stopColor={`hsl(${(hue + 40) % 360} 50% 22%)`} />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="20" fill={`url(#${id})`} />
      <path d="M20 2c-6 4.5-9 10.5-9 18s3 13.5 9 18M20 2c6 4.5 9 10.5 9 18s-3 13.5-9 18" stroke="white" strokeOpacity=".14" fill="none" />
      <text x="20" y="25" textAnchor="middle" fontSize="14" fontWeight="700" fill="#F8F4EA" fontFamily="Golos Text, sans-serif">{initials}</text>
    </svg>
  );
}
