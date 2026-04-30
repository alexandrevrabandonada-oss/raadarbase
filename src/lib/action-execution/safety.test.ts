import { describe, it, expect } from "vitest";
import { 
  sanitizeEvidenceText, 
  containsForbiddenExecutionTerm 
} from "./safety";

describe("Action Execution Safety", () => {
  describe("sanitizeEvidenceText", () => {
    it("deve remover e-mails", () => {
      const input = "Falei com fulano@email.com sobre a pauta.";
      expect(sanitizeEvidenceText(input)).toContain("[EMAIL_REMOVIDO]");
      expect(sanitizeEvidenceText(input)).not.toContain("fulano@email.com");
    });

    it("deve remover telefones", () => {
      const input = "Ligar para (24) 99999-8888.";
      expect(sanitizeEvidenceText(input)).toContain("[TELEFONE_REMOVIDO]");
      expect(sanitizeEvidenceText(input)).not.toContain("99999-8888");
    });

    it("deve remover CPF", () => {
      const input = "O CPF dele é 123.456.789-00.";
      expect(sanitizeEvidenceText(input)).toContain("[CPF_REMOVIDO]");
    });
  });

  describe("containsForbiddenExecutionTerm", () => {
    it("deve detectar termos de perfilamento", () => {
      const input = "Este é um eleitor persuadível e voto certo.";
      const detected = containsForbiddenExecutionTerm(input);
      expect(detected).toContain("persuadível");
      expect(detected).toContain("voto certo");
    });

    it("deve detectar termos de automação", () => {
      const input = "Usar robô de DM para disparo em massa.";
      const detected = containsForbiddenExecutionTerm(input);
      expect(detected).toContain("robô de DM");
      expect(detected).toContain("disparo em massa");
    });

    it("deve retornar vazio para texto seguro", () => {
      expect(containsForbiddenExecutionTerm("Reunião produtiva sobre saúde.")).toEqual([]);
    });
  });
});
