import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { shouldUseMockData } from "@/lib/config";
import type { Json, TableInsert, TableUpdate } from "@/lib/supabase/database.types";
import type { OperationalIncidentRow } from "@/lib/types";
import { mockIncidents } from "./e2e-mocks";

export type { OperationalIncidentRow };
type IncidentSeverityFilter = OperationalIncidentRow["severity"] | "all";
type IncidentStatusFilter = OperationalIncidentRow["status"] | "all" | "active";
type IncidentSourceFilter = "all" | "webhook";

export type IncidentListFilters = {
  source?: IncidentSourceFilter;
  severity?: IncidentSeverityFilter;
  status?: IncidentStatusFilter;
};

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function listOpenIncidents(): Promise<OperationalIncidentRow[]> {
  if (shouldUseMockData()) return mockIncidents.filter((incident) => incident.status !== "resolved");

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("operational_incidents")
    .select("*")
    .neq("status", "resolved")
    .order("severity", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(`Falha ao listar incidentes: ${error.message}`);
  return data ?? [];
}

export async function listIncidents(filters: IncidentListFilters): Promise<OperationalIncidentRow[]> {
  if (shouldUseMockData()) {
    return mockIncidents.filter((incident) => {
      const source = filters.source ?? "all";
      const severity = filters.severity ?? "all";
      const status = filters.status ?? "active";

      const sourceMatch =
        source === "all" ||
        incident.kind.toLowerCase().includes("meta.webhook") ||
        incident.related_entity_type === "meta_webhook_events";
      const severityMatch = severity === "all" || incident.severity === severity;
      const statusMatch =
        status === "all"
          ? true
          : status === "active"
            ? incident.status !== "resolved"
            : incident.status === status;

      return sourceMatch && severityMatch && statusMatch;
    });
  }

  const supabase = getSupabaseAdminClient();
  const source = filters.source ?? "all";
  const severity = filters.severity ?? "all";
  const status = filters.status ?? "active";

  let query = supabase.from("operational_incidents").select("*");

  if (source === "webhook") {
    query = query.or("kind.ilike.%meta.webhook%,related_entity_type.eq.meta_webhook_events");
  }

  if (severity !== "all") {
    query = query.eq("severity", severity);
  }

  if (status === "active") {
    query = query.neq("status", "resolved");
  } else if (status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query.order("created_at", { ascending: false }).limit(200);
  if (error) throw new Error(`Falha ao listar incidentes filtrados: ${error.message}`);
  return data ?? [];
}

export async function listAllIncidents(): Promise<OperationalIncidentRow[]> {
  if (shouldUseMockData()) return mockIncidents;

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("operational_incidents")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(`Falha ao listar incidentes: ${error.message}`);
  return data ?? [];
}

export async function countOpenIncidents(): Promise<number> {
  if (shouldUseMockData()) return mockIncidents.filter((incident) => incident.status !== "resolved").length;

  const supabase = getSupabaseAdminClient();
  const { count, error } = await supabase
    .from("operational_incidents")
    .select("id", { count: "exact", head: true })
    .neq("status", "resolved");
  if (error) return 0;
  return count ?? 0;
}

export async function countCriticalIncidents(): Promise<number> {
  if (shouldUseMockData()) return mockIncidents.filter((incident) => incident.severity === "critical" && incident.status !== "resolved").length;

  const supabase = getSupabaseAdminClient();
  const { count, error } = await supabase
    .from("operational_incidents")
    .select("id", { count: "exact", head: true })
    .eq("severity", "critical")
    .neq("status", "resolved");
  if (error) return 0;
  return count ?? 0;
}

export async function countOpenWebhookIncidents(): Promise<number> {
  if (shouldUseMockData()) {
    return mockIncidents.filter(
      (incident) =>
        incident.status !== "resolved" &&
        (incident.kind.toLowerCase().includes("meta.webhook") || incident.related_entity_type === "meta_webhook_events"),
    ).length;
  }

  const supabase = getSupabaseAdminClient();
  const { count, error } = await supabase
    .from("operational_incidents")
    .select("id", { count: "exact", head: true })
    .neq("status", "resolved")
    .or("kind.ilike.%meta.webhook%,related_entity_type.eq.meta_webhook_events");
  if (error) return 0;
  return count ?? 0;
}

export async function countCriticalWebhookIncidents(): Promise<number> {
  if (shouldUseMockData()) {
    return mockIncidents.filter(
      (incident) =>
        incident.status !== "resolved" &&
        incident.severity === "critical" &&
        (incident.kind.toLowerCase().includes("meta.webhook") || incident.related_entity_type === "meta_webhook_events"),
    ).length;
  }

  const supabase = getSupabaseAdminClient();
  const { count, error } = await supabase
    .from("operational_incidents")
    .select("id", { count: "exact", head: true })
    .eq("severity", "critical")
    .neq("status", "resolved")
    .or("kind.ilike.%meta.webhook%,related_entity_type.eq.meta_webhook_events");
  if (error) return 0;
  return count ?? 0;
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function acknowledgeIncidentInDb(id: string, actorEmail: string | null) {
  const supabase = getSupabaseAdminClient();
  const payload: TableUpdate<"operational_incidents"> = {
    status: "acknowledged",
    acknowledged_at: new Date().toISOString(),
    actor_email: actorEmail,
  };
  const { error } = await supabase.from("operational_incidents").update(payload).eq("id", id);
  if (error) throw new Error(`Falha ao reconhecer incidente: ${error.message}`);
}

export async function resolveIncidentInDb(id: string, actorEmail: string | null) {
  const supabase = getSupabaseAdminClient();
  const payload: TableUpdate<"operational_incidents"> = {
    status: "resolved",
    resolved_at: new Date().toISOString(),
    actor_email: actorEmail,
  };
  const { error } = await supabase.from("operational_incidents").update(payload).eq("id", id);
  if (error) throw new Error(`Falha ao resolver incidente: ${error.message}`);
}

export async function createIncident(incident: TableInsert<"operational_incidents">) {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("operational_incidents").insert(incident);
  if (error) throw new Error(`Falha ao criar incidente: ${error.message}`);
}

export async function addIncidentNoteInDb(id: string, note: string, actorEmail: string | null) {
  const supabase = getSupabaseAdminClient();
  const { data: incident, error: readError } = await supabase
    .from("operational_incidents")
    .select("metadata")
    .eq("id", id)
    .maybeSingle();

  if (readError) throw new Error(`Falha ao carregar incidente para nota: ${readError.message}`);

  const metadata =
    incident?.metadata && typeof incident.metadata === "object" && !Array.isArray(incident.metadata)
      ? ({ ...(incident.metadata as Record<string, unknown>) } as Record<string, unknown>)
      : ({} as Record<string, unknown>);

  const existingNotes = Array.isArray(metadata.notes) ? metadata.notes : [];
  const nextNotes = [...existingNotes, {
    at: new Date().toISOString(),
    by: actorEmail ?? "internal",
    note,
  }].slice(-50);

  const payload: TableUpdate<"operational_incidents"> = {
    actor_email: actorEmail,
    metadata: {
      ...metadata,
      notes: nextNotes,
    } as Json,
  };

  const { error } = await supabase.from("operational_incidents").update(payload).eq("id", id);
  if (error) throw new Error(`Falha ao adicionar nota operacional: ${error.message}`);
}

// ─── Derivation ───────────────────────────────────────────────────────────────

/**
 * Derives incidents from operational signals (stuck runs, repeated failures).
 * Idempotent: uses related_entity_id to avoid duplicates.
 */
export async function deriveIncidentsFromSyncRuns(
  stuckRunIds: string[],
  repeatedFailureKinds: string[],
): Promise<void> {
  if (shouldUseMockData()) return;

  const supabase = getSupabaseAdminClient();

  for (const runId of stuckRunIds) {
    // Check if incident already exists for this run
    const { data: existing } = await supabase
      .from("operational_incidents")
      .select("id")
      .eq("related_entity_id", runId)
      .eq("kind", "stuck_run")
      .neq("status", "resolved")
      .maybeSingle();

    if (!existing) {
      await supabase.from("operational_incidents").insert({
        kind: "stuck_run",
        severity: "warning",
        status: "open",
        title: "Sincronização Meta presa",
        description: `Run ${runId} iniciada mas não finalizada após tempo esperado.`,
        related_entity_type: "meta_sync_runs",
        related_entity_id: runId,
      });
    }
  }

  for (const kind of repeatedFailureKinds) {
    const { data: existing } = await supabase
      .from("operational_incidents")
      .select("id")
      .eq("related_entity_id", kind)
      .eq("kind", "repeated_failure")
      .neq("status", "resolved")
      .maybeSingle();

    if (!existing) {
      await supabase.from("operational_incidents").insert({
        kind: "repeated_failure",
        severity: "critical",
        status: "open",
        title: `Falha recorrente: ${kind}`,
        description: `Sincronização "${kind}" falhou repetidamente nas últimas 24h.`,
        related_entity_type: "meta_sync_runs",
        related_entity_id: kind,
      });
    }
  }
}
