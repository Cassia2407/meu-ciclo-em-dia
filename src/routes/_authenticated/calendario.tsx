import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { startOfMonth } from "date-fns";
import { Droplet, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell, ErrorState, LoadingState, PageHeader } from "@/components/AppShell";
import { CalendarLegend, MonthCalendar } from "@/components/MonthCalendar";
import { DayLogDialog } from "@/components/DayLogDialog";
import { PeriodRangeDialog } from "@/components/PeriodRangeDialog";
import { PredictionDisclaimer } from "@/components/Disclaimer";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { marksForDay, toKey } from "@/lib/cycle";
import { useDeleteDay, useIsAdult, useMenstrualRecords, useSexualRecords, useSymptomRecords } from "@/lib/data";
import { BLOATING_OPTIONS, CRAMPS_OPTIONS, FLOW_OPTIONS, friendlyError, symptomLabel } from "@/lib/labels";
import { fmtDay, useCycleSummary } from "@/lib/useCycle";

export const Route = createFileRoute("/_authenticated/calendario")({
  head: () => ({
    meta: [
      { title: "Calendário — Cíclica" },
      { name: "description", content: "Calendário menstrual com seus registros e estimativas." },
      { property: "og:title", content: "Calendário — Cíclica" },
      { property: "og:description", content: "Calendário menstrual com seus registros e estimativas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Calendario,
});

function Calendario() {
  const { summary, showFertile, isLoading, isError, refetch } = useCycleSummary();
  const adult = useIsAdult();
  const menstrual = useMenstrualRecords();
  const symptoms = useSymptomRecords();
  const sexual = useSexualRecords(adult);
  const del = useDeleteDay(adult);

  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState(() => toKey(new Date()));
  const [dayOpen, setDayOpen] = useState(false);
  const [periodOpen, setPeriodOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const bleeding = useMemo(() => new Set((menstrual.data ?? []).map((r) => r.record_date)), [menstrual.data]);
  const withSymptoms = useMemo(() => new Set((symptoms.data ?? []).map((r) => r.record_date)), [symptoms.data]);

  if (isLoading || symptoms.isLoading) return <AppShell><LoadingState /></AppShell>;
  if (isError || symptoms.isError) return <AppShell><ErrorState onRetry={refetch} /></AppShell>;

  const m = menstrual.data?.find((r) => r.record_date === selected);
  const s = symptoms.data?.find((r) => r.record_date === selected);
  const x = sexual.data?.find((r) => r.record_date === selected);
  const hasAny = !!m || !!s || !!x;
  const marks = marksForDay(selected, summary.projections, showFertile);
  const todayKey = toKey(new Date());
  const estimates = [
    !m && marks.predictedPeriod && selected >= todayKey && "Menstruação estimada",
    !m && marks.ovulation && "Ovulação estimada",
    !m && marks.fertile && "Período fértil estimado",
  ].filter(Boolean) as string[];

  const onDelete = async () => {
    try {
      await del.mutateAsync(selected);
      toast.success("Registros do dia excluídos.");
    } catch (e) {
      toast.error(friendlyError(e, "Não foi possível excluir. Tente novamente."));
    } finally {
      setConfirmDelete(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Calendário"
        subtitle="Toque em um dia para ver ou registrar informações."
        action={
          <Button className="rounded-full" onClick={() => setPeriodOpen(true)}>
            <Droplet className="mr-1 h-4 w-4" /> Registrar menstruação
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <MonthCalendar
            month={month}
            onMonthChange={setMonth}
            selected={selected}
            onSelect={setSelected}
            bleeding={bleeding}
            withSymptoms={withSymptoms}
            projections={summary.projections}
            showFertile={showFertile}
          />
          <div className="rounded-3xl bg-card p-4 shadow-soft">
            <CalendarLegend showFertile={showFertile} />
          </div>
        </div>

        <aside className="h-fit rounded-3xl bg-card p-5 shadow-soft" aria-live="polite">
          <h2 className="text-xl font-medium capitalize">{fmtDay(selected, "EEEE, d 'de' MMMM")}</h2>

          {estimates.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {estimates.map((e) => (
                <span key={e} className="rounded-full bg-lilac px-2.5 py-0.5 text-xs font-bold text-lilac-deep">
                  {e}
                </span>
              ))}
            </div>
          )}

          {hasAny ? (
            <dl className="mt-4 space-y-3 text-sm">
              {m && (
                <div>
                  <dt className="font-bold">Menstruação</dt>
                  <dd className="text-foreground/80">
                    Registrada{m.flow ? ` · fluxo ${FLOW_OPTIONS.find((o) => o.value === m.flow)?.label.toLowerCase()}` : ""}
                  </dd>
                </div>
              )}
              {s?.cramps && (
                <div>
                  <dt className="font-bold">Cólicas</dt>
                  <dd className="text-foreground/80">{CRAMPS_OPTIONS.find((o) => o.value === s.cramps)?.label}</dd>
                </div>
              )}
              {s?.bloating && (
                <div>
                  <dt className="font-bold">Inchaço</dt>
                  <dd className="text-foreground/80">{BLOATING_OPTIONS.find((o) => o.value === s.bloating)?.label}</dd>
                </div>
              )}
              {s && (s.symptoms.length > 0 || s.other_symptom) && (
                <div>
                  <dt className="font-bold">Sintomas</dt>
                  <dd className="mt-1 flex flex-wrap gap-1.5">
                    {s.symptoms.filter((v) => v !== "outros").map((v) => (
                      <span key={v} className="rounded-full bg-rose-light px-2.5 py-0.5 text-xs font-semibold">{symptomLabel(v)}</span>
                    ))}
                    {s.other_symptom && (
                      <span className="rounded-full bg-rose-light px-2.5 py-0.5 text-xs font-semibold">{s.other_symptom}</span>
                    )}
                  </dd>
                </div>
              )}
              {s?.notes && (
                <div>
                  <dt className="font-bold">Observações</dt>
                  <dd className="whitespace-pre-wrap text-foreground/80">{s.notes}</dd>
                </div>
              )}
              {x && (
                <div>
                  <dt className="font-bold">Registro privado</dt>
                  <dd className="text-foreground/80">Relação sexual registrada{x.notes ? ` · ${x.notes}` : ""}</dd>
                </div>
              )}
            </dl>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">Nenhum registro neste dia.</p>
          )}

          <div className="mt-5 flex flex-col gap-2">
            {selected <= todayKey ? (
              <Button className="rounded-full" onClick={() => setDayOpen(true)}>
                <Pencil className="mr-1 h-4 w-4" /> {hasAny ? "Editar registro" : "Registrar este dia"}
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground">Datas futuras não podem ser registradas.</p>
            )}
            {hasAny && (
              <Button variant="outline" className="rounded-full text-destructive hover:text-destructive" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="mr-1 h-4 w-4" /> Excluir registros do dia
              </Button>
            )}
          </div>
        </aside>
      </div>

      {summary.next && <PredictionDisclaimer className="mt-6" />}

      <DayLogDialog date={selected} open={dayOpen} onOpenChange={setDayOpen} />
      <PeriodRangeDialog open={periodOpen} onOpenChange={setPeriodOpen} initialStart={selected} />

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir registros deste dia?</AlertDialogTitle>
            <AlertDialogDescription>
              Todos os registros de {fmtDay(selected, "d 'de' MMMM")} serão apagados. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancelar</AlertDialogCancel>
            <AlertDialogAction className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={onDelete}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
