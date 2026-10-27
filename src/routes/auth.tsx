import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { MailCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Notice } from "@/components/Disclaimer";
import { ADULT_AGE, validateBirthDate } from "@/lib/age";
import { friendlyError } from "@/lib/labels";

type Mode = "entrar" | "criar" | "recuperar";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { mode?: Mode; redirect?: string } => ({
    mode: s.mode === "criar" || s.mode === "recuperar" || s.mode === "entrar" ? s.mode : undefined,
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Entrar ou criar conta — Cíclica" },
      { name: "description", content: "Entre na sua conta do Cíclica ou crie uma nova para acompanhar seu ciclo." },
      { property: "og:title", content: "Entrar ou criar conta — Cíclica" },
      { property: "og:description", content: "Acesse o Cíclica, seu calendário menstrual." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

const emailSchema = z.string().trim().email("Informe um e-mail válido.").max(255);
const passwordSchema = z.string().min(8, "A senha precisa ter pelo menos 8 caracteres.").max(72);

function safeRedirect(r?: string) {
  if (!r) return "/inicio";
  try {
    const url = new URL(r, window.location.origin);
    if (url.origin !== window.location.origin) return "/inicio";
    return url.pathname + url.search;
  } catch {
    return "/inicio";
  }
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="text-sm font-semibold text-destructive" role="alert">
      {msg}
    </p>
  );
}

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>(search.mode ?? "entrar");

  useEffect(() => {
    setMode(search.mode ?? "entrar");
  }, [search.mode]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: safeRedirect(search.redirect), replace: true });
    });
  }, [navigate, search.redirect]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="mx-auto w-full max-w-md px-5 pt-8">
        <Link to="/" aria-label="Voltar para a página inicial">
          <Logo />
        </Link>
      </header>
      <main className="mx-auto w-full max-w-md flex-1 px-5 py-8">
        {mode !== "recuperar" && (
          <div className="mb-6 grid grid-cols-2 rounded-full bg-muted p-1" role="tablist">
            {(["entrar", "criar"] as const).map((m) => (
              <button
                key={m}
                role="tab"
                aria-selected={mode === m}
                onClick={() => setMode(m)}
                className={`rounded-full py-2.5 text-sm font-bold transition-colors ${
                  mode === m ? "bg-card text-foreground shadow-soft" : "text-muted-foreground"
                }`}
              >
                {m === "entrar" ? "Entrar" : "Criar conta"}
              </button>
            ))}
          </div>
        )}
        <div className="rounded-3xl bg-card p-6 shadow-soft md:p-8">
          {mode === "entrar" && (
            <SignIn onForgot={() => setMode("recuperar")} redirectTo={() => safeRedirect(search.redirect)} />
          )}
          {mode === "criar" && <SignUp />}
          {mode === "recuperar" && <Forgot onBack={() => setMode("entrar")} />}
        </div>
      </main>
      <footer className="mx-auto flex max-w-md gap-4 px-5 pb-8 text-sm text-muted-foreground">
        <Link to="/termos" className="hover:text-foreground">Termos de uso</Link>
        <Link to="/privacidade" className="hover:text-foreground">Política de privacidade</Link>
      </footer>
    </div>
  );
}

function SignIn({ onForgot, redirectTo }: { onForgot: () => void; redirectTo: () => string }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    const em = emailSchema.safeParse(email);
    if (!em.success) errs.email = em.error.issues[0].message;
    if (!password) errs.password = "Informe sua senha.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: em.data!, password });
    setLoading(false);
    if (error) {
      setErrors({ form: friendlyError(error, "Não foi possível entrar. Tente novamente.") });
      return;
    }
    navigate({ to: redirectTo(), replace: true });
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div>
        <h1 className="text-2xl font-medium">Que bom ver você</h1>
        <p className="mt-1 text-sm text-muted-foreground">Entre com seu e-mail e senha.</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="login-email">E-mail</Label>
        <Input id="login-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 rounded-xl" />
        <FieldError msg={errors.email} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="login-password">Senha</Label>
        <Input id="login-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 rounded-xl" />
        <FieldError msg={errors.password} />
      </div>
      <FieldError msg={errors.form} />
      <Button type="submit" className="h-11 w-full rounded-full text-base" disabled={loading}>
        {loading ? "Entrando…" : "Entrar"}
      </Button>
      <button type="button" onClick={onForgot} className="w-full text-center text-sm font-semibold text-primary hover:underline">
        Esqueci minha senha
      </button>
    </form>
  );
}

