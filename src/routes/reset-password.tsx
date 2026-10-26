import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { friendlyError } from "@/lib/labels";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Criar nova senha — Cíclica" },
      { name: "description", content: "Defina uma nova senha para sua conta do Cíclica." },
      { property: "og:title", content: "Criar nova senha — Cíclica" },
      { property: "og:description", content: "Defina uma nova senha para sua conta do Cíclica." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    supabase.auth.getSession().then(({ data: s }) => {
      if (s.session) setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return setError("A senha precisa ter pelo menos 8 caracteres.");
    if (password !== confirm) return setError("As senhas não coincidem.");
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return setError(friendlyError(error));
    toast.success("Senha alterada com sucesso.");
    navigate({ to: "/inicio", replace: true });
  };

  return (
    <div className="min-h-screen bg-background px-5 py-8">
      <div className="mx-auto max-w-md">
        <Link to="/"><Logo /></Link>
        <div className="mt-8 rounded-3xl bg-card p-6 shadow-soft md:p-8">
          <h1 className="text-2xl font-medium">Criar nova senha</h1>
          {!ready ? (
            <p className="mt-3 text-muted-foreground">
              Abra esta página pelo link enviado ao seu e-mail. Se o link expirou,{" "}
              <Link to="/auth" search={{ mode: "recuperar" }} className="font-semibold text-primary hover:underline">
                peça um novo
              </Link>
              .
            </p>
          ) : (
            <form onSubmit={submit} noValidate className="mt-5 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="np">Nova senha</Label>
                <Input id="np" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="npc">Confirmar nova senha</Label>
                <Input id="npc" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="h-11 rounded-xl" />
              </div>
              {error && <p className="text-sm font-semibold text-destructive" role="alert">{error}</p>}
              <Button type="submit" className="h-11 w-full rounded-full" disabled={loading}>
                {loading ? "Salvando…" : "Salvar nova senha"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
