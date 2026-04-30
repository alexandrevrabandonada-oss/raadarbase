"use server";

import { revalidatePath } from "next/cache";
import { requireInternalSession } from "@/lib/supabase/auth";
import { requireRole } from "@/lib/authz/roles";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { 
  confirmInteractionTopics, 
  removeInteractionTopic,
  TopicCategoryRow 
} from "@/lib/data/topics";
import type { ActionResult } from "@/app/actions";
import { isForbiddenLabel } from "@/lib/topics/rules";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function confirmInteractionTopicAction(
  interactionId: string, 
  topicIds: string[]
): Promise<ActionResult> {
  try {
    const session = await requireInternalSession();
    await requireRole(["admin", "operador"]);

    await confirmInteractionTopics(interactionId, topicIds, session.id);

    await writeAuditLog({
      actorId: session.id,
      actorEmail: session.email,
      action: "topic.confirmed",
      entityType: "ig_interactions",
      entityId: interactionId,
      summary: `Temas confirmados para interação: ${topicIds.length} temas.`,
      metadata: { topicIds },
    });

    revalidatePath("/temas/revisao");
    revalidatePath("/temas");
    return { ok: true, message: "Temas confirmados com sucesso." };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Falha ao confirmar temas.",
    };
  }
}

export async function removeInteractionTopicAction(
  interactionId: string, 
  topicId: string
): Promise<ActionResult> {
  try {
    const session = await requireInternalSession();
    await requireRole(["admin", "operador"]);

    await removeInteractionTopic(interactionId, topicId);

    await writeAuditLog({
      actorId: session.id,
      actorEmail: session.email,
      action: "topic.removed",
      entityType: "ig_interactions",
      entityId: interactionId,
      summary: "Tema removido da interação.",
      metadata: { topicId },
    });

    revalidatePath("/temas/revisao");
    return { ok: true, message: "Tema removido com sucesso." };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Falha ao remover tema.",
    };
  }
}

export async function createTopicCategoryAction(
  payload: Pick<TopicCategoryRow, "slug" | "name" | "description" | "color">
): Promise<ActionResult> {
  try {
    const session = await requireInternalSession();
    await requireRole(["admin", "operador"]);

    if (isForbiddenLabel(payload.slug) || isForbiddenLabel(payload.name)) {
      // Registrar tentativa proibida como incidente
      // Import circular dependency avoided by using DB directly if needed
      // but for now we just throw
      throw new Error(`O termo "${payload.slug}" é proibido por motivos de ética e privacidade.`);
    }

    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.from("topic_categories").insert(payload);
    if (error) throw error;

    await writeAuditLog({
      actorId: session.id,
      actorEmail: session.email,
      action: "topic.created",
      entityType: "topic_categories",
      entityId: payload.slug,
      summary: `Nova categoria de tema criada: ${payload.name}`,
    });

    revalidatePath("/temas");
    return { ok: true, message: "Categoria criada com sucesso." };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Falha ao criar categoria.",
    };
  }
}
