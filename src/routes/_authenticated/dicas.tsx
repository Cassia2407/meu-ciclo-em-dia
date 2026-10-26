import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { AppShell, ErrorState, LoadingState, PageHeader } from "@/components/AppShell";
import { Chip } from "@/components/Chip";
import { Notice } from "@/components/Disclaimer";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ageGroup, calculateAge } from "@/lib/age";
import { useEducationalContent, useProfile, type EducationalContent } from "@/lib/data";
import { CATEGORIES, categoryLabel } from "@/lib/labels";

export const Route = createFileRoute("/_authenticated/dicas")({
  head: () => ({
    meta: [
      { title: "Dicas e informações — Cíclica" },
      { name: "description", content: "Conteúdos educativos sobre ciclo menstrual, higiene, cólicas e autocuidado." },
      { property: "og:title", content: "Dicas e informações — Cíclica" },
      { property: "og:description", content: "Conteúdos educativos sobre ciclo menstrual, higiene, cólicas e autocuidado." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dicas,
});

const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

function ArticleBody({ body }: { body: string }) {
  const blocks = body.split(/\n\s*\n/);
  return (
    <div className="space-y-3 leading-relaxed">
      {blocks.map((block, i) => {
        const lines = block.split("\n");
        const bullets = lines.filter((l) => l.startsWith("- "));
        const intro = lines.filter((l) => !l.startsWith("- "));
        return (
          <div key={i} className="space-y-2">
            {intro.length > 0 && <p>{intro.join(" ")}</p>}
            {bullets.length > 0 && (
              <ul className="ml-5 list-disc space-y-1">
                {bullets.map((b, j) => (
                  <li key={j}>{b.slice(2)}</li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Dicas() {
  const profile = useProfile();
  const content = useEducationalContent();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [onlyMine, setOnlyMine] = useState(true);
  const [open, setOpen] = useState<EducationalContent | null>(null);

  const age = profile.data ? calculateAge(profile.data.birth_date) : null;
  const group = age !== null ? ageGroup(age) : null;

  const list = useMemo(() => {
    const q = normalize(query.trim());
    return (content.data ?? []).filter((c) => {
      if (onlyMine && group && !c.age_groups.includes(group)) return false;
      if (category && c.category !== category) return false;
      if (q && !normalize(`${c.title} ${c.summary} ${c.body}`).includes(q)) return false;
      return true;
    });
  }, [content.data, query, category, onlyMine, group]);

  if (content.isLoading || profile.isLoading) return <AppShell><LoadingState /></AppShell>;
  if (content.isError) return <AppShell><ErrorState onRetry={() => content.refetch()} /></AppShell>;

  return (
    <AppShell>
      <PageHeader title="Dicas" subtitle="Informações educativas sobre saúde menstrual." />

      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por palavra-chave (ex.: cólica, absorvente)"
          aria-label="Buscar dicas"
          className="h-12 rounded-full bg-card pl-11"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Chip selected={onlyMine} onClick={() => setOnlyMine(true)}>Para a minha idade</Chip>
        <Chip selected={!onlyMine} onClick={() => setOnlyMine(false)}>Todos os conteúdos</Chip>
      </div>

      <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-2" role="group" aria-label="Categorias">
        <Chip selected={category === null} onClick={() => setCategory(null)} className="shrink-0">Todas</Chip>
        {CATEGORIES.map((c) => (
          <Chip key={c.value} selected={category === c.value} onClick={() => setCategory(category === c.value ? null : c.value)} className="shrink-0">
            {c.label}
          </Chip>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="mt-6 rounded-3xl bg-card p-6 text-center shadow-soft">
          <p>Nenhum conteúdo encontrado.</p>
          <p className="mt-1 text-sm text-muted-foreground">Tente outra palavra ou veja todos os conteúdos.</p>
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {list.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => setOpen(c)}
                className="flex h-full w-full flex-col rounded-3xl bg-card p-5 text-left shadow-soft transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="text-xs font-bold uppercase tracking-wide text-lilac-deep">{categoryLabel(c.category)}</span>
                <span className="mt-2 font-display text-xl font-medium">{c.title}</span>
                <span className="mt-2 text-sm text-muted-foreground">{c.summary}</span>
                <span className="mt-auto pt-4 text-sm font-bold text-primary">Ler mais →</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Notice className="mt-8">
        Conteúdo educativo baseado em orientações de fontes de saúde como o Ministério da Saúde e a Organização Mundial
        da Saúde. Não substitui consulta com profissional de saúde. Em emergências, ligue 192 (SAMU).
      </Notice>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl sm:max-w-2xl">
          {open && (
            <>
              <DialogHeader>
                <p className="text-xs font-bold uppercase tracking-wide text-lilac-deep">{categoryLabel(open.category)}</p>
                <DialogTitle className="font-display text-2xl font-medium">{open.title}</DialogTitle>
                <DialogDescription>{open.summary}</DialogDescription>
              </DialogHeader>
              <ArticleBody body={open.body} />
              <p className="mt-4 border-t pt-4 text-xs text-muted-foreground">
                Fontes de referência: {open.sources}. Este conteúdo é informativo e não substitui orientação
                profissional.
              </p>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
