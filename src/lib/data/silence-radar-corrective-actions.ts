import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { shouldUseMockData } from "@/lib/config";
import type { TableRow, TableInsert, Json } from "@/lib/supabase/database.types";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CorrectiveActionRow = TableRow<"silence_radar_corrective_actions">;

export type CorrectiveActionKind =
  | "reforco_bairro"
  | "explicacao_pauta"
  | "pergunta_publica"
  | "roda_escuta"
  | "card_explicativo";

export type CorrectiveActionTargetType = "bairro" | "pauta" | "post" | "janela";

export type CorrectiveActionStatus = "planned" | "doing" | "done" | "archived";

export type CreateCorrectiveActionInput = {
  actionPlanItemId?: string | null;
  kind: CorrectiveActionKind;
  targetType: CorrectiveActionTargetType;
  targetLabel: string;
  sourceMetric: string;
  baselineValue?: number | null;
  baselineSnapshot?: Record<string, unknown>;
  createdBy?: string | null;
  createdByEmail?: string | null;
  metadata?: Record<string, unknown>;
};

export type CorrectiveActionImpact = {
  actionId: string;
  targetType: CorrectiveActionTargetType;
  targetLabel: string;
  kind: CorrectiveActionKind;
  baselineValue: number | null;
  baselineSnapshot: Json;
  currentReportCount: number;
  currentFormCount: number;
  currentCommentCount: number;
  deltaReports: number | null;
  deltaForms: number | null;
  deltaComments: number | null;
};

// ─── Dedup key ────────────────────────────────────────────────────────────────

/**
 * Builds a compound dedup key so we can detect existing open actions for the
 * same (kind, target_type, target_label) combination before creating a new one.
 */
export function correctiveActionDedupKey(
  kind: CorrectiveActionKind,
  targetType: CorrectiveActionTargetType,
  targetLabel: string,
): string {
  return `${kind}|${targetType}|${targetLabel.trim().toLowerCase()}`;
}

// ─── List ─────────────────────────────────────────────────────────────────────

export async function listSilenceRadarCorrectiveActions(opts?: {
  status?: CorrectiveActionStatus;
  targetType?: CorrectiveActionTargetType;
}): Promise<CorrectiveActionRow[]> {
  if (shouldUseMockData()) return [];

  const supabase = getSupabaseAdminClient();
  let query = supabase
    .from("silence_radar_corrective_actions")
    .select("*")
    .order("created_at", { ascending: false });

  if (opts?.status) query = query.eq("status", opts.status);
  if (opts?.targetType) query = query.eq("target_type", opts.targetType);

  const { data, error } = await query;
  if (error) throw new Error(`Falha ao listar ações corretivas: ${error.message}`);
  return data ?? [];
}

