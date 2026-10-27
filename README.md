# Meu Ciclo em Dia

# PROMPT PARA LOVABLE — APLICATIVO DE CALENDÁRIO MENSTRUAL

Crie um aplicativo web responsivo de acompanhamento menstrual chamado provisoriamente **Cíclica**, voltado para mulheres e jovens a partir de 15 anos. O objetivo é ajudar as usuárias a acompanhar o ciclo menstrual, registrar sintomas, visualizar estimativas do período fértil e acessar informações educativas adequadas à sua faixa etária.

O projeto deve ser um **MVP simples, funcional e econômico**, adequado à versão gratuita do Lovable. Priorize as funcionalidades essenciais, evite complexidade desnecessária e não implemente recursos pagos ou integrações externas que não sejam indispensáveis.

## 1. IDENTIDADE VISUAL E DESIGN

Desenvolva uma interface feminina, moderna, acolhedora, minimalista e organizada.

Paleta de cores:
- Rosa-claro: #F8DDE5
- Rosa pastel: #F2C6D4
- Rosa médio: #D98FA8
- Lilás pastel: #E9E1F5
- Creme: #FFF9F5
- Branco: #FFFFFF
- Texto principal: #493943

Diretrizes visuais:
- Utilize tons pastéis com contraste suficiente para facilitar a leitura.
- Prefira cartões com cantos arredondados, sombras suaves e espaçamento confortável.
- Utilize tipografia moderna, legível e delicada.
- Inclua ícones simples para calendário, sintomas, perfil, informações e configurações.
- Evite excesso de elementos decorativos, animações pesadas e telas poluídas.
- O aplicativo deve funcionar bem em celulares, tablets e computadores.
- Utilize português brasileiro em toda a interface.
- Crie uma identidade visual consistente, com aparência de um produto real e confiável.

## 2. ESTRUTURA E NAVEGAÇÃO

Crie as seguintes páginas:

### A. Página de entrada e autenticação

Apresente o nome do aplicativo, uma frase curta de boas-vindas e opções para entrar ou criar uma conta.

Exemplo de frase: "Conheça seu ciclo. Cuide de você."

Funcionalidades:
- Cadastro com nome, data de nascimento, e-mail e senha.
- Login com e-mail e senha.
- Recuperação de senha.
- Validação dos campos e mensagens de erro claras.
- Aceite dos termos de uso e da política de privacidade.
- Opção para sair da conta.
- Não exibir dados menstruais pessoais antes da autenticação.

### B. Página inicial — Meu ciclo

Após o login, exiba um painel com:

- Saudação personalizada.
- Data atual.
- Dia estimado do ciclo menstrual, quando houver dados suficientes.
- Próxima menstruação estimada.
- Estimativa do período fértil e da ovulação.
- Resumo dos sintomas registrados recentemente.
- Botão destacado para registrar menstruação ou sintomas.
- Acesso rápido ao calendário, às dicas e à área de ajuda.

Se a usuária ainda não tiver registrado informações suficientes, mostre uma mensagem amigável incentivando o primeiro registro, sem apresentar previsões inventadas.

### C. Página de calendário menstrual

Crie um calendário mensal interativo.

Funcionalidades:
- Permitir selecionar uma data.
- Registrar o primeiro e o último dia da menstruação.
- Marcar os dias de sangramento.
- Permitir editar ou excluir registros.
- Diferenciar visualmente os dias menstruais, os dias estimados do período fértil, a ovulação estimada e o dia atual.
- Exibir uma legenda clara para cada marcação.
- Permitir consultar os meses anteriores e seguintes.

Ao selecionar uma data, abrir um formulário simples para registrar informações daquele dia.

Campos do registro:
- Houve sangramento menstrual? Sim ou não.
- Intensidade do fluxo: leve, moderado ou intenso.
- Cólicas: nenhuma, leve, moderada ou intensa.
- Inchaço: nenhum, leve, moderado ou intenso.
- Outros sintomas: dor de cabeça, sensibilidade nas mamas, cansaço, alterações de humor, acne, náusea e outros.
- Campo opcional para observações pessoais.

Permita selecionar mais de um sintoma.

Não obrigue a usuária a preencher todos os campos. Ela deve poder registrar apenas as informações que desejar.

### D. Registro de atividade sexual — exclusivo para maiores de 18 anos

Somente usuárias com 18 anos completos ou mais poderão visualizar e utilizar essa funcionalidade.

Permita registrar, de maneira opcional e privada:
- Se houve relação sexual em determinada data.
- Observação opcional sobre o registro.

