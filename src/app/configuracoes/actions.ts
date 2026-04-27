"use server";

import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdminSession } from "@/lib/supabase/auth";
import type { TableUpdate } from "@/lib/supabase/database.types";

type ActionResult = { ok: true; message: string } | { ok: false; error: string };

async function updateInternalUserStatus(userId: string, nextStatus: "active" | "disabled") : Promise<ActionResult> {
  try {
    if (!userId.trim()) throw new Error("Usuário interno inválido.");
    const actor = await requireAdminSession();
    if (actor.id === userId && nextStatus === "disabled") {
      throw new Error("Você não pode desativar o seu próprio acesso por esta tela.");
    }

    const supabase = getSupabaseAdminClient();
    const payload: TableUpdate<"internal_users"> = {
      status: nextStatus,
      approved_at: nextStatus === "active" ? new Date().toISOString() : null,
      approved_by: nextStatus === "active" ? actor.id : null,
      updated_at: new Date().toISOString(),
    };

    const { data: target, error: readError } = await supabase
      .from("internal_users")
      .select("id,email,status")
      .eq("id", userId)
      .maybeSingle();
    if (readError) throw new Error(readError.message);
    if (!target) throw new Error("Usuário interno não encontrado.");

    const { error } = await supabase.from("internal_users").update(payload).eq("id", userId);
    if (error) throw new Error(error.message);

    await writeAuditLog({
      actorId: actor.id,
      actorEmail: actor.email ?? null,
      action: nextStatus === "active" ? "internal_user.approved" : "internal_user.disabled",
      entityType: "internal_users",
      entityId: userId,
      summary:
        nextStatus === "active"
          ? `Acesso interno liberado para ${target.email}.`
          : `Acesso interno desativado para ${target.email}.`,
      metadata: {
        email: target.email,
        previous_status: target.status,
        status: nextStatus,
      },
    });

    revalidatePath("/configuracoes");
    return {
      ok: true,
      message:
        nextStatus === "active"
          ? `Acesso liberado para ${target.email}.`
          : `Acesso desativado para ${target.email}.`,
    };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Falha ao atualizar usuário interno." };
  }
}

export async function approveInternalUserAction(userId: string): Promise<ActionResult> {
  return updateInternalUserStatus(userId, "active");
}

export async function disableInternalUserAction(userId: string): Promise<ActionResult> {
  return updateInternalUserStatus(userId, "disabled");
}
