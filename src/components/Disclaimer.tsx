import { Info } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Notice({ children, className, tone = "lilac" }: { children: ReactNode; className?: string; tone?: "lilac" | "rose" }) {
  return (
    <div
      className={cn(
        "flex gap-3 rounded-2xl p-4 text-sm leading-relaxed text-foreground",
        tone === "lilac" ? "bg-lilac" : "bg-rose-light",
        className,
      )}
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-lilac-deep" aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}

export function PredictionDisclaimer({ className }: { className?: string }) {
  return (
    <Notice className={className}>
      As datas de ovulação, período fértil e próxima menstruação são <strong>estimativas</strong> calculadas
      a partir dos seus registros. Ciclos irregulares e variações individuais podem alterar as previsões.
      <strong> O calendário não é um método contraceptivo confiável</strong> e não deve ser usado sozinho
      para evitar uma gravidez.
    </Notice>
  );
}