Não solicite nomes de parceiros, imagens íntimas ou detalhes desnecessários.

Não exiba essa seção para menores de 18 anos. A restrição deve ser validada no sistema, e não apenas escondida visualmente.

Trate essas informações como dados pessoais sensíveis, com acesso restrito à própria usuária e proteção adequada no armazenamento.

Não utilize esses registros para realizar diagnósticos, inferir comportamentos ou enviar notificações constrangedoras.

### E. Página de dicas e informações educativas

Crie uma área com conteúdos educativos organizados por categorias:

- Entendendo o ciclo menstrual.
- Menstruação e higiene menstrual.
- Sintomas comuns do período menstrual.
- Cólicas e desconfortos menstruais.
- Autocuidado durante a menstruação.
- Ovulação e período fértil.
- Quando procurar atendimento médico.
- Mitos e verdades sobre a menstruação.

Filtre os conteúdos de acordo com a idade informada no cadastro.

Organização sugerida:
- 15 a 17 anos: puberdade, primeiras menstruações, higiene, mudanças corporais e quando conversar com um adulto de confiança ou profissional de saúde.
- 18 a 24 anos: acompanhamento do ciclo, sintomas, autocuidado e saúde menstrual.
- 25 anos ou mais: acompanhamento do ciclo, variações menstruais, autocuidado e orientação para procurar avaliação profissional quando necessário.

Essas categorias são sugestões de organização, não regras médicas. Permita que a usuária consulte outros conteúdos educativos independentemente da faixa etária, quando apropriado.

Inclua uma busca simples por palavras-chave e filtros por categoria.

As informações devem ser responsáveis, claras, educativas e baseadas em fontes confiáveis de saúde, como o Ministério da Saúde e a Organização Mundial da Saúde.

Não invente tratamentos, medicamentos, dosagens, diagnósticos ou explicações médicas sem fundamento.

Quando um conteúdo envolver sintomas persistentes, intensos, incomuns ou preocupantes, oriente a usuária a procurar um profissional de saúde. Em situações potencialmente urgentes, indique que procure atendimento imediatamente.

### F. Área de acompanhamento do ciclo

Implemente uma visualização simples contendo:

- Histórico dos ciclos registrados.
- Duração de cada ciclo, quando calculável.
- Duração do sangramento.
- Comparação entre os ciclos anteriores.
- Estimativa da próxima menstruação.
- Estimativa da ovulação e do período fértil.

Utilize os registros reais da usuária para calcular as estimativas.

Quando não houver histórico suficiente, solicite as informações necessárias e informe que as estimativas podem ser imprecisas.

Não apresente a ovulação ou o período fértil como certezas. Deixe claro que ciclos irregulares e variações individuais podem alterar as previsões.

Inclua um aviso de que o calendário não é um método contraceptivo confiável e não deve ser utilizado isoladamente para evitar uma gravidez.

Não faça previsões sobre fertilidade individual nem indique que uma usuária está ou não grávida.

### G. Página de perfil e configurações

Permita:
- Visualizar e editar nome, e-mail e data de nascimento.
- Consultar e alterar preferências.
- Acessar a política de privacidade e os termos de uso.
- Solicitar a exclusão da conta e dos dados pessoais.
- Encerrar a sessão.

A idade deve ser calculada a partir da data de nascimento, sem permitir que a usuária escolha manualmente uma idade diferente para liberar funcionalidades restritas.

### H. Central de ajuda e suporte

Crie uma página simples com:
- Perguntas frequentes.
- Explicação de como registrar a menstruação.
- Explicação de como funcionam as previsões do calendário.
- Orientações sobre privacidade e segurança.
- Canal ou formulário simples para contato e envio de dúvidas.

Não invente telefone, e-mail ou endereço de suporte. Se não houver um canal configurado, apresente um formulário interno ou uma mensagem informando que o canal de atendimento precisa ser configurado.

## 3. CADASTRO, BANCO DE DADOS E SEGURANÇA

Se o ambiente permitir, utilize Supabase para autenticação e armazenamento dos dados.

Estruture o banco de dados com tabelas simples:
- profiles: informações básicas do perfil e data de nascimento.
- menstrual_records: registros de menstruação, fluxo e duração.
- symptom_records: sintomas e observações associados às datas.
- sexual_activity_records: registros opcionais de atividade sexual, exclusivos para maiores de 18 anos.
- educational_content: conteúdos educativos, categorias e faixas etárias.

Relacione os registros à conta da usuária autenticada.

