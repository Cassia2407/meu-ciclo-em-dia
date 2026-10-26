export const FLOW_OPTIONS = [
  { value: "leve", label: "Leve" },
  { value: "moderado", label: "Moderado" },
  { value: "intenso", label: "Intenso" },
] as const;

export const CRAMPS_OPTIONS = [
  { value: "nenhuma", label: "Nenhuma" },
  { value: "leve", label: "Leve" },
  { value: "moderada", label: "Moderada" },
  { value: "intensa", label: "Intensa" },
] as const;

export const BLOATING_OPTIONS = [
  { value: "nenhum", label: "Nenhum" },
  { value: "leve", label: "Leve" },
  { value: "moderado", label: "Moderado" },
  { value: "intenso", label: "Intenso" },
] as const;

export const SYMPTOM_OPTIONS = [
  { value: "dor_de_cabeca", label: "Dor de cabeça" },
  { value: "sensibilidade_mamas", label: "Sensibilidade nas mamas" },
  { value: "cansaco", label: "Cansaço" },
  { value: "humor", label: "Alterações de humor" },
  { value: "acne", label: "Acne" },
  { value: "nausea", label: "Náusea" },
  { value: "outros", label: "Outros" },
] as const;

export const symptomLabel = (v: string) =>
  SYMPTOM_OPTIONS.find((o) => o.value === v)?.label ?? v;

export const CATEGORIES = [
  { value: "ciclo", label: "Entendendo o ciclo menstrual" },
  { value: "higiene", label: "Menstruação e higiene menstrual" },
  { value: "sintomas", label: "Sintomas comuns do período menstrual" },
  { value: "colicas", label: "Cólicas e desconfortos menstruais" },
  { value: "autocuidado", label: "Autocuidado durante a menstruação" },
  { value: "fertil", label: "Ovulação e período fértil" },
  { value: "atendimento", label: "Quando procurar atendimento médico" },
  { value: "mitos", label: "Mitos e verdades sobre a menstruação" },
] as const;

export const categoryLabel = (v: string) => CATEGORIES.find((c) => c.value === v)?.label ?? v;

/** Translates backend/auth messages to friendly Portuguese without leaking details. */
export function friendlyError(err: unknown, fallback = "Não foi possível concluir. Tente novamente."): string {
  const msg = err && typeof err === "object" && "message" in err ? String((err as { message: unknown }).message) : "";
  const known: [RegExp, string][] = [
    [/invalid login credentials/i, "E-mail ou senha incorretos."],
    [/email not confirmed/i, "Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada."],
    [/user already registered/i, "Já existe uma conta com este e-mail."],
    [/password should be at least/i, "A senha precisa ter pelo menos 8 caracteres."],
    [/(weak|pwned|leaked)/i, "Esta senha é fácil de adivinhar ou já apareceu em vazamentos. Escolha outra."],
    [/rate limit|too many/i, "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente de novo."],
    [/database error saving new user/i, "Não foi possível criar a conta. Confira os dados (é preciso ter 15 anos ou mais e aceitar os termos)."],
    [/datas futuras/i, "Não é possível registrar datas futuras."],
    [/a partir de 15 anos/i, "O Cíclica é destinado a pessoas a partir de 15 anos."],
    [/não pode ser feita pelo aplicativo/i, "Esta alteração de data de nascimento não pode ser feita pelo aplicativo."],
    [/data de nascimento inválida/i, "Data de nascimento inválida."],
    [/row-level security/i, "Você não tem permissão para esta ação."],
    [/failed to fetch|network/i, "Sem conexão. Verifique sua internet e tente novamente."],
    [/same.*password|different from the old/i, "A nova senha precisa ser diferente da atual."],
  ];
  for (const [re, text] of known) if (re.test(msg)) return text;
  return fallback;
}
