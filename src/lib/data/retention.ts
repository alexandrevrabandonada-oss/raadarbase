import { shouldUseMockData } from "@/lib/config";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { TableRow } from "@/lib/supabase/database.types";

export type OperationalRetentionPolicy = TableRow<"operational_retention_policies">;

const mockOperationalRetentionPolicies: OperationalRetentionPolicy[] = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    entity: "meta_sync_runs",
    retention_days: 180,
    enabled: true,
    created_at: "2026-04-27T00:00:00.000Z",
    updated_at: "2026-04-27T00:00:00.000Z",
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    entity: "audit_logs",
    retention_days: 365,
    enabled: true,
    created_at: "2026-04-27T00:00:00.000Z",
    updated_at: "2026-04-27T00:00:00.000Z",
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    entity: "meta_account_snapshots",
    retention_days: 365,
    enabled: true,
    created_at: "2026-04-27T00:00:00.000Z",
    updated_at: "2026-04-27T00:00:00.000Z",
  },
];

export async function listOperationalRetentionPolicies(): Promise<OperationalRetentionPolicy[]> {
  if (shouldUseMockData()) return mockOperationalRetentionPolicies;

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("operational_retention_policies")
    .select("*")
    .order("entity", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}