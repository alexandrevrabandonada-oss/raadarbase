import { beforeEach, describe, expect, it, vi } from "vitest";

type Row = Record<string, unknown>;
type Tables = Record<string, Row[]>;
type Filter = { key: string; value: unknown; op: "eq" | "not-null" };

const state = vi.hoisted(() => ({
  client: null as unknown,
}));

vi.mock("@/lib/config", () => ({
  shouldUseMockData: () => false,
}));

vi.mock("@/lib/supabase/admin", () => ({
  getSupabaseAdminClient: () => state.client,
}));

class Query {
  private filters: Filter[] = [];
  private maxRows: number | null = null;
  private countMode = false;
  private orderKey: string | null = null;
  private ascending = true;
  private metaAuditOnly = false;

  constructor(
    private tables: Tables,
    private table: string,
  ) {}

  select(_columns?: string, options?: { count?: string; head?: boolean }) {
    this.countMode = Boolean(options?.count && options?.head);
    return this;
  }

  eq(key: string, value: unknown) {
    this.filters.push({ key, value, op: "eq" });
    return this;
  }

  not(key: string, operator: string, value: unknown) {
    if (operator === "is" && value === null) this.filters.push({ key, value, op: "not-null" });
    return this;
  }

  or(value: string) {
    if (value.includes("action.ilike.meta.")) this.metaAuditOnly = true;
    return this;
  }

  order(key: string, options?: { ascending?: boolean }) {
    this.orderKey = key;
    this.ascending = options?.ascending ?? true;
    return this;
  }

  limit(value: number) {
    this.maxRows = value;
    return this;
  }

  then<TResult1 = unknown, TResult2 = never>(
    onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    return this.execute().then(onfulfilled, onrejected);
  }

  private rows() {
    return this.tables[this.table] ?? [];
  }

  private matches(row: Row) {
    const filterMatch = this.filters.every((filter) => {
      if (filter.op === "eq") return row[filter.key] === filter.value;
      return row[filter.key] !== null && row[filter.key] !== undefined;
    });
    if (!filterMatch) return false;
    if (!this.metaAuditOnly) return true;
    return (
      typeof row.action === "string" && row.action.startsWith("meta.") ||
      row.entity_type === "meta_sync" ||
      Boolean((row.metadata as { run_id?: string } | undefined)?.run_id)
    );
  }

  private async execute() {
    let data = this.rows().filter((row) => this.matches(row));
    if (this.orderKey) {
      data = [...data].sort((a, b) => {
        const av = String(a[this.orderKey!] ?? "");
        const bv = String(b[this.orderKey!] ?? "");
        return this.ascending ? av.localeCompare(bv) : bv.localeCompare(av);
      });
    }
    if (this.maxRows !== null) data = data.slice(0, this.maxRows);
    if (this.countMode) return { data: null, count: data.length, error: null };
    return { data, count: null, error: null };
  }
}

function createFakeSupabase(tables: Tables) {
  return {
    from(table: string) {
      return new Query(tables, table);
    },
  };
}

function run(overrides: Partial<Row> = {}) {
  return {
    id: "run-1",
    actor_id: null,
    actor_email: null,
    kind: "meta.media",
    status: "success",
    started_at: "2026-05-04T16:00:00.000Z",
    finished_at: "2026-05-04T16:00:05.000Z",
    inserted_count: 1,
    updated_count: 0,
    skipped_count: 0,
    error_message: null,
    metadata: {},
    ...overrides,
  };
}

describe("meta reconciliation", () => {
  beforeEach(() => {
    state.client = createFakeSupabase({
      ig_posts: [],
      ig_interactions: [],
      ig_people: [],
      meta_sync_runs: [],
      audit_logs: [],
    });
  });

  it("conta a fonte da verdade corretamente", async () => {
    state.client = createFakeSupabase({
      ig_posts: [{ id: "p1" }, { id: "p2" }],
      ig_interactions: [{ id: "i1" }],
      ig_people: [{ id: "u1" }, { id: "u2" }, { id: "u3" }],
      meta_sync_runs: [run()],
      audit_logs: [
        { id: "a1", action: "meta.media_synced", entity_type: "meta_sync", metadata: {} },
        { id: "a2", action: "contact.confirmed", entity_type: "contacts", metadata: {} },
      ],
    });
    const { getMetaCountsFromTables } = await import("./meta-reconciliation");

    await expect(getMetaCountsFromTables()).resolves.toEqual({
      posts: 2,
      interactions: 1,
      people: 3,
      syncRuns: 1,
      auditLogs: 1,
    });
  });

  it("detecta runs presas", async () => {
    state.client = createFakeSupabase({
      meta_sync_runs: [
        run({ id: "old", status: "started", started_at: "2026-05-04T15:00:00.000Z", finished_at: null }),
        run({ id: "new", status: "started", started_at: "2026-05-04T15:55:00.000Z", finished_at: null }),
      ],
    });
    const { getStuckMetaSyncRuns } = await import("./meta-reconciliation");

    const stuck = await getStuckMetaSyncRuns(undefined, new Date("2026-05-04T16:00:00.000Z"));

    expect(stuck).toHaveLength(1);
    expect(stuck[0].id).toBe("old");
  });

  it("prioriza a última run finalizada", async () => {
    const { getLatestFinalizedMetaSyncRun } = await import("./meta-reconciliation");
    const latest = getLatestFinalizedMetaSyncRun([
      run({ id: "started", status: "started", started_at: "2026-05-04T16:10:00.000Z", finished_at: null }),
      run({ id: "success", status: "success", started_at: "2026-05-04T16:00:00.000Z" }),
    ]);

    expect(latest?.id).toBe("success");
  });

  it("reporta divergência entre dashboard e fonte da verdade", async () => {
    const { compareDashboardVsSourceOfTruth } = await import("./meta-reconciliation");
    const divergences = compareDashboardVsSourceOfTruth(
      { posts: 1, interactions: 2, people: 3 },
      { posts: 1, interactions: 5, people: 3, syncRuns: 1, auditLogs: 1 },
    );

    expect(divergences).toEqual([
      { label: "Interações/comentários", dashboard: 2, sourceOfTruth: 5, severity: "warning" },
    ]);
  });

  it("banco vazio não quebra", async () => {
    const { getMetaReconciliationSummary } = await import("./meta-reconciliation");

    const summary = await getMetaReconciliationSummary();

    expect(summary.sourceOfTruth).toEqual({ posts: 0, interactions: 0, people: 0, syncRuns: 0, auditLogs: 0 });
    expect(summary.latestRuns).toEqual([]);
    expect(summary.stuckRuns).toEqual([]);
    expect(summary.divergences).toEqual([]);
  });
});
