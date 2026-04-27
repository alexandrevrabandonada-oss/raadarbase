import { beforeEach, describe, expect, it, vi } from "vitest";

type Row = Record<string, unknown>;

const state = vi.hoisted(() => ({
  runs: [] as Row[],
  audits: [] as Row[],
  syncMedia: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/supabase/auth", () => ({
  requireInternalSession: async () => ({ id: "user-1", email: "operador@example.com" }),
}));

vi.mock("@/lib/audit/write-audit-log", () => ({
  writeAuditLog: async (payload: Row) => {
    state.audits.push(payload);
  },
}));

vi.mock("@/lib/meta/sync", () => ({
  syncInstagramAccountSnapshot: vi.fn(),
  syncInstagramComments: vi.fn(),
  syncInstagramMedia: (...args: unknown[]) => state.syncMedia(...args),
}));

function query(table: string) {
  const filters: { key: string; value: unknown }[] = [];
  let payload: Row | null = null;
  let operation: "select" | "update" = "select";
  const rows = table === "meta_sync_runs" ? state.runs : [];
  const api = {
    select: () => api,
    update: (next: Row) => {
      operation = "update";
      payload = next;
      return api;
    },
    eq: (key: string, value: unknown) => {
      filters.push({ key, value });
      return api;
    },
    maybeSingle: async () => {
      const found = rows.find((row) => filters.every((filter) => row[filter.key] === filter.value)) ?? null;
      return { data: found, error: null };
    },
    then: async (resolve: (value: unknown) => unknown) => {
      if (operation === "update") {
        state.runs = state.runs.map((row) =>
          filters.every((filter) => row[filter.key] === filter.value) ? { ...row, ...(payload ?? {}) } : row,
        );
      }
      return resolve({ data: null, error: null });
    },
  };
  return api;
}

vi.mock("@/lib/supabase/admin", () => ({
  getSupabaseAdminClient: () => ({
    from: (table: string) => query(table),
  }),
}));

describe("operacao actions", () => {
  beforeEach(() => {
    state.runs = [
      {
        id: "started-run",
        kind: "meta.media",
        status: "started",
        metadata: {},
      },
      {
        id: "success-run",
        kind: "meta.media",
        status: "success",
        metadata: {},
      },
    ];
    state.audits = [];
    state.syncMedia.mockReset();
    state.syncMedia.mockResolvedValue({ ok: true, message: "ok", inserted: 0, updated: 0, skipped: 0 });
  });

  it("marca run started como falha e gera audit_log", async () => {
    const { markSyncRunAsFailedAction } = await import("./actions");

    const result = await markSyncRunAsFailedAction("started-run");

    expect(result.ok).toBe(true);
    expect(state.runs.find((run) => run.id === "started-run")).toMatchObject({
      status: "error",
      error_message: "Marcada manualmente como falha por operador interno",
    });
    expect(state.audits).toMatchObject([{ action: "meta.sync_marked_failed" }]);
  });

  it("impede marcar success como falha", async () => {
    const { markSyncRunAsFailedAction } = await import("./actions");

    const result = await markSyncRunAsFailedAction("success-run");

    expect(result.ok).toBe(false);
    expect(state.runs.find((run) => run.id === "success-run")).toMatchObject({ status: "success" });
  });

  it("retry preserva referencia da run original e gera audit_log", async () => {
    const { retryMetaSyncRunAction } = await import("./actions");

    const result = await retryMetaSyncRunAction("success-run");

    expect(result.ok).toBe(true);
    expect(state.syncMedia).toHaveBeenCalledWith(
      { actorId: "user-1", actorEmail: "operador@example.com" },
      { retryOf: "success-run" },
    );
    expect(state.audits).toMatchObject([{ action: "meta.sync_retried", metadata: expect.objectContaining({ retry_of: "success-run" }) }]);
  });
});
