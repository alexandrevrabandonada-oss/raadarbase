"use server";

import { revalidatePath } from "next/cache";
import { requireInternalSession } from "@/lib/supabase/auth";
import { requireRole } from "@/lib/authz/roles";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { 
  createActionEvidence, 
  updateActionEvidence, 
  archiveOrDeleteActionEvidence, 
  upsertActionItemResult 
} from "@/lib/data/action-execution";
import { updateActionPlanItem } from "@/lib/data/action-plans";
import { validateExecutionSafety, sanitizeExecutionInput } from "@/lib/action-execution/safety";
import type { ActionResult } from "@/app/actions";
import type { TableInsert, TableUpdate } from "@/lib/supabase/database.types";

export async function createActionEvidenceAction(
  planId: string,
  input: TableInsert<"action_item_evidence">
): Promise<ActionResult> {
  try {
    const session = await requireInternalSession();
    await requireRole(["admin", "operador", "comunicacao"]);

    const safety = await validateExecutionSafety(
      input.title,
      input.description,
      session.email!,
      session.id,
      "action_item_evidence"
    );

    if (!safety.isSafe) {
      throw new Error("Conteúdo bloqueado por conter termos proibidos.");
    }

    const sanitized = sanitizeExecutionInput({
      ...input,
      created_by: session.id,
      created_by_email: session.email
    });

    const evidence = await createActionEvidence(sanitized);

    await writeAuditLog({
      actorId: session.id,
      actorEmail: session.email!,
      action: "action_execution.evidence_created",
      entityType: "action_item_evidence",
      entityId: evidence.id,
      summary: `Evidência registrada para item ${input.action_plan_item_id}: ${evidence.title}`
    });

    revalidatePath(`/acoes/${planId}`);
    revalidatePath(`/acoes/${planId}/itens/${input.action_plan_item_id}`);
    
    return { ok: true, message: "Evidência registrada com sucesso." };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Erro ao registrar evidência." };
  }
}

export async function updateActionEvidenceAction(
  planId: string,
  itemId: string,
  id: string,
  input: TableUpdate<"action_item_evidence">
): Promise<ActionResult> {
  try {
    const session = await requireInternalSession();
    await requireRole(["admin", "operador", "comunicacao"]);

    if (input.title || input.description) {
      const safety = await validateExecutionSafety(
        input.title || "",
        input.description,
        session.email!,
        session.id,
        "action_item_evidence"
      );
      if (!safety.isSafe) throw new Error("Conteúdo bloqueado.");
    }

    const sanitized = sanitizeExecutionInput(input);
    await updateActionEvidence(id, sanitized);

    await writeAuditLog({
      actorId: session.id,
      actorEmail: session.email!,
      action: "action_execution.evidence_updated",
      entityType: "action_item_evidence",
      entityId: id,
      summary: `Evidência atualizada: ${id}`
    });

    revalidatePath(`/acoes/${planId}`);
    revalidatePath(`/acoes/${planId}/itens/${itemId}`);
    
    return { ok: true, message: "Evidência atualizada." };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Erro ao atualizar evidência." };
  }
}

export async function removeActionEvidenceAction(
  planId: string,
  itemId: string,
  id: string
): Promise<ActionResult> {
  try {
    const session = await requireInternalSession();
    await requireRole(["admin", "operador"]);

    await archiveOrDeleteActionEvidence(id);

    await writeAuditLog({
      actorId: session.id,
      actorEmail: session.email!,
      action: "action_execution.evidence_removed",
      entityType: "action_item_evidence",
      entityId: id,
      summary: `Evidência removida: ${id}`
    });

    revalidatePath(`/acoes/${planId}`);
    revalidatePath(`/acoes/${planId}/itens/${itemId}`);
    
    return { ok: true, message: "Evidência removida." };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Erro ao remover evidência." };
  }
}

export async function upsertActionItemResultAction(
  planId: string,
  input: TableInsert<"action_item_results">
): Promise<ActionResult> {
  try {
    const session = await requireInternalSession();
    await requireRole(["admin", "operador", "comunicacao"]);

    const safety = await validateExecutionSafety(
      input.result_summary,
      `${input.public_response} ${input.lessons_learned} ${input.next_step}`,
      session.email!,
      session.id,
      "action_item_results"
    );

    if (!safety.isSafe) throw new Error("Conteúdo bloqueado.");

    const sanitized = sanitizeExecutionInput({
      ...input,
      created_by: session.id,
      created_by_email: session.email
    });

    const result = await upsertActionItemResult(sanitized);

    await writeAuditLog({
      actorId: session.id,
      actorEmail: session.email!,
      action: "action_execution.result_created",
      entityType: "action_item_results",
      entityId: result.id,
      summary: `Resultado registrado para item ${input.action_plan_item_id}`
    });

    revalidatePath(`/acoes/${planId}`);
    revalidatePath(`/acoes/${planId}/itens/${input.action_plan_item_id}`);
    
    return { ok: true, message: "Resultado registrado." };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Erro ao registrar resultado." };
  }
}

export async function completeItemWithResultAction(
  planId: string,
  itemId: string,
  resultInput: TableInsert<"action_item_results">
): Promise<ActionResult> {
  try {
    const session = await requireInternalSession();
    await requireRole(["admin", "operador", "comunicacao"]);

    // 1. Registrar resultado
    const safety = await validateExecutionSafety(
      resultInput.result_summary,
      `${resultInput.public_response} ${resultInput.lessons_learned} ${resultInput.next_step}`,
      session.email!,
      session.id,
      "action_item_results"
    );
    if (!safety.isSafe) throw new Error("Conteúdo bloqueado.");

    const sanitized = sanitizeExecutionInput({
      ...resultInput,
      action_plan_item_id: itemId,
      created_by: session.id,
      created_by_email: session.email
    });

    await upsertActionItemResult(sanitized);

    // 2. Marcar item como concluído
    await updateActionPlanItem(itemId, { 
      status: "done", 
      completed_at: new Date().toISOString() 
    });

    await writeAuditLog({
      actorId: session.id,
      actorEmail: session.email!,
      action: "action_execution.item_completed_with_result",
      entityType: "action_plan_items",
      entityId: itemId,
      summary: `Item ${itemId} concluído com resultado registrado.`
    });

    revalidatePath(`/acoes/${planId}`);
    revalidatePath(`/acoes/${planId}/itens/${itemId}`);
    revalidatePath("/execucao");
    
    return { ok: true, message: "Item concluído com sucesso." };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Erro ao concluir item." };
  }
}
