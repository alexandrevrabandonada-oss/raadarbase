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

export async function listAuditLogs(limit = 100): Promise<AuditLogEntry[]> {
  if (shouldUseMockData()) {
    const now = Date.now();
    return [
      {
        id: "mock-log-1",
        actorId: "actor-1",
        actorEmail: "gabriela.costa@radar.org",
        action: "contact.response_recorded",
        entityType: "contact",
        entityId: "person-1",
        summary: "Registrou resposta de escuta de Carlos Silva no Instagram.",
        metadata: {},
        createdAt: new Date(now - 1000 * 60 * 12).toISOString(), // 12 mins ago
      },
      {
        id: "mock-log-2",
        actorId: "actor-2",
        actorEmail: "marcos.santos@radar.org",
        action: "action_execution.result_created",
        entityType: "action_execution",
        entityId: "action-1",
        summary: "Concluiu resultado de escuta na Roda de Conversa - Lapa.",
        metadata: {},
        createdAt: new Date(now - 1000 * 60 * 45).toISOString(), // 45 mins ago
      },
      {
        id: "mock-log-3",
        actorId: "actor-1",
        actorEmail: "gabriela.costa@radar.org",
        action: "message.created",
        entityType: "message_template",
        entityId: "temp-1",
        summary: "Forjou nova fórmula de abordagem sobre mobilidade no grimório.",
        metadata: {},
        createdAt: new Date(now - 1000 * 60 * 120).toISOString(), // 2 hours ago
      },
      {
        id: "mock-log-4",
        actorId: "actor-3",
        actorEmail: "ana.mendes@radar.org",
        action: "volunteer_application.approved",
        entityType: "volunteer_application",
        entityId: "vol-1",
        summary: "Aprovou a ficha e acolheu Juliana Souza como voluntária no Clã da Lapa.",
        metadata: {},
        createdAt: new Date(now - 1000 * 60 * 300).toISOString(), // 5 hours ago
      },
      {
        id: "mock-log-5",
        actorId: "actor-4",
        actorEmail: "lucas.oliveira@radar.org",
        action: "strategic_memory.created",
        entityType: "strategic_memory",
        entityId: "mem-1",
        summary: "Consagrou novo registro de memória tática sobre demandas do Centro.",
        metadata: {},
        createdAt: new Date(now - 1000 * 60 * 480).toISOString(), // 8 hours ago
      },
    ];
  }
  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(limit);
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

export async function listAuditLogsForEntity(entityType: string, entityId: string, limit = 25): Promise<AuditLogEntry[]> {
  if (shouldUseMockData()) return [];
  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []).map(mapAuditEntry);
  } catch (error) {
    handleSupabaseReadError("listAuditLogsForEntity", error);
  }
}

export async function getOperationalTelemetry(days = 7, limit = 200): Promise<AuditLogEntry[]> {
  if (shouldUseMockData()) return [];
  try {
    const supabase = getSupabaseAdminClient();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .or(`entity_type.eq.operational_telemetry,action.eq.contact.response_recorded,action.eq.contact.referral_recorded`)
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: true })
      .limit(limit);
      
    if (error) throw error;
    return (data ?? []).map(mapAuditEntry);
  } catch (error) {
    handleSupabaseReadError("getOperationalTelemetry", error);
  }
}
export async function listPilotFeedback(limit = 100): Promise<AuditLogEntry[]> {
  if (shouldUseMockData()) return [];
  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .eq("action", "pilot.feedback_submitted")
      .order("created_at", { ascending: false })
      .limit(limit);
      
    if (error) throw error;
    return (data ?? []).map(mapAuditEntry);
  } catch (error) {
    handleSupabaseReadError("listPilotFeedback", error);
  }
}
