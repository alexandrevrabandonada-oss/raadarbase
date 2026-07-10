import { describe, expect, it, vi } from "vitest";
import { classifyProfile } from "./classification";

describe("classifyProfile", () => {
  it("usa regra forte sem chamar IA", async () => {
    const ai = vi.fn();
    const result = await classifyProfile({ username: "dra.demo", bio: "Médica CRM 12345" }, ai);
    expect(result.categoria).toBe("medico");
    expect(result.source).toBe("regra");
    expect(ai).not.toHaveBeenCalled();
  });

  it("chama IA somente quando regras não resolvem", async () => {
    const ai = vi.fn().mockResolvedValue({ categoria: "artista", confidence: 0.8, source: "ia", rationale: "conteúdo artístico explícito" });
    const result = await classifyProfile({ username: "perfil.demo", bio: "conteúdo autoral" }, ai);
    expect(ai).toHaveBeenCalledOnce();
    expect(result.categoria).toBe("artista");
  });
});

