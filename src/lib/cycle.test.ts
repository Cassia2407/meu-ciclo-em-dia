import { describe, expect, it } from "vitest";
import { daysBetween, groupPeriods, marksForDay, summarizeCycles } from "./cycle";

const today = new Date(2026, 9, 10); // 10 Oct 2026

describe("estimativas do ciclo", () => {
  it("agrupa dias seguidos de sangramento em uma menstruação", () => {
    const periods = groupPeriods(["2026-09-01", "2026-09-02", "2026-09-03", "2026-09-29"]);
    expect(periods).toEqual([
      { start: "2026-09-01", end: "2026-09-03", length: 3 },
      { start: "2026-09-29", end: "2026-09-29", length: 1 },
    ]);
  });

  it("sem histórico suficiente e sem duração informada, não faz previsões", () => {
    const s = summarizeCycles(daysBetween("2026-10-01", "2026-10-05"), {}, today);
    expect(s.next).toBeNull();
    expect(s.cycleDay).toBe(10);
  });

  it("com uma menstruação e duração habitual informada, usa a informação da usuária", () => {
    const s = summarizeCycles(daysBetween("2026-10-01", "2026-10-05"), { typicalCycleLength: 30 }, today);
    expect(s.basis).toBe("preferencia");
    expect(s.next?.periodStart).toBe("2026-10-31");
    expect(s.lowConfidence).toBe(true);
  });

  it("próxima menstruação = último início + média dos ciclos; ovulação 14 dias antes; fértil de -5 a +1", () => {
    const dates = [
      ...daysBetween("2026-08-04", "2026-08-08"),
      ...daysBetween("2026-09-01", "2026-09-05"), // ciclo de 28
      ...daysBetween("2026-09-29", "2026-10-03"), // ciclo de 28
    ];
    const s = summarizeCycles(dates, {}, today);
    expect(s.avgCycleLength).toBe(28);
    expect(s.avgPeriodLength).toBe(5);
    expect(s.next).toEqual({
      periodStart: "2026-10-27",
      periodEnd: "2026-10-31",
      ovulation: "2026-10-13",
      fertileStart: "2026-10-08",
      fertileEnd: "2026-10-14",
    });
    expect(s.cycleDay).toBe(12);
  });

  it("ignora intervalos acima de 60 dias (falta de registro) no cálculo da média", () => {
    const dates = ["2026-01-01", "2026-05-01", "2026-05-29"];
    const s = summarizeCycles(dates, {}, today);
    expect(s.avgCycleLength).toBe(28);
    expect(s.validCycleCount).toBe(1);
  });

  it("marca ciclos que variam mais de 7 dias como irregulares", () => {
    const dates = ["2026-06-01", "2026-06-25", "2026-07-30"]; // 24 e 35 dias
    expect(summarizeCycles(dates, {}, today).irregular).toBe(true);
  });

  it("oculta período fértil e ovulação quando a preferência está desligada", () => {
    const s = summarizeCycles(["2026-09-01", "2026-09-29"], {}, today);
    const ovu = s.next!.ovulation;
    expect(marksForDay(ovu, s.projections, true).ovulation).toBe(true);
    expect(marksForDay(ovu, s.projections, false).ovulation).toBe(false);
  });
});
