import { createHash, randomUUID } from "node:crypto";
import { shouldUseMockData } from "@/lib/config";
import { getMetaReconciliationSummary } from "@/lib/data/meta-reconciliation";
import { getInternalSession } from "@/lib/supabase/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Json, TableInsert, TableRow } from "@/lib/supabase/database.types";

export type MetaReconciliationEvidenceRow = TableRow<"meta_reconciliation_evidence">;
export type MetaReconciliationEvidenceDelta = {
  posts_count: number;
  interactions_count: number;
  people_count: number;
  meta_sync_runs_count: number;
  meta_audit_logs_count: number;
  started_runs_count: number;
  stuck_runs_count: number;
  latest_meta_sync_status: string | null;
  status: MetaReconciliationEvidenceRow["status"];
};

export type MetaReconciliationEvidenceComparison = {
  latest: MetaReconciliationEvidenceRow | null;
  previous: MetaReconciliationEvidenceRow | null;
  delta: MetaReconciliationEvidenceDelta | null;
};

export type MetaReconciliationEvidenceAuditLog = Pick<
  TableRow<"audit_logs">,
  "id" | "actor_email" | "action" | "entity_type" | "entity_id" | "summary" | "metadata" | "created_at"
>;

type SupabaseClient = ReturnType<typeof getSupabaseAdminClient>;

type HashSummary = {
  generatedAt: string;
  postsCount: number;
  interactionsCount: number;
  peopleCount: number;
  metaSyncRunsCount: number;
  metaAuditLogsCount: number;
  startedRunsCount: number;
  stuckRunsCount: number;
  latestMetaSyncStatus: string | null;
  latestMetaSyncAt: string | null;
  status: MetaReconciliationEvidenceRow["status"];
};

const mockEvidence: MetaReconciliationEvidenceRow = {
  id: "mock-meta-reconciliation-evidence",
  generated_at: "2026-05-04T16:45:00.000Z",
  generated_by: null,
  generated_by_email: "demo@radardebase.local",
  posts_count: 26,
  interactions_count: 542,
  people_count: 451,
  meta_sync_runs_count: 27,
  meta_audit_logs_count: 56,
  started_runs_count: 0,
  stuck_runs_count: 0,
  latest_meta_sync_status: "success",
  latest_meta_sync_at: "2026-05-04T16:42:08.000Z",
  report_hash: "",
  status: "ok",
  notes: "Evidência operacional agregada de demonstração.",
  metadata: { source: "mock" },
};

mockEvidence.report_hash = computeReconciliationHash({
  generatedAt: mockEvidence.generated_at,
  postsCount: mockEvidence.posts_count,
  interactionsCount: mockEvidence.interactions_count,
  peopleCount: mockEvidence.people_count,
  metaSyncRunsCount: mockEvidence.meta_sync_runs_count,
  metaAuditLogsCount: mockEvidence.meta_audit_logs_count,
  startedRunsCount: mockEvidence.started_runs_count,
  stuckRunsCount: mockEvidence.stuck_runs_count,
  latestMetaSyncStatus: mockEvidence.latest_meta_sync_status,
  latestMetaSyncAt: mockEvidence.latest_meta_sync_at,
  status: mockEvidence.status,
});

function getClient(client?: SupabaseClient) {
  return client ?? getSupabaseAdminClient();
}

function sortByGeneratedAtDesc(rows: MetaReconciliationEvidenceRow[]) {
  return [...rows].sort((left, right) => right.generated_at.localeCompare(left.generated_at));
}

function getHistoryBase(client?: SupabaseClient) {
  return listMetaReconciliationEvidence(10, client);
}

function buildNotes(status: MetaReconciliationEvidenceRow["status"], startedRunsCount: number, stuckRunsCount: number) {
  if (status === "blocked") return "Há runs presas ou falha operacional recente na reconciliação Meta.";
  if (status === "attention") return startedRunsCount > 0 ? "Há runs em andamento; acompanhar a próxima finalização." : "Reconciliação com atenção operacional.";
  if (stuckRunsCount > 0) return "Há runs presas acima do limite operacional.";
  return "Evidência operacional agregada e assinada com hash do relatório.";
}

