import { useEffect, useState } from "react";
import { differenceInCalendarDays } from "date-fns";
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
import { ChipGroup } from "./Chip";
import { parseLocalDate } from "@/lib/age";
import { toKey } from "@/lib/cycle";
import { useAddPeriodRange } from "@/lib/data";
import { FLOW_OPTIONS, friendlyError } from "@/lib/labels";

const MAX_DAYS = 15;

export function PeriodRangeDialog({
  open,
  onOpenChange,
  initialStart,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initialStart?: string | null;
}) {
  const today = toKey(new Date());
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState(today);
  const [flow, setFlow] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const add = useAddPeriodRange();

  useEffect(() => {
    if (open) {
      const s = initialStart && initialStart <= today ? initialStart : today;
      setStart(s);
      setEnd(s);
      setFlow(null);
      setError(null);
    }
  }, [open, initialStart, today]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const s = parseLocalDate(start);
    const en = parseLocalDate(end);
    if (!s || !en) return setError("Informe datas válidas.");
    if (start > today || end > today) return setError("Não é possível registrar datas futuras.");
    if (end < start) return setError("O último dia não pode ser antes do primeiro.");
    if (differenceInCalendarDays(en, s) + 1 > MAX_DAYS)
      return setError(`Registre no máximo ${MAX_DAYS} dias por vez.`);
    setError(null);
    try {
      await add.mutateAsync({ start, end, flow });
      toast.success("Menstruação registrada.");
      onOpenChange(false);
    } catch (err) {
      toast.error(friendlyError(err, "Não foi possível salvar. Tente novamente."));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl sm:max-w-md">
        <form onSubmit={onSubmit} noValidate>
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-medium">Registrar menstruação</DialogTitle>
            <DialogDescription>
              Informe o primeiro e o último dia. Se ainda estiver menstruada, use a data de hoje como último dia e
              atualize depois.
            </DialogDescription>
          </DialogHeader>
          <div className="my-5 grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="p-start">Primeiro dia</Label>
              <Input id="p-start" type="date" max={today} value={start} onChange={(e) => setStart(e.target.value)} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-end">Último dia</Label>
              <Input id="p-end" type="date" max={today} min={start} value={end} onChange={(e) => setEnd(e.target.value)} className="rounded-xl" />
            </div>
          </div>
          <div className="mb-4 space-y-2">
            <p className="text-sm font-bold">Fluxo predominante (opcional)</p>
            <ChipGroup label="Fluxo predominante" options={FLOW_OPTIONS} value={flow as never} onChange={setFlow} />
          </div>
          {error && (
            <p className="mb-3 text-sm font-semibold text-destructive" role="alert">
              {error}
            </p>
          )}
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" className="rounded-full" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="rounded-full" disabled={add.isPending}>
              {add.isPending ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
