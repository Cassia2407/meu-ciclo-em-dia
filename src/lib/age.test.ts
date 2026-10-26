import { describe, expect, it } from "vitest";
import { ageGroup, calculateAge, isAdult, validateBirthDate } from "./age";

const today = new Date(2026, 9, 26); // 26 Oct 2026

describe("idade calculada pela data de nascimento", () => {
  it("um dia antes de completar 18 anos ainda tem 17", () => {
    expect(calculateAge("2008-10-27", today)).toBe(17);
    expect(isAdult("2008-10-27", today)).toBe(false);
  });

  it("no dia do aniversário de 18 anos passa a ser maior de idade", () => {
    expect(calculateAge("2008-10-26", today)).toBe(18);
    expect(isAdult("2008-10-26", today)).toBe(true);
  });

  it("bloqueia cadastro abaixo de 15 anos", () => {
    expect(validateBirthDate("2011-10-27", today).ok).toBe(false);
    expect(validateBirthDate("2011-10-26", today)).toEqual({ ok: true, age: 15 });
  });

  it("rejeita datas futuras ou inválidas", () => {
    expect(validateBirthDate("2027-01-01", today).ok).toBe(false);
    expect(validateBirthDate("2010-02-30", today).ok).toBe(false);
  });

  it("agrupa faixas etárias 15-17, 18-24 e 25+", () => {
    expect(ageGroup(17)).toBe("15-17");
    expect(ageGroup(18)).toBe("18-24");
    expect(ageGroup(24)).toBe("18-24");
    expect(ageGroup(25)).toBe("25+");
  });
});
