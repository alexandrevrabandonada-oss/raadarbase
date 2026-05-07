"use server";

import { revalidatePath } from "next/cache";
import { requireInternalSession } from "@/lib/supabase/auth";
import { requireRole } from "@/lib/authz/roles";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { generateDailyTerritorialSnapshot, listTerritorialSnapshots } from "@/lib/data/territorial-listening-monitoring";
import { getTerritorialListeningWindowById } from "@/lib/data/territorial-listening-windows";
import { getActionPlanByReportId, updateActionPlanItem } from "@/lib/data/action-plans";
import { getNewBatchOutreachIds } from "@/lib/data/territorial-listening-outreach";
import type { Json } from "@/lib/supabase/database.types";

function getTextValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getBoolValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return value === "on" || value === "true";
}

async function syncCallOutreachPlanItemFromShared(windowId: string, actor: { id: string; email: string | null }, notes?: string | null) {
  const window = await getTerritorialListeningWindowById(windowId);
  if (!window) return;

  const plan = await getActionPlanByReportId(window.sourceReportId);
  const item = plan?.items?.find((currentItem) => currentItem.title.toLowerCase().includes("nova chamada de 30 segundos"));
  if (!item) return;

  const supabase = getSupabaseAdminClient();
  const newBatchIds = await getNewBatchOutreachIds(windowId);
  const { data: outreachRows, error: outreachError } = await supabase
    .from("territorial_listening_outreach_logs")
    .select("id,channel,status,shared_at,notes")
    .eq("window_id", windowId)
    .order("created_at", { ascending: true });

  if (outreachError) throw new Error(outreachError.message);

  const scopedRows = (outreachRows ?? []).filter((row) => newBatchIds.includes(row.id));
  const sharedRows = scopedRows.filter((row) => row.status === "shared" && row.shared_at);
  const sharedAtValues = sharedRows.map((row) => row.shared_at as string).sort((a, b) => a.localeCompare(b));

  const existingMetadata = item.metadata && typeof item.metadata === "object" && !Array.isArray(item.metadata)
    ? (item.metadata as Record<string, unknown>)
    : {};
  const existingOutreachMetadata = existingMetadata.territorial_outreach && typeof existingMetadata.territorial_outreach === "object" && !Array.isArray(existingMetadata.territorial_outreach)
    ? (existingMetadata.territorial_outreach as Record<string, unknown>)
    : {};

  const nextStatus = sharedRows.length === 0 ? "todo" : sharedRows.length === newBatchIds.length && newBatchIds.length > 0 ? "done" : "doing";
  const normalizedNotes = notes && notes.trim().length > 0
    ? notes.trim()
    : (sharedRows.find((row) => typeof row.notes === "string" && row.notes.trim().length > 0)?.notes ?? null);

  await updateActionPlanItem(item.id, {
    status: nextStatus,
    metadata: {
      ...existingMetadata,
      territorial_outreach: {
        ...existingOutreachMetadata,
        new_batch_ids: newBatchIds,
        outreach_ids: sharedRows.map((row) => row.id),
        shared_channels: Array.from(new Set(sharedRows.map((row) => row.channel))),
        first_new_batch_shared_at: sharedAtValues[0] ?? null,
        shared_at: sharedAtValues[0] ?? null,
        latest_shared_at: sharedAtValues[sharedAtValues.length - 1] ?? null,
        notes: normalizedNotes,
        updated_at: new Date().toISOString(),
      },
    },
  });

  await writeAuditLog({
    actorId: actor.id,
    actorEmail: actor.email,
    action: "action_plan.item_updated",
    entityType: "action_plan_items",
    entityId: item.id,
    summary: sharedRows.length > 0
      ? "Item da nova chamada de 30 segundos atualizado com compartilhamentos confirmados manualmente."
      : "Item da chamada de 30 segundos mantido como pendente por falta de compartilhamento confirmado.",
    metadata: {
      action_plan_id: plan?.id ?? null,
      new_batch_ids: newBatchIds,
      outreach_ids: sharedRows.map((row) => row.id),
      shared_channels: Array.from(new Set(sharedRows.map((row) => row.channel))),
      first_new_batch_shared_at: sharedAtValues[0] ?? null,
      notes: normalizedNotes,
      status: nextStatus,
    },
  });
}

