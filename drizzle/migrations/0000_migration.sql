-- ============ Utility: updated_at ============
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL CHECK (char_length(full_name) BETWEEN 1 AND 100),
  birth_date date NOT NULL,
  terms_accepted_at timestamptz NOT NULL DEFAULT now(),
  typical_cycle_length smallint CHECK (typical_cycle_length IS NULL OR typical_cycle_length BETWEEN 15 AND 60),
  typical_period_length smallint CHECK (typical_period_length IS NULL OR typical_period_length BETWEEN 1 AND 15),
  show_fertile_window boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuária lê o próprio perfil" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Usuária atualiza o próprio perfil" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Birth date rules: minimum age 15, no future dates, and a minor cannot
-- edit her birth date to become an adult (prevents unlocking 18+ features).
CREATE OR REPLACE FUNCTION public.validate_profile_birth_date()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  new_age int;
  old_age int;
BEGIN
  IF NEW.birth_date > current_date THEN
    RAISE EXCEPTION 'Data de nascimento inválida.';
  END IF;
  new_age := date_part('year', age(current_date, NEW.birth_date))::int;
  IF new_age > 120 THEN
    RAISE EXCEPTION 'Data de nascimento inválida.';
  END IF;
  IF new_age < 15 THEN
    RAISE EXCEPTION 'O Cíclica é destinado a pessoas a partir de 15 anos.';
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.birth_date IS DISTINCT FROM OLD.birth_date THEN
    old_age := date_part('year', age(current_date, OLD.birth_date))::int;
    IF old_age < 18 AND new_age >= 18 THEN
      RAISE EXCEPTION 'Esta alteração de data de nascimento não pode ser feita pelo aplicativo.';
    END IF;
  END IF;
  IF TG_OP = 'UPDATE' THEN
    NEW.terms_accepted_at := OLD.terms_accepted_at;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER profiles_validate_birth_date BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.validate_profile_birth_date();

-- Create profile on signup from signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF COALESCE(NEW.raw_user_meta_data->>'terms_accepted', 'false') <> 'true' THEN
    RAISE EXCEPTION 'É preciso aceitar os termos de uso e a política de privacidade.';
  END IF;
  INSERT INTO public.profiles (id, full_name, birth_date, terms_accepted_at)
  VALUES (
    NEW.id,
    left(trim(COALESCE(NEW.raw_user_meta_data->>'full_name', '')), 100),
    (NEW.raw_user_meta_data->>'birth_date')::date,
    now()
  );
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Is the current user 18+? (computed from birth date only)
CREATE OR REPLACE FUNCTION public.current_user_is_adult()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND birth_date <= (current_date - interval '18 years')::date
  );
$$;
REVOKE EXECUTE ON FUNCTION public.current_user_is_adult() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_user_is_adult() TO authenticated;

-- No future-dated records (1 day tolerance for time zones)
CREATE OR REPLACE FUNCTION public.validate_record_date()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.record_date > current_date + 1 THEN
    RAISE EXCEPTION 'Não é possível registrar datas futuras.';
  END IF;
  IF NEW.record_date < date '1950-01-01' THEN
    RAISE EXCEPTION 'Data inválida.';
  END IF;
  RETURN NEW;
END;
$$;

