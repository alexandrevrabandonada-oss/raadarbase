import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { shouldUseMockData } from "@/lib/config";
import type { TableInsert, TableUpdate } from "@/lib/supabase/database.types";
import type { OperationalIncidentRow } from "@/lib/types";
import { mockIncidents } from "./e2e-mocks";

export type { OperationalIncidentRow };

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
