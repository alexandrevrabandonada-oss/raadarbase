"use server";

import type { Json } from "@/lib/supabase/database.types";
import { requireRole } from "@/lib/authz/roles";
import { type ActionResult, performAction } from "./utils";

export async function listFieldAgendaEventsAction() {
  await requireRole(["admin", "operador", "comunicacao", "leitura"]);
  const { listFieldAgendaEvents } = await import("@/lib/data/field-agenda");
  return listFieldAgendaEvents({ status: "planned" });
}

export async function trackOperationalEvent(
  event: string,
  personId?: string,
  metadata?: Json,
): Promise<ActionResult> {
  return performAction({
    action: "telemetry.event_recorded",
    entityType: "operational_telemetry",
    entityId: personId || null,
    summary: `Evento operacional registrado: ${event}`,
    metadata: {
      ...((metadata as Record<string, unknown>) || {}),
      event,
      timestamp: new Date().toISOString(),
    },
    mutate: async () => {},
  });
}
