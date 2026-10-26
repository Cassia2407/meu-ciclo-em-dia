import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Chip({
  selected,
  onClick,
  children,
  className,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground hover:bg-secondary",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function ChipGroup<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly { value: T; label: string }[];
  value: T | null;
  onChange: (v: T | null) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => (
        <Chip key={o.value} selected={value === o.value} onClick={() => onChange(value === o.value ? null : o.value)}>
          {o.label}
        </Chip>
      ))}
    </div>
  );
}
