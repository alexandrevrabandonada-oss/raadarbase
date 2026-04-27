"use server";

import { revalidatePath } from "next/cache";
import { requireInternalSession } from "@/lib/supabase/auth";
import {
  getLatestMetaSyncRuns,
  syncInstagramAccountSnapshot,
  syncInstagramComments,
  syncInstagramMedia,
} from "@/lib/meta/sync";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ActionResult } from "@/app/actions";

function toActionResult(result: { ok: boolean; message: string }): ActionResult {
  return result.ok ? { ok: true, message: result.message } : { ok: false, error: result.message };
}

async function actor() {
  const user = await requireInternalSession();
  return { actorId: user.id, actorEmail: user.email ?? null };
}

export async function syncMetaAccountSnapshotAction(): Promise<ActionResult> {
  try {
    const result = await syncInstagramAccountSnapshot(await actor());
    revalidatePath("/integracoes/meta");
    revalidatePath("/configuracoes");
    return toActionResult(result);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Falha ao sincronizar conta." };
  }
}

export async function syncMetaMediaAction(): Promise<ActionResult> {
  try {
    const result = await syncInstagramMedia(await actor());
    revalidatePath("/integracoes/meta");
    revalidatePath("/dashboard");
    return toActionResult(result);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Falha ao sincronizar posts." };
  }
}

export async function syncMetaRecentCommentsAction(): Promise<ActionResult> {
  try {
    const syncActor = await actor();
    const supabase = getSupabaseAdminClient();
    const { data: posts, error } = await supabase
      .from("ig_posts")
      .select("id")
      .not("synced_at", "is", null)
      .order("published_at", { ascending: false })
      .limit(Number(process.env.META_SYNC_MAX_MEDIA ?? 25));
    if (error) throw new Error(error.message);
    if (!posts?.length) return { ok: false, error: "Nenhum post sincronizado para buscar comentários." };

    let failures = 0;
    let synced = 0;
    for (const post of posts) {
      const result = await syncInstagramComments(syncActor, post.id);
      if (result.ok) synced += 1;
      else failures += 1;
    }
    revalidatePath("/integracoes/meta");
    revalidatePath("/pessoas");
    revalidatePath("/dashboard");
    return failures
      ? { ok: false, error: `Comentários sincronizados com ${failures} falha(s) parcial(is).` }
      : { ok: true, message: `Comentários sincronizados em ${synced} post(s).` };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Falha ao sincronizar comentários." };
  }
}

export async function getMetaSyncRunsForPage() {
  await requireInternalSession();
  return getLatestMetaSyncRuns();
}
