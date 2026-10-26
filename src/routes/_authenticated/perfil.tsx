import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LogOut, ShieldCheck, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, ErrorState, LoadingState, PageHeader, useSignOut } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ADULT_AGE, calculateAge, validateBirthDate } from "@/lib/age";
import { useCurrentUser, useProfile, useUpdateProfile } from "@/lib/data";
import { deleteMyAccount } from "@/lib/account.functions";
import { friendlyError } from "@/lib/labels";

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => ({
    meta: [
      { title: "Perfil — Cíclica" },
      { name: "description", content: "Seus dados, preferências e privacidade no Cíclica." },
      { property: "og:title", content: "Perfil — Cíclica" },
      { property: "og:description", content: "Seus dados, preferências e privacidade no Cíclica." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Perfil,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-card p-5 shadow-soft md:p-6">
      <h2 className="text-xl font-medium">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Perfil() {
  const profile = useProfile();
  const user = useCurrentUser();
  const update = useUpdateProfile();
  const signOut = useSignOut();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const deleteAccount = useServerFn(deleteMyAccount);

  const [name, setName] = useState("");
  const [birth, setBirth] = useState("");
  const [email, setEmail] = useState("");
  const [cycleLen, setCycleLen] = useState("");
  const [periodLen, setPeriodLen] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (profile.data) {
      setName(profile.data.full_name);
      setBirth(profile.data.birth_date);
      setCycleLen(profile.data.typical_cycle_length ? String(profile.data.typical_cycle_length) : "");
      setPeriodLen(profile.data.typical_period_length ? String(profile.data.typical_period_length) : "");
    }
  }, [profile.data]);
  useEffect(() => setEmail(user.email ?? ""), [user.email]);

  if (profile.isLoading) return <AppShell><LoadingState /></AppShell>;
  if (profile.isError || !profile.data) return <AppShell><ErrorState onRetry={() => profile.refetch()} /></AppShell>;
  const p = profile.data;
  const age = calculateAge(p.birth_date);

  const savePersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    const n = name.trim();
    if (!n) errs.name = "Informe seu nome.";
    const bc = validateBirthDate(birth);
    if (!bc.ok) errs.birth = bc.message;
    else if (age !== null && age < ADULT_AGE && bc.age >= ADULT_AGE)
      errs.birth = "Esta alteração de data de nascimento não pode ser feita pelo aplicativo.";
    const em = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) errs.email = "Informe um e-mail válido.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    try {
      if (n !== p.full_name || birth !== p.birth_date) {
        await update.mutateAsync({ id: p.id, full_name: n, birth_date: birth });
      }
      if (em !== user.email) {
        const { error } = await supabase.auth.updateUser({ email: em }, { emailRedirectTo: window.location.origin });
        if (error) throw error;
        toast.success("Enviamos um link de confirmação para o novo e-mail. A troca só vale após a confirmação.");
      } else {
        toast.success("Dados atualizados.");
      }
    } catch (err) {
      toast.error(friendlyError(err));
    }
  };

  const savePrefs = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    const c = cycleLen ? Number(cycleLen) : null;
    const pl = periodLen ? Number(periodLen) : null;
    if (c !== null && (!Number.isInteger(c) || c < 15 || c > 60)) errs.cycle = "Use um número entre 15 e 60.";
    if (pl !== null && (!Number.isInteger(pl) || pl < 1 || pl > 15)) errs.period = "Use um número entre 1 e 15.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    try {
      await update.mutateAsync({ id: p.id, typical_cycle_length: c, typical_period_length: pl });
      toast.success("Preferências salvas.");
    } catch (err) {
      toast.error(friendlyError(err));
    }
  };

  const toggleFertile = async (v: boolean) => {
    try {
      await update.mutateAsync({ id: p.id, show_fertile_window: v });
    } catch (err) {
      toast.error(friendlyError(err));
    }
  };

  const onDeleteAccount = async () => {
    setDeleting(true);
    try {
      await deleteAccount();
      await queryClient.cancelQueries();
      queryClient.clear();
      await supabase.auth.signOut();
      toast.success("Sua conta e seus dados foram excluídos.");
      navigate({ to: "/", replace: true });
    } catch {
      toast.error("Não foi possível excluir a conta agora. Tente novamente.");
      setDeleting(false);
    }
  };

  return (
    <AppShell>
      <PageHeader title="Perfil" subtitle={age !== null ? `${age} anos` : undefined} />

      <div className="space-y-5">
        <Section title="Dados pessoais">
          <form onSubmit={savePersonal} noValidate className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="pf-name">Nome</Label>
              <Input id="pf-name" maxLength={100} value={name} onChange={(e) => setName(e.target.value)} className="h-11 rounded-xl" />
              {errors.name && <p className="text-sm font-semibold text-destructive">{errors.name}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pf-birth">Data de nascimento</Label>
              <Input id="pf-birth" type="date" value={birth} onChange={(e) => setBirth(e.target.value)} className="h-11 rounded-xl" />
              <p className="text-xs text-muted-foreground">
                Sua idade é calculada automaticamente a partir desta data.
              </p>
              {errors.birth && <p className="text-sm font-semibold text-destructive">{errors.birth}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pf-email">E-mail</Label>
              <Input id="pf-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 rounded-xl" />
              {errors.email && <p className="text-sm font-semibold text-destructive">{errors.email}</p>}
            </div>
            <Button type="submit" className="rounded-full" disabled={update.isPending}>Salvar dados</Button>
          </form>
        </Section>

        <Section title="Preferências">
          <form onSubmit={savePrefs} noValidate className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Opcional. Usado apenas para estimativas enquanto você não tiver ciclos suficientes registrados.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="pf-cycle">Duração habitual do ciclo (dias)</Label>
                <Input id="pf-cycle" inputMode="numeric" value={cycleLen} onChange={(e) => setCycleLen(e.target.value)} placeholder="Ex.: 28" className="h-11 rounded-xl" />
                {errors.cycle && <p className="text-sm font-semibold text-destructive">{errors.cycle}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pf-period">Duração habitual da menstruação (dias)</Label>
                <Input id="pf-period" inputMode="numeric" value={periodLen} onChange={(e) => setPeriodLen(e.target.value)} placeholder="Ex.: 5" className="h-11 rounded-xl" />
                {errors.period && <p className="text-sm font-semibold text-destructive">{errors.period}</p>}
              </div>
            </div>
            <Button type="submit" className="rounded-full" disabled={update.isPending}>Salvar preferências</Button>
          </form>
          <div className="mt-6 flex items-center justify-between gap-4 border-t pt-5">
            <div>
              <Label htmlFor="pf-fertile" className="font-bold">Mostrar período fértil e ovulação</Label>
              <p className="text-sm text-muted-foreground">Exibe essas estimativas no calendário e no início.</p>
            </div>
            <Switch id="pf-fertile" checked={p.show_fertile_window} onCheckedChange={toggleFertile} />
          </div>
        </Section>

        <Section title="Privacidade">
          <div className="flex gap-3 text-sm text-foreground/85">
            <ShieldCheck className="h-5 w-5 shrink-0 text-lilac-deep" aria-hidden="true" />
            <p>
              Seus registros são visíveis apenas para você. Não compartilhamos seus dados com terceiros nem os
              usamos para publicidade.
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold">
            <Link to="/privacidade" className="text-primary hover:underline">Política de privacidade</Link>
            <Link to="/termos" className="text-primary hover:underline">Termos de uso</Link>
            <Link to="/ajuda" className="text-primary hover:underline">Central de ajuda</Link>
          </div>
        </Section>

        <Section title="Conta">
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" className="rounded-full" onClick={signOut}>
              <LogOut className="mr-1 h-4 w-4" /> Sair da conta
            </Button>
            <Button variant="outline" className="rounded-full text-destructive hover:text-destructive" onClick={() => { setConfirmText(""); setDeleteOpen(true); }}>
              <Trash2 className="mr-1 h-4 w-4" /> Excluir conta e dados
            </Button>
          </div>
        </Section>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={(o) => !deleting && setDeleteOpen(o)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir sua conta?</AlertDialogTitle>
            <AlertDialogDescription>
              Sua conta e todos os seus registros (menstruação, sintomas, observações e preferências) serão apagados
              definitivamente. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="confirm-delete">Para confirmar, digite EXCLUIR</Label>
            <Input id="confirm-delete" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} className="h-11 rounded-xl" autoComplete="off" />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full" disabled={deleting}>Cancelar</AlertDialogCancel>
            <Button
              className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={confirmText.trim().toUpperCase() !== "EXCLUIR" || deleting}
              onClick={onDeleteAccount}
            >
              {deleting ? "Excluindo…" : "Excluir definitivamente"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
