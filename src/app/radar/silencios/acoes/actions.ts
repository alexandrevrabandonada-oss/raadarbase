"use server";

import { revalidatePath } from "next/cache";
import { requireInternalSession } from "@/lib/supabase/auth";
import { requireRole } from "@/lib/authz/roles";
import {
  completeCorrectiveAction,
  archiveCorrectiveAction,
} from "@/lib/data/silence-radar-corrective-actions";
import { writeAuditLog } from "@/lib/audit/write-audit-log";

export async function completeCorrectiveActionServerAction(
  formData: FormData,
): Promise<void> {
  const user = await requireInternalSession();
  await requireRole(["admin", "operador"]);

  const id = typeof formData.get("id") === "string" ? (formData.get("id") as string).trim() : "";
  if (!id) return;

  const action = await completeCorrectiveAction(id);

  await writeAuditLog({
    actorId: user.id,
    actorEmail: user.email ?? null,
    action: "silence_radar.corrective_action_completed",
    entityType: "silence_radar_corrective_actions",
    entityId: action.id,
    summary: `Ação corretiva concluída: ${action.kind} para ${action.target_type} "${action.target_label}".`,
    metadata: { kind: action.kind, target_type: action.target_type, target_label: action.target_label },
  });

  revalidatePath("/radar/silencios/acoes");
  revalidatePath(`/radar/silencios/acoes/${action.id}`);
  revalidatePath("/radar/silencios/impacto");
  revalidatePath("/radar/silencios");
}

export async function archiveCorrectiveActionServerAction(
  formData: FormData,
): Promise<void> {
  const user = await requireInternalSession();
  await requireRole(["admin", "operador"]);

  const id = typeof formData.get("id") === "string" ? (formData.get("id") as string).trim() : "";
  if (!id) return;

  const action = await archiveCorrectiveAction(id);

  await writeAuditLog({
    actorId: user.id,
    actorEmail: user.email ?? null,
    action: "silence_radar.corrective_action_archived",
    entityType: "silence_radar_corrective_actions",
    entityId: action.id,
    summary: `Ação corretiva arquivada: ${action.kind} para ${action.target_type} "${action.target_label}".`,
    metadata: { kind: action.kind, target_type: action.target_type, target_label: action.target_label },
  });

  revalidatePath("/radar/silencios/acoes");
  revalidatePath(`/radar/silencios/acoes/${action.id}`);
  revalidatePath("/radar/silencios/impacto");
  revalidatePath("/radar/silencios");
}
