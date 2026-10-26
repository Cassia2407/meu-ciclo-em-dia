import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Chip, ChipGroup } from "./Chip";
import { parseLocalDate } from "@/lib/age";
import { toKey } from "@/lib/cycle";
import {
  useIsAdult,
  useMenstrualRecords,
  useSaveDayLog,
  useSexualRecords,
  useSymptomRecords,
} from "@/lib/data";
import { BLOATING_OPTIONS, CRAMPS_OPTIONS, FLOW_OPTIONS, SYMPTOM_OPTIONS, friendlyError } from "@/lib/labels";

type Props = { date: string | null; open: boolean; onOpenChange: (open: boolean) => void };

export function DayLogDialog({ date, open, onOpenChange }: Props) {
  const adult = useIsAdult();
  const menstrual = useMenstrualRecords();
  const symptoms = useSymptomRecords();
  const sexual = useSexualRecords(adult);
  const save = useSaveDayLog();

  const [bleeding, setBleeding] = useState<boolean | null>(null);
  const [flow, setFlow] = useState<string | null>(null);
  const [cramps, setCramps] = useState<string | null>(null);
  const [bloating, setBloating] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [other, setOther] = useState("");
  const [notes, setNotes] = useState("");
  const [hadSex, setHadSex] = useState(false);
  const [sexNotes, setSexNotes] = useState("");

  useEffect(() => {
    if (!open || !date) return;
    const m = menstrual.data?.find((r) => r.record_date === date);
    const s = symptoms.data?.find((r) => r.record_date === date);
    const x = sexual.data?.find((r) => r.record_date === date);
    setBleeding(m ? true : null);
    setFlow(m?.flow ?? null);
    setCramps(s?.cramps ?? null);
    setBloating(s?.bloating ?? null);
    setSelected(s?.symptoms ?? []);
    setOther(s?.other_symptom ?? "");
    setNotes(s?.notes ?? "");
    setHadSex(!!x);
    setSexNotes(x?.notes ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, date]);

  if (!date) return null;
  const parsed = parseLocalDate(date);
  const isFuture = date > toKey(new Date());

  const toggleSymptom = (v: string) =>
    setSelected((prev) => (prev.includes(v) ? prev.filter((p) => p !== v) : [...prev, v]));

  const onSave = async () => {
    if (isFuture) {
      toast.error("Não é possível registrar datas futuras.");
      return;
    }
    try {
      await save.mutateAsync({
        date,
        bleeding,
        flow: bleeding ? flow : null,
        cramps,
        bloating,
        symptoms: selected,
        otherSymptom: selected.includes("outros") ? other : "",
        notes,
        sexual: adult ? { had: hadSex, notes: sexNotes } : undefined,
      });
      toast.success("Registro salvo.");
      onOpenChange(false);
    } catch (e) {
      toast.error(friendlyError(e, "Não foi possível salvar o registro. Tente novamente."));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-3xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-medium">
            {parsed ? format(parsed, "d 'de' MMMM", { locale: ptBR }) : date}
          </DialogTitle>
          <DialogDescription>Preencha só o que quiser. Nenhum campo é obrigatório.</DialogDescription>
        </DialogHeader>

        {isFuture ? (
          <p className="rounded-2xl bg-muted p-4 text-sm">
            Esta data ainda não chegou. Você poderá registrar informações a partir do próprio dia.
          </p>
        ) : (
          <div className="space-y-6">
            <section className="space-y-2">
              <h3 className="font-sans text-sm font-bold">Houve sangramento menstrual?</h3>
              <div className="flex gap-2">
                <Chip selected={bleeding === true} onClick={() => setBleeding(bleeding === true ? null : true)}>
                  Sim
                </Chip>
                <Chip selected={bleeding === false} onClick={() => setBleeding(bleeding === false ? null : false)}>
                  Não
                </Chip>
              </div>
            </section>

            {bleeding === true && (
              <section className="space-y-2">
                <h3 className="font-sans text-sm font-bold">Intensidade do fluxo</h3>
                <ChipGroup label="Intensidade do fluxo" options={FLOW_OPTIONS} value={flow as never} onChange={setFlow} />
              </section>
            )}

            <section className="space-y-2">
              <h3 className="font-sans text-sm font-bold">Cólicas</h3>
              <ChipGroup label="Cólicas" options={CRAMPS_OPTIONS} value={cramps as never} onChange={setCramps} />
            </section>

            <section className="space-y-2">
              <h3 className="font-sans text-sm font-bold">Inchaço</h3>
              <ChipGroup label="Inchaço" options={BLOATING_OPTIONS} value={bloating as never} onChange={setBloating} />
            </section>

            <section className="space-y-2">
              <h3 className="font-sans text-sm font-bold">Outros sintomas</h3>
              <p className="text-xs text-muted-foreground">Você pode escolher mais de um.</p>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Outros sintomas">
                {SYMPTOM_OPTIONS.map((o) => (
                  <Chip key={o.value} selected={selected.includes(o.value)} onClick={() => toggleSymptom(o.value)}>
                    {o.label}
                  </Chip>
                ))}
              </div>
              {selected.includes("outros") && (
                <Input
                  aria-label="Descreva o outro sintoma"
                  placeholder="Qual sintoma?"
                  maxLength={100}
                  value={other}
                  onChange={(e) => setOther(e.target.value)}
                  className="mt-2 rounded-xl"
                />
              )}
            </section>

            <section className="space-y-2">
              <Label htmlFor="day-notes" className="text-sm font-bold">
                Observações pessoais (opcional)
              </Label>
              <Textarea
                id="day-notes"
                maxLength={1000}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Como você se sentiu hoje?"
                className="rounded-xl"
              />
            </section>

            {adult && (
              <section className="space-y-3 rounded-2xl border border-dashed p-4">
                <div className="flex items-center gap-2 text-sm font-bold">
                  <Lock className="h-4 w-4 text-lilac-deep" aria-hidden="true" />
                  Atividade sexual (opcional e privado)
                </div>
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="had-sex" className="font-normal">
                    Houve relação sexual neste dia?
                  </Label>
                  <Switch id="had-sex" checked={hadSex} onCheckedChange={setHadSex} />
                </div>
                {hadSex && (
                  <Textarea
                    aria-label="Observação sobre o registro"
                    maxLength={500}
                    value={sexNotes}
                    onChange={(e) => setSexNotes(e.target.value)}
                    placeholder="Observação opcional"
                    className="rounded-xl"
                  />
                )}
                <p className="text-xs text-muted-foreground">Visível apenas para você.</p>
              </section>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" className="rounded-full" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          {!isFuture && (
            <Button className="rounded-full" onClick={onSave} disabled={save.isPending}>
              {save.isPending ? "Salvando…" : "Salvar registro"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