Requisitos:
- Uma usuária só pode visualizar, cadastrar, editar e excluir os próprios registros.
- Utilize políticas de segurança no banco de dados, como Row Level Security (RLS), quando usar Supabase.
- Não armazene senhas em tabelas próprias nem em texto simples.
- Não exponha chaves privadas, credenciais administrativas ou segredos no frontend.
- Não inclua dados pessoais ou sintomas em URLs, logs públicos ou mensagens de erro.
- Solicite apenas os dados necessários para o funcionamento do aplicativo.
- Disponibilize a exclusão de registros e da conta.
- Não utilize dados menstruais para publicidade ou compartilhamento com terceiros.
- Não crie perfis públicos nem funcionalidades sociais que exponham os dados das usuárias.

Como o público inclui adolescentes, implemente avisos de privacidade adequados à idade e uma experiência de cadastro compatível com as exigências legais aplicáveis, incluindo a LGPD. Não declare conformidade legal automática apenas porque esses recursos foram implementados.

Se o Supabase não estiver configurado, não simule autenticação segura. Crie a interface e informe claramente quais configurações são necessárias para habilitar o cadastro, o login e o armazenamento persistente.

## 4. REGRAS DE FUNCIONAMENTO

- Calcule a idade automaticamente pela data de nascimento.
- Libere o registro de atividade sexual somente para maiores de 18 anos.
- Utilize as datas e os registros fornecidos pela própria usuária.
- Não crie ciclos, sintomas ou registros fictícios na conta real.
- Se forem utilizados dados de demonstração, identifique-os claramente como exemplos.
- Diferencie dados registrados de previsões calculadas.
- Permita corrigir registros anteriores.
- Atualize o calendário quando um registro for criado, alterado ou excluído.
- Mostre mensagens de sucesso e de erro compreensíveis.
- Trate campos vazios e datas inválidas corretamente.
- Não interprete sintomas como diagnóstico de uma doença.
- Não prescreva tratamentos ou medicamentos.
- Oriente a procurar um profissional de saúde diante de suspeitas ou sintomas preocupantes.

## 5. EXPERIÊNCIA DO USUÁRIO

A navegação principal deve ser simples, preferencialmente com uma barra inferior no celular contendo:

1. Início.
2. Calendário.
3. Meu ciclo.
4. Dicas.
5. Perfil.

No computador, utilize uma navegação lateral ou superior, conforme ficar mais organizada.

Todos os botões devem funcionar. Formulários devem validar dados, salvar informações quando o backend estiver configurado e apresentar feedback ao usuário.

Inclua estados vazios, mensagens de carregamento, tratamento de erros e confirmação antes de excluir registros.

Priorize acessibilidade, contraste adequado, textos objetivos, campos fáceis de preencher e navegação intuitiva.

## 6. ESCOPO DO MVP E LIMITES DA VERSÃO GRATUITA

Implemente primeiro o núcleo funcional:

1. Cadastro e login.
2. Perfil e cálculo de idade.
3. Calendário menstrual.
4. Registro de menstruação e sintomas.
5. Estimativas do ciclo, da ovulação e do período fértil.
6. Biblioteca de dicas educativas filtradas por idade.
7. Privacidade, exclusão de dados e central de ajuda básica.

Não implemente inicialmente:
- Inteligência artificial ou chatbot médico.
- Pagamentos ou planos de assinatura.
- Notificações push.
- Integrações complexas com outros aplicativos.
- Recursos sociais ou comunidade.
- Painéis administrativos avançados.
- APIs pagas ou funcionalidades que exijam serviços externos pagos.

Prefira componentes reutilizáveis, código organizado e cálculos simples no próprio aplicativo.

Construa a solução em etapas, evitando recriar a aplicação inteira quando um ajuste pontual for suficiente.

## 7. RESULTADO ESPERADO

Entregue um aplicativo visualmente consistente, responsivo e funcional, com navegação completa e páginas integradas.

Priorize o funcionamento real dos registros e da autenticação em vez de criar apenas telas demonstrativas.

Antes de finalizar, verifique os fluxos de cadastro, login, registro menstrual, seleção de sintomas, cálculo de idade, bloqueio da funcionalidade para menores de 18 anos, edição e exclusão de registros.

Se alguma funcionalidade depender de configuração externa, informe exatamente o que precisa ser configurado e não apresente a funcionalidade como concluída antes de ela funcionar.

O resultado deve ser um MVP simples, seguro, fácil de usar e adequado para uma futura evolução.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/2aae9392-d68d-4dd4-b32c-d137a32595cb).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
