import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { shouldUseMockData } from "@/lib/config";
import type { Json, TableInsert } from "@/lib/supabase/database.types";
import type { AuditAction } from "@/lib/types";

type AuditPayload = {
  actorId: string | null;
  actorEmail: string | null;
  action: AuditAction;
  entityType: string;
  entityId: string | null;
  summary: string;
  metadata?: Json;
};

export async function writeAuditLog(payload: AuditPayload) {
  const insertPayload: TableInsert<"audit_logs"> = {
    actor_id: payload.actorId,
    actor_email: payload.actorEmail,
    action: payload.action,
    entity_type: payload.entityType,
    entity_id: payload.entityId,
    summary: payload.summary,
    metadata: payload.metadata ?? {},
  };

  if (shouldUseMockData()) return;

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("audit_logs").insert(insertPayload);

  if (error) {
    throw new Error(`Falha ao gravar audit_log: ${error.message}`);
  }
}
