import { beforeEach, describe, expect, it, vi } from "vitest";

type Row = Record<string, unknown>;

const state = vi.hoisted(() => ({
  audits: [] as Row[],
  createdInputs: [] as Row[],
  links: [] as Row[],
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/supabase/auth", () => ({
  requireInternalSession: async () => ({
    id: "user-1",
    email: "operador@radar.dev",
  }),
}));

vi.mock("@/lib/authz/roles", () => ({
  requireRole: async () => undefined,
}));

vi.mock("@/lib/audit/write-audit-log", () => ({
  writeAuditLog: async (payload: Row) => {
    state.audits.push(payload);
  },
}));

vi.mock("@/lib/strategic-memory/safety", () => ({
  validateMemoryInput: async () => ({ isSafe: true, detectedTerms: [] }),
  sanitizeMemoryInputObject: <T,>(input: T) => input,
}));

vi.mock("@/lib/data/strategic-memory", () => ({
  createStrategicMemory: async (input: Row) => {
    state.createdInputs.push(input);
    return {
      id: "memory-1",
      ...input,
    };
  },
  updateStrategicMemory: async () => {
    throw new Error("not implemented in this test");
  },
  archiveStrategicMemory: async () => {
    throw new Error("not implemented in this test");
  },
  linkMemoryToEntity: async (memoryId: string, entityType: string, entityId: string) => {
    state.links.push({ memoryId, entityType, entityId });
    return { id: "link-1", memory_id: memoryId, entity_type: entityType, entity_id: entityId };
  },
  unlinkMemoryEntity: async () => undefined,
  suggestMemoriesFromResults: async () => [],
}));

describe("memoria actions", () => {
  beforeEach(() => {
    state.audits = [];
    state.createdInputs = [];
    state.links = [];
  });

  it("cria memória assistida e vincula ao resultado de campo", async () => {
    const { createStrategicMemoryFromFieldResultAction } = await import("./actions");

    const result = await createStrategicMemoryFromFieldResultAction(
      {
        title: "Registro de Campo - Vila Esperança",
        summary: "Resumo agregado",
        status: "active",
        metadata: {
          memoryType: "Registro de Campo",
        },
      },
      {
        resultId: "result-1",
        eventId: "event-1",
      },
    );

    expect(result).toMatchObject({ ok: true, id: "memory-1" });
    expect(state.createdInputs).toHaveLength(1);
    expect(state.links).toMatchObject([{ memoryId: "memory-1", entityType: "result", entityId: "result-1" }]);
    expect(state.audits).toMatchObject([
      { action: "strategic_memory.created" },
      { action: "strategic_memory.linked", metadata: expect.objectContaining({ entityType: "result", entityId: "result-1" }) },
    ]);
  });
});
