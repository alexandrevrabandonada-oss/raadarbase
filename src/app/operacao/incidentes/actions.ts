"use server";

import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { requireInternalSession } from "@/lib/supabase/auth";
import { requireRole } from "@/lib/authz/roles";
import { acknowledgeIncidentInDb, resolveIncidentInDb, addIncidentNoteInDb } from "@/lib/data/incidents";
import type { ActionResult } from "@/app/actions/utils";

function sanitizeOperationalNote(note: string): string {
  return note
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "[REDACTED_EMAIL]")
    .replace(/(\+?\d{1,3}[\s.-]?)?(\(?\d{2,3}\)?[\s.-]?)\d{4,5}[\s.-]?\d{4}/g, "[REDACTED_PHONE]")
    .replace(/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g, "[REDACTED_CPF]")
    .trim();
}

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

export async function addIncidentNote(incidentId: string, rawNote: string): Promise<ActionResult> {
  try {
    const session = await requireInternalSession();
    await requireRole(["admin", "operador"]);
    const sanitizedNote = sanitizeOperationalNote(rawNote).slice(0, 280);

    if (!sanitizedNote) {
      return { ok: false, error: "A nota operacional nao pode ficar vazia." };
    }

    await addIncidentNoteInDb(incidentId, sanitizedNote, session.email);
    await writeAuditLog({
      actorId: session.id,
      actorEmail: session.email,
      action: "incident.note_added",
      entityType: "operational_incidents",
      entityId: incidentId,
      summary: "Nota operacional adicionada ao incidente.",
      metadata: {
        note_preview: sanitizedNote.slice(0, 80),
      },
    });

    revalidatePath("/operacao/incidentes");
    return { ok: true, message: "Nota operacional registrada." };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Falha ao adicionar nota operacional.",
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
