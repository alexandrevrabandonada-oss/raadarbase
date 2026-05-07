"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { shouldUseMockData } from "@/lib/config";
import { requireRole } from "@/lib/authz/roles";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { requireInternalSession } from "@/lib/supabase/auth";
import type { ActionResult } from "@/app/actions";

/**
 * Retorna a lista de usuários internos ativos para distribuição de tarefas.
 */
export async function getActiveOperators() {
  await requireRole(["admin", "operador"]);
  
  if (shouldUseMockData()) {
    return [
      { id: "user-1", email: "admin@example.com", full_name: "Admin Mock", role: "admin" },
      { id: "user-2", email: "op1@example.com", full_name: "Operador 1", role: "operador" },
    ];
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("internal_users")
    .select("id, email, full_name, role")
    .eq("status", "active")
    .order("full_name");

  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * Atribui várias tarefas a um operador em lote.
 */
export async function bulkAssignTasks(taskIds: string[], internalUserId: string | null): Promise<ActionResult> {
  if (taskIds.length === 0) return { ok: true, message: "Nenhuma tarefa selecionada." };
  
  try {
    const actor = await requireInternalSession();
    await requireRole(["admin"]); // Apenas admin pode distribuir para outros em lote

    if (shouldUseMockData()) {
      return { ok: true, message: `${taskIds.length} tarefas atribuídas (Mock).` };
    }

    const supabase = getSupabaseAdminClient();
    const { error } = await supabase
      .from("outreach_tasks")
      .update({ responsible_id: internalUserId, updated_at: new Date().toISOString() })
      .in("id", taskIds);

    if (error) throw new Error(error.message);

    await writeAuditLog({
      actorId: actor.id,
      actorEmail: actor.email ?? null,
      action: "outreach_task.bulk_assigned",
      entityType: "outreach_tasks",
      entityId: null,
      summary: `${taskIds.length} tarefas atribuídas em lote.`,
      metadata: { taskIds, assignedTo: internalUserId },
    });

    revalidatePath("/abordagem");
    return { ok: true, message: `${taskIds.length} tarefas atribuídas com sucesso.` };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Falha na atribuição em lote." };
  }
}

/**
 * Distribui tarefas sem responsável igualmente entre os operadores selecionados.
 */
export async function balanceTasks(operatorIds: string[], limitPerOperator = 10): Promise<ActionResult> {
  if (operatorIds.length === 0) return { ok: false, error: "Selecione pelo menos um operador." };

  try {
    const actor = await requireInternalSession();
    await requireRole(["admin"]);

    if (shouldUseMockData()) {
      return { ok: true, message: "Balanceamento simulado concluído." };
    }

    const supabase = getSupabaseAdminClient();
    
    // 1. Buscar tarefas abertas sem responsável
    const { data: openTasks, error: fetchError } = await supabase
      .from("outreach_tasks")
      .select("id")
      .is("responsible_id", null)
      .neq("column_key", "concluido")
      .neq("column_key", "nao_abordar")
      .order("created_at", { ascending: true })
      .limit(operatorIds.length * limitPerOperator);

    if (fetchError) throw new Error(fetchError.message);
    if (!openTasks || openTasks.length === 0) return { ok: true, message: "Nenhuma tarefa pendente para balancear." };

    // 2. Distribuir entre os operadores
    let assignedCount = 0;
    for (let i = 0; i < openTasks.length; i++) {
      const operatorId = operatorIds[i % operatorIds.length];
      const taskId = openTasks[i].id;
      
      const { error: updateError } = await supabase
        .from("outreach_tasks")
        .update({ responsible_id: operatorId, updated_at: new Date().toISOString() })
        .eq("id", taskId);
      
      if (!updateError) assignedCount++;
    }

    await writeAuditLog({
      actorId: actor.id,
      actorEmail: actor.email ?? null,
      action: "outreach_task.balanced",
      entityType: "outreach_tasks",
      entityId: null,
      summary: `${assignedCount} tarefas balanceadas entre ${operatorIds.length} operadores.`,
      metadata: { operatorIds, assignedCount },
    });

    revalidatePath("/abordagem");
    return { ok: true, message: `${assignedCount} tarefas distribuídas entre os operadores.` };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Falha no balanceamento." };
  }
}
