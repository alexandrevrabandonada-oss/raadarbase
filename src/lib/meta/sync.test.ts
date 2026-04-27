import { beforeEach, describe, expect, it, vi } from "vitest";
import accountSuccess from "./__fixtures__/account-success.json";
import commentsPartialError from "./__fixtures__/comments-partial-error.json";
import commentsSuccess from "./__fixtures__/comments-success.json";
import mediaSuccess from "./__fixtures__/media-success.json";

type Row = Record<string, unknown>;
type Tables = Record<string, Row[]>;
type Filter = { key: string; value: unknown };

const state = vi.hoisted(() => ({
  client: null as unknown,
  metaGet: vi.fn(),
  configured: true,
}));

vi.mock("@/lib/supabase/admin", () => ({
  getSupabaseAdminClient: () => state.client,
}));

vi.mock("@/lib/meta/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./client")>();
  return {
    ...actual,
    isMetaConfigured: () => state.configured,
    metaGet: state.metaGet,
  };
});

class Query {
  private operation: "select" | "insert" | "update" = "select";
  private payload: Row | Row[] | null = null;
  private filters: Filter[] = [];
  private singleMode: "single" | "maybeSingle" | null = null;
  private maxRows: number | null = null;

  constructor(
    private tables: Tables,
    private table: string,
  ) {}

  select() {
    return this;
  }

  insert(payload: Row | Row[]) {
    this.operation = "insert";
    this.payload = payload;
    return this;
  }

  update(payload: Row) {
    this.operation = "update";
    this.payload = payload;
    return this;
  }

  eq(key: string, value: unknown) {
    this.filters.push({ key, value });
    return this;
  }

  order() {
    return this;
  }

  limit(value: number) {
    this.maxRows = value;
    return this;
  }

  not() {
    return this;
  }

  maybeSingle() {
    this.singleMode = "maybeSingle";
    return this.execute();
  }

  single() {
    this.singleMode = "single";
    return this.execute();
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
    return this.filters.every((filter) => row[filter.key] === filter.value);
  }

  private withDefaults(row: Row) {
    const id = row.id ?? `${this.table}-${this.rows().length + 1}`;
    if (this.table === "meta_sync_runs") {
      return {
        id,
        started_at: new Date().toISOString(),
        finished_at: null,
        inserted_count: 0,
        updated_count: 0,
        skipped_count: 0,
        error_message: null,
        metadata: {},
        ...row,
      };
    }
    if (this.table === "audit_logs") {
      return { id, created_at: new Date().toISOString(), metadata: {}, ...row };
    }
    return { id, ...row };
  }

  private async execute() {
    this.tables[this.table] ??= [];

    if (this.operation === "insert") {
      const payloads = Array.isArray(this.payload) ? this.payload : [this.payload ?? {}];
      const inserted = payloads.map((row) => this.withDefaults(row));
      this.tables[this.table].push(...inserted);
      return this.singleMode ? { data: inserted[0] ?? null, error: null } : { data: inserted, error: null };
    }

    if (this.operation === "update") {
      const updated: Row[] = [];
      this.tables[this.table] = this.rows().map((row) => {
        if (!this.matches(row)) return row;
        const next = { ...row, ...(this.payload ?? {}) };
        updated.push(next);
        return next;
      });
      return this.singleMode ? { data: updated[0] ?? null, error: null } : { data: updated, error: null };
    }

    let selected = this.rows().filter((row) => this.matches(row));
    if (this.maxRows !== null) selected = selected.slice(0, this.maxRows);
    if (this.singleMode === "single") return { data: selected[0] ?? null, error: selected[0] ? null : { message: "No rows" } };
    if (this.singleMode === "maybeSingle") return { data: selected[0] ?? null, error: null };
    return { data: selected, error: null };
  }
}

function createFakeSupabase(tables: Tables) {
  return {
    tables,
    from(table: string) {
      return new Query(tables, table);
    },
  };
}

function table(name: string) {
  const client = state.client as { tables: Tables };
  return client.tables[name] ?? [];
}

