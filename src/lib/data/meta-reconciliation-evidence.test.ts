import { beforeEach, describe, expect, it, vi } from "vitest";

type Row = Record<string, unknown>;

const state = vi.hoisted(() => ({
  useMocks: false,
  session: { id: "user-1", email: "operador@example.com" },
  summary: {
    sourceOfTruth: { posts: 26, interactions: 542, people: 451, syncRuns: 27, auditLogs: 56 },
    dashboard: { posts: 26, interactions: 542, people: 451 },
    latestRuns: [],
    latestFinalizedRun: null,
    latestRun: null,
    startedRuns: [],
    stuckRuns: [],
    divergences: [],
  },
  insertedPayload: null as Row | null,
  evidenceRows: [] as Row[],
  auditLogs: [] as Row[],
}));

vi.mock("@/lib/config", () => ({
  shouldUseMockData: () => state.useMocks,
}));

vi.mock("@/lib/data/meta-reconciliation", () => ({
  getMetaReconciliationSummary: async () => state.summary,
}));

vi.mock("@/lib/supabase/auth", () => ({
  getInternalSession: async () => state.session,
}));

vi.mock("@/lib/supabase/admin", () => ({
  getSupabaseAdminClient: () => ({
    from: (table: string) => {
      if (table === "meta_reconciliation_evidence") {
        return {
          insert: (payload: Row) => {
            state.insertedPayload = payload;
            return {
              select: () => ({
                single: async () => ({ data: payload, error: null }),
              }),
            };
          },
          select: () => ({
            order: () => ({
              limit: async (limit = state.evidenceRows.length) => ({ data: state.evidenceRows.slice(0, limit), error: null }),
            }),
            eq: (column: string, value: string) => ({
              maybeSingle: async () => ({
                data: (state.evidenceRows.find((row) => row[column] === value) ?? null) as Row | null,
                error: null,
              }),
            }),
            maybeSingle: async () => ({ data: (state.evidenceRows[0] ?? null) as Row | null, error: null }),
          }),
        };
      }

      return {
        select: () => ({
          or: () => ({
            order: () => ({
                limit: async (limit = state.auditLogs.length) => ({ data: state.auditLogs.slice(0, limit), error: null }),
            }),
          }),
          order: () => ({
            limit: async (limit = state.auditLogs.length) => ({ data: state.auditLogs.slice(0, limit), error: null }),
          }),
        }),
      };
    },
  }),
}));

