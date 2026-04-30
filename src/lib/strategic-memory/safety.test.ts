import { describe, it, expect, vi } from "vitest";
import { 
  containsForbiddenMemoryTerm, 
  sanitizeMemoryText, 
  validateMemoryInput 
} from "./safety";

// Mock das dependências externas
vi.mock("@/lib/data/incidents", () => ({
  createIncident: vi.fn(),
}));

vi.mock("@/lib/audit/write-audit-log", () => ({
  writeAuditLog: vi.fn(),
}));

describe("Strategic Memory Safety Logic", () => {
  describe("Forbidden Term Detection", () => {
    it("should detect simple forbidden terms", () => {
      const detected = containsForbiddenMemoryTerm("Isso é um voto certo para nós");
      expect(detected).toContain("voto certo");
    });

    it("should be case-insensitive and ignore accents", () => {
      const detected = containsForbiddenMemoryTerm("Padrão de PERFIL PSICOLÓGICO detectado");
      expect(detected).toContain("perfil psicológico");
    });

    it("should return empty array for safe text", () => {
      const detected = containsForbiddenMemoryTerm("Aprendizado sobre mobilização de saúde no bairro");
      expect(detected).toHaveLength(0);
    });

    it("should detect sensitive profiling terms", () => {
      const detected = containsForbiddenMemoryTerm("Ideologia da pessoa: conservadora");
      expect(detected).toContain("ideologia da pessoa");
    });
  });

  describe("PII Sanitization", () => {
    it("should remove emails", () => {
      const sanitized = sanitizeMemoryText("Contato: teste@exemplo.com no bairro");
      expect(sanitized).toBe("Contato: [EMAIL_REMOVIDO] no bairro");
    });

    it("should remove phones", () => {
      const sanitized = sanitizeMemoryText("Ligar para (24) 99999-8888");
      expect(sanitized).toBe("Ligar para [TELEFONE_REMOVIDO]");
    });

    it("should remove CPFs", () => {
      const sanitized = sanitizeMemoryText("CPF do lider: 123.456.789-00");
      expect(sanitized).toBe("CPF do lider: [CPF_REMOVIDO]");
    });
  });

  describe("validateMemoryInput", () => {
    it("should block forbidden input and return false", async () => {
      const result = await validateMemoryInput(
        "Titulo com robô de DM",
        "Resumo seguro",
        "admin@radar.base",
        "user-id"
      );
      expect(result.isSafe).toBe(false);
      expect(result.detectedTerms).toContain("robô de DM");
    });

    it("should allow safe input and return true", async () => {
      const result = await validateMemoryInput(
        "Titulo Seguro",
        "Aprendemos que reuniões presenciais funcionam melhor para o tema saúde.",
        "admin@radar.base",
        "user-id"
      );
      expect(result.isSafe).toBe(true);
      expect(result.detectedTerms).toHaveLength(0);
    });
  });
});
