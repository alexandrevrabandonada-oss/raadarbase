"use server";

import { revalidatePath } from "next/cache";
import { requireInternalSession } from "@/lib/supabase/auth";
import { requireRole } from "@/lib/authz/roles";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { createIncident } from "@/lib/data/incidents";
import { 
  createActionPlan, 
  updateActionPlan, 
  createActionPlanItem, 
  updateActionPlanItem,
  suggestActionPlanFromReport
} from "@/lib/data/action-plans";
import { checkTextSafety, sanitizeActionPlanData } from "@/lib/action-plans/safety";
import type { ActionResult } from "@/app/actions";
import type { TableInsert, TableUpdate } from "@/lib/supabase/database.types";

/**
 * Helper para validar segurança de texto e disparar incidentes/logs se necessário.
 */
async function validateSafety(
  title: string, 
  description: string | null | undefined, 
  entityType: string,
  actorEmail: string,
  actorId: string
): Promise<boolean> {
  const titleSafety = checkTextSafety(title);
  const descSafety = checkTextSafety(description);

  if (!titleSafety.isSafe || !descSafety.isSafe) {
    const detected = [...new Set([...titleSafety.detectedTerms, ...descSafety.detectedTerms])];
    
    // Log de auditoria de violação
    await writeAuditLog({
      actorId,
      actorEmail,
      action: "action_plan.forbidden_term_detected",
      entityType,
      entityId: null,
      summary: `Tentativa de uso de termos proibidos: ${detected.join(", ")}`,
      metadata: { detectedTerms: detected }
    });

    // Criar incidente warning
    await createIncident({
      kind: "forbidden_term_policy_violation",
      severity: "warning",
      status: "open",
      title: "Violação de Governança: Termos Proibidos",
      description: `O usuário ${actorEmail} tentou criar/editar uma ação contendo: ${detected.join(", ")}. A ação foi bloqueada automaticamente.`,
      related_entity_type: entityType,
      actor_email: actorEmail
    });

    return false;
  }
  return true;
}