function deriveStatus(latestMetaSyncStatus: string | null, startedRunsCount: number, stuckRunsCount: number) {
  if (stuckRunsCount > 0 || latestMetaSyncStatus === "error") return "blocked" as const;
  if (startedRunsCount > 0) return "attention" as const;
  if (latestMetaSyncStatus && latestMetaSyncStatus !== "success") return "attention" as const;
  return "ok" as const;
}

function asEvidenceDelta(previous: MetaReconciliationEvidenceRow, current: MetaReconciliationEvidenceRow): MetaReconciliationEvidenceDelta {
  return {
    posts_count: current.posts_count - previous.posts_count,
    interactions_count: current.interactions_count - previous.interactions_count,
    people_count: current.people_count - previous.people_count,
    meta_sync_runs_count: current.meta_sync_runs_count - previous.meta_sync_runs_count,
    meta_audit_logs_count: current.meta_audit_logs_count - previous.meta_audit_logs_count,
    started_runs_count: current.started_runs_count - previous.started_runs_count,
    stuck_runs_count: current.stuck_runs_count - previous.stuck_runs_count,
    latest_meta_sync_status: current.latest_meta_sync_status,
    status: current.status,
  };
}

export function computeReconciliationHash(summary: HashSummary) {
  const payload = {
    generatedAt: summary.generatedAt,
    postsCount: summary.postsCount,
    interactionsCount: summary.interactionsCount,
    peopleCount: summary.peopleCount,
    metaSyncRunsCount: summary.metaSyncRunsCount,
    metaAuditLogsCount: summary.metaAuditLogsCount,
    startedRunsCount: summary.startedRunsCount,
    stuckRunsCount: summary.stuckRunsCount,
    latestMetaSyncStatus: summary.latestMetaSyncStatus,
    latestMetaSyncAt: summary.latestMetaSyncAt,
    status: summary.status,
  };

  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function buildEvidenceRow(summary: Awaited<ReturnType<typeof getMetaReconciliationSummary>>, generatedAt: string, generatedBy: { id: string; email: string | null } | null): TableInsert<"meta_reconciliation_evidence"> {
  const latestMetaSyncStatus = summary.latestFinalizedRun?.status ?? summary.latestRun?.status ?? null;
  const latestMetaSyncAt = summary.latestFinalizedRun?.finished_at ?? summary.latestRun?.started_at ?? null;
  const startedRunsCount = summary.startedRuns.length;
  const stuckRunsCount = summary.stuckRuns.length;
  const status = deriveStatus(latestMetaSyncStatus, startedRunsCount, stuckRunsCount);

  return {
    id: randomUUID(),
    generated_at: generatedAt,
    generated_by: generatedBy?.id ?? null,
    generated_by_email: generatedBy?.email ?? null,
    posts_count: summary.sourceOfTruth.posts,
    interactions_count: summary.sourceOfTruth.interactions,
    people_count: summary.sourceOfTruth.people,
    meta_sync_runs_count: summary.sourceOfTruth.syncRuns,
    meta_audit_logs_count: summary.sourceOfTruth.auditLogs,
    started_runs_count: startedRunsCount,
    stuck_runs_count: stuckRunsCount,
    latest_meta_sync_status: latestMetaSyncStatus,
    latest_meta_sync_at: latestMetaSyncAt,
    report_hash: computeReconciliationHash({
      generatedAt,
      postsCount: summary.sourceOfTruth.posts,
      interactionsCount: summary.sourceOfTruth.interactions,
      peopleCount: summary.sourceOfTruth.people,
      metaSyncRunsCount: summary.sourceOfTruth.syncRuns,
      metaAuditLogsCount: summary.sourceOfTruth.auditLogs,
      startedRunsCount,
      stuckRunsCount,
      latestMetaSyncStatus,
      latestMetaSyncAt,
      status,
    }),
    status,
    notes: buildNotes(status, startedRunsCount, stuckRunsCount),
    metadata: {
      source: "meta_reconciliation",
      generated_at: generatedAt,
      source_of_truth: {
        posts: summary.sourceOfTruth.posts,
        interactions: summary.sourceOfTruth.interactions,
        people: summary.sourceOfTruth.people,
        syncRuns: summary.sourceOfTruth.syncRuns,
        auditLogs: summary.sourceOfTruth.auditLogs,
      },
      started_runs_count: startedRunsCount,
      stuck_runs_count: stuckRunsCount,
    } satisfies Json,
  };
}

export async function generateMetaReconciliationEvidence(): Promise<MetaReconciliationEvidenceRow> {
  const summary = await getMetaReconciliationSummary();
  const generatedAt = new Date().toISOString();
  const session = await getInternalSession();
  const generatedBy = session ? { id: session.id, email: session.email } : null;
  const row = buildEvidenceRow(summary, generatedAt, generatedBy);

  if (shouldUseMockData()) {
    return { ...(row as MetaReconciliationEvidenceRow) };
  }

  const supabase = getClient();
  const { data, error } = await supabase.from("meta_reconciliation_evidence").insert(row).select("*").single();

  if (error) throw new Error(error.message);
  return data ?? (row as MetaReconciliationEvidenceRow);
}

export async function listMetaReconciliationEvidence(limit = 10, client?: SupabaseClient): Promise<MetaReconciliationEvidenceRow[]> {
  if (shouldUseMockData()) return [mockEvidence].slice(0, limit);

  const supabase = getClient(client);
  const { data, error } = await supabase
    .from("meta_reconciliation_evidence")
    .select("*")
    .order("generated_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getMetaReconciliationEvidenceHistory(limit = 10, client?: SupabaseClient): Promise<MetaReconciliationEvidenceRow[]> {
  const history = await listMetaReconciliationEvidence(limit, client);
  return sortByGeneratedAtDesc(history);
}

export async function compareLatestEvidenceSnapshots(client?: SupabaseClient): Promise<MetaReconciliationEvidenceComparison> {
  const history = await getHistoryBase(client);
  const [latest, previous] = history;

  return {
    latest: latest ?? null,
    previous: previous ?? null,
    delta: latest && previous ? asEvidenceDelta(previous, latest) : null,
  };
}

export function getEvidenceDelta(previous: MetaReconciliationEvidenceRow | null, current: MetaReconciliationEvidenceRow | null): MetaReconciliationEvidenceDelta | null {
  if (!previous || !current) return null;
  return asEvidenceDelta(previous, current);
}

export async function getMetaReconciliationEvidence(id: string, client?: SupabaseClient): Promise<MetaReconciliationEvidenceRow | null> {
  if (shouldUseMockData()) return id === mockEvidence.id ? mockEvidence : null;

  const supabase = getClient(client);
  const { data, error } = await supabase
    .from("meta_reconciliation_evidence")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ?? null;
}

export async function listAuditLogsForMetaReconciliationEvidence(id: string, client?: SupabaseClient): Promise<MetaReconciliationEvidenceAuditLog[]> {
  if (shouldUseMockData()) {
    return [
      {
        id: "mock-meta-reconciliation-evidence-audit",
        actor_email: "demo@radardebase.local",
        action: "meta.reconciliation_evidence_generated",
        entity_type: "meta_reconciliation_evidence",
        entity_id: id,
        summary: "Evidência operacional agregada gerada.",
        metadata: { report_hash: mockEvidence.report_hash },
        created_at: mockEvidence.generated_at,
      },
    ];
  }

  const supabase = getClient(client);
  const { data, error } = await supabase
    .from("audit_logs")
    .select("id,actor_email,action,entity_type,entity_id,summary,metadata,created_at")
    .or(`entity_id.eq.${id},metadata->>evidence_id.eq.${id}`)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function countMetaReconciliationEvidence(client?: SupabaseClient): Promise<number> {
  if (shouldUseMockData()) return 1;

  const supabase = getClient(client);
  const { count, error } = await supabase
    .from("meta_reconciliation_evidence")
    .select("id", { count: "exact", head: true });

  if (error) throw new Error(error.message);
  return count ?? 0;
}
