import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell, ErrorState, LoadingState, PageHeader } from "@/components/AppShell";
import { Notice, PredictionDisclaimer } from "@/components/Disclaimer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isValidCycle } from "@/lib/cycle";
import { useUpdateProfile } from "@/lib/data";
import { friendlyError } from "@/lib/labels";
import { fmtDay, fmtRange, useCycleSummary } from "@/lib/useCycle";

export const Route = createFileRoute("/_authenticated/ciclo")({
  head: () => ({
    meta: [
      { title: "Meu ciclo — Cíclica" },
      { name: "description", content: "Histórico dos seus ciclos, duração média e estimativas." },
      { property: "og:title", content: "Meu ciclo — Cíclica" },
      { property: "og:description", content: "Histórico dos seus ciclos, duração média e estimativas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Ciclo,
});

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-3xl bg-card p-5 shadow-soft">
      <p className="text-sm font-bold text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-3xl">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function TypicalLengthForm({ current, profileId }: { current: number | null; profileId: string }) {
  const [value, setValue] = useState(current ? String(current) : "");
  const [error, setError] = useState<string | null>(null);
  const update = useUpdateProfile();
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(value);
    if (!Number.isInteger(n) || n < 15 || n > 60) return setError("Informe um número entre 15 e 60 dias.");
    setError(null);
    try {
      await update.mutateAsync({ id: profileId, typical_cycle_length: n });
      toast.success("Duração habitual salva.");
    } catch (err) {
      toast.error(friendlyError(err));
    }
  };
  return (
    <form onSubmit={submit} noValidate className="mt-3 flex flex-wrap items-end gap-3">
      <div className="space-y-1.5">
        <Label htmlFor="typical">Duração habitual do ciclo (dias)</Label>
        <Input id="typical" inputMode="numeric" value={value} onChange={(e) => setValue(e.target.value)} placeholder="Ex.: 28" className="h-11 w-36 rounded-xl" />
      </div>
      <Button type="submit" className="h-11 rounded-full" disabled={update.isPending}>
        Salvar
      </Button>
      {error && <p className="w-full text-sm font-semibold text-destructive" role="alert">{error}</p>}
    </form>
  );
}

function Ciclo() {
  const { summary, profile, showFertile, isLoading, isError, refetch } = useCycleSummary();
  if (isLoading) return <AppShell><LoadingState /></AppShell>;
  if (isError || !profile) return <AppShell><ErrorState onRetry={refetch} /></AppShell>;

  const { periods, cycles, next } = summary;
  const recentCycles = cycles.slice(-6);
  const maxLen = Math.max(35, ...recentCycles.map((c) => c.length));
  const history = [...periods].reverse();
  const cycleByStart = new Map(cycles.map((c) => [c.start, c]));

  return (
    <AppShell>
      <PageHeader title="Meu ciclo" subtitle="Seu histórico e as estimativas calculadas a partir dele." />

      {periods.length === 0 ? (
        <div className="rounded-3xl bg-card p-6 shadow-soft">
          <h2 className="text-xl font-medium">Ainda não há registros</h2>
          <p className="mt-2 text-muted-foreground">
            Registre sua menstruação no{" "}
            <Link to="/calendario" className="font-semibold text-primary hover:underline">calendário</Link> para ver seu histórico.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat
              label="Duração média do ciclo"
              value={summary.avgCycleLength ? `${summary.avgCycleLength} dias` : "—"}
              hint={
                summary.basis === "historico"
                  ? `Com base em ${summary.validCycleCount} ${summary.validCycleCount === 1 ? "ciclo" : "ciclos"}`
                  : summary.basis === "preferencia"
                    ? "Informada por você"
                    : "Registre mais um ciclo"
              }
            />
            <Stat
              label="Duração média do sangramento"
              value={summary.avgPeriodLength ? `${summary.avgPeriodLength} dias` : "—"}
              hint={`Com base em ${Math.min(periods.length, 6)} ${periods.length === 1 ? "registro" : "registros"}`}
            />
            <Stat label="Próxima menstruação" value={next ? fmtDay(next.periodStart) : "—"} hint="Estimativa" />
            {showFertile && (
              <Stat
                label="Ovulação estimada"
                value={next ? fmtDay(next.ovulation) : "—"}
                hint={next ? `Período fértil: ${fmtRange(next.fertileStart, next.fertileEnd)}` : "Estimativa"}
              />
            )}
          </div>

          {(summary.basis !== "historico" || summary.lowConfidence) && (
            <div className="mt-4 rounded-3xl bg-rose-light p-5">
              <p className="font-bold">
                {summary.basis === null ? "Precisamos de mais informações" : "Estimativas ainda pouco precisas"}
              </p>
              <p className="mt-1 text-sm text-foreground/80">
                {summary.basis === null
                  ? "Para estimar a próxima menstruação, registre pelo menos duas menstruações ou informe quantos dias costuma durar o seu ciclo."
                  : "Com poucos ciclos registrados, as estimativas podem ser imprecisas. Elas ficam mais confiáveis à medida que você registra mais ciclos."}
              </p>
              {summary.basis !== "historico" && (
                <TypicalLengthForm current={profile.typical_cycle_length} profileId={profile.id} />
              )}
            </div>
          )}

          {summary.irregular && (
            <Notice className="mt-4" tone="rose">
              A duração dos seus ciclos variou mais de 7 dias entre os registros. Isso pode acontecer e torna as
              estimativas menos precisas. Se as variações forem frequentes ou preocuparem você, converse com um
              profissional de saúde.
            </Notice>
          )}

          {recentCycles.length > 0 && (
            <section className="mt-8 rounded-3xl bg-card p-5 shadow-soft md:p-6">
              <h2 className="text-xl font-medium">Comparação entre ciclos</h2>
              <ul className="mt-4 space-y-3">
                {recentCycles.map((c) => (
                  <li key={c.start}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="font-semibold">{fmtDay(c.start, "d MMM yyyy")}</span>
                      <span className="text-muted-foreground">
                        {c.length} dias{!isValidCycle(c) && " · fora da média"}
                      </span>
                    </div>
                    <div className="flex h-3 overflow-hidden rounded-full bg-muted" role="img" aria-label={`Ciclo de ${c.length} dias com ${c.periodLength} dias de sangramento`}>
                      <div className="bg-period" style={{ width: `${(c.periodLength / maxLen) * 100}%` }} />
                      <div className="bg-rose-pastel/60" style={{ width: `${((c.length - c.periodLength) / maxLen) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-muted-foreground">
                Rosa forte: dias de sangramento. Intervalos acima de 60 dias não entram na média, pois podem indicar
                falta de registro.
              </p>
            </section>
          )}

          <section className="mt-8">
            <h2 className="text-xl font-medium">Histórico</h2>
            <ul className="mt-3 divide-y overflow-hidden rounded-3xl bg-card shadow-soft">
              {history.map((p, i) => {
                const cycle = cycleByStart.get(p.start);
                return (
                  <li key={p.start} className="flex flex-wrap items-center justify-between gap-2 px-5 py-4">
                    <div>
                      <p className="font-semibold">{fmtRange(p.start, p.end)}</p>
                      <p className="text-sm text-muted-foreground">
                        Sangramento: {p.length} {p.length === 1 ? "dia" : "dias"}
                      </p>
                    </div>
                    <span className="rounded-full bg-lilac px-3 py-1 text-sm font-semibold">
                      {cycle ? `Ciclo de ${cycle.length} dias` : i === 0 ? "Ciclo atual" : "—"}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        </>
      )}

      <PredictionDisclaimer className="mt-8" />
      <p className="mt-3 text-sm text-muted-foreground">
        O Cíclica não faz previsões sobre fertilidade individual e não indica se você está ou não grávida. Em caso de
        dúvida, procure um profissional de saúde.
      </p>
    </AppShell>
  );
}
