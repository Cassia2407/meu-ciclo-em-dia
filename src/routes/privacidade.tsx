import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de privacidade — Cíclica" },
      { name: "description", content: "Como o Cíclica coleta, usa e protege seus dados pessoais e de saúde." },
      { property: "og:title", content: "Política de privacidade — Cíclica" },
      { property: "og:description", content: "Como o Cíclica coleta, usa e protege seus dados pessoais e de saúde." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Privacidade,
});

function Privacidade() {
  return (
    <LegalPage title="Política de privacidade">
      <p>
        Levamos sua privacidade a sério. Dados sobre menstruação, sintomas e vida sexual são dados pessoais
        sensíveis e recebem cuidado especial, conforme a Lei Geral de Proteção de Dados (LGPD).
      </p>
      <h2>Quais dados coletamos</h2>
      <ul>
        <li>Cadastro: nome, data de nascimento e e-mail. A senha é protegida pelo sistema de autenticação e nunca fica guardada em texto simples.</li>
        <li>Registros que você escolher fazer: dias de menstruação, fluxo, sintomas e observações.</li>
        <li>Para maiores de 18 anos, se você optar: registro de relação sexual em uma data e observação opcional.</li>
        <li>Preferências do aplicativo, como a duração habitual do seu ciclo.</li>
        <li>Mensagens enviadas pela central de ajuda.</li>
      </ul>
      <h2>Para que usamos</h2>
      <ul>
        <li>Mostrar seu calendário, seu histórico e as estimativas do ciclo.</li>
        <li>Calcular sua idade para mostrar conteúdos adequados e liberar funcionalidades restritas.</li>
        <li>Responder dúvidas enviadas pela central de ajuda.</li>
      </ul>
      <h2>O que não fazemos</h2>
      <ul>
        <li>Não vendemos nem compartilhamos seus dados com terceiros para publicidade.</li>
        <li>Não criamos perfis públicos nem funcionalidades sociais.</li>
        <li>Não usamos seus registros para fazer diagnósticos ou inferir comportamentos.</li>
      </ul>
      <h2>Proteção</h2>
      <p>
        Cada conta só consegue ver, criar, editar e excluir os próprios registros. Essa regra é aplicada no banco
        de dados, e não apenas na tela. Os dados são transmitidos por conexão segura.
      </p>
      <h2>Adolescentes</h2>
      <p>
        Se você tem entre 15 e 17 anos, coletamos apenas o necessário para o funcionamento do aplicativo e a
        funcionalidade de registro de atividade sexual não fica disponível. Recomendamos conversar com sua mãe,
        seu pai ou responsável sobre o uso do aplicativo.
      </p>
      <h2>Seus direitos</h2>
      <p>
        Você pode consultar e corrigir seus dados no perfil, excluir registros a qualquer momento e solicitar a
        exclusão definitiva da conta e de todos os dados pela página de perfil.
      </p>
    </LegalPage>
  );
}
