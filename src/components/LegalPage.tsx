import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Logo } from "./Logo";
import { Notice } from "./Disclaimer";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background px-5 py-8">
      <div className="mx-auto max-w-2xl">
        <Link to="/"><Logo /></Link>
        <article className="mt-8 rounded-3xl bg-card p-6 shadow-soft md:p-10">
          <h1 className="text-3xl font-medium md:text-4xl">{title}</h1>
          <Notice className="mt-5" tone="rose">
            Versão preliminar. Este texto deve ser revisado por profissional jurídico antes do lançamento público do
            aplicativo.
          </Notice>
          <div className="mt-6 space-y-4 leading-relaxed text-foreground [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-medium [&_li]:ml-5 [&_li]:list-disc [&_p]:text-foreground/90">
            {children}
          </div>
        </article>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link to="/termos" className="hover:text-foreground">Termos de uso</Link> ·{" "}
          <Link to="/privacidade" className="hover:text-foreground">Política de privacidade</Link> ·{" "}
          <Link to="/" className="hover:text-foreground">Início</Link>
        </p>
      </div>
    </div>
  );
}