async function updateWindowStatus(windowId: string, status: "closed" | "archived", action: "territorial.window_closed" | "territorial.window_archived") {
  const session = await requireInternalSession();
  await requireRole(["admin", "operador"]);

  const window = await getTerritorialListeningWindowById(windowId);
  if (!window) throw new Error("Janela territorial não encontrada.");

  const windowMetadata =
    window.metadata && typeof window.metadata === "object" && !Array.isArray(window.metadata)
      ? (window.metadata as Record<string, Json>)
      : {};

  const supabase = getSupabaseAdminClient();
  const timestamp = new Date().toISOString();
  const { error } = await supabase
    .from("territorial_listening_windows")
    .update({
      status,
      metadata: {
        ...windowMetadata,
        [`${status}_at`]: timestamp,
        [`${status}_by`]: session.email,
      } as Json,
    })
    .eq("id", windowId);

  if (error) throw new Error(`Falha ao atualizar janela territorial: ${error.message}`);

  await writeAuditLog({
    actorId: session.id,
    actorEmail: session.email,
    action,
    entityType: "territorial_listening_windows",
    entityId: windowId,
    summary: status === "closed" ? "Janela territorial fechada." : "Janela territorial arquivada.",
    metadata: {
      source_report_id: window.sourceReportId,
      action_plan_id: window.actionPlanId,
      status,
    },
  });

  revalidatePath("/escuta/bairro/admin");
  revalidatePath(`/relatorios/${window.sourceReportId}/devolutiva`);

  return { ok: true as const, message: status === "closed" ? "Janela territorial fechada." : "Janela territorial arquivada." };
}

export async function generateTerritorialDailySnapshotAction(windowId: string): Promise<void> {
  try {
    const session = await requireInternalSession();
    await requireRole(["admin", "operador"]);

    await generateDailyTerritorialSnapshot(windowId, session);

    revalidatePath("/escuta/bairro/admin");
    return;
  } catch (error) {
    throw error instanceof Error ? error : new Error("Falha ao gerar snapshot diário.");
  }
}

export async function createTerritorialOutreachLogAction(windowId: string, formData: FormData): Promise<void> {
  try {
    const session = await requireInternalSession();
    await requireRole(["admin", "operador"]);

    const window = await getTerritorialListeningWindowById(windowId);
    if (!window) throw new Error("Janela territorial não encontrada.");

    const channel = getTextValue(formData, "channel") as "instagram_story" | "instagram_feed" | "whatsapp" | "reuniao" | "outro";
    const notes = getTextValue(formData, "notes");
    const publicUrl = getTextValue(formData, "public_url") || null;

    if (!channel) throw new Error("Canal de reforço inválido.");

    const supabase = getSupabaseAdminClient();
    const latestSnapshot = (await listTerritorialSnapshots(windowId))[0] ?? null;

    const { data, error } = await supabase
      .from("territorial_listening_outreach_logs")
      .insert({
        window_id: windowId,
        channel,
        status: "planned",
        public_url: publicUrl,
        notes,
        created_by: session.id,
        created_by_email: session.email,
        metadata: {
          latest_snapshot_id: latestSnapshot?.id ?? null,
          latest_snapshot_date: latestSnapshot?.snapshotDate ?? null,
          latest_snapshot_status: latestSnapshot?.status ?? null,
        },
      })
      .select("*")
      .single();

    if (error) throw new Error(error.message);

    await writeAuditLog({
      actorId: session.id,
      actorEmail: session.email,
      action: "territorial.outreach_created",
      entityType: "territorial_listening_outreach_logs",
      entityId: data.id,
      summary: "Reforço da chamada territorial registrado como planejado.",
      metadata: {
        window_id: windowId,
        channel,
        status: "planned",
        public_url: publicUrl,
        latest_snapshot_id: latestSnapshot?.id ?? null,
      },
    });

    revalidatePath("/escuta/bairro/admin");
    return;
  } catch (error) {
    throw error instanceof Error ? error : new Error("Falha ao registrar reforço territorial.");
  }
}

