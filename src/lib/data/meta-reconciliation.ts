import { shouldUseMockData } from "@/lib/config";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { TableRow } from "@/lib/supabase/database.types";

export type MetaReconciliationCounts = {
  posts: number;
  interactions: number;
  people: number;
  syncRuns: number;
  auditLogs: number;
};

export type MetaDashboardCounts = {
  posts: number;
  interactions: number;
  people: number;
};

export type MetaCountDivergence = {
  label: string;
  dashboard: number | string | null;
  sourceOfTruth: number | string | null;
  severity: "info" | "warning";
};

export type MetaReconciliationSummary = {
  sourceOfTruth: MetaReconciliationCounts;
  dashboard: MetaDashboardCounts;
  latestRuns: TableRow<"meta_sync_runs">[];
  latestFinalizedRun: TableRow<"meta_sync_runs"> | null;
  latestRun: TableRow<"meta_sync_runs"> | null;
  startedRuns: TableRow<"meta_sync_runs">[];
  stuckRuns: TableRow<"meta_sync_runs">[];
  divergences: MetaCountDivergence[];
};

type SupabaseClient = ReturnType<typeof getSupabaseAdminClient>;

const STUCK_RUN_MINUTES = 15;

const mockFinalizedRun: TableRow<"meta_sync_runs"> = {
  id: "mock-meta-success",
  actor_id: null,
  actor_email: "demo@radardebase.local",
  kind: "meta.media",
  status: "success",
  started_at: "2026-05-04T16:42:00.000Z",
  finished_at: "2026-05-04T16:42:08.000Z",
  inserted_count: 26,
  updated_count: 0,
  skipped_count: 0,
  error_message: null,
  metadata: {},
};

