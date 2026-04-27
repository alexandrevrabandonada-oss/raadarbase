import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { isMetaConfigured, metaGet, redactMetaMessage } from "@/lib/meta/client";
import type { Json, TableInsert, TableUpdate } from "@/lib/supabase/database.types";

export type SyncActor = {
  actorId: string | null;
  actorEmail: string | null;
};

export type SyncResult = {
  ok: boolean;
  message: string;
  inserted: number;
  updated: number;
  skipped: number;
  metadata?: Json;
};

type SyncOptions = {
  retryOf?: string;
};

type Media = {
  id: string;
  caption?: string;
  media_type?: string;
  media_url?: string;
  permalink?: string;
  timestamp?: string;
  like_count?: number;
  comments_count?: number;
};

type Comment = {
  id: string;
  text?: string;
  username?: string;
  timestamp?: string;
};

type Paged<T> = {
  data?: T[];
};

type AccountSnapshot = {
  username?: string;
  name?: string;
  followers_count?: number;
  media_count?: number;
};

function getLimit(name: "META_SYNC_MAX_MEDIA" | "META_SYNC_MAX_COMMENTS_PER_MEDIA", fallback: number) {
  const value = Number(process.env[name] ?? fallback);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

async function startRun(actor: SyncActor, kind: string, metadata: Json = {}) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("meta_sync_runs")
    .insert({
      actor_id: actor.actorId,
      actor_email: actor.actorEmail,
      kind,
      status: "started",
      metadata,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id;
}

async function finishRun(
  runId: string,
  status: "success" | "error",
  counts: { inserted: number; updated: number; skipped: number },
  metadata: Json = {},
  errorMessage: string | null = null,
) {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("meta_sync_runs")
    .update({
      status,
      finished_at: new Date().toISOString(),
      inserted_count: counts.inserted,
      updated_count: counts.updated,
      skipped_count: counts.skipped,
      error_message: errorMessage,
      metadata,
    })
    .eq("id", runId);
  if (error) throw new Error(error.message);
}

export async function hasRunningMetaSync(kind: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("meta_sync_runs")
    .select("id")
    .eq("kind", kind)
    .eq("status", "started")
    .limit(1);
  if (error) throw new Error(error.message);
  return Boolean(data?.length);
}

async function guard(kind: string) {
  if (!isMetaConfigured()) {
    throw new Error("Integração Meta não configurada.");
  }
  if (await hasRunningMetaSync(kind)) {
    throw new Error("Já existe uma sincronização deste tipo em andamento.");
  }
}

export async function getLatestMetaSyncRuns() {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("meta_sync_runs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(10);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getMetaDashboardStats() {
  const supabase = getSupabaseAdminClient();
  const [latest, posts, comments, people] = await Promise.all([
    supabase.from("meta_sync_runs").select("*").order("started_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("ig_posts").select("id", { count: "exact", head: true }).not("synced_at", "is", null),
    supabase.from("ig_interactions").select("id", { count: "exact", head: true }).not("synced_at", "is", null),
    supabase.from("ig_people").select("id", { count: "exact", head: true }).not("synced_at", "is", null),
  ]);
  return {
    latest: latest.data,
    posts: posts.count ?? 0,
    comments: comments.count ?? 0,
    people: people.count ?? 0,
  };
}

export async function syncInstagramMedia(actor: SyncActor, options: SyncOptions = {}): Promise<SyncResult> {
  const kind = "meta.media";
  await guard(kind);
  const baseMetadata = options.retryOf ? { retry_of: options.retryOf } : {};
  const runId = await startRun(actor, kind, baseMetadata);
  const counts = { inserted: 0, updated: 0, skipped: 0 };

  try {
    const media = await metaGet<Paged<Media>>(`${process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID}/media`, {
      fields: "id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count",
      limit: getLimit("META_SYNC_MAX_MEDIA", 25),
    });
    if (!media.ok) throw new Error(media.message);

    const supabase = getSupabaseAdminClient();
    for (const item of media.data.data ?? []) {
      const { data: existing } = await supabase.from("ig_posts").select("id").eq("instagram_post_id", item.id).maybeSingle();
      const payload: TableInsert<"ig_posts"> & TableUpdate<"ig_posts"> = {
        instagram_post_id: item.id,
        caption: item.caption ?? null,
        media_type: item.media_type ?? null,
        permalink: item.permalink ?? null,
        published_at: item.timestamp ?? null,
        metrics: {
          interactions: (item.like_count ?? 0) + (item.comments_count ?? 0),
          comments: item.comments_count ?? 0,
          mobilizationScore: item.comments_count ?? 0,
          topic: "instagram",
          like_count: item.like_count ?? 0,
          comments_count: item.comments_count ?? 0,
        },
        raw: item as unknown as Json,
        synced_at: new Date().toISOString(),
      };
      const { error } = existing
        ? await supabase.from("ig_posts").update(payload).eq("id", existing.id)
        : await supabase.from("ig_posts").insert(payload);
      if (error) throw new Error(error.message);
      if (existing) counts.updated += 1;
      else counts.inserted += 1;
    }

    await finishRun(runId, "success", counts, { ...baseMetadata, read: media.data.data?.length ?? 0 });
    await writeAuditLog({
      actorId: actor.actorId,
      actorEmail: actor.actorEmail,
      action: "meta.media_synced",
      entityType: "meta_sync",
      entityId: runId,
      summary: "Sincronização manual de mídias do Instagram",
      metadata: { ...baseMetadata, ...counts, read: media.data.data?.length ?? 0 },
    });
    return { ok: true, message: "Mídias sincronizadas.", ...counts };
  } catch (error) {
    const message = redactMetaMessage(error instanceof Error ? error.message : "Falha ao sincronizar mídias.");
    await finishRun(runId, "error", counts, baseMetadata, message);
    await writeAuditLog({
      actorId: actor.actorId,
      actorEmail: actor.actorEmail,
      action: "meta.media_synced",
      entityType: "meta_sync",
      entityId: runId,
      summary: "Falha na sincronização manual de mídias do Instagram",
      metadata: { ...baseMetadata, error: message },
    });
    return { ok: false, message, ...counts };
  }
}

export async function syncInstagramComments(
  actor: SyncActor,
  internalPostId: string,
  options: SyncOptions = {},
): Promise<SyncResult> {
  const kind = "meta.comments";
  await guard(kind);
  const baseMetadata = options.retryOf ? { retry_of: options.retryOf } : {};
  const runId = await startRun(actor, kind, baseMetadata);
  const counts = { inserted: 0, updated: 0, skipped: 0 };
  const supabase = getSupabaseAdminClient();

  try {
    const { data: post, error: postError } = await supabase
      .from("ig_posts")
      .select("*")
      .eq("id", internalPostId)
      .maybeSingle();
    if (postError) throw new Error(postError.message);
    if (!post) throw new Error("Post interno não encontrado.");

    const comments = await metaGet<Paged<Comment>>(`${post.instagram_post_id}/comments`, {
      fields: "id,text,username,timestamp",
      limit: getLimit("META_SYNC_MAX_COMMENTS_PER_MEDIA", 50),
    });
    if (!comments.ok) throw new Error(comments.message);

    for (const comment of comments.data.data ?? []) {
      if (!comment.username) {
        counts.skipped += 1;
        continue;
      }
      const now = new Date().toISOString();
      const { data: existingPerson } = await supabase
        .from("ig_people")
        .select("id,total_interactions,themes")
        .eq("username", comment.username)
        .maybeSingle();
      const nextThemes = Array.from(new Set([...(existingPerson?.themes ?? []), "instagram_comment"]));
      const personPayload = {
        total_interactions: existingPerson ? existingPerson.total_interactions + 1 : 1,
        themes: nextThemes,
        last_interaction_at: comment.timestamp ?? now,
        raw: comment as unknown as Json,
        synced_at: now,
      };
      const personResult = existingPerson
        ? await supabase.from("ig_people").update(personPayload).eq("id", existingPerson.id).select("id").single()
        : await supabase
            .from("ig_people")
            .insert({
              username: comment.username,
              display_name: comment.username,
              status: "novo",
              ...personPayload,
            })
            .select("id")
            .single();
      if (personResult.error) throw new Error(personResult.error.message);

      const { data: existingInteraction } = await supabase
        .from("ig_interactions")
        .select("id")
        .eq("external_id", comment.id)
        .maybeSingle();
      if (existingInteraction) {
        counts.skipped += 1;
        continue;
      }
      const interactionPayload: TableInsert<"ig_interactions"> = {
        external_id: comment.id,
        instagram_interaction_id: comment.id,
        person_id: personResult.data.id,
        post_id: post.id,
        type: "comentario",
        text_content: comment.text ?? "",
        theme: "instagram_comment",
        occurred_at: comment.timestamp ?? now,
        raw_payload: comment as unknown as Json,
        raw: comment as unknown as Json,
        synced_at: now,
      };
      const { error } = await supabase.from("ig_interactions").insert(interactionPayload);
      if (error) throw new Error(error.message);
      counts.inserted += 1;
    }

    await finishRun(runId, "success", counts, { ...baseMetadata, post_id: internalPostId });
    await writeAuditLog({
      actorId: actor.actorId,
      actorEmail: actor.actorEmail,
      action: "meta.comments_synced",
      entityType: "ig_post",
      entityId: internalPostId,
      summary: "Sincronização manual de comentários do Instagram",
      metadata: { ...baseMetadata, ...counts, run_id: runId },
    });
    return { ok: true, message: "Comentários sincronizados.", ...counts };
  } catch (error) {
    const message = redactMetaMessage(error instanceof Error ? error.message : "Falha ao sincronizar comentários.");
    await finishRun(runId, "error", counts, { ...baseMetadata, post_id: internalPostId }, message);
    await writeAuditLog({
      actorId: actor.actorId,
      actorEmail: actor.actorEmail,
      action: "meta.comments_synced",
      entityType: "ig_post",
      entityId: internalPostId,
      summary: "Falha na sincronização manual de comentários do Instagram",
      metadata: { ...baseMetadata, error: message, run_id: runId },
    });
    return { ok: false, message, ...counts };
  }
}

export async function syncInstagramAccountSnapshot(
  actor: SyncActor,
  options: SyncOptions = {},
): Promise<SyncResult> {
  const kind = "meta.account_snapshot";
  await guard(kind);
  const baseMetadata = options.retryOf ? { retry_of: options.retryOf } : {};
  const runId = await startRun(actor, kind, baseMetadata);
  const counts = { inserted: 0, updated: 0, skipped: 0 };

  try {
    const snapshot = await metaGet<AccountSnapshot>(`${process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID}`, {
      fields: "username,name,followers_count,media_count",
    });
    if (!snapshot.ok) throw new Error(snapshot.message);

    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.from("meta_account_snapshots").insert({
      username: snapshot.data.username ?? null,
      name: snapshot.data.name ?? null,
      followers_count: snapshot.data.followers_count ?? null,
      media_count: snapshot.data.media_count ?? null,
      raw: snapshot.data as unknown as Json,
    });
    if (error) throw new Error(error.message);
    counts.inserted = 1;

    await finishRun(runId, "success", counts, { ...baseMetadata, username: snapshot.data.username ?? null });
    await writeAuditLog({
      actorId: actor.actorId,
      actorEmail: actor.actorEmail,
      action: "meta.account_snapshot_synced",
      entityType: "meta_sync",
      entityId: runId,
      summary: "Sincronização manual de dados básicos da conta Instagram",
      metadata: { ...baseMetadata, username: snapshot.data.username ?? null },
    });
    return { ok: true, message: "Dados da conta sincronizados.", ...counts };
  } catch (error) {
    const message = redactMetaMessage(error instanceof Error ? error.message : "Falha ao sincronizar conta.");
    await finishRun(runId, "error", counts, baseMetadata, message);
    await writeAuditLog({
      actorId: actor.actorId,
      actorEmail: actor.actorEmail,
      action: "meta.account_snapshot_synced",
      entityType: "meta_sync",
      entityId: runId,
      summary: "Falha na sincronização manual de dados básicos da conta Instagram",
      metadata: { ...baseMetadata, error: message },
    });
    return { ok: false, message, ...counts };
  }
}
