import { describe, it, expect } from "vitest";
import { validateReportTextSafety, sanitizeReportSnapshot } from "./safety";

describe("Report Safety", () => {
  it("should allow safe titles", () => {
    const result = validateReportTextSafety("Relatório de Mobilização - Saúde");
    expect(result.ok).toBe(true);
  });

  it("should block titles with forbidden terms like 'voto certo'", () => {
    const result = validateReportTextSafety("Relatório de Voto Certo");
    expect(result.ok).toBe(false);
    expect(result.forbiddenTerm).toBe("voto certo");
  });

  it("should block descriptions with forbidden terms like 'microtargeting'", () => {
    const result = validateReportTextSafety("Este relatório usa microtargeting para segmentação.");
    expect(result.ok).toBe(false);
    expect(result.forbiddenTerm).toBe("microtargeting");
  });

  it("should sanitize PII in snapshots", () => {
    const snapshot = {
      representativeComments: [
        { text: "Meu email é joao@exemplo.com e meu tel é 24 99999-8888", authorEmail: "joao@exemplo.com" }
      ]
    };
    const sanitized = sanitizeReportSnapshot(snapshot);
    expect(sanitized.representativeComments[0].authorEmail).toBeUndefined();
    expect(sanitized.representativeComments[0].text).toContain("[EMAIL OCULTO]");
    expect(sanitized.representativeComments[0].text).toContain("[TELEFONE OCULTO]");
  });
});
