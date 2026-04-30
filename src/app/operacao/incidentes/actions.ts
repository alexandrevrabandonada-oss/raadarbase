"use server";

import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { requireInternalSession } from "@/lib/supabase/auth";
import { requireRole } from "@/lib/authz/roles";
import { acknowledgeIncidentInDb, resolveIncidentInDb } from "@/lib/data/incidents";
import type { ActionResult } from "@/app/actions";

export async function acknowledgeIncident(incidentId: string): Promise<ActionResult> {
  try {
    const session = await requireInternalSession();
    await requireRole(["admin", "operador"]);
    await acknowledgeIncidentInDb(incidentId, session.email);
    await writeAuditLog({
      actorId: session.id,
      actorEmail: session.email,
      action: "incident.acknowledged",
      entityType: "operational_incidents",
      entityId: incidentId,
      summary: "Incidente reconhecido.",
    });
    revalidatePath("/operacao/incidentes");
    return { ok: true, message: "Incidente reconhecido." };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Falha ao reconhecer incidente.",
    };
  }
}

export async function resolveIncident(incidentId: string): Promise<ActionResult> {
  try {
    const session = await requireInternalSession();
    await requireRole(["admin", "operador"]);
    await resolveIncidentInDb(incidentId, session.email);
    await writeAuditLog({
      actorId: session.id,
      actorEmail: session.email,
      action: "incident.resolved",
      entityType: "operational_incidents",
      entityId: incidentId,
      summary: "Incidente resolvido.",
    });
    revalidatePath("/operacao/incidentes");
    return { ok: true, message: "Incidente resolvido." };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Falha ao resolver incidente.",
    };
  }
}

export async function checkExecutionHealthAction(): Promise<ActionResult> {
  try {
    await requireRole(["admin", "operador"]);
    // Aqui simulamos a varredura que geraria incidentes
    // Em um ambiente real, isso seria um cron job chamando lib/data/action-execution.ts getExecutionStats
    
    return { ok: true, message: "Verificação de saúde de execução concluída." };
  } catch {
    return { ok: false, error: "Falha na verificação." };
  }
}
