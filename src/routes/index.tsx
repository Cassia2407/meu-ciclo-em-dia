import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { CalendarHeart, BookOpen, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cíclica — Conheça seu ciclo. Cuide de você." },
      {
        name: "description",
        content:
          "Calendário menstrual para registrar sua menstruação e sintomas, ver estimativas do ciclo e ler dicas de saúde menstrual.",
      },
      { property: "og:title", content: "Cíclica — Conheça seu ciclo. Cuide de você." },
      {
        property: "og:description",
        content: "Acompanhe seu ciclo menstrual com privacidade, registre sintomas e aprenda sobre saúde menstrual.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function CycleArt() {
  return (
    <svg viewBox="0 0 320 320" className="h-full w-full" aria-hidden="true">
      <circle cx="160" cy="160" r="150" className="fill-rose-light" />
      <circle cx="160" cy="160" r="118" className="fill-cream" />
      {Array.from({ length: 28 }).map((_, i) => {
        const a = (i / 28) * Math.PI * 2 - Math.PI / 2;
        const x = 160 + Math.cos(a) * 134;
        const y = 160 + Math.sin(a) * 134;
        const cls =
          i < 5 ? "fill-rose-deep" : i >= 9 && i <= 14 ? (i === 13 ? "fill-lilac-deep" : "fill-lilac") : "fill-rose-pastel";
        return <circle key={i} cx={x} cy={y} r={i === 13 ? 9 : 7} className={cls} />;
      })}
      <path
        d="M160 104c18 21 27 37 27 49a27 27 0 0 1-54 0c0-12 9-28 27-49Z"
        className="fill-rose-medium"
      />
      <text x="160" y="222" textAnchor="middle" className="fill-foreground font-display" fontSize="20">
        seu ritmo
      </text>
    </svg>
  );
}

function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/inicio", replace: true });
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Logo />
        <Link to="/auth" search={{ mode: "entrar" }} className="rounded-full px-4 py-2 text-sm font-bold text-primary hover:bg-secondary">
          Entrar
        </Link>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 pt-6 md:grid-cols-[1.1fr_0.9fr] md:pt-14">
          <div>
            <p className="mb-4 inline-block rounded-full bg-lilac px-3 py-1 text-xs font-bold uppercase tracking-wider text-lilac-deep">
              Calendário menstrual
            </p>
            <h1 className="text-5xl font-medium leading-[1.05] text-foreground md:text-7xl">
              Conheça seu ciclo.
              <br />
              <em className="font-normal text-primary">Cuide de você.</em>
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-muted-foreground">
              Registre sua menstruação e seus sintomas, acompanhe estimativas do seu ciclo e encontre informações
              confiáveis sobre saúde menstrual.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/auth"
                search={{ mode: "criar" }}
                className="inline-flex items-center rounded-full bg-primary px-7 py-3.5 font-bold text-primary-foreground shadow-lift transition-transform hover:-translate-y-0.5"
              >
                Criar conta grátis
              </Link>
              <Link
                to="/auth"
                search={{ mode: "entrar" }}
                className="inline-flex items-center rounded-full border border-input bg-card px-7 py-3.5 font-bold text-foreground hover:bg-secondary"
              >
                Já tenho conta
              </Link>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">Para pessoas a partir de 15 anos.</p>
          </div>
          <div className="mx-auto w-full max-w-sm md:max-w-md">
            <CycleArt />
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-4 px-5 pb-16 md:grid-cols-3">
          {[
            {
              icon: CalendarHeart,
              title: "Seu calendário",
              text: "Marque os dias de menstruação, o fluxo e como você se sente, do seu jeito.",
            },
            {
              icon: BookOpen,
              title: "Dicas para a sua idade",
              text: "Conteúdos educativos sobre ciclo, higiene, cólicas e quando procurar um profissional.",
            },
            {
              icon: ShieldCheck,
              title: "Privacidade em primeiro lugar",
              text: "Seus registros são visíveis só para você. Sem perfis públicos e sem publicidade com seus dados.",
            },
          ].map((f) => (
            <div key={f.title} className="rounded-3xl bg-card p-6 shadow-soft">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-light text-primary">
                <f.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-xl font-medium">{f.title}</h2>
              <p className="mt-2 text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-sm text-muted-foreground">
          <p>O Cíclica é uma ferramenta educativa e não substitui orientação profissional de saúde.</p>
          <nav className="flex gap-4">
            <Link to="/termos" className="hover:text-foreground">Termos de uso</Link>
            <Link to="/privacidade" className="hover:text-foreground">Privacidade</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
