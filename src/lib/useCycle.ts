import { useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { parseLocalDate } from "./age";
import { summarizeCycles } from "./cycle";
import { useMenstrualRecords, useProfile } from "./data";

export function useCycleSummary() {
  const profile = useProfile();
  const menstrual = useMenstrualRecords();
  const summary = useMemo(
    () =>
      summarizeCycles(
        (menstrual.data ?? []).map((r) => r.record_date),
        {
          typicalCycleLength: profile.data?.typical_cycle_length,
          typicalPeriodLength: profile.data?.typical_period_length,
        },
        new Date(),
      ),
    [menstrual.data, profile.data],
  );
  return {
    summary,
    profile: profile.data,
    showFertile: profile.data?.show_fertile_window ?? true,
    isLoading: profile.isLoading || menstrual.isLoading,
    isError: profile.isError || menstrual.isError,
    refetch: () => {
      profile.refetch();
      menstrual.refetch();
    },
  };
}

export function fmtDay(key: string, pattern = "d 'de' MMM") {
  const d = parseLocalDate(key);
  return d ? format(d, pattern, { locale: ptBR }) : key;
}

export function fmtRange(a: string, b: string) {
  return a === b ? fmtDay(a) : `${fmtDay(a)} – ${fmtDay(b)}`;
}