function SignUp() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", birth: "", email: "", password: "", confirm: "" });
  const [accepted, setAccepted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const birthCheck = form.birth ? validateBirthDate(form.birth) : null;
  const isMinor = birthCheck?.ok && birthCheck.age < ADULT_AGE;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    const name = form.name.trim();
    if (!name) errs.name = "Informe seu nome.";
    else if (name.length > 100) errs.name = "Use no máximo 100 caracteres.";
    if (!form.birth) errs.birth = "Informe sua data de nascimento.";
    else if (birthCheck && !birthCheck.ok) errs.birth = birthCheck.message;
    const em = emailSchema.safeParse(form.email);
    if (!em.success) errs.email = em.error.issues[0].message;
    const pw = passwordSchema.safeParse(form.password);
    if (!pw.success) errs.password = pw.error.issues[0].message;
    if (form.password !== form.confirm) errs.confirm = "As senhas não coincidem.";
    if (!accepted) errs.terms = "É preciso aceitar os termos de uso e a política de privacidade.";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: em.data!,
      password: form.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: name, birth_date: form.birth, terms_accepted: "true" },
      },
    });
    setLoading(false);
    if (error) {
      setErrors({ form: friendlyError(error, "Não foi possível criar a conta. Tente novamente.") });
      return;
    }
    if (data.session) {
      toast.success("Conta criada! Bem-vinda ao Cíclica.");
      navigate({ to: "/inicio", replace: true });
      return;
    }
    setSentTo(em.data!);
    toast.success("Conta criada! Confirme seu e-mail para entrar.");
  };

  if (sentTo) {
    return (
      <div className="space-y-4 text-center">
        <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-lilac text-lilac-deep">
          <MailCheck className="h-7 w-7" aria-hidden="true" />
        </span>
        <h1 className="text-2xl font-medium">Confirme seu e-mail</h1>
        <p className="text-muted-foreground">
          Enviamos um link de confirmação para <strong className="text-foreground">{sentTo}</strong>. Abra o e-mail e
          clique no link para ativar sua conta. Se não encontrar, verifique a caixa de spam.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div>
        <h1 className="text-2xl font-medium">Criar sua conta</h1>
        <p className="mt-1 text-sm text-muted-foreground">Leva menos de um minuto.</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="su-name">Nome</Label>
        <Input id="su-name" autoComplete="given-name" maxLength={100} value={form.name} onChange={set("name")} className="h-11 rounded-xl" />
        <FieldError msg={errors.name} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="su-birth">Data de nascimento</Label>
        <Input id="su-birth" type="date" autoComplete="bday" value={form.birth} onChange={set("birth")} className="h-11 rounded-xl" />
        <p className="text-xs text-muted-foreground">Usada para calcular sua idade e mostrar conteúdos adequados.</p>
        <FieldError msg={errors.birth} />
      </div>
      {isMinor && (
        <Notice tone="rose">
          Como você tem menos de 18 anos, recomendamos que converse com sua mãe, seu pai ou responsável sobre o uso
          do aplicativo. Coletamos apenas o necessário e seus registros ficam visíveis só para você.
        </Notice>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="su-email">E-mail</Label>
        <Input id="su-email" type="email" autoComplete="email" value={form.email} onChange={set("email")} className="h-11 rounded-xl" />
        <FieldError msg={errors.email} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="su-pass">Senha</Label>
          <Input id="su-pass" type="password" autoComplete="new-password" value={form.password} onChange={set("password")} className="h-11 rounded-xl" />
          <FieldError msg={errors.password} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="su-confirm">Confirmar senha</Label>
          <Input id="su-confirm" type="password" autoComplete="new-password" value={form.confirm} onChange={set("confirm")} className="h-11 rounded-xl" />
          <FieldError msg={errors.confirm} />
        </div>
      </div>
      <div className="flex items-start gap-3">
        <Checkbox id="su-terms" checked={accepted} onCheckedChange={(v) => setAccepted(v === true)} className="mt-0.5" />
        <Label htmlFor="su-terms" className="text-sm font-normal leading-relaxed">
          Li e aceito os{" "}
          <Link to="/termos" target="_blank" className="font-semibold text-primary underline-offset-2 hover:underline">
            termos de uso
          </Link>{" "}
          e a{" "}
          <Link to="/privacidade" target="_blank" className="font-semibold text-primary underline-offset-2 hover:underline">
            política de privacidade
          </Link>
          .
        </Label>
      </div>
      <FieldError msg={errors.terms} />
      <FieldError msg={errors.form} />
      <Button type="submit" className="h-11 w-full rounded-full text-base" disabled={loading}>
        {loading ? "Criando conta…" : "Criar conta"}
      </Button>
    </form>
  );
}

function Forgot({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const em = emailSchema.safeParse(email);
    if (!em.success) return setError(em.error.issues[0].message);
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(em.data, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) return setError(friendlyError(error));
    setSent(true);
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div>
        <h1 className="text-2xl font-medium">Recuperar senha</h1>
        <p className="mt-1 text-sm text-muted-foreground">Enviaremos um link para você criar uma nova senha.</p>
      </div>
      {sent ? (
        <Notice>Se houver uma conta com este e-mail, você receberá um link em instantes. Verifique também o spam.</Notice>
      ) : (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="fp-email">E-mail</Label>
            <Input id="fp-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 rounded-xl" />
            <FieldError msg={error ?? undefined} />
          </div>
          <Button type="submit" className="h-11 w-full rounded-full text-base" disabled={loading}>
            {loading ? "Enviando…" : "Enviar link"}
          </Button>
        </>
      )}
      <button type="button" onClick={onBack} className="w-full text-center text-sm font-semibold text-primary hover:underline">
        Voltar para o login
      </button>
    </form>
  );
}
