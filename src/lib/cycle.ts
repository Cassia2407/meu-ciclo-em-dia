import { addDays, differenceInCalendarDays, format } from "date-fns";
import { parseLocalDate } from "./age";

export const toKey = (d: Date) => format(d, "yyyy-MM-dd");
const fromKey = (k: string) => parseLocalDate(k)!;

/** Cycles shorter or longer than this are treated as gaps in the records, not real cycles. */
export const MIN_VALID_CYCLE = 15;
export const MAX_VALID_CYCLE = 60;
/** Days counted back from the next period to estimate ovulation. */
export const LUTEAL_DAYS = 14;
/** Fertile window: 5 days before ovulation through 1 day after. */
export const FERTILE_BEFORE = 5;
export const FERTILE_AFTER = 1;
/** Bleeding days separated by at most this many calendar days belong to the same period. */
const MAX_GAP_IN_PERIOD = 2;
const HISTORY_FOR_AVERAGE = 6;

export type Period = { start: string; end: string; length: number };
export type Cycle = { start: string; end: string; length: number; periodLength: number };

export function groupPeriods(bleedingDates: string[]): Period[] {
  const sorted = Array.from(new Set(bleedingDates)).sort();
  const periods: Period[] = [];
  for (const key of sorted) {
    const last = periods[periods.length - 1];
    if (last && differenceInCalendarDays(fromKey(key), fromKey(last.end)) <= MAX_GAP_IN_PERIOD) {
      last.end = key;
      last.length = differenceInCalendarDays(fromKey(key), fromKey(last.start)) + 1;
    } else {
      periods.push({ start: key, end: key, length: 1 });
    }
  }
  return periods;
}

export function buildCycles(periods: Period[]): Cycle[] {
  const cycles: Cycle[] = [];
  for (let i = 0; i < periods.length - 1; i++) {
    const start = fromKey(periods[i].start);
    const next = fromKey(periods[i + 1].start);
    cycles.push({
      start: periods[i].start,
      end: toKey(addDays(next, -1)),
      length: differenceInCalendarDays(next, start),
      periodLength: periods[i].length,
    });
  }
  return cycles;
}

export const isValidCycle = (c: Cycle) =>
  c.length >= MIN_VALID_CYCLE && c.length <= MAX_VALID_CYCLE;

export type Projection = {
  periodStart: string;
  periodEnd: string;
  ovulation: string;
  fertileStart: string;
  fertileEnd: string;
};

export type CycleSummary = {
  periods: Period[];
  cycles: Cycle[];
  lastPeriod: Period | null;
  avgCycleLength: number | null;
  avgPeriodLength: number | null;
  /** Where the cycle length used in predictions came from. */
  basis: "historico" | "preferencia" | null;
  validCycleCount: number;
  lowConfidence: boolean;
  irregular: boolean;
  cycleDay: number | null;
  next: Projection | null;
  /** Days past the estimated start of the next period (only when > 0). */
  daysLate: number;
  projections: Projection[];
};

export type CyclePrefs = {
  typicalCycleLength?: number | null;
  typicalPeriodLength?: number | null;
};

function project(lastStart: Date, cycleLength: number, periodLength: number, k: number, prevPeriodEnd: Date): Projection {
  const start = addDays(lastStart, cycleLength * k);
  const ovulation = addDays(start, -LUTEAL_DAYS);
  let fertileStart = addDays(ovulation, -FERTILE_BEFORE);
  if (fertileStart <= prevPeriodEnd) fertileStart = addDays(prevPeriodEnd, 1);
  return {
    periodStart: toKey(start),
    periodEnd: toKey(addDays(start, periodLength - 1)),
    ovulation: toKey(ovulation),
    fertileStart: toKey(fertileStart),
    fertileEnd: toKey(addDays(ovulation, FERTILE_AFTER)),
  };
}

export function summarizeCycles(
  bleedingDates: string[],
  prefs: CyclePrefs = {},
  today: Date = new Date(),
  projectionCount = 3,
): CycleSummary {
  const periods = groupPeriods(bleedingDates);
  const cycles = buildCycles(periods);
  const valid = cycles.filter(isValidCycle).slice(-HISTORY_FOR_AVERAGE);
  const lastPeriod = periods[periods.length - 1] ?? null;

  let avgCycleLength: number | null = null;
  let basis: CycleSummary["basis"] = null;
  if (valid.length > 0) {
    avgCycleLength = Math.round(valid.reduce((s, c) => s + c.length, 0) / valid.length);
    basis = "historico";
  } else if (prefs.typicalCycleLength) {
    avgCycleLength = prefs.typicalCycleLength;
    basis = "preferencia";
  }

  const recentPeriods = periods.slice(-HISTORY_FOR_AVERAGE);
  const avgPeriodLength =
    recentPeriods.length > 0
      ? Math.round(recentPeriods.reduce((s, p) => s + p.length, 0) / recentPeriods.length)
      : prefs.typicalPeriodLength ?? null;

  const lengths = valid.map((c) => c.length);
  const irregular =
    lengths.length >= 2 && Math.max(...lengths) - Math.min(...lengths) > 7;

  let cycleDay: number | null = null;
  const projections: Projection[] = [];
  let daysLate = 0;

  if (lastPeriod) {
    const lastStart = fromKey(lastPeriod.start);
    const diff = differenceInCalendarDays(today, lastStart);
    if (diff >= 0 && diff < 90) cycleDay = diff + 1;

    if (avgCycleLength) {
      const periodLen = Math.max(1, avgPeriodLength ?? 5);
      let prevEnd = fromKey(lastPeriod.end);
      for (let k = 1; k <= projectionCount; k++) {
        const p = project(lastStart, avgCycleLength, periodLen, k, prevEnd);
        projections.push(p);
        prevEnd = fromKey(p.periodEnd);
      }
      const late = differenceInCalendarDays(today, fromKey(projections[0].periodStart));
      if (late > 0) daysLate = late;
    }
  }

  return {
    periods,
    cycles,
    lastPeriod,
    avgCycleLength,
    avgPeriodLength,
    basis,
    validCycleCount: valid.length,
    lowConfidence: basis === "preferencia" || valid.length < 3,
    irregular,
    cycleDay,
    next: projections[0] ?? null,
    daysLate,
    projections,
  };
}

export type DayMarks = {
  predictedPeriod: boolean;
  fertile: boolean;
  ovulation: boolean;
};

export function marksForDay(key: string, projections: Projection[], showFertile: boolean): DayMarks {
  const marks: DayMarks = { predictedPeriod: false, fertile: false, ovulation: false };
  for (const p of projections) {
    if (key >= p.periodStart && key <= p.periodEnd) marks.predictedPeriod = true;
    if (showFertile) {
      if (key === p.ovulation) marks.ovulation = true;
      else if (key >= p.fertileStart && key <= p.fertileEnd) marks.fertile = true;
    }
  }
  return marks;
}

/** All calendar days between two keys, inclusive. */
export function daysBetween(startKey: string, endKey: string): string[] {
  const start = fromKey(startKey);
  const total = differenceInCalendarDays(fromKey(endKey), start);
  return Array.from({ length: total + 1 }, (_, i) => toKey(addDays(start, i)));
}
