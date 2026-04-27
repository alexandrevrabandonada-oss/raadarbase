"use server";

import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireInternalSession } from "@/lib/supabase/auth";
import {
  syncInstagramAccountSnapshot,
  syncInstagramComments,
  syncInstagramMedia,
  type SyncActor,
} from "@/lib/meta/sync";
import type { Json, TableRow } from "@/lib/supabase/database.types";

type ActionResult = { ok: true; message: string } | { ok: false; error: string };

const MANUAL_FAILURE_MESSAGE = "Marcada manualmente como falha por operador interno";

async function actor(): Promise<SyncActor> {
  const user = await requireInternalSession();
  return { actorId: user.id, actorEmail: user.email ?? null };
}

function getRetryPostId(run: TableRow<"meta_sync_runs">) {
  const metadata = run.metadata;
  if (metadata && typeof metadata === "object" && !Array.isArray(metadata) && "post_id" in metadata) {
    const postId = metadata.post_id;
    return typeof postId === "string" ? postId : null;
  }
  return null;
}

export async function markSyncRunAsFailedAction(runId: string): Promise<ActionResult> {
  try {
    if (!runId.trim()) throw new Error("Sincronização inválida.");
    const internalActor = await actor();
    const supabase = getSupabaseAdminClient();
    const { data: run, error: readError } = await supabase
      .from("meta_sync_runs")
      .select("*")
      .eq("id", runId)
      .maybeSingle();
    if (readError) throw new Error(readError.message);
    if (!run) throw new Error("Sincronização não encontrada.");
    if (run.status !== "started") throw new Error("Somente sincronização em andamento pode ser marcada como falha.");

    const { error } = await supabase
      .from("meta_sync_runs")
      .update({
        status: "error",
        finished_at: new Date().toISOString(),
        error_message: MANUAL_FAILURE_MESSAGE,
      })
      .eq("id", runId);
    if (error) throw new Error(error.message);

    await writeAuditLog({
      actorId: internalActor.actorId,
      actorEmail: internalActor.actorEmail,
      action: "meta.sync_marked_failed",
      entityType: "meta_sync",
      entityId: runId,
      summary: MANUAL_FAILURE_MESSAGE,
      metadata: { kind: run.kind },
    });
    revalidatePath("/operacao");
    revalidatePath(`/operacao/sync/${runId}`);
    return { ok: true, message: MANUAL_FAILURE_MESSAGE };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Falha ao marcar sincronização." };
  }
}

export async function retryMetaSyncRunAction(runId: string): Promise<ActionResult> {
  try {
    if (!runId.trim()) throw new Error("Sincronização inválida.");
    const internalActor = await actor();
    const supabase = getSupabaseAdminClient();
    const { data: run, error } = await supabase
      .from("meta_sync_runs")
      .select("*")
      .eq("id", runId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!run) throw new Error("Sincronização não encontrada.");

    let result;
    if (run.kind === "meta.account_snapshot") {
      result = await syncInstagramAccountSnapshot(internalActor, { retryOf: runId });
    } else if (run.kind === "meta.media") {
      result = await syncInstagramMedia(internalActor, { retryOf: runId });
    } else if (run.kind === "meta.comments") {
      const postId = getRetryPostId(run);
      if (!postId) throw new Error("Run de comentários sem post_id em metadata. Reprocessamento bloqueado.");
      result = await syncInstagramComments(internalActor, postId, { retryOf: runId });
    } else {
      throw new Error("Tipo de sincronização não suportado para reprocessamento.");
    }

    await writeAuditLog({
      actorId: internalActor.actorId,
      actorEmail: internalActor.actorEmail,
      action: "meta.sync_retried",
      entityType: "meta_sync",
      entityId: runId,
      summary: "Sincronização reprocessada manualmente com segurança.",
      metadata: { retry_of: runId, kind: run.kind, result: result as unknown as Json },
    });
    revalidatePath("/operacao");
    revalidatePath(`/operacao/sync/${runId}`);
    return result.ok
      ? { ok: true, message: "Reprocessamento executado." }
      : { ok: false, error: result.message };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Falha ao reprocessar sincronização." };
  }
}