export async function getSilenceRadarCorrectiveActionById(id: string): Promise<CorrectiveActionRow | null> {
  if (shouldUseMockData()) return null;

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("silence_radar_corrective_actions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Falha ao carregar ação corretiva: ${error.message}`);
  return data ?? null;
}

// ─── Active set (for dedup) ───────────────────────────────────────────────────

/**
 * Returns a Set of dedup keys for all non-archived corrective actions.
 * Used to detect duplicates before creating a new action.
 */
export async function getActiveCorrectiveActionKeys(): Promise<Set<string>> {
  if (shouldUseMockData()) return new Set();

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("silence_radar_corrective_actions")
    .select("kind, target_type, target_label")
    .neq("status", "archived");

  if (error) throw new Error(`Falha ao carregar chaves de ações: ${error.message}`);

  const keys = new Set<string>();
  for (const row of data ?? []) {
    keys.add(correctiveActionDedupKey(
      row.kind as CorrectiveActionKind,
      row.target_type as CorrectiveActionTargetType,
      row.target_label,
    ));
  }
  return keys;
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createCorrectiveActionFromRadarFinding(
  input: CreateCorrectiveActionInput,
): Promise<CorrectiveActionRow> {
  if (shouldUseMockData()) {
    return {
      id: "mock-id",
      action_plan_item_id: input.actionPlanItemId ?? null,
      kind: input.kind,
      target_type: input.targetType,
      target_label: input.targetLabel,
      source_metric: input.sourceMetric,
      baseline_value: input.baselineValue ?? null,
      baseline_snapshot: (input.baselineSnapshot ?? {}) as Json,
      status: "planned",
      created_by: input.createdBy ?? null,
      created_by_email: input.createdByEmail ?? null,
      created_at: new Date().toISOString(),
      completed_at: null,
      metadata: (input.metadata ?? {}) as Json,
    };
  }

  const supabase = getSupabaseAdminClient();

  const insert: TableInsert<"silence_radar_corrective_actions"> = {
    action_plan_item_id: input.actionPlanItemId ?? null,
    kind: input.kind,
    target_type: input.targetType,
    target_label: input.targetLabel,
    source_metric: input.sourceMetric,
    baseline_value: input.baselineValue ?? null,
    baseline_snapshot: (input.baselineSnapshot ?? {}) as Json,
    status: "planned",
    created_by: input.createdBy ?? null,
    created_by_email: input.createdByEmail ?? null,
    metadata: (input.metadata ?? {}) as Json,
  };

  const { data, error } = await supabase
    .from("silence_radar_corrective_actions")
    .insert(insert)
    .select()
    .single();

  if (error) throw new Error(`Falha ao criar ação corretiva: ${error.message}`);
  return data;
}

// ─── Complete ─────────────────────────────────────────────────────────────────

export async function completeCorrectiveAction(id: string): Promise<CorrectiveActionRow> {
  if (shouldUseMockData()) {
    return { id } as unknown as CorrectiveActionRow;
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("silence_radar_corrective_actions")
    .update({ status: "done", completed_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`Falha ao concluir ação corretiva: ${error.message}`);
  return data;
}

// ─── Archive ──────────────────────────────────────────────────────────────────

export async function archiveCorrectiveAction(id: string): Promise<CorrectiveActionRow> {
  if (shouldUseMockData()) {
    return { id } as unknown as CorrectiveActionRow;
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("silence_radar_corrective_actions")
    .update({ status: "archived" })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`Falha ao arquivar ação corretiva: ${error.message}`);
  return data;
}

// ─── Impact (aggregate before/after) ─────────────────────────────────────────

/**
 * Computes aggregate before/after impact for a single corrective action.
 * Compares baseline_snapshot values against current aggregate counts.
 * Never touches individual records — only counts by bairro/pauta/topic.
 */
export async function getCorrectiveActionImpact(
  actionId: string,
): Promise<CorrectiveActionImpact | null> {
  if (shouldUseMockData()) return null;

  const supabase = getSupabaseAdminClient();

  const { data: action, error: actionErr } = await supabase
    .from("silence_radar_corrective_actions")
    .select("*")
    .eq("id", actionId)
    .maybeSingle();

  if (actionErr) throw new Error(`Falha ao carregar ação: ${actionErr.message}`);
  if (!action) return null;

  const targetLabel = action.target_label;
  const targetType = action.target_type as CorrectiveActionTargetType;
  const createdAt = action.created_at;

  let currentReportCount = 0;
  let currentFormCount = 0;
  let currentCommentCount = 0;

  if (targetType === "bairro") {
    // Count bairro_escuta_submissions for this bairro after action was created
    const { count } = await supabase
      .from("bairro_escuta_submissions")
      .select("id", { count: "exact", head: true })
      .eq("bairro", targetLabel)
      .gte("created_at", createdAt);

    currentReportCount = count ?? 0;
    currentFormCount = count ?? 0;
  } else if (targetType === "pauta") {
    // Count form submissions for this pauta after action was created
    const { count: formCount } = await supabase
      .from("bairro_escuta_submissions")
      .select("id", { count: "exact", head: true })
      .eq("pauta", targetLabel)
      .gte("created_at", createdAt);

    currentFormCount = formCount ?? 0;

    // Count ig_posts comments for topic_category matching targetLabel
    const { data: posts } = await supabase
      .from("ig_posts")
      .select("metrics")
      .gte("published_at", createdAt);

    let comments = 0;
    for (const post of posts ?? []) {
      const m = post.metrics && typeof post.metrics === "object" && !Array.isArray(post.metrics)
        ? (post.metrics as Record<string, unknown>)
        : {};
      const topic = String(m.topic_category ?? "").toLowerCase();
      if (topic === targetLabel.toLowerCase()) {
        comments += Number(m.comments_count ?? 0);
      }
    }
    currentCommentCount = comments;
  } else if (targetType === "post") {
    // Count interactions for post matching targetLabel (shortcode)
    const { data: post } = await supabase
      .from("ig_posts")
      .select("metrics")
      .eq("shortcode", targetLabel)
      .maybeSingle();

    if (post?.metrics && typeof post.metrics === "object" && !Array.isArray(post.metrics)) {
      const m = post.metrics as Record<string, unknown>;
      currentCommentCount = Number(m.comments_count ?? 0) + Number(m.like_count ?? 0);
    }
  }

  const baseline = action.baseline_snapshot as Record<string, unknown>;
  const baselineReports = Number(baseline.reportCount ?? 0);
  const baselineForms = Number(baseline.formCount ?? 0);
  const baselineComments = Number(baseline.commentCount ?? 0);

  return {
    actionId: action.id,
    targetType,
    targetLabel,
    kind: action.kind as CorrectiveActionKind,
    baselineValue: action.baseline_value,
    baselineSnapshot: action.baseline_snapshot,
    currentReportCount,
    currentFormCount,
    currentCommentCount,
    deltaReports: targetType === "bairro" ? currentReportCount - baselineReports : null,
    deltaForms: targetType === "pauta" ? currentFormCount - baselineForms : null,
    deltaComments: targetType === "pauta" || targetType === "post"
      ? currentCommentCount - baselineComments
      : null,
  };
}
