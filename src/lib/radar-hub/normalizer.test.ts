import { describe, expect, it } from "vitest";
import { findSensitiveFields, normalizeName, normalizeUniversalRecord } from "./normalizer";

describe("normalizeUniversalRecord", () => {
  it("normaliza campos universais e preserva evidências", () => {
    const result = normalizeUniversalRecord({ nome: "  Associação Árvore  ", bio: "Associação de moradores de Volta Redonda RJ", username: "@Arvore.Demo", seguidores: "1200", sourceReference: "fixture-1" }, "csv");
    expect(result.normalizedName).toBe("associacao arvore");
    expect(result.entityType).toBe("association");
    expect(result.mainCategory).toBe("associacao");
    expect(result.location).toMatchObject({ city: "Volta Redonda", state: "RJ" });
    expect(result.metrics.followers).toBe(1200);
    expect(result.identifiers[0]).toMatchObject({ normalizedValue: "arvore.demo", sourceType: "csv" });
    expect(result.evidence.some((item) => item.fieldName === "primary_city" && item.confidence > 0)).toBe(true);
  });

  it("nunca inventa localização sem evidência", () => {
    const result = normalizeUniversalRecord({ name: "Entidade Sem Local", description: "Projeto cultural itinerante" });
    expect(result.location).toEqual({ city: null, state: null, region: null, confidence: 0 });
  });

  it("marca conflito de localização sem substituir o valor fornecido", () => {
    const result = normalizeUniversalRecord({ name: "Entidade Demo", city: "Resende", state: "RJ", bio: "Atuação comprovada em Volta Redonda RJ" });
    expect(result.location).toMatchObject({ city: "Resende", state: "RJ", confidence: .55 });
    expect(result.tags).toContain("location-conflict");
    expect(result.evidence.find((item) => item.fieldName === "location_conflict")?.fieldValue).toEqual(expect.objectContaining({ explicitCity: "Resende", inferredCity: "Volta Redonda" }));
  });

  it("recusa campos sensíveis inclusive aninhados", () => {
    expect(findSensitiveFields({ profile: { religiao: "não deve entrar" } })).toEqual(["profile.religiao"]);
    expect(() => normalizeUniversalRecord({ name: "Pessoa Demo", political_opinion: "x" })).toThrow(/Campos sensíveis/);
  });

  it("normaliza acentos e pontuação do nome", () => expect(normalizeName("João & AÇÃO!")) .toBe("joao acao"));
});
