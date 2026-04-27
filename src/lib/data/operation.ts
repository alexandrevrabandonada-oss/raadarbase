import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { shouldUseMockData } from "@/lib/config";
import type { TableRow } from "@/lib/supabase/database.types";

export type MetaSyncRun = TableRow<"meta_sync_runs">;
export type RelatedAuditLog = Pick<
  TableRow<"audit_logs">,
  "id" | "actor_email" | "action" | "entity_type" | "entity_id" | "summary" | "metadata" | "created_at"
>;

const mockRun: MetaSyncRun = {
  id: "mock-meta-sync",
  actor_id: null,
  actor_email: "demo@radardebase.local",
  kind: "meta.media",
  status: "success",
  started_at: "2026-04-27T09:00:00-03:00",
  finished_at: "2026-04-27T09:00:08-03:00",
  inserted_count: 4,
  updated_count: 0,
  skipped_count: 0,
  error_message: null,
  metadata: { read: 4 },
};

export async function listMetaSyncRuns(limit = 30): Promise<MetaSyncRun[]> {
  if (shouldUseMockData()) return [mockRun];
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("meta_sync_runs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getMetaSyncRunById(id: string): Promise<MetaSyncRun | null> {
  if (shouldUseMockData() && id === mockRun.id) return mockRun;
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("meta_sync_runs")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function listAuditLogsForSync(runId: string): Promise<RelatedAuditLog[]> {
  if (shouldUseMockData()) {
    return [
      {
        id: "mock-audit-meta-sync",
        actor_email: "demo@radardebase.local",
        action: "meta.media_synced",
        entity_type: "meta_sync",
        entity_id: runId,
        summary: "Sincronização manual de mídias do Instagram",
        metadata: { inserted: 4, updated: 0, skipped: 0 },
        created_at: "2026-04-27T09:00:08-03:00",
      },
    ];
  }
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select("id,actor_email,action,entity_type,entity_id,summary,metadata,created_at")
    .or(`entity_id.eq.${runId},metadata->>run_id.eq.${runId}`)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getLatestMetaSyncError(): Promise<MetaSyncRun | null> {
  if (shouldUseMockData()) return null;
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("meta_sync_runs")
    .select("*")
    .eq("status", "error")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function listRetriesForSync(runId: string): Promise<MetaSyncRun[]> {
  if (shouldUseMockData()) return [];
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("meta_sync_runs")
    .select("*")
    .eq("metadata->>retry_of", runId)
    .order("started_at", { ascending: false })
    .limit(20);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getLatestMetaSyncRun(): Promise<MetaSyncRun | null> {
  if (shouldUseMockData()) return mockRun;
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("meta_sync_runs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function countRecentMetaErrors(hours = 24): Promise<number> {
  if (shouldUseMockData()) return 0;
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  const supabase = getSupabaseAdminClient();
  const { count, error } = await supabase
    .from("meta_sync_runs")
    .select("id", { count: "exact", head: true })
    .eq("status", "error")
    .gte("started_at", since);
  if (error) throw new Error(error.message);
  return count ?? 0;
}
