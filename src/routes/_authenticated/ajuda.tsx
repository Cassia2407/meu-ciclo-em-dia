import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Notice } from "@/components/Disclaimer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser, useIsAdult } from "@/lib/data";
import { friendlyError } from "@/lib/labels";

export const Route = createFileRoute("/_authenticated/ajuda")({
  head: () => ({
    meta: [
      { title: "Central de ajuda — Cíclica" },
      { name: "description", content: "Perguntas frequentes, como registrar e como funcionam as previsões." },
      { property: "og:title", content: "Central de ajuda — Cíclica" },
      { property: "og:description", content: "Perguntas frequentes, como registrar e como funcionam as previsões." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Ajuda,
});

const contactSchema = z.object({
  subject: z.string().trim().min(1, "Informe o assunto.").max(150, "Use no máximo 150 caracteres."),
  message: z.string().trim().min(1, "Escreva sua mensagem.").max(2000, "Use no máximo 2000 caracteres."),
});

function Ajuda() {
  const user = useCurrentUser();
  const adult = useIsAdult();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);

  const faq = [
    {
      q: "Como registro minha menstruação?",
      a: "No Calendário, toque em “Registrar menstruação” e informe o primeiro e o último dia. Você também pode tocar em um dia específico e responder “Sim” em “Houve sangramento menstrual?”. Se ainda estiver menstruada, registre até hoje e complete depois.",
    },
    {
      q: "Como registro sintomas?",
      a: "Toque em “Registrar hoje” no Início ou em qualquer dia do Calendário. Escolha cólicas, inchaço e outros sintomas — você pode marcar vários — e, se quiser, escreva uma observação. Nenhum campo é obrigatório.",
    },
    {
      q: "Como corrijo ou apago um registro?",
      a: "No Calendário, toque no dia, use “Editar registro” para alterar ou “Excluir registros do dia” para apagar. Sempre pedimos confirmação antes de excluir.",
    },
    {
      q: "Como funcionam as previsões?",
      a: "Calculamos a média da duração dos seus últimos ciclos registrados (até 6). A próxima menstruação é estimada somando essa média ao início da última menstruação. A ovulação é estimada cerca de 14 dias antes da próxima menstruação, e o período fértil vai de 5 dias antes até 1 dia depois da ovulação estimada. Com apenas uma menstruação registrada, usamos a duração habitual do ciclo que você informar.",
    },
    {
      q: "As previsões são confiáveis?",
      a: "São apenas estimativas. Ciclos irregulares, estresse, doenças, medicamentos e outras variações individuais podem alterar as datas. O calendário não é um método contraceptivo confiável e não deve ser usado sozinho para evitar uma gravidez.",
    },
    {
      q: "Quem pode ver meus dados?",
      a: "Somente você. Cada conta só consegue acessar os próprios registros, e essa regra é aplicada no banco de dados. Não há perfis públicos e não compartilhamos seus dados com terceiros nem para publicidade.",
    },
    {
      q: "Como excluo minha conta?",
      a: "Em Perfil, toque em “Excluir conta e dados”. Todos os seus registros são apagados definitivamente.",
    },
    ...(adult
      ? [
          {
            q: "Como funciona o registro de atividade sexual?",
            a: "É opcional e privado, disponível apenas para maiores de 18 anos. Você pode marcar se houve relação em uma data e adicionar uma observação. Esses registros não são usados para diagnósticos nem para enviar notificações.",
          },
        ]
      : []),
  ];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = contactSchema.safeParse({ subject, message });
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const i of parsed.error.issues) errs[String(i.path[0])] = i.message;
      setErrors(errs);
      return;
    }
    setErrors({});
    setSending(true);
    const { error } = await supabase
      .from("support_messages")
      .insert({ user_id: user.id, subject: parsed.data.subject, message: parsed.data.message });
    setSending(false);
    if (error) {
      toast.error(friendlyError(error, "Não foi possível enviar sua mensagem. Tente novamente."));
      return;
    }
    setSubject("");
    setMessage("");
    toast.success("Mensagem enviada. Obrigada!");
  };

  return (
    <AppShell>
      <PageHeader title="Central de ajuda" subtitle="Dúvidas frequentes e contato." />

      <section className="rounded-3xl bg-card p-2 shadow-soft md:p-4">
        <Accordion type="single" collapsible>
          {faq.map((f, i) => (
            <AccordionItem key={f.q} value={`q${i}`} className="px-3 last:border-b-0">
              <AccordionTrigger className="text-left font-bold hover:no-underline">{f.q}</AccordionTrigger>
              <AccordionContent className="leading-relaxed text-foreground/85">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <Notice className="mt-5" tone="rose">
        O Cíclica não oferece atendimento médico. Se tiver sintomas intensos ou preocupantes, procure um profissional
        de saúde ou uma Unidade Básica de Saúde. Em emergências, ligue 192 (SAMU).
      </Notice>

      <section className="mt-8 rounded-3xl bg-card p-5 shadow-soft md:p-6">
        <h2 className="text-xl font-medium">Enviar uma dúvida</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Sua mensagem fica registrada no aplicativo para a equipe responsável. Não inclua dados de saúde que você não
          queira compartilhar.
        </p>
        <form onSubmit={submit} noValidate className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ct-subject">Assunto</Label>
            <Input id="ct-subject" maxLength={150} value={subject} onChange={(e) => setSubject(e.target.value)} className="h-11 rounded-xl" />
            {errors.subject && <p className="text-sm font-semibold text-destructive">{errors.subject}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ct-message">Mensagem</Label>
            <Textarea id="ct-message" maxLength={2000} rows={5} value={message} onChange={(e) => setMessage(e.target.value)} className="rounded-xl" />
            {errors.message && <p className="text-sm font-semibold text-destructive">{errors.message}</p>}
          </div>
          <Button type="submit" className="rounded-full" disabled={sending}>
            {sending ? "Enviando…" : "Enviar mensagem"}
          </Button>
        </form>
      </section>
    </AppShell>
  );
}