describe("meta sync", () => {
  beforeEach(() => {
    process.env.META_GRAPH_VERSION = "v23.0";
    process.env.META_ACCESS_TOKEN = "fake-secret-token";
    process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID = "ig-account-1";
    process.env.META_SYNC_MAX_MEDIA = "25";
    process.env.META_SYNC_MAX_COMMENTS_PER_MEDIA = "50";
    state.client = createFakeSupabase({
      meta_sync_runs: [],
      audit_logs: [],
      ig_posts: [
        {
          id: "post-1",
          instagram_post_id: "ig-media-1",
          caption: "Post existente",
          metrics: {},
        },
      ],
      ig_people: [],
      ig_interactions: [],
      meta_account_snapshots: [],
    });
    state.metaGet.mockReset();
    state.configured = true;
  });

  it("falha quando Meta nao esta configurada", async () => {
    state.configured = false;
    const { syncInstagramMedia } = await import("./sync");

    await expect(syncInstagramMedia({ actorId: "user-1", actorEmail: "user@example.com" })).rejects.toThrow(
      "Integração Meta não configurada.",
    );
  });

  it("sincroniza dados basicos da conta e cria run/audit", async () => {
    state.metaGet.mockResolvedValue({ ok: true, data: accountSuccess });
    const { syncInstagramAccountSnapshot } = await import("./sync");

    const result = await syncInstagramAccountSnapshot({ actorId: "user-1", actorEmail: "user@example.com" });

    expect(result).toMatchObject({ ok: true, inserted: 1 });
    expect(table("meta_account_snapshots")).toHaveLength(1);
    expect(table("meta_sync_runs")).toMatchObject([{ kind: "meta.account_snapshot", status: "success" }]);
    expect(table("audit_logs")).toMatchObject([{ action: "meta.account_snapshot_synced" }]);
  });

  it("sincroniza posts validos com insert e update", async () => {
    state.metaGet.mockResolvedValue({ ok: true, data: mediaSuccess });
    const { syncInstagramMedia } = await import("./sync");

    const result = await syncInstagramMedia({ actorId: "user-1", actorEmail: "user@example.com" });

    expect(result).toMatchObject({ ok: true, inserted: 1, updated: 1 });
    expect(table("ig_posts")).toHaveLength(2);
    expect(table("meta_sync_runs")[0]).toMatchObject({ status: "success", inserted_count: 1, updated_count: 1 });
    expect(table("audit_logs")[0]).toMatchObject({ action: "meta.media_synced" });
  });

  it("sincroniza comentarios e nao duplica external_id", async () => {
    state.metaGet.mockResolvedValue({ ok: true, data: commentsSuccess });
    const { syncInstagramComments } = await import("./sync");

    const first = await syncInstagramComments({ actorId: "user-1", actorEmail: "user@example.com" }, "post-1");
    const second = await syncInstagramComments({ actorId: "user-1", actorEmail: "user@example.com" }, "post-1");

    expect(first).toMatchObject({ ok: true, inserted: 2, skipped: 0 });
    expect(second).toMatchObject({ ok: true, inserted: 0, skipped: 2 });
    expect(table("ig_people")).toHaveLength(2);
    expect(table("ig_interactions")).toHaveLength(2);
  });

  it("trata erro parcial de comentarios ignorando item sem username", async () => {
    state.metaGet.mockResolvedValue({ ok: true, data: commentsPartialError });
    const { syncInstagramComments } = await import("./sync");

    const result = await syncInstagramComments({ actorId: "user-1", actorEmail: "user@example.com" }, "post-1");

    expect(result).toMatchObject({ ok: true, inserted: 1, skipped: 1 });
    expect(table("ig_interactions")).toHaveLength(1);
  });

  it("registra erro 400 da Meta com run finalizado", async () => {
    state.metaGet.mockResolvedValue({ ok: false, status: 400, code: "10", message: "Permissions error" });
    const { syncInstagramMedia } = await import("./sync");

    const result = await syncInstagramMedia({ actorId: "user-1", actorEmail: "user@example.com" });

    expect(result).toMatchObject({ ok: false, message: "Permissions error" });
    expect(table("meta_sync_runs")[0]).toMatchObject({ status: "error", error_message: "Permissions error" });
    expect(table("meta_sync_runs")[0].finished_at).toBeTruthy();
    expect(table("audit_logs")[0]).toMatchObject({ action: "meta.media_synced" });
  });

  it("redige access_token no retorno, meta_sync_runs e audit_logs", async () => {
    state.metaGet.mockResolvedValue({
      ok: false,
      status: 401,
      code: "190",
      message: "Token fake-secret-token invalido",
    });
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { syncInstagramMedia } = await import("./sync");

    const result = await syncInstagramMedia({ actorId: "user-1", actorEmail: "user@example.com" });
    const serializedRuns = JSON.stringify(table("meta_sync_runs"));
    const serializedAudits = JSON.stringify(table("audit_logs"));

    expect(result.message).not.toContain("fake-secret-token");
    expect(serializedRuns).not.toContain("fake-secret-token");
    expect(serializedAudits).not.toContain("fake-secret-token");
    expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringContaining("fake-secret-token"));
  });
});
