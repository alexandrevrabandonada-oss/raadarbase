"use server";

import { revalidatePath } from "next/cache";
import { requireInternalSession } from "@/lib/supabase/auth";
import { requireRole } from "@/lib/authz/roles";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { getActionPlanByReportId } from "@/lib/data/action-plans";
import { getDevolutionPublicationByReportId } from "@/lib/data/devolution-publications";
import { getPublicDevolutiveKit } from "@/lib/data/report-devolutive";
import { openTerritorialListeningWindow } from "@/lib/data/territorial-listening-windows";
import type { ActionResult } from "@/app/actions/utils";
import type { TableUpdate } from "@/lib/supabase/database.types";

type DevolutionPublicationInput = {
  publishedUrl?: string;
  instagramPostUrl?: string;
  whatsappShared?: boolean;
};

async function updatePlanItemStatus(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  itemId: string,
  planId: string,
  input: TableUpdate<"action_plan_items">,
) {
  const { error } = await supabase.from("action_plan_items").update(input).eq("id", itemId);
  if (error) throw new Error(error.message);
  return planId;
}

function cleanUrl(value?: string) {
  const normalized = value?.trim() ?? "";
  return normalized.length > 0 ? normalized : null;
}

async function upsertDevolutionPublication(
  reportId: string,
  session: { id: string; email: string | null },
  payload: TableUpdate<"public_devolution_publications">,
) {
  const supabase = getSupabaseAdminClient();
  const existing = await getDevolutionPublicationByReportId(reportId);
  if (existing) {
    const { data, error } = await supabase
      .from("public_devolution_publications")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", existing.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  const { data, error } = await supabase
    .from("public_devolution_publications")
    .insert({
      report_id: reportId,
      created_by: session.id,
      created_by_email: session.email,
      ...payload,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function syncPublicDevolutivePlanAction(reportId: string): Promise<ActionResult & { planId?: string }> {
  try {
    const session = await requireInternalSession();
    await requireRole(["admin", "operador", "comunicacao"]);

    const kit = await getPublicDevolutiveKit(reportId);
    const plan = await getActionPlanByReportId(reportId);
    if (!plan) {
      return { ok: false, error: "Plano de ação vinculado ao relatório não encontrado." };
    }

    const supabase = getSupabaseAdminClient();
    const { data: currentItems, error: itemsError } = await supabase
      .from("action_plan_items")
      .select("*")
      .eq("action_plan_id", plan.id);

    if (itemsError) throw new Error(itemsError.message);

    const items = currentItems ?? [];
    const publicTitle = "Publicar devolutiva no Instagram";
    const groupTitle = "Compartilhar chamada em grupos";
    const monitorTitle = "Monitorar escuta por bairro por 7 dias";
    const synthesisTitle = "Gerar síntese territorial após 7 dias";

    const carouselItem = items.find((item) => item.type === "carrossel" && item.title.includes("escuta do Instagram"));
    if (carouselItem && carouselItem.status !== "doing") {
      await updatePlanItemStatus(supabase, carouselItem.id, plan.id, { status: "doing" });
      await writeAuditLog({
        actorId: session.id,
        actorEmail: session.email,
        action: "action_plan.item_updated",
        entityType: "action_plan_items",
        entityId: carouselItem.id,
        summary: "Item de carrossel marcado como em andamento.",
        metadata: { action_plan_id: plan.id, status: "doing" },
      });
    }

    const publicItem = items.find((item) => ["post_publico", "resposta_publica"].includes(item.type));
    if (publicItem) {
      const needsUpdate = publicItem.title !== publicTitle || publicItem.status !== "doing" || publicItem.type !== "post_publico";
      if (needsUpdate) {
        await updatePlanItemStatus(supabase, publicItem.id, plan.id, {
          type: "post_publico",
          title: publicTitle,
          status: "doing",
          description: "Publicar devolutiva no Instagram com síntese das pautas e sem expor pessoas.",
        });
        await writeAuditLog({
          actorId: session.id,
          actorEmail: session.email,
          action: "action_plan.item_updated",
          entityType: "action_plan_items",
          entityId: publicItem.id,
          summary: "Item de publicação da devolutiva atualizado.",
          metadata: { action_plan_id: plan.id, status: "doing", type: "post_publico" },
        });
      }
    } else {
      const { data, error } = await supabase
        .from("action_plan_items")
        .insert({
          action_plan_id: plan.id,
          type: "post_publico",
          title: publicTitle,
          description: "Publicar devolutiva no Instagram com síntese das pautas e sem expor pessoas.",
          status: "doing",
          metadata: { source: "devolutive_kit" },
        })
        .select()
        .single();

      if (error) throw new Error(error.message);

      await writeAuditLog({
        actorId: session.id,
        actorEmail: session.email,
        action: "action_plan.item_created",
        entityType: "action_plan_items",
        entityId: data.id,
        summary: "Item de publicação da devolutiva criado.",
        metadata: { action_plan_id: plan.id, type: "post_publico" },
      });
    }

    const groupItem = items.find((item) => item.type === "encaminhamento" && item.title.toLowerCase().includes("chamada"));
    if (groupItem) {
      const needsUpdate = groupItem.title !== groupTitle || groupItem.status !== "todo";
      if (needsUpdate) {
        await updatePlanItemStatus(supabase, groupItem.id, plan.id, {
          title: groupTitle,
          status: "todo",
          description: "Compartilhar a chamada em grupos sem automação, microtargeting ou contato em massa.",
        });
        await writeAuditLog({
          actorId: session.id,
          actorEmail: session.email,
          action: "action_plan.item_updated",
          entityType: "action_plan_items",
          entityId: groupItem.id,
          summary: "Item de compartilhamento em grupos atualizado.",
          metadata: { action_plan_id: plan.id },
        });
      }
    } else {
      const { data, error } = await supabase
        .from("action_plan_items")
        .insert({
          action_plan_id: plan.id,
          type: "encaminhamento",
          title: groupTitle,
          description: "Compartilhar a chamada em grupos sem automação, microtargeting ou contato em massa.",
          status: "todo",
          metadata: { source: "devolutive_kit" },
        })
        .select()
        .single();

      if (error) throw new Error(error.message);

      await writeAuditLog({
        actorId: session.id,
        actorEmail: session.email,
        action: "action_plan.item_created",
        entityType: "action_plan_items",
        entityId: data.id,
        summary: "Item de compartilhamento em grupos criado.",
        metadata: { action_plan_id: plan.id, type: "encaminhamento" },
      });
    }

    const neighborhoodItem = items.find((item) => item.type === "escuta_bairro");
    if (neighborhoodItem) {
      const desiredTitle = monitorTitle;
      const needsUpdate = neighborhoodItem.title !== desiredTitle || neighborhoodItem.status !== "doing";
      if (needsUpdate) {
        await updatePlanItemStatus(supabase, neighborhoodItem.id, plan.id, {
          type: "escuta_bairro",
          title: desiredTitle,
          status: "doing",
          description: "Abrir escuta territorial por bairro com consentimento explícito e sem dados sensíveis desnecessários.",
        });
        await writeAuditLog({
          actorId: session.id,
          actorEmail: session.email,
          action: "action_plan.item_updated",
          entityType: "action_plan_items",
          entityId: neighborhoodItem.id,
          summary: "Item de monitoramento da escuta territorial atualizado.",
          metadata: { action_plan_id: plan.id, status: "doing" },
        });
      }
    } else {
      const { data, error } = await supabase
        .from("action_plan_items")
        .insert({
          action_plan_id: plan.id,
          type: "escuta_bairro",
          title: monitorTitle,
          description: "Monitorar a escuta territorial por bairro durante 7 dias, com consentimento explícito e sem dados sensíveis desnecessários.",
          status: "doing",
          metadata: { source: "devolutive_kit" },
        })
        .select()
        .single();

      if (error) throw new Error(error.message);

      await writeAuditLog({
        actorId: session.id,
        actorEmail: session.email,
        action: "action_plan.item_created",
        entityType: "action_plan_items",
        entityId: data.id,
        summary: "Item de monitoramento da escuta territorial criado.",
        metadata: { action_plan_id: plan.id, type: "escuta_bairro", status: "doing" },
      });
    }

    const synthesisItem = items.find((item) => item.type === "material_explicativo" && item.title.toLowerCase().includes("síntese"));
    if (synthesisItem) {
      const needsUpdate = synthesisItem.title !== synthesisTitle || synthesisItem.status !== "todo";
      if (needsUpdate) {
        await updatePlanItemStatus(supabase, synthesisItem.id, plan.id, {
          title: synthesisTitle,
          status: "todo",
          description: "Consolidar uma síntese territorial após 7 dias com base em pauta agregada e consentida.",
        });
        await writeAuditLog({
          actorId: session.id,
          actorEmail: session.email,
          action: "action_plan.item_updated",
          entityType: "action_plan_items",
          entityId: synthesisItem.id,
          summary: "Item de síntese territorial atualizado.",
          metadata: { action_plan_id: plan.id },
        });
      }
    } else {
      const { data, error } = await supabase
        .from("action_plan_items")
        .insert({
          action_plan_id: plan.id,
          type: "material_explicativo",
          title: synthesisTitle,
          description: "Consolidar uma síntese territorial após 7 dias com base em pauta agregada e consentida.",
          status: "todo",
          metadata: { source: "devolutive_kit" },
        })
        .select()
        .single();

      if (error) throw new Error(error.message);

      await writeAuditLog({
        actorId: session.id,
        actorEmail: session.email,
        action: "action_plan.item_created",
        entityType: "action_plan_items",
        entityId: data.id,
        summary: "Item de síntese territorial criado.",
        metadata: { action_plan_id: plan.id, type: "material_explicativo" },
      });
    }

    const planMetadata = plan.metadata && typeof plan.metadata === "object" && !Array.isArray(plan.metadata)
      ? (plan.metadata as Record<string, unknown>)
      : {};

    await supabase
      .from("action_plans")
      .update({
        metadata: {
          ...planMetadata,
          devolutive_kit: {
            report_id: reportId,
            generated_at: new Date().toISOString(),
          },
        },
      })
      .eq("id", plan.id);

    await writeAuditLog({
      actorId: session.id,
      actorEmail: session.email,
      action: "action_plan.updated",
      entityType: "action_plans",
      entityId: plan.id,
      summary: "Plano atualizado com a devolutiva pública.",
      metadata: { report_id: reportId, kit_title: kit.publicTitle },
    });

    revalidatePath(`/relatorios/${reportId}/devolutiva`);
    revalidatePath(`/relatorios/${reportId}`);
    revalidatePath(`/acoes/${plan.id}`);
    revalidatePath("/acoes");

    return { ok: true, message: "Plano atualizado com a devolutiva pública.", planId: plan.id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Falha ao atualizar o plano da devolutiva." };
  }
}

export async function markDevolutionReviewedAction(reportId: string): Promise<ActionResult & { publicationId?: string }> {
  try {
    const session = await requireInternalSession();
    await requireRole(["admin", "operador", "comunicacao"]);

    const plan = await getActionPlanByReportId(reportId);
    const publication = await upsertDevolutionPublication(reportId, session, {
      action_plan_id: plan?.id ?? null,
      status: "reviewed",
      metadata: {
        reviewed_at: new Date().toISOString(),
        reviewed_by: session.email,
      },
    });

    await writeAuditLog({
      actorId: session.id,
      actorEmail: session.email,
      action: "devolution.reviewed",
      entityType: "public_devolution_publications",
      entityId: publication.id,
      summary: "Devolutiva marcada como revisada.",
      metadata: { report_id: reportId, action_plan_id: plan?.id ?? null },
    });

    revalidatePath(`/relatorios/${reportId}/devolutiva`);
    revalidatePath(`/relatorios/${reportId}`);

    return { ok: true, message: "Devolutiva marcada como revisada.", publicationId: publication.id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Falha ao revisar a devolutiva." };
  }
}

export async function markDevolutionPublishedAction(
  reportId: string,
  input: DevolutionPublicationInput,
): Promise<ActionResult & { publicationId?: string }> {
  try {
    const session = await requireInternalSession();
    await requireRole(["admin", "operador", "comunicacao"]);

    const publishedUrl = cleanUrl(input.publishedUrl);
    const instagramPostUrl = cleanUrl(input.instagramPostUrl);

    if (!publishedUrl && !instagramPostUrl) {
      return { ok: false, error: "Informe ao menos uma URL de publicação." };
    }

    const plan = await getActionPlanByReportId(reportId);
    const publication = await upsertDevolutionPublication(reportId, session, {
      action_plan_id: plan?.id ?? null,
      status: "published",
      published_at: new Date().toISOString(),
      published_url: publishedUrl,
      instagram_post_url: instagramPostUrl,
      whatsapp_shared: Boolean(input.whatsappShared),
      metadata: {
        published_by: session.email,
        whatsapp_shared: Boolean(input.whatsappShared),
      },
    });

    const window = await openTerritorialListeningWindow({
      reportId,
      actionPlanId: plan?.id ?? null,
      createdBy: { id: session.id, email: session.email },
      metadata: {
        publication_id: publication.id,
        published_url: publishedUrl,
        instagram_post_url: instagramPostUrl,
        whatsapp_shared: Boolean(input.whatsappShared),
      },
      durationDays: 7,
    });

    await writeAuditLog({
      actorId: session.id,
      actorEmail: session.email,
      action: "devolution.published",
      entityType: "public_devolution_publications",
      entityId: publication.id,
      summary: "Devolutiva marcada como publicada.",
      metadata: {
        report_id: reportId,
        action_plan_id: plan?.id ?? null,
        whatsapp_shared: Boolean(input.whatsappShared),
        territorial_window_id: window?.id ?? null,
      },
    });

    await writeAuditLog({
      actorId: session.id,
      actorEmail: session.email,
      action: "territorial_listening_window.opened",
      entityType: "territorial_listening_windows",
      entityId: window?.id ?? null,
      summary: "Janela territorial de escuta aberta por 7 dias.",
      metadata: {
        report_id: reportId,
        action_plan_id: plan?.id ?? null,
        starts_at: window?.startsAt ?? null,
        ends_at: window?.endsAt ?? null,
      },
    });

    revalidatePath(`/relatorios/${reportId}/devolutiva`);
    revalidatePath(`/relatorios/${reportId}`);
    revalidatePath("/escuta/bairro/admin");

    return { ok: true, message: "Devolutiva marcada como publicada.", publicationId: publication.id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Falha ao publicar a devolutiva." };
  }
}

export async function archiveDevolutionPublicationAction(id: string): Promise<ActionResult> {
  try {
    const session = await requireInternalSession();
    await requireRole(["admin", "operador", "comunicacao"]);

    const supabase = getSupabaseAdminClient();
    const { data: publication, error: fetchError } = await supabase
      .from("public_devolution_publications")
      .select("id, report_id")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) throw new Error(fetchError.message);
    if (!publication) return { ok: false, error: "Publicação não encontrada." };

    const { error } = await supabase
      .from("public_devolution_publications")
      .update({ status: "archived", updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw new Error(error.message);

    await writeAuditLog({
      actorId: session.id,
      actorEmail: session.email,
      action: "devolution.archived",
      entityType: "public_devolution_publications",
      entityId: id,
      summary: "Publicação da devolutiva arquivada.",
      metadata: { report_id: publication.report_id },
    });

    revalidatePath(`/relatorios/${publication.report_id}/devolutiva`);
    revalidatePath(`/relatorios/${publication.report_id}`);

    return { ok: true, message: "Publicação arquivada." };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Falha ao arquivar a publicação." };
  }
}