export async function createActionPlanAction(input: TableInsert<"action_plans">): Promise<ActionResult> {
  try {
    const session = await requireInternalSession();
    await requireRole(["admin", "operador", "comunicacao"]);

    const isSafe = await validateSafety(
      input.title, 
      input.description, 
      "action_plans", 
      session.email!, 
      session.id
    );
    if (!isSafe) throw new Error("O conteúdo contém termos proibidos pela política de governança.");

    const sanitizedInput = sanitizeActionPlanData({
      ...input,
      created_by: session.id,
      created_by_email: session.email
    });

    const plan = await createActionPlan(sanitizedInput);

    await writeAuditLog({
      actorId: session.id,
      actorEmail: session.email!,
      action: "action_plan.created",
      entityType: "action_plans",
      entityId: plan.id,
      summary: `Plano de ação criado: ${plan.title}`
    });

    revalidatePath("/acoes");
    return { ok: true, message: "Plano de ação criado com sucesso.", id: plan.id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Erro ao criar plano." };
  }
}

export async function updateActionPlanAction(id: string, input: TableUpdate<"action_plans">): Promise<ActionResult> {
  try {
    const session = await requireInternalSession();
    await requireRole(["admin", "operador", "comunicacao"]);

    if (input.title !== undefined || input.description !== undefined) {
      const isSafe = await validateSafety(
        input.title || "", 
        input.description, 
        "action_plans", 
        session.email!, 
        session.id
      );
      if (!isSafe) throw new Error("O conteúdo contém termos proibidos pela política de governança.");
    }

    const plan = await updateActionPlan(id, sanitizeActionPlanData(input));

    await writeAuditLog({
      actorId: session.id,
      actorEmail: session.email!,
      action: "action_plan.updated",
      entityType: "action_plans",
      entityId: id,
      summary: `Plano de ação atualizado: ${plan.title}`
    });

    revalidatePath("/acoes");
    revalidatePath(`/acoes/${id}`);
    return { ok: true, message: "Plano de ação atualizado." };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Erro ao atualizar plano." };
  }
}

export async function archiveActionPlanAction(id: string): Promise<ActionResult> {
  try {
    const session = await requireInternalSession();
    await requireRole(["admin", "operador"]);

    await updateActionPlan(id, { status: "archived" });

    await writeAuditLog({
      actorId: session.id,
      actorEmail: session.email!,
      action: "action_plan.archived",
      entityType: "action_plans",
      entityId: id,
      summary: `Plano de ação arquivado.`
    });

    revalidatePath("/acoes");
    return { ok: true, message: "Plano de ação arquivado." };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Erro ao arquivar plano." };
  }
}

export async function completeActionPlanAction(id: string): Promise<ActionResult> {
  try {
    const session = await requireInternalSession();
    await requireRole(["admin", "operador", "comunicacao"]);

    await updateActionPlan(id, { 
      status: "done", 
      completed_at: new Date().toISOString() 
    });

    await writeAuditLog({
      actorId: session.id,
      actorEmail: session.email!,
      action: "action_plan.completed",
      entityType: "action_plans",
      entityId: id,
      summary: `Plano de ação concluído.`
    });

    revalidatePath("/acoes");
    revalidatePath(`/acoes/${id}`);
    return { ok: true, message: "Plano de ação concluído." };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Erro ao concluir plano." };
  }
}

export async function createActionPlanItemAction(input: TableInsert<"action_plan_items">): Promise<ActionResult> {
  try {
    const session = await requireInternalSession();
    await requireRole(["admin", "operador", "comunicacao"]);

    const isSafe = await validateSafety(
      input.title, 
      input.description, 
      "action_plan_items", 
      session.email!, 
      session.id
    );
    if (!isSafe) throw new Error("O conteúdo contém termos proibidos pela política de governança.");

    const item = await createActionPlanItem(sanitizeActionPlanData(input));

    await writeAuditLog({
      actorId: session.id,
      actorEmail: session.email!,
      action: "action_plan.item_created",
      entityType: "action_plan_items",
      entityId: item.id,
      summary: `Item criado no plano: ${item.title}`
    });

    revalidatePath(`/acoes/${input.action_plan_id}`);
    return { ok: true, message: "Item criado com sucesso." };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Erro ao criar item." };
  }
}

export async function updateActionPlanItemAction(id: string, actionPlanId: string, input: TableUpdate<"action_plan_items">): Promise<ActionResult> {
  try {
    const session = await requireInternalSession();
    await requireRole(["admin", "operador", "comunicacao"]);

    if (input.title !== undefined || input.description !== undefined) {
      const isSafe = await validateSafety(
        input.title || "", 
        input.description, 
        "action_plan_items", 
        session.email!, 
        session.id
      );
      if (!isSafe) throw new Error("O conteúdo contém termos proibidos pela política de governança.");
    }

    const item = await updateActionPlanItem(id, sanitizeActionPlanData(input));

    await writeAuditLog({
      actorId: session.id,
      actorEmail: session.email!,
      action: "action_plan.item_updated",
      entityType: "action_plan_items",
      entityId: id,
      summary: `Item atualizado: ${item.title} (Status: ${item.status})`
    });

    revalidatePath(`/acoes/${actionPlanId}`);
    return { ok: true, message: "Item atualizado." };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Erro ao atualizar item." };
  }
}

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export async function suggestActionPlanFromReportAction(reportId: string): Promise<any> {
  try {
    await requireInternalSession();
    const suggestions = await suggestActionPlanFromReport(reportId);
    
    // Log da sugestão
    const session = await requireInternalSession();
    await writeAuditLog({
      actorId: session.id,
      actorEmail: session.email!,
      action: "action_plan.suggested_from_report",
      entityType: "mobilization_reports",
      entityId: reportId,
      summary: `Sugestões de plano geradas para o relatório: ${suggestions.reportTitle}`
    });

    return suggestions;
  } catch (error) {
    throw error;
  }
}
