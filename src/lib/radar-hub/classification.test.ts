import { describe, expect, it, vi } from "vitest";
import { normalizeUniversalRecord } from "./normalizer";
import { classifyPublicRole } from "./classification";

describe("classifyPublicRole", () => {
  it("não chama IA quando regra objetiva resolve", async () => {
    const classifier = vi.fn(); const record = normalizeUniversalRecord({ name: "Professora Demo", bio: "Professora da rede pública" });
    expect((await classifyPublicRole(record, classifier)).category).toBe("professor");
    expect(classifier).not.toHaveBeenCalled();
  });
  it("aceita IA válida somente quando necessário", async () => {
    const record = normalizeUniversalRecord({ name: "Entidade Demo" });
    const result = await classifyPublicRole(record, async () => ({ category: "ong", confidence: .81, explanation: "Descrição pública objetiva." }));
    expect(result).toMatchObject({ category: "ong", confidence: .81 });
  });
  it("mantém unknown se a IA retorna contrato inválido", async () => {
    const record = normalizeUniversalRecord({ name: "Entidade Demo" });
    const result = await classifyPublicRole(record, async () => ({ category: "ong", confidence: 2, explanation: "inválido" }));
    expect(result.category).toBe("unknown");
  });
});
