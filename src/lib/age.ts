export const MIN_AGE = 15;
export const ADULT_AGE = 18;

export type AgeGroup = "15-17" | "18-24" | "25+";

/** Parses "yyyy-MM-dd" as a local calendar date (no time zone shift). */
export function parseLocalDate(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const date = new Date(y, mo, d);
  if (date.getFullYear() !== y || date.getMonth() !== mo || date.getDate() !== d) return null;
  return date;
}

/** Full years between birth date and `today`. Returns null for invalid input. */
export function calculateAge(birthDate: string, today: Date = new Date()): number | null {
  const birth = parseLocalDate(birthDate);
  if (!birth) return null;
  let age = today.getFullYear() - birth.getFullYear();
  const beforeBirthday =
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}

export function isAdult(birthDate: string, today: Date = new Date()): boolean {
  const age = calculateAge(birthDate, today);
  return age !== null && age >= ADULT_AGE;
}

export function ageGroup(age: number): AgeGroup {
  if (age < 18) return "15-17";
  if (age < 25) return "18-24";
  return "25+";
}

export type BirthDateCheck = { ok: true; age: number } | { ok: false; message: string };

export function validateBirthDate(birthDate: string, today: Date = new Date()): BirthDateCheck {
  const birth = parseLocalDate(birthDate);
  if (!birth) return { ok: false, message: "Informe uma data de nascimento válida." };
  if (birth > today) return { ok: false, message: "A data de nascimento não pode estar no futuro." };
  const age = calculateAge(birthDate, today)!;
  if (age > 120) return { ok: false, message: "Informe uma data de nascimento válida." };
  if (age < MIN_AGE)
    return { ok: false, message: "O Cíclica é destinado a pessoas a partir de 15 anos." };
  return { ok: true, age };
}