export async function markTerritorialOutreachSharedAction(id: string, formData: FormData): Promise<void> {
  try {
    const session = await requireInternalSession();
    await requireRole(["admin", "operador"]);

    const manualConfirmation = getBoolValue(formData, "manual_confirmation");
    if (!manualConfirmation) {
      throw new Error("Confirme que a divulgação manual já foi publicada antes de marcar como compartilhado.");
    }

    const publicUrl = getTextValue(formData, "public_url") || null;
    const notes = getTextValue(formData, "notes") || null;

    const supabase = getSupabaseAdminClient();
    const { data: current, error: readError } = await supabase
      .from("territorial_listening_outreach_logs")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (readError) throw new Error(readError.message);
    if (!current) throw new Error("Reforço territorial não encontrado.");

    const { error } = await supabase
      .from("territorial_listening_outreach_logs")
      .update({
        status: "shared",
        shared_at: new Date().toISOString(),
        public_url: publicUrl ?? current.public_url,
        notes: notes ?? current.notes,
        metadata: {
          ...((current.metadata as Record<string, unknown> | null) ?? {}),
          shared_at: new Date().toISOString(),
        },
      })
      .eq("id", id);
    if (error) throw new Error(error.message);

    await writeAuditLog({
      actorId: session.id,
      actorEmail: session.email,
      action: "territorial.outreach_shared",
      entityType: "territorial_listening_outreach_logs",
      entityId: id,
      summary: "Reforço da chamada territorial marcado como compartilhado.",
      metadata: {
        window_id: current.window_id,
        channel: current.channel,
        public_url: publicUrl ?? current.public_url,
      },
    });

    await syncCallOutreachPlanItemFromShared(current.window_id, session, notes);

    revalidatePath("/escuta/bairro/admin");
    return;
  } catch (error) {
    throw error instanceof Error ? error : new Error("Falha ao marcar reforço como compartilhado.");
  }
}

export async function archiveTerritorialOutreachAction(id: string): Promise<void> {
  try {
    const session = await requireInternalSession();
    await requireRole(["admin", "operador"]);

    const supabase = getSupabaseAdminClient();
    const { data: current, error: readError } = await supabase
      .from("territorial_listening_outreach_logs")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (readError) throw new Error(readError.message);
    if (!current) throw new Error("Reforço territorial não encontrado.");

    const { error } = await supabase
      .from("territorial_listening_outreach_logs")
      .update({
        status: "archived",
        metadata: {
          ...((current.metadata as Record<string, unknown> | null) ?? {}),
          archived_at: new Date().toISOString(),
        },
      })
      .eq("id", id);
    if (error) throw new Error(error.message);

    await writeAuditLog({
      actorId: session.id,
      actorEmail: session.email,
      action: "territorial.outreach_archived",
      entityType: "territorial_listening_outreach_logs",
      entityId: id,
      summary: "Reforço da chamada territorial arquivado.",
      metadata: { window_id: current.window_id, channel: current.channel },
    });


    revalidatePath("/escuta/bairro/admin");
    return;
  } catch (error) {
    throw error instanceof Error ? error : new Error("Falha ao arquivar reforço territorial.");
  }
}

export async function closeTerritorialListeningWindowAction(windowId: string): Promise<void> {
  try {
    await updateWindowStatus(windowId, "closed", "territorial.window_closed");
    return;
  } catch (error) {
    throw error instanceof Error ? error : new Error("Falha ao fechar janela territorial.");
  }
}

export async function archiveTerritorialListeningWindowAction(windowId: string): Promise<void> {
  try {
    await updateWindowStatus(windowId, "archived", "territorial.window_archived");
    return;
  } catch (error) {
    throw error instanceof Error ? error : new Error("Falha ao arquivar janela territorial.");
  }
}