-- ============ MENSTRUAL RECORDS (one row per bleeding day) ============
CREATE TABLE public.menstrual_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  record_date date NOT NULL,
  flow text CHECK (flow IS NULL OR flow IN ('leve', 'moderado', 'intenso')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, record_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.menstrual_records TO authenticated;
GRANT ALL ON public.menstrual_records TO service_role;
ALTER TABLE public.menstrual_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Próprios registros - ler" ON public.menstrual_records FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Próprios registros - criar" ON public.menstrual_records FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Próprios registros - editar" ON public.menstrual_records FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Próprios registros - excluir" ON public.menstrual_records FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER menstrual_updated_at BEFORE UPDATE ON public.menstrual_records FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER menstrual_validate_date BEFORE INSERT OR UPDATE ON public.menstrual_records FOR EACH ROW EXECUTE FUNCTION public.validate_record_date();

-- ============ SYMPTOM RECORDS (one row per day) ============
CREATE TABLE public.symptom_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  record_date date NOT NULL,
  cramps text CHECK (cramps IS NULL OR cramps IN ('nenhuma', 'leve', 'moderada', 'intensa')),
  bloating text CHECK (bloating IS NULL OR bloating IN ('nenhum', 'leve', 'moderado', 'intenso')),
  symptoms text[] NOT NULL DEFAULT '{}',
  other_symptom text CHECK (other_symptom IS NULL OR char_length(other_symptom) <= 100),
  notes text CHECK (notes IS NULL OR char_length(notes) <= 1000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, record_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.symptom_records TO authenticated;
GRANT ALL ON public.symptom_records TO service_role;
ALTER TABLE public.symptom_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Próprios sintomas - ler" ON public.symptom_records FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Próprios sintomas - criar" ON public.symptom_records FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Próprios sintomas - editar" ON public.symptom_records FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Próprios sintomas - excluir" ON public.symptom_records FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER symptom_updated_at BEFORE UPDATE ON public.symptom_records FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER symptom_validate_date BEFORE INSERT OR UPDATE ON public.symptom_records FOR EACH ROW EXECUTE FUNCTION public.validate_record_date();

-- ============ SEXUAL ACTIVITY RECORDS (18+ only, enforced by RLS) ============
CREATE TABLE public.sexual_activity_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  record_date date NOT NULL,
  notes text CHECK (notes IS NULL OR char_length(notes) <= 500),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, record_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sexual_activity_records TO authenticated;
GRANT ALL ON public.sexual_activity_records TO service_role;
ALTER TABLE public.sexual_activity_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Adulta - ler os próprios" ON public.sexual_activity_records FOR SELECT TO authenticated
  USING (auth.uid() = user_id AND public.current_user_is_adult());
CREATE POLICY "Adulta - criar os próprios" ON public.sexual_activity_records FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.current_user_is_adult());
CREATE POLICY "Adulta - editar os próprios" ON public.sexual_activity_records FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND public.current_user_is_adult())
  WITH CHECK (auth.uid() = user_id AND public.current_user_is_adult());
CREATE POLICY "Adulta - excluir os próprios" ON public.sexual_activity_records FOR DELETE TO authenticated
  USING (auth.uid() = user_id AND public.current_user_is_adult());
CREATE TRIGGER sexual_updated_at BEFORE UPDATE ON public.sexual_activity_records FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER sexual_validate_date BEFORE INSERT OR UPDATE ON public.sexual_activity_records FOR EACH ROW EXECUTE FUNCTION public.validate_record_date();

