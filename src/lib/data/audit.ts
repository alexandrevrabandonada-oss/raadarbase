import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { shouldUseMockData } from "@/lib/config";
import type { AuditAction, AuditLogEntry } from "@/lib/types";
import { handleSupabaseReadError } from "./utils";

function mapAuditEntry(entry: {
  id: string;
  actor_id: string | null;
  actor_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  summary: string;
  metadata: AuditLogEntry["metadata"];
  created_at: string;
}): AuditLogEntry {
  return {
    id: entry.id,
    actorId: entry.actor_id,
    actorEmail: entry.actor_email,
    action: entry.action,
    entityType: entry.entity_type,
    entityId: entry.entity_id,
    summary: entry.summary,
    metadata: entry.metadata,
    createdAt: entry.created_at,
  };
}

export async function listAuditLogs(): Promise<AuditLogEntry[]> {
  if (shouldUseMockData()) return [];
  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(100);
    if (error) throw error;
    return (data ?? []).map(mapAuditEntry);
  } catch (error) {
    handleSupabaseReadError("listAuditLogs", error);
  }
}

export async function getLatestAuditLogForEntity(entityType: string, entityId: string): Promise<AuditLogEntry | null> {
  if (shouldUseMockData()) return null;
  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data ? mapAuditEntry(data) : null;
  } catch (error) {
    handleSupabaseReadError("getLatestAuditLogForEntity", error);
  }
}

export async function getLatestAuditByAction(action: AuditAction): Promise<AuditLogEntry | null> {
  if (shouldUseMockData()) return null;
  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .eq("action", action)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data ? mapAuditEntry(data) : null;
  } catch (error) {
    handleSupabaseReadError("getLatestAuditByAction", error);
  }
}
