import type { Json } from "@/lib/supabase/database.types";
import { getInfluenceClient } from "@/lib/influence/db-types";
import { normalizeImportedProfiles } from "@/lib/influence/import";

type Actor = { id: string; email: string | null };
export type ProfileUpdateProvider = (username: string) => Promise<Record<string, unknown>>;

function clampInteger(value: number | undefined, fallback: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.floor(Number.isFinite(value) ? value! : fallback)));
}

export async function enqueueStaleProfileUpdates(input: { staleDays?: number; limit?: number; concurrency?: number }, actor: Actor) {
  const staleDays = clampInteger(input.staleDays, 30, 1, 3650);
  const limit = clampInteger(input.limit, 500, 1, 10_000);
  const concurrency = clampInteger(input.concurrency, 4, 1, 20);
  const staleBefore = new Date(Date.now() - staleDays * 86_400_000).toISOString();
  const supabase = getInfluenceClient();
  const profiles = await supabase.from("instagram_profiles").select("id").lt("data_ultima_atualizacao", staleBefore).order("data_ultima_atualizacao").limit(limit);
  if (profiles.error) throw profiles.error;
  const job = await supabase.from("instagram_update_jobs").insert({ stale_before: staleBefore, requested_limit: limit, concurrency, total_items: profiles.data?.length ?? 0, created_by: actor.id }).select("*").single();
  if (job.error) throw job.error;
  if (profiles.data?.length) {
    const queued = await supabase.from("instagram_update_queue").insert(profiles.data.map((profile) => ({ job_id: job.data.id, profile_id: profile.id })));
    if (queued.error) throw queued.error;
  }
  await supabase.from("instagram_processing_logs").insert({ job_id: job.data.id, level: "info", event: "job.queued", message: `${profiles.data?.length ?? 0} perfis desatualizados adicionados à fila.`, metadata: { staleBefore, concurrency } });
  return job.data;
}

async function runWithConcurrency<T>(items: T[], concurrency: number, worker: (item: T) => Promise<void>) {
  let cursor = 0;
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const item = items[cursor];
      cursor += 1;
      await worker(item);
    }
  });
  await Promise.all(runners);
}

export async function processInfluenceUpdateJob(jobId: string, provider: ProfileUpdateProvider, workerId = crypto.randomUUID()) {
  const supabase = getInfluenceClient();
  const job = await supabase.from("instagram_update_jobs").select("*").eq("id", jobId).single();
  if (job.error) throw job.error;
  await supabase.from("instagram_update_jobs").update({ status: "processing", started_at: job.data.started_at ?? new Date().toISOString() }).eq("id", jobId);
  const queue = await supabase.from("instagram_update_queue").select("*").eq("job_id", jobId).in("status", ["pending", "failed"]).lte("next_attempt_at", new Date().toISOString()).order("id").limit(job.data.requested_limit);
  if (queue.error) throw queue.error;
  let completed = 0;
  let failed = 0;

  await runWithConcurrency(queue.data ?? [], job.data.concurrency, async (item) => {
    const claim = await supabase.from("instagram_update_queue").update({ status: "processing", locked_at: new Date().toISOString(), locked_by: workerId, attempts: item.attempts + 1 }).eq("id", item.id).in("status", ["pending", "failed"]).select("id").maybeSingle();
    if (claim.error || !claim.data) return;
    const profile = await supabase.from("instagram_profiles").select("*").eq("id", item.profile_id).single();
    if (profile.error) throw profile.error;
    try {
      const raw = await provider(profile.data.username);
      const normalized = await normalizeImportedProfiles([{ ...raw, username: profile.data.username }]);
      const update = normalized.profiles[0];
      if (!update) throw new Error("Fonte permitida não retornou um perfil válido.");
      const history = await supabase.from("instagram_profile_history").insert({ profile_id: profile.data.id, snapshot: profile.data as unknown as Json, changed_fields: Object.keys(update), reason: "atualizacao_incremental" });
      if (history.error) throw history.error;
      const saved = await supabase.from("instagram_profiles").update(update).eq("id", profile.data.id);
      if (saved.error) throw saved.error;
      await supabase.from("instagram_update_queue").update({ status: "completed", locked_at: null, locked_by: null, last_error: null }).eq("id", item.id);
      await supabase.from("instagram_processing_logs").insert({ job_id: jobId, profile_id: profile.data.id, level: "info", event: "profile.updated", message: `@${profile.data.username} atualizado por fonte permitida.` });
      completed += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message.slice(0, 1000) : "Erro desconhecido.";
      const exhausted = item.attempts + 1 >= item.max_attempts;
      const delayMinutes = 2 ** Math.min(item.attempts + 1, 8);
      await supabase.from("instagram_update_queue").update({ status: "failed", locked_at: null, locked_by: null, last_error: message, next_attempt_at: new Date(Date.now() + delayMinutes * 60_000).toISOString() }).eq("id", item.id);
      await supabase.from("instagram_processing_logs").insert({ job_id: jobId, profile_id: profile.data.id, level: exhausted ? "error" : "warning", event: exhausted ? "profile.exhausted" : "profile.retry_scheduled", message, metadata: { attempt: item.attempts + 1, maxAttempts: item.max_attempts, delayMinutes } });
      failed += 1;
    }
  });

  const remaining = await supabase.from("instagram_update_queue").select("id", { count: "exact", head: true }).eq("job_id", jobId).in("status", ["pending", "failed"]);
  if (remaining.error) throw remaining.error;
  const done = (remaining.count ?? 0) === 0 || (queue.data ?? []).every((item) => item.attempts + 1 >= item.max_attempts);
  const status = done ? (failed > 0 ? "completed_with_errors" : "completed") : "processing";
  const updatedJob = await supabase.from("instagram_update_jobs").update({ status, completed_items: job.data.completed_items + completed, failed_items: job.data.failed_items + failed, completed_at: done ? new Date().toISOString() : null }).eq("id", jobId).select("*").single();
  if (updatedJob.error) throw updatedJob.error;
  return updatedJob.data;
}

export function createAllowedHttpUpdateProvider(endpoint: string, apiKey?: string): ProfileUpdateProvider {
  return async (username) => {
    const url = new URL(endpoint);
    url.searchParams.set("username", username);
    const response = await fetch(url, { headers: apiKey ? { authorization: `Bearer ${apiKey}` } : undefined, signal: AbortSignal.timeout(10_000) });
    if (!response.ok) throw new Error(`Fonte permitida respondeu HTTP ${response.status}.`);
    const body: unknown = await response.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Resposta inválida da fonte permitida.");
    return body as Record<string, unknown>;
  };
}

