import { describe, expect, it } from "vitest";
import { calculateInfluenceScore } from "./score";

describe("calculateInfluenceScore", () => {
  it("combina log de seguidores e pesos configuráveis", () => {
    const result = calculateInfluenceScore({ seguidores: 10_000, contaVerificada: true, empresa: true, criador: false, locationConfidence: 0.5 });
    expect(result.score).toBe(57.5);
    expect(result.components).toEqual({ followers: 40, verified: 12, business: 4, creator: 0, location: 1.5, interaction: 0 });
  });

  it("trata números inválidos sem produzir NaN", () => {
    expect(calculateInfluenceScore({ seguidores: Number.NaN, contaVerificada: false, empresa: false, criador: false, locationConfidence: -1 }).score).toBe(0);
  });
});

