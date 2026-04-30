import { describe, it, expect } from "vitest";
import { checkTextSafety, sanitizeActionPlanData } from "./safety";

describe("Safety Layer: Action Plans", () => {
  it("should detect forbidden terms", () => {
    const unsafeText = "Precisamos de um robô de DM para microtargeting.";
    const result = checkTextSafety(unsafeText);
    expect(result.isSafe).toBe(false);
    expect(result.detectedTerms).toContain("robô de DM");
    expect(result.detectedTerms).toContain("microtargeting");
  });

  it("should allow safe text", () => {
    const safeText = "Organizar plenária sobre transporte público.";
    const result = checkTextSafety(safeText);
    expect(result.isSafe).toBe(true);
    expect(result.detectedTerms).toHaveLength(0);
  });

  it("should sanitize PII from data objects", () => {
    const rawData = {
      title: "Reunião com joao@email.com",
      description: "Ligar para +55 24 99999-9999 sobre a pauta.",
      metadata: { contact: "maria@site.org" }
    };

    const sanitized = sanitizeActionPlanData(rawData);
    expect(sanitized.title).toBe("Reunião com [EMAIL_REMOVIDO]");
    expect(sanitized.description).toContain("[TELEFONE_REMOVIDO]");
    expect(sanitized.metadata.contact).toBe("[EMAIL_REMOVIDO]");
  });
});
