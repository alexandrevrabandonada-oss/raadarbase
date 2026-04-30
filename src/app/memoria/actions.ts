"use server";

import { revalidatePath } from "next/cache";
import { requireInternalSession } from "@/lib/supabase/auth";
import { requireRole } from "@/lib/authz/roles";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { 
  createStrategicMemory, 
  updateStrategicMemory, 
  archiveStrategicMemory,
  linkMemoryToEntity,
  unlinkMemoryEntity,
  suggestMemoriesFromResults
} from "@/lib/data/strategic-memory";
import { 
  validateMemoryInput, 
  sanitizeMemoryInputObject 
} from "@/lib/strategic-memory/safety";
import type { ActionResult } from "@/app/actions";
import type { TableInsert, TableUpdate } from "@/lib/supabase/database.types";

export async function createStrategicMemoryAction(input: TableInsert<"strategic_memories">): Promise<ActionResult> {
  try {
    const session = await requireInternalSession();
    await requireRole(["admin", "operador", "comunicacao"]);

    const safety = await validateMemoryInput(
      input.title,
      input.summary,
      session.email!,
      session.id
    );

    if (!safety.isSafe) {
      throw new Error("O conteúdo contém termos proibidos pela política de governança.");
    }

    const sanitizedInput = sanitizeMemoryInputObject({
      ...input,
      created_by: session.id,
      created_by_email: session.email
    });

    const memory = await createStrategicMemory(sanitizedInput);

    await writeAuditLog({
      actorId: session.id,
      actorEmail: session.email!,
      action: "strategic_memory.created",
      entityType: "strategic_memories",
      entityId: memory.id,
      summary: `Memória estratégica criada: ${memory.title}`
    });

    revalidatePath("/memoria");
    return { ok: true, message: "Memória estratégica criada com sucesso.", id: memory.id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Erro ao criar memória." };
  }
}

export async function updateStrategicMemoryAction(id: string, input: TableUpdate<"strategic_memories">): Promise<ActionResult> {
  try {
    const session = await requireInternalSession();
    await requireRole(["admin", "operador", "comunicacao"]);

    if (input.title !== undefined || input.summary !== undefined) {
      const safety = await validateMemoryInput(
        input.title || "",
        input.summary || "",
        session.email!,
        session.id
      );
      if (!safety.isSafe) throw new Error("O conteúdo contém termos proibidos pela política de governança.");
    }

    const memory = await updateStrategicMemory(id, sanitizeMemoryInputObject(input));

    await writeAuditLog({
      actorId: session.id,
      actorEmail: session.email!,
      action: "strategic_memory.updated",
      entityType: "strategic_memories",
      entityId: id,
      summary: `Memória estratégica atualizada: ${memory.title}`
    });

    revalidatePath("/memoria");
    revalidatePath(`/memoria/${id}`);
    return { ok: true, message: "Memória estratégica atualizada." };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Erro ao atualizar memória." };
  }
}

export async function archiveStrategicMemoryAction(id: string): Promise<ActionResult> {
  try {
    const session = await requireInternalSession();
    await requireRole(["admin", "operador"]);

    await archiveStrategicMemory(id);

    await writeAuditLog({
      actorId: session.id,
      actorEmail: session.email!,
      action: "strategic_memory.archived",
      entityType: "strategic_memories",
      entityId: id,
      summary: `Memória estratégica arquivada.`
    });

    revalidatePath("/memoria");
    return { ok: true, message: "Memória estratégica arquivada." };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Erro ao arquivar memória." };
  }
}

export async function linkStrategicMemoryAction(memoryId: string, entityType: string, entityId: string): Promise<ActionResult> {
  try {
    const session = await requireInternalSession();
    await requireRole(["admin", "operador", "comunicacao"]);

    await linkMemoryToEntity(memoryId, entityType, entityId);

    await writeAuditLog({
      actorId: session.id,
      actorEmail: session.email!,
      action: "strategic_memory.linked",
      entityType: "strategic_memories",
      entityId: memoryId,
      summary: `Vínculo criado: ${entityType} -> ${entityId}`,
      metadata: { entityType, entityId }
    });

    revalidatePath(`/memoria/${memoryId}`);
    return { ok: true, message: "Vínculo criado com sucesso." };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Erro ao criar vínculo." };
  }
}

export async function unlinkStrategicMemoryAction(memoryId: string, entityType: string, entityId: string): Promise<ActionResult> {
  try {
    const session = await requireInternalSession();
    await requireRole(["admin", "operador", "comunicacao"]);

    await unlinkMemoryEntity(memoryId, entityType, entityId);

    await writeAuditLog({
      actorId: session.id,
      actorEmail: session.email!,
      action: "strategic_memory.unlinked",
      entityType: "strategic_memories",
      entityId: memoryId,
      summary: `Vínculo removido: ${entityType} -> ${entityId}`,
      metadata: { entityType, entityId }
    });

    revalidatePath(`/memoria/${memoryId}`);
    return { ok: true, message: "Vínculo removido." };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Erro ao remover vínculo." };
  }
}

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export async function suggestStrategicMemoriesAction(filters?: any): Promise<any> {
  try {
    const session = await requireInternalSession();
    const suggestions = await suggestMemoriesFromResults(filters);
    
    await writeAuditLog({
      actorId: session.id,
      actorEmail: session.email!,
      action: "strategic_memory.suggested_from_results",
      entityType: "strategic_memories",
      entityId: null,
      summary: `Sugestões de memória geradas a partir de resultados.`,
      metadata: { filters, suggestionCount: suggestions.length }
    });

    return suggestions;
  } catch (error) {
    throw error;
  }
}
