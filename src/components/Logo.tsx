import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" className={cn("h-9 w-9", className)}>
      <circle cx="20" cy="20" r="19" className="fill-rose-light" />
      <circle cx="20" cy="20" r="12.5" fill="none" strokeWidth="3" strokeDasharray="5 3.2" strokeLinecap="round" className="stroke-rose-medium" />
      <path d="M20 12.5c3.6 4.3 5.4 7.4 5.4 9.7a5.4 5.4 0 0 1-10.8 0c0-2.3 1.8-5.4 5.4-9.7Z" className="fill-rose-deep" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark />
      <span className="font-display text-2xl font-semibold tracking-tight text-foreground">Cíclica</span>
    </span>
  );
}