-- ============ SUPPORT MESSAGES ============
CREATE TABLE public.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  subject text NOT NULL CHECK (char_length(subject) BETWEEN 1 AND 150),
  message text NOT NULL CHECK (char_length(message) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.support_messages TO authenticated;
GRANT ALL ON public.support_messages TO service_role;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Próprias mensagens - ler" ON public.support_messages FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Próprias mensagens - enviar" ON public.support_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ============ EDUCATIONAL CONTENT ============
CREATE TABLE public.educational_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  category text NOT NULL,
  title text NOT NULL,
  summary text NOT NULL,
  body text NOT NULL,
  age_groups text[] NOT NULL DEFAULT '{15-17,18-24,25+}',
  sources text NOT NULL DEFAULT 'Ministério da Saúde; Organização Mundial da Saúde (OMS)',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.educational_content TO authenticated;
GRANT ALL ON public.educational_content TO service_role;
ALTER TABLE public.educational_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Conteúdo educativo visível para usuárias autenticadas" ON public.educational_content
  FOR SELECT TO authenticated USING (true);

INSERT INTO public.educational_content (slug, category, title, summary, body, age_groups, sort_order) VALUES
('o-que-e-o-ciclo', 'ciclo', 'O que é o ciclo menstrual',
 'Entenda as fases do ciclo e por que ele varia de pessoa para pessoa.',
$t$O ciclo menstrual é contado do primeiro dia de uma menstruação até o dia anterior à menstruação seguinte. Ele faz parte do funcionamento natural do corpo e é regulado por hormônios.

Em pessoas adultas, um ciclo costuma durar entre 21 e 35 dias, e a menstruação costuma durar de 2 a 7 dias. Essas faixas são referências gerais: cada corpo tem o seu ritmo, e pequenas variações de um mês para outro são comuns.

De forma simplificada, o ciclo tem algumas etapas:
- Menstruação: o revestimento interno do útero é eliminado na forma de sangramento.
- Fase folicular: o corpo se prepara para liberar um óvulo.
- Ovulação: um óvulo é liberado pelo ovário, geralmente perto da metade do ciclo.
- Fase lútea: período entre a ovulação e a próxima menstruação.

Estresse, mudanças de rotina, sono, alimentação, atividade física intensa e algumas condições de saúde podem alterar o ciclo. Registrar seus dias ajuda você a conhecer o seu padrão e a conversar com um profissional de saúde quando precisar.$t$,
 '{15-17,18-24,25+}', 10),

('primeiras-menstruacoes', 'ciclo', 'Primeiras menstruações: o que esperar',
 'Nos primeiros anos, é comum que o ciclo ainda não seja regular.',
$t$A primeira menstruação, chamada de menarca, costuma acontecer durante a puberdade. Nos primeiros anos depois dela, é bastante comum que os ciclos sejam irregulares: o intervalo entre uma menstruação e outra pode variar, e o fluxo pode mudar de um mês para outro.

Isso acontece porque o corpo ainda está ajustando a produção de hormônios. Com o tempo, o ciclo tende a ficar mais previsível.

Algumas dicas para essa fase:
- Anote os dias de sangramento para conhecer o seu padrão.
- Tenha sempre um absorvente na mochila ou na bolsa.
- Se tiver dúvidas, converse com um adulto de confiança, como mãe, pai, responsável, professora ou outra pessoa próxima.
- Procure uma Unidade Básica de Saúde (UBS) ou um profissional de saúde se sentir dor forte, sangramento muito intenso ou se algo preocupar você.

Ter dúvidas é normal. Ninguém precisa passar por essa fase sem informação.$t$,
 '{15-17}', 20),

('variacoes-do-ciclo', 'ciclo', 'Variações do ciclo ao longo da vida',
 'O ciclo pode mudar com a idade, a rotina e diferentes fases da vida.',
$t$O ciclo menstrual não é igual a vida toda. Ele pode mudar com a idade, após uma gestação, com o uso de alguns medicamentos ou métodos contraceptivos, em períodos de estresse e com mudanças importantes de peso ou de rotina.

Variações pequenas de alguns dias entre um ciclo e outro são comuns. Já mudanças marcantes e persistentes merecem atenção, por exemplo:
- ciclos que passam a ser muito mais curtos ou muito mais longos do que o habitual;
- ausência de menstruação por vários meses sem motivo conhecido;
- sangramento entre as menstruações ou após a relação sexual;
- fluxo muito mais intenso do que o habitual.

Nesses casos, procure um profissional de saúde para uma avaliação. O histórico que você registra no aplicativo pode ajudar nessa conversa.$t$,
 '{18-24,25+}', 30),

('higiene-intima', 'higiene', 'Higiene íntima no dia a dia',
 'Cuidados simples para se sentir confortável durante a menstruação.',
$t$Durante a menstruação, alguns cuidados simples ajudam a manter o conforto e a saúde:
- Lave a região externa (vulva) com água e sabonete neutro ou suave durante o banho.
- Evite duchas vaginais: a vagina tem mecanismos naturais de limpeza, e as duchas podem alterar seu equilíbrio.
- Troque o absorvente regularmente, de acordo com o fluxo e com a orientação do fabricante.
- Prefira roupas íntimas confortáveis e que permitam a ventilação.
- Lave as mãos antes e depois de trocar o absorvente ou o coletor.

Tomar banho, lavar o cabelo e manter a rotina de higiene durante a menstruação é seguro e recomendado.

Se você notar coceira persistente, ardência, mau cheiro forte ou corrimento diferente do habitual, procure um profissional de saúde.$t$,
 '{15-17,18-24,25+}', 40),

('produtos-menstruais', 'higiene', 'Absorventes, coletores e calcinhas absorventes',
 'Conheça as opções e os cuidados de uso de cada produto.',
$t$Existem diferentes produtos para a menstruação. A escolha depende do seu conforto, da sua rotina e do seu fluxo:
- Absorvente externo: fica na calcinha. Deve ser trocado com regularidade.
- Absorvente interno: é inserido na vagina. Respeite o tempo máximo de uso indicado na embalagem e use a menor absorção adequada ao seu fluxo.
- Coletor menstrual: copinho reutilizável inserido na vagina. Deve ser esvaziado e higienizado conforme as instruções do fabricante.
- Calcinha absorvente: reutilizável, deve ser lavada conforme a orientação do fabricante.

Leia sempre as instruções da embalagem.

Atenção: em casos raros, o uso de produtos internos está associado à síndrome do choque tóxico. Se você estiver usando absorvente interno ou coletor e tiver febre alta de início súbito, vômitos, diarreia, tontura, desmaio ou manchas avermelhadas na pele, retire o produto e procure atendimento médico imediatamente.$t$,
 '{15-17,18-24,25+}', 50),

('sintomas-comuns', 'sintomas', 'Sintomas comuns antes e durante a menstruação',
 'Inchaço, sensibilidade nas mamas e alterações de humor podem acontecer.',
$t$Muitas pessoas percebem mudanças no corpo e no humor nos dias que antecedem a menstruação ou durante ela. Entre as mais comuns estão:
- cólicas na parte baixa da barriga;
- inchaço;
- sensibilidade nas mamas;
- cansaço;
- dor de cabeça;
- alterações de humor, irritabilidade ou mais sensibilidade emocional;
- acne;
- mudanças no apetite.

Quando esses sinais aparecem antes da menstruação e melhoram depois que ela começa, costumam ser chamados de tensão pré-menstrual (TPM). A intensidade varia muito de pessoa para pessoa.

Registrar seus sintomas ajuda a perceber padrões. Os registros do aplicativo não servem para diagnóstico. Se os sintomas atrapalharem seus estudos, seu trabalho, seu sono ou suas relações, ou se forem muito intensos, procure um profissional de saúde.$t$,
 '{15-17,18-24,25+}', 60),

('colicas', 'colicas', 'Cólicas: o que são e medidas de conforto',
 'Por que as cólicas acontecem e o que pode trazer alívio no dia a dia.',
$t$As cólicas menstruais acontecem porque o útero se contrai para eliminar seu revestimento. Elas são comuns, principalmente nos primeiros dias da menstruação.

Algumas medidas simples podem trazer conforto:
- aplicar calor local, como uma bolsa de água morna sobre a barriga (com cuidado para não se queimar);
- fazer atividades físicas leves ou alongamentos, se você se sentir bem;
- descansar e manter uma boa hidratação;
- usar roupas confortáveis.

Não use medicamentos por conta própria. Converse com um profissional de saúde ou farmacêutico antes de usar qualquer remédio para dor.

Procure atendimento se a dor for muito forte, se não melhorar com as medidas de conforto, se impedir suas atividades habituais, se for diferente do que você costuma sentir ou se vier acompanhada de febre, desmaio ou sangramento muito intenso.$t$,
 '{15-17,18-24,25+}', 70),

('autocuidado', 'autocuidado', 'Autocuidado durante a menstruação',
 'Pequenos cuidados com o corpo e a mente podem fazer diferença.',
$t$Cuidar de si durante a menstruação pode ser simples:
- Respeite seus limites: em dias de mais cansaço, reduza o ritmo quando for possível.
- Durma bem e mantenha horários regulares.
- Beba água ao longo do dia.
- Prefira uma alimentação variada, com frutas, verduras e legumes.
- Movimente-se de acordo com sua disposição: caminhadas e alongamentos costumam ser bem-vindos.
- Tenha por perto o que deixa você mais confortável: absorventes, roupa confortável, bolsa de água morna.
- Observe suas emoções e converse com alguém de confiança se estiver se sentindo mal.

Se você sentir tristeza intensa, ansiedade forte ou pensamentos de se machucar, procure ajuda profissional. No Brasil, o CVV atende gratuitamente pelo telefone 188, 24 horas por dia.$t$,
 '{15-17,18-24,25+}', 80),

('mudancas-na-adolescencia', 'autocuidado', 'Mudanças no corpo na adolescência',
 'A puberdade traz muitas mudanças, e cada pessoa vive isso no seu tempo.',
$t$Durante a puberdade, o corpo passa por várias transformações: crescimento das mamas, aparecimento de pelos, mudanças na pele, no formato do corpo e o início da menstruação.

Cada pessoa vive essas mudanças no seu próprio tempo. Comparar seu corpo com o de outras pessoas pode gerar insegurança, mas é normal haver diferenças.

Algumas orientações:
- Converse com um adulto de confiança sobre suas dúvidas.
- Cuide da higiene da pele e do corpo com produtos suaves.
- Busque informação em fontes confiáveis, como profissionais de saúde e serviços públicos de saúde.
- Na Unidade Básica de Saúde (UBS) você pode receber orientação gratuita.

Se algo deixar você preocupada ou desconfortável, você tem o direito de procurar ajuda e ser ouvida.$t$,
 '{15-17}', 90),

('ovulacao-periodo-fertil', 'fertil', 'Ovulação e período fértil: noções básicas',
 'Entenda o que são e por que as estimativas nunca são exatas.',
$t$A ovulação é a liberação de um óvulo pelo ovário. Ela costuma acontecer cerca de 14 dias antes da próxima menstruação, mas esse momento varia de pessoa para pessoa e até de um ciclo para outro.

O período fértil corresponde aos dias do ciclo em que há maior chance de gravidez caso haja relação sexual sem proteção. Ele inclui alguns dias antes da ovulação e o próprio dia da ovulação, porque os espermatozoides podem sobreviver alguns dias no corpo.

As datas mostradas no aplicativo são estimativas calculadas a partir dos seus registros. Elas podem estar erradas, especialmente se seus ciclos forem irregulares, se houver poucos registros, ou em situações como estresse, doenças, uso de medicamentos e pós-parto.

Para planejar ou evitar uma gravidez, converse com um profissional de saúde.$t$,
 '{18-24,25+}', 100),

('calendario-nao-e-contraceptivo', 'fertil', 'Por que o calendário não é um método contraceptivo confiável',
 'Previsões de calendário não devem ser usadas sozinhas para evitar gravidez.',
$t$Aplicativos de calendário menstrual, incluindo o Cíclica, calculam estimativas. Eles não sabem exatamente quando a ovulação acontece no seu corpo.

Por isso, o calendário não é um método contraceptivo confiável e não deve ser usado sozinho para evitar uma gravidez. Também não protege contra infecções sexualmente transmissíveis (ISTs).

Vale saber:
- É possível engravidar em dias fora do período fértil estimado, porque a ovulação pode adiantar ou atrasar.
- É possível, embora menos provável, engravidar durante a menstruação.
- A camisinha (externa ou interna) é o método que, além de ajudar a prevenir a gravidez, protege contra ISTs.

O SUS oferece orientação e métodos contraceptivos gratuitos. Procure uma Unidade Básica de Saúde ou um profissional de saúde para escolher o método mais adequado para você.$t$,
 '{18-24,25+}', 110),

('quando-procurar-atendimento', 'atendimento', 'Sinais para procurar um profissional de saúde',
 'Saiba quais situações merecem avaliação e quando buscar atendimento imediato.',
$t$Procure um profissional de saúde se você perceber:
- sangramento muito intenso, que exige trocar o absorvente a cada uma ou duas horas, por várias horas seguidas;
- menstruação que dura mais de 7 dias;
- cólicas muito fortes, que não melhoram ou que impedem suas atividades;
- sangramento entre as menstruações ou após a relação sexual;
- ausência de menstruação por três meses ou mais, quando antes ela vinha regularmente;
- ciclos que mudaram muito em relação ao seu padrão habitual;
- corrimento com cheiro forte, coceira ou ardência persistentes.

Procure atendimento imediatamente (pronto-socorro ou SAMU, telefone 192) se tiver:
- sangramento muito intenso acompanhado de tontura, fraqueza, falta de ar ou desmaio;
- dor abdominal forte e repentina;
- febre alta com mal-estar intenso, especialmente se estiver usando absorvente interno ou coletor;
- suspeita de gravidez com dor forte ou sangramento.

Este conteúdo é informativo e não substitui uma consulta.$t$,
 '{15-17,18-24,25+}', 120),

('adulto-de-confianca', 'atendimento', 'Quando conversar com um adulto de confiança',
 'Você não precisa lidar com dúvidas e desconfortos sozinha.',
$t$Se você tem menos de 18 anos, conversar com um adulto de confiança pode ajudar muito. Pode ser sua mãe, seu pai, responsável, uma tia, uma professora ou outra pessoa com quem você se sinta segura.

Converse com alguém se:
- a menstruação causar dor forte ou atrapalhar a escola;
- o sangramento parecer muito intenso;
- você tiver dúvidas sobre o seu corpo;
- você se sentir triste, ansiosa ou insegura por muitos dias.

Você também pode procurar uma Unidade Básica de Saúde (UBS), onde profissionais podem orientar você gratuitamente.

Se você estiver passando por qualquer situação de violência ou se sentir em risco, procure ajuda. O Disque 100 recebe denúncias de violações de direitos de crianças e adolescentes, e em emergências ligue 190.$t$,
 '{15-17}', 130),

('mitos-e-verdades', 'mitos', 'Mitos e verdades sobre a menstruação',
 'Lavar o cabelo, fazer exercícios e outras dúvidas comuns.',
$t$"Não pode lavar o cabelo menstruada." Mito. Tomar banho e lavar o cabelo durante a menstruação é seguro e ajuda no conforto.

"Não pode fazer exercício físico." Mito. Atividades físicas são permitidas e podem até aliviar cólicas. Respeite sua disposição.

"O sangue menstrual é sujo." Mito. A menstruação é um processo natural do corpo e não tem nada de sujo ou vergonhoso.

"Todo ciclo tem exatamente 28 dias." Mito. O número 28 é apenas uma média. Ciclos mais curtos ou mais longos podem ser normais.

"Cólica forte é sempre normal e é preciso aguentar." Mito. Cólicas leves a moderadas são comuns, mas dor muito forte ou que impede suas atividades merece avaliação profissional.

"É normal o ciclo variar um pouco." Verdade. Pequenas variações de alguns dias são comuns.

"Estresse pode alterar a menstruação." Verdade. Estresse, sono e mudanças de rotina podem influenciar o ciclo.$t$,
 '{15-17,18-24,25+}', 140);