describe("meta reconciliation evidence", () => {
  beforeEach(() => {
    state.useMocks = false;
    state.insertedPayload = null;
    state.evidenceRows = [
      {
        id: "evidence-3",
        generated_at: "2026-05-04T16:50:00.000Z",
        generated_by: "user-1",
        generated_by_email: "operador@example.com",
        posts_count: 28,
        interactions_count: 560,
        people_count: 460,
        meta_sync_runs_count: 29,
        meta_audit_logs_count: 58,
        started_runs_count: 1,
        stuck_runs_count: 0,
        latest_meta_sync_status: "success",
        latest_meta_sync_at: "2026-05-04T16:49:30.000Z",
        report_hash: "c".repeat(64),
        status: "ok",
        notes: "latest",
        metadata: { source: "mock" },
      },
      {
        id: "evidence-2",
        generated_at: "2026-05-04T16:45:00.000Z",
        generated_by: "user-1",
        generated_by_email: "operador@example.com",
        posts_count: 26,
        interactions_count: 542,
        people_count: 451,
        meta_sync_runs_count: 27,
        meta_audit_logs_count: 56,
        started_runs_count: 0,
        stuck_runs_count: 0,
        latest_meta_sync_status: "success",
        latest_meta_sync_at: "2026-05-04T16:42:08.000Z",
        report_hash: "b".repeat(64),
        status: "ok",
        notes: "middle",
        metadata: { source: "mock" },
      },
      {
        id: "evidence-1",
        generated_at: "2026-05-04T16:40:00.000Z",
        generated_by: "user-1",
        generated_by_email: "operador@example.com",
        posts_count: 24,
        interactions_count: 520,
        people_count: 445,
        meta_sync_runs_count: 25,
        meta_audit_logs_count: 54,
        started_runs_count: 0,
        stuck_runs_count: 1,
        latest_meta_sync_status: "error",
        latest_meta_sync_at: "2026-05-04T16:39:08.000Z",
        report_hash: "a".repeat(64),
        status: "blocked",
        notes: "older",
        metadata: { source: "mock" },
      },
    ];
    state.auditLogs = [
      {
        id: "audit-1",
        actor_email: "operador@example.com",
        action: "meta.reconciliation_evidence_generated",
        entity_type: "meta_reconciliation_evidence",
        entity_id: "evidence-3",
        summary: "Evidência operacional agregada gerada.",
        metadata: { report_hash: "c".repeat(64) },
        created_at: "2026-05-04T16:50:00.000Z",
      },
    ];
    state.session = { id: "user-1", email: "operador@example.com" };
    state.summary = {
      sourceOfTruth: { posts: 26, interactions: 542, people: 451, syncRuns: 27, auditLogs: 56 },
      dashboard: { posts: 26, interactions: 542, people: 451 },
      latestRuns: [],
      latestFinalizedRun: null,
      latestRun: null,
      startedRuns: [],
      stuckRuns: [],
      divergences: [],
    };
  });

  it("gera hash estável a partir de agregados e timestamp", async () => {
    const { computeReconciliationHash } = await import("./meta-reconciliation-evidence");

    const base = {
      generatedAt: "2026-05-04T16:45:00.000Z",
      postsCount: 26,
      interactionsCount: 542,
      peopleCount: 451,
      metaSyncRunsCount: 27,
      metaAuditLogsCount: 56,
      startedRunsCount: 0,
      stuckRunsCount: 0,
      latestMetaSyncStatus: "success",
      latestMetaSyncAt: "2026-05-04T16:42:08.000Z",
      status: "ok" as const,
    };

    const first = computeReconciliationHash(base);
    const second = computeReconciliationHash(base);
    const different = computeReconciliationHash({ ...base, generatedAt: "2026-05-04T16:45:01.000Z" });

    expect(first).toHaveLength(64);
    expect(first).toBe(second);
    expect(first).not.toBe(different);
  });

  it("gera evidência sem incluir PII ou payload bruto no insert", async () => {
    const { generateMetaReconciliationEvidence } = await import("./meta-reconciliation-evidence");

    const evidence = await generateMetaReconciliationEvidence();

    expect(evidence.report_hash).toHaveLength(64);
    expect(state.insertedPayload).toMatchObject({
      posts_count: 26,
      interactions_count: 542,
      people_count: 451,
      meta_sync_runs_count: 27,
      meta_audit_logs_count: 56,
      generated_by: "user-1",
      generated_by_email: "operador@example.com",
    });
    expect(Object.keys(state.insertedPayload ?? {})).not.toContain("payload");
    expect(Object.keys(state.insertedPayload ?? {})).not.toContain("username");
    expect(Object.keys(state.insertedPayload ?? {})).not.toContain("token");
    expect(Object.keys((state.insertedPayload?.metadata as Row) ?? {})).not.toContain("payload");
    expect(Object.keys((state.insertedPayload?.metadata as Row) ?? {})).not.toContain("username");
    expect(Object.keys((state.insertedPayload?.metadata as Row) ?? {})).not.toContain("token");
  });

  it("expõe a evidência mockada sem depender de supabase", async () => {
    state.useMocks = true;
    const { getMetaReconciliationEvidence, listMetaReconciliationEvidence, countMetaReconciliationEvidence } = await import(
      "./meta-reconciliation-evidence"
    );

    const list = await listMetaReconciliationEvidence(5);
    const item = await getMetaReconciliationEvidence("mock-meta-reconciliation-evidence");
    const count = await countMetaReconciliationEvidence();

    expect(list).toHaveLength(1);
    expect(item?.report_hash).toHaveLength(64);
    expect(count).toBe(1);
  });

  it("retorna histórico ordenado, delta entre snapshots e logs relacionados", async () => {
    const {
      compareLatestEvidenceSnapshots,
      getEvidenceDelta,
      getMetaReconciliationEvidenceHistory,
      listAuditLogsForMetaReconciliationEvidence,
    } = await import("./meta-reconciliation-evidence");

    const history = await getMetaReconciliationEvidenceHistory(2);
    const comparison = await compareLatestEvidenceSnapshots();
    const delta = getEvidenceDelta(history[1], history[0]);
    const auditLogs = await listAuditLogsForMetaReconciliationEvidence("evidence-3");

    expect(history).toHaveLength(2);
    expect(history[0].id).toBe("evidence-3");
    expect(history[1].id).toBe("evidence-2");
    expect(comparison.latest?.id).toBe("evidence-3");
    expect(comparison.previous?.id).toBe("evidence-2");
    expect(comparison.delta?.posts_count).toBe(2);
    expect(delta?.interactions_count).toBe(18);
    expect(auditLogs).toHaveLength(1);
    expect(auditLogs[0].action).toBe("meta.reconciliation_evidence_generated");
  });
});
