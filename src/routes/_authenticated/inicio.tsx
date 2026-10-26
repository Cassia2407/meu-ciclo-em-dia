import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { differenceInCalendarDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays, Droplet, LifeBuoy, Plus, Sparkles, Sun } from "lucide-react";
import { AppShell, ErrorState, LoadingState } from "@/components/AppShell";
import { DayLogDialog } from "@/components/DayLogDialog";
import { PeriodRangeDialog } from "@/components/PeriodRangeDialog";
import { PredictionDisclaimer } from "@/components/Disclaimer";
import { Button } from "@/components/ui/button";
import { parseLocalDate } from "@/lib/age";
import { toKey } from "@/lib/cycle";
import { useSymptomRecords } from "@/lib/data";
import { BLOATING_OPTIONS, CRAMPS_OPTIONS, symptomLabel } from "@/lib/labels";
import { fmtDay, fmtRange, useCycleSummary } from "@/lib/useCycle";

export const Route = createFileRoute("/_authenticated/inicio")({
  head: () => ({
    meta: [
      { title: "Início — Cíclica" },
      { name: "description", content: "Seu resumo do ciclo menstrual de hoje." },
      { property: "og:title", content: "Início — Cíclica" },
      { property: "og:description", content: "Seu resumo do ciclo menstrual de hoje." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Inicio,
});

function EstimateBadge() {
  return (
    <span className="rounded-full bg-lilac px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-lilac-deep">
      Estimativa
    </span>
  );
}

function Inicio() {
  const { summary, profile, showFertile, isLoading, isError, refetch } = useCycleSummary();
  const symptoms = useSymptomRecords();
  const [dayOpen, setDayOpen] = useState(false);
  const [periodOpen, setPeriodOpen] = useState(false);
  const today = new Date();
  const todayKey = toKey(today);

  if (isLoading) return <AppShell><LoadingState /></AppShell>;
  if (isError) return <AppShell><ErrorState onRetry={refetch} /></AppShell>;

  const firstName = profile?.full_name.split(" ")[0] ?? "";
  const hasData = summary.periods.length > 0;
  const next = summary.next;
  const daysToNext = next ? differenceInCalendarDays(parseLocalDate(next.periodStart)!, today) : null;
  const recentSymptoms = (symptoms.data ?? [])
    .filter((s) => differenceInCalendarDays(today, parseLocalDate(s.record_date)!) <= 7 && s.record_date <= todayKey)
    .slice(0, 4);

  return (
    <AppShell>
      <div className="mb-6">
        <p className="text-sm font-semibold capitalize text-muted-foreground">
          {format(today, "EEEE, d 'de' MMMM", { locale: ptBR })}
        </p>
        <h1 className="mt-1 text-3xl font-medium md:text-4xl">Olá, {firstName}</h1>
      </div>

      {!hasData ? (
        <section className="rounded-3xl bg-gradient-to-br from-rose-light to-lilac p-6 shadow-soft md:p-8">
          <h2 className="text-2xl font-medium">Vamos começar?</h2>
          <p className="mt-2 max-w-lg text-foreground/80">
            Registre sua última menstruação para que o Cíclica possa calcular estimativas do seu ciclo. Enquanto não
            houver registros, não mostramos previsões.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button className="h-11 rounded-full px-6" onClick={() => setPeriodOpen(true)}>
              <Droplet className="mr-1 h-4 w-4" /> Registrar menstruação
            </Button>
            <Button variant="outline" className="h-11 rounded-full bg-card px-6" onClick={() => setDayOpen(true)}>
              Registrar sintomas de hoje
            </Button>
          </div>
        </section>
      ) : (
        <>
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-light via-rose-light to-lilac p-6 shadow-soft md:p-8">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-primary">Seu ciclo hoje</p>
                {summary.cycleDay ? (
                  <p className="mt-2 font-display text-5xl font-medium md:text-6xl">
                    Dia {summary.cycleDay}
                  </p>
                ) : (
                  <p className="mt-2 text-lg">Sem registro recente de menstruação.</p>
                )}
                <p className="mt-1 text-sm text-foreground/75">
                  Última menstruação: {fmtRange(summary.lastPeriod!.start, summary.lastPeriod!.end)}
                </p>
              </div>
              <div className="rounded-2xl bg-card/80 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold">Próxima menstruação</p>
                  {next && <EstimateBadge />}
                </div>
                {next && daysToNext !== null ? (
                  summary.daysLate > 0 ? (
                    <div className="mt-2 text-sm leading-relaxed">
                      <p className="font-display text-2xl">{fmtDay(next.periodStart)}</p>
                      <p className="mt-1 text-foreground/80">
                        A data estimada já passou há {summary.daysLate} {summary.daysLate === 1 ? "dia" : "dias"}.
                        Variações são comuns. Se você já menstruou, registre no calendário. Se o atraso persistir ou
                        preocupar você, procure um profissional de saúde.
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="mt-2 font-display text-2xl">{fmtDay(next.periodStart, "d 'de' MMMM")}</p>
                      <p className="text-sm text-foreground/75">
                        {daysToNext === 0 ? "hoje" : `em cerca de ${daysToNext} ${daysToNext === 1 ? "dia" : "dias"}`}
                      </p>
                    </>
                  )
                ) : (
                  <p className="mt-2 text-sm text-foreground/80">
                    Ainda não há dados suficientes. Registre mais um ciclo ou informe a duração habitual do seu ciclo
                    em{" "}
                    <Link to="/ciclo" className="font-semibold text-primary underline-offset-2 hover:underline">
                      Meu ciclo
                    </Link>
                    .
                  </p>
                )}
              </div>
            </div>
          </section>

          {next && showFertile && (
            <section className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-card p-5 shadow-soft">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold">Período fértil</p>
                  <EstimateBadge />
                </div>
                <p className="mt-2 font-display text-xl">{fmtRange(next.fertileStart, next.fertileEnd)}</p>
              </div>
              <div className="rounded-3xl bg-card p-5 shadow-soft">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold">Ovulação</p>
                  <EstimateBadge />
                </div>
                <p className="mt-2 font-display text-xl">por volta de {fmtDay(next.ovulation)}</p>
              </div>
            </section>
          )}
        </>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <Button className="h-12 flex-1 rounded-full text-base shadow-lift sm:flex-none sm:px-8" onClick={() => setDayOpen(true)}>
          <Plus className="mr-1 h-5 w-5" /> Registrar hoje
        </Button>
        {hasData && (
          <Button variant="outline" className="h-12 flex-1 rounded-full bg-card sm:flex-none sm:px-6" onClick={() => setPeriodOpen(true)}>
            <Droplet className="mr-1 h-4 w-4" /> Registrar menstruação
          </Button>
        )}
      </div>

      <section className="mt-8">
        <h2 className="text-xl font-medium">Sintomas recentes</h2>
        {symptoms.isLoading ? (
          <LoadingState />
        ) : recentSymptoms.length === 0 ? (
          <p className="mt-2 text-muted-foreground">Nenhum sintoma registrado nos últimos 7 dias.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {recentSymptoms.map((s) => {
              const items = [
                s.cramps && s.cramps !== "nenhuma" && `Cólica ${CRAMPS_OPTIONS.find((o) => o.value === s.cramps)?.label.toLowerCase()}`,
                s.bloating && s.bloating !== "nenhum" && `Inchaço ${BLOATING_OPTIONS.find((o) => o.value === s.bloating)?.label.toLowerCase()}`,
                ...s.symptoms.filter((x) => x !== "outros").map(symptomLabel),
                s.other_symptom,
              ].filter(Boolean) as string[];
              return (
                <li key={s.id} className="flex flex-wrap items-center gap-2 rounded-2xl bg-card px-4 py-3 shadow-soft">
                  <span className="mr-1 text-sm font-bold capitalize">{fmtDay(s.record_date, "EEE, d/MM")}</span>
                  {items.length ? (
                    items.map((t) => (
                      <span key={t} className="rounded-full bg-rose-light px-2.5 py-0.5 text-xs font-semibold">
                        {t}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">Apenas observações</span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-8 grid grid-cols-3 gap-3">
        {[
          { to: "/calendario", label: "Calendário", icon: CalendarDays },
          { to: "/dicas", label: "Dicas", icon: Sparkles },
          { to: "/ajuda", label: "Ajuda", icon: LifeBuoy },
        ].map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className="flex flex-col items-center gap-2 rounded-3xl bg-card p-4 text-sm font-bold shadow-soft transition-transform hover:-translate-y-0.5"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-lilac text-lilac-deep">
              <l.icon className="h-5 w-5" aria-hidden="true" />
            </span>
            {l.label}
          </Link>
        ))}
      </section>

      {hasData && next && <PredictionDisclaimer className="mt-8" />}
      {!hasData && (
        <p className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
          <Sun className="h-4 w-4" aria-hidden="true" /> Dica: você pode registrar sintomas mesmo sem estar menstruada.
        </p>
      )}

      <DayLogDialog date={todayKey} open={dayOpen} onOpenChange={setDayOpen} />
      <PeriodRangeDialog open={periodOpen} onOpenChange={setPeriodOpen} />
    </AppShell>
  );
}
