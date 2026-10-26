import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { marksForDay, toKey, type Projection } from "@/lib/cycle";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

type Props = {
  month: Date;
  onMonthChange: (d: Date) => void;
  selected: string | null;
  onSelect: (key: string) => void;
  bleeding: Set<string>;
  withSymptoms: Set<string>;
  projections: Projection[];
  showFertile: boolean;
};

export function MonthCalendar({
  month,
  onMonthChange,
  selected,
  onSelect,
  bleeding,
  withSymptoms,
  projections,
  showFertile,
}: Props) {
  const todayKey = toKey(new Date());
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
  const days: Date[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) days.push(d);

  return (
    <div className="rounded-3xl bg-card p-4 shadow-soft md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onMonthChange(addMonths(month, -1))}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-secondary"
          aria-label="Mês anterior"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="font-display text-xl font-medium capitalize" aria-live="polite">
          {format(month, "MMMM 'de' yyyy", { locale: ptBR })}
        </h2>
        <button
          type="button"
          onClick={() => onMonthChange(addMonths(month, 1))}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-secondary"
          aria-label="Próximo mês"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-1">
            {w}
          </div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {days.map((d) => {
          const key = toKey(d);
          const inMonth = isSameMonth(d, month);
          const isToday = key === todayKey;
          const isSelected = key === selected;
          const recorded = bleeding.has(key);
          const marks = marksForDay(key, projections, showFertile);
          const predicted = !recorded && marks.predictedPeriod && key >= todayKey;
          const ovulation = !recorded && marks.ovulation;
          const fertile = !recorded && !ovulation && marks.fertile;
          const hasSymptoms = withSymptoms.has(key);

          const desc = [
            format(d, "d 'de' MMMM", { locale: ptBR }),
            recorded && "menstruação registrada",
            predicted && "menstruação estimada",
            ovulation && "ovulação estimada",
            fertile && "período fértil estimado",
            hasSymptoms && "com sintomas registrados",
            isToday && "hoje",
          ]
            .filter(Boolean)
            .join(", ");

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              aria-label={desc}
              aria-pressed={isSelected}
              className={cn(
                "relative flex aspect-square items-center justify-center rounded-full text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                !inMonth && "opacity-35",
                recorded && "bg-period text-period-foreground",
                ovulation && "bg-ovulation text-ovulation-foreground",
                fertile && "bg-fertile text-fertile-foreground",
                predicted && "border-2 border-dashed border-rose-medium",
                !recorded && !ovulation && !fertile && "hover:bg-muted",
                isToday && "ring-2 ring-foreground/70 ring-offset-2 ring-offset-card",
                isSelected && "scale-105 ring-2 ring-primary ring-offset-2 ring-offset-card",
              )}
            >
              {format(d, "d")}
              {hasSymptoms && (
                <span
                  className={cn(
                    "absolute bottom-1 h-1.5 w-1.5 rounded-full",
                    recorded || ovulation ? "bg-card" : "bg-primary",
                  )}
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function CalendarLegend({ showFertile }: { showFertile: boolean }) {
  const items = [
    { swatch: "bg-period", label: "Menstruação registrada" },
    { swatch: "border-2 border-dashed border-rose-medium", label: "Menstruação estimada" },
    ...(showFertile
      ? [
          { swatch: "bg-fertile", label: "Período fértil estimado" },
          { swatch: "bg-ovulation", label: "Ovulação estimada" },
        ]
      : []),
    { swatch: "ring-2 ring-foreground/70", label: "Hoje" },
    { swatch: "relative after:absolute after:inset-0 after:m-auto after:h-1.5 after:w-1.5 after:rounded-full after:bg-primary", label: "Sintomas registrados" },
  ];
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-foreground sm:grid-cols-3" aria-label="Legenda do calendário">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-2">
          <span className={cn("inline-block h-4 w-4 shrink-0 rounded-full", i.swatch)} aria-hidden="true" />
          {i.label}
        </li>
      ))}
    </ul>
  );
}