function getClient(client?: SupabaseClient) {
  return client ?? getSupabaseAdminClient();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function countRows(client: SupabaseClient, table: any, apply?: (query: any) => any) {
  const query = client.from(table).select("id", { count: "exact", head: true });
  const result = (await (apply ? apply(query) : query)) as { count: number | null; error: { message: string } | null };
  if (result.error) throw new Error(result.error.message);
  return result.count ?? 0;
}

export function isMetaSyncRunStuck(
  run: Pick<TableRow<"meta_sync_runs">, "status" | "finished_at" | "started_at">,
  now = new Date(),
  limitMinutes = STUCK_RUN_MINUTES,
) {
  if (run.status !== "started") return false;
  if (run.finished_at) return false;
  const startedAt = Date.parse(run.started_at);
  if (!Number.isFinite(startedAt)) return false;
  return now.getTime() - startedAt > limitMinutes * 60 * 1000;
}

export function getLatestFinalizedMetaSyncRun(runs: TableRow<"meta_sync_runs">[]) {
  return runs.find((run) => run.status !== "started" && Boolean(run.finished_at)) ?? null;
}

export function compareDashboardVsSourceOfTruth(
  dashboard: MetaDashboardCounts,
  sourceOfTruth: MetaReconciliationCounts,
  latestRuns: TableRow<"meta_sync_runs">[] = [],
  stuckRuns: TableRow<"meta_sync_runs">[] = [],
): MetaCountDivergence[] {
  const divergences: MetaCountDivergence[] = [];
  const checks: Array<[string, keyof MetaDashboardCounts, keyof MetaReconciliationCounts]> = [
    ["Posts", "posts", "posts"],
    ["Interações/comentários", "interactions", "interactions"],
    ["Pessoas", "people", "people"],
  ];

  for (const [label, dashboardKey, sourceKey] of checks) {
    if (dashboard[dashboardKey] !== sourceOfTruth[sourceKey]) {
      divergences.push({
        label,
        dashboard: dashboard[dashboardKey],
        sourceOfTruth: sourceOfTruth[sourceKey],
        severity: "warning",
      });
    }
  }

  const latestRun = latestRuns[0] ?? null;
  const latestFinalizedRun = getLatestFinalizedMetaSyncRun(latestRuns);
  if (latestRun?.status === "started" && latestFinalizedRun && latestFinalizedRun.started_at > latestRun.started_at) {
    divergences.push({
      label: "Run started superada",
      dashboard: "started",
      sourceOfTruth: latestFinalizedRun.status,
      severity: "info",
    });
  }

  if (stuckRuns.length > 0) {
    divergences.push({
      label: "Runs iniciadas sem finalização",
      dashboard: stuckRuns.length,
      sourceOfTruth: "ver operação",
      severity: "warning",
    });
  }

  return divergences;
}

export async function getMetaCountsFromTables(client?: SupabaseClient): Promise<MetaReconciliationCounts> {
  if (shouldUseMockData()) {
    return { posts: 26, interactions: 542, people: 451, syncRuns: 27, auditLogs: 56 };
  }

  const supabase = getClient(client);
  const [posts, interactions, people, syncRuns, auditLogs] = await Promise.all([
    countRows(supabase, "ig_posts"),
    countRows(supabase, "ig_interactions"),
    countRows(supabase, "ig_people"),
    countRows(supabase, "meta_sync_runs"),
    getMetaAuditLogCounts(supabase),
  ]);

  return { posts, interactions, people, syncRuns, auditLogs };
}

export async function getMetaDashboardCounts(client?: SupabaseClient): Promise<MetaDashboardCounts> {
  if (shouldUseMockData()) return { posts: 26, interactions: 542, people: 451 };

  const supabase = getClient(client);
  const [posts, interactions, people] = await Promise.all([
    countRows(supabase, "ig_posts", (query) => query.not("synced_at", "is", null)),
    countRows(supabase, "ig_interactions", (query) => query.not("synced_at", "is", null)),
    countRows(supabase, "ig_people", (query) => query.not("synced_at", "is", null)),
  ]);

  return { posts, interactions, people };
}

export async function getLatestMetaSyncRuns(limit = 10, client?: SupabaseClient): Promise<TableRow<"meta_sync_runs">[]> {
  if (shouldUseMockData()) return [mockFinalizedRun];

  const supabase = getClient(client);
  const { data, error } = await supabase
    .from("meta_sync_runs")
    .select("id,kind,status,started_at,finished_at,inserted_count,updated_count,skipped_count,error_message,actor_id,actor_email,metadata")
    .order("started_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getStartedMetaSyncRuns(client?: SupabaseClient): Promise<TableRow<"meta_sync_runs">[]> {
  if (shouldUseMockData()) return [];

  const supabase = getClient(client);
  const { data, error } = await supabase
    .from("meta_sync_runs")
    .select("id,kind,status,started_at,finished_at,inserted_count,updated_count,skipped_count,error_message,actor_id,actor_email,metadata")
    .eq("status", "started")
    .order("started_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getStuckMetaSyncRuns(client?: SupabaseClient, now = new Date()) {
  const startedRuns = await getStartedMetaSyncRuns(client);
  return startedRuns.filter((run) => isMetaSyncRunStuck(run, now));
}

export async function getMetaAuditLogCounts(client?: SupabaseClient): Promise<number> {
  if (shouldUseMockData()) return 56;

  const supabase = getClient(client);
  return countRows(supabase, "audit_logs", (query) =>
    query.or("action.ilike.meta.%,entity_type.eq.meta_sync,metadata->>run_id.not.is.null"),
  );
}

export async function getMetaReconciliationSummary(client?: SupabaseClient): Promise<MetaReconciliationSummary> {
  const supabase = client ? getClient(client) : undefined;
  const [sourceOfTruth, dashboard, latestRuns, startedRuns] = await Promise.all([
    getMetaCountsFromTables(supabase),
    getMetaDashboardCounts(supabase),
    getLatestMetaSyncRuns(10, supabase),
    getStartedMetaSyncRuns(supabase),
  ]);
  const stuckRuns = startedRuns.filter((run) => isMetaSyncRunStuck(run));
  const latestRun = latestRuns[0] ?? null;
  const latestFinalizedRun = getLatestFinalizedMetaSyncRun(latestRuns);
  const divergences = compareDashboardVsSourceOfTruth(dashboard, sourceOfTruth, latestRuns, stuckRuns);

  return {
    sourceOfTruth,
    dashboard,
    latestRuns,
    latestFinalizedRun,
    latestRun,
    startedRuns,
    stuckRuns,
    divergences,
  };
}
