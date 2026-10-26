import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos de uso — Cíclica" },
      { name: "description", content: "Condições de uso do Cíclica, aplicativo de calendário menstrual." },
      { property: "og:title", content: "Termos de uso — Cíclica" },
      { property: "og:description", content: "Condições de uso do Cíclica, aplicativo de calendário menstrual." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Termos,
});

function Termos() {
  return (
    <LegalPage title="Termos de uso">
      <h2>1. O que é o Cíclica</h2>
      <p>
        O Cíclica é um aplicativo de acompanhamento do ciclo menstrual com finalidade educativa e de organização
        pessoal. Ele permite registrar dias de menstruação, sintomas e observações, e apresenta estimativas
        calculadas a partir desses registros.
      </p>
      <h2>2. Quem pode usar</h2>
      <p>
        O aplicativo é destinado a pessoas a partir de 15 anos. Algumas funcionalidades são exclusivas para
        maiores de 18 anos, e a idade é calculada pela data de nascimento informada no cadastro. Se você tem
        menos de 18 anos, recomendamos conversar com sua mãe, seu pai ou responsável sobre o uso do aplicativo.
      </p>
      <h2>3. Não é um serviço médico</h2>
      <ul>
        <li>O Cíclica não faz diagnósticos, não prescreve tratamentos e não substitui consultas.</li>
        <li>As datas de ovulação, período fértil e próxima menstruação são apenas estimativas.</li>
        <li>O calendário não é um método contraceptivo confiável e não deve ser usado sozinho para evitar gravidez.</li>
        <li>Em caso de sintomas intensos, persistentes ou preocupantes, procure um profissional de saúde. Em emergências, ligue 192 (SAMU).</li>
      </ul>
      <h2>4. Sua conta</h2>
      <p>
        Você é responsável por manter sua senha em sigilo e por informar dados verdadeiros no cadastro. Você pode
        editar seus dados e excluir sua conta a qualquer momento pela página de perfil.
      </p>
      <h2>5. Uso adequado</h2>
      <p>
        Não utilize o aplicativo para fins ilegais nem tente acessar dados de outras pessoas. Contas usadas de
        forma abusiva podem ser suspensas.
      </p>
      <h2>6. Alterações</h2>
      <p>
        Estes termos podem ser atualizados. Quando isso acontecer, avisaremos no próprio aplicativo.
      </p>
    </LegalPage>
  );
}
