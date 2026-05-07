import { shouldUseMockData } from "@/lib/config";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { TerritorialListeningWindowRow } from "@/lib/types";

type TerritorialWindowRecord = TerritorialListeningWindowRow & {
  report?: { id: string; title: string } | null;
  action_plan?: { id: string; title: string } | null;
};

export type TerritorialListeningWindowView = {
  id: string;
  sourceReportId: string;
  reportTitle: string;
  actionPlanId: string | null;
  actionPlanTitle: string | null;
  startsAt: string;
  endsAt: string;
  status: TerritorialListeningWindowRow["status"];
  createdAt: string;
  createdByEmail: string | null;
  metadata: TerritorialListeningWindowRow["metadata"];
  daysRemaining: number | null;
};

export type TerritorialListeningWindowSummary = {
  activeWindow: TerritorialListeningWindowView | null;
  openWindows: TerritorialListeningWindowView[];
  recentWindows: TerritorialListeningWindowView[];
  totalWindows: number;
};

function toView(window: TerritorialWindowRecord, now = new Date()): TerritorialListeningWindowView {
  const endsAt = Date.parse(window.ends_at);
  const daysRemaining = Number.isFinite(endsAt)
    ? Math.max(0, Math.ceil((endsAt - now.getTime()) / (24 * 60 * 60 * 1000)))
    : null;

  return {
    id: window.id,
    sourceReportId: window.source_report_id,
    reportTitle: window.report?.title ?? window.source_report_id,
    actionPlanId: window.action_plan_id,
    actionPlanTitle: window.action_plan?.title ?? null,
    startsAt: window.starts_at,
    endsAt: window.ends_at,
    status: window.status,
    createdAt: window.created_at,
    createdByEmail: window.created_by_email,
    metadata: window.metadata,
    daysRemaining,
  };
}

export async function getTerritorialListeningWindowByReportId(reportId: string): Promise<TerritorialListeningWindowView | null> {
  if (shouldUseMockData()) return null;

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("territorial_listening_windows")
    .select(`
      *,
      report:mobilization_reports(id, title),
      action_plan:action_plans(id, title)
    `)
    .eq("source_report_id", reportId)
    .maybeSingle();

  if (error) throw new Error(`Falha ao buscar janela territorial: ${error.message}`);
  return data ? toView(data as TerritorialWindowRecord) : null;
}

export async function getTerritorialListeningWindowById(windowId: string): Promise<TerritorialListeningWindowView | null> {
  if (shouldUseMockData()) return null;

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("territorial_listening_windows")
    .select(`
      *,
      report:mobilization_reports(id, title),
      action_plan:action_plans(id, title)
    `)
    .eq("id", windowId)
    .maybeSingle();

  if (error) throw new Error(`Falha ao buscar janela territorial: ${error.message}`);
  return data ? toView(data as TerritorialWindowRecord) : null;
}

export async function listTerritorialListeningWindows(limit = 10): Promise<TerritorialListeningWindowView[]> {
  if (shouldUseMockData()) return [];

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("territorial_listening_windows")
    .select(`
      *,
      report:mobilization_reports(id, title),
      action_plan:action_plans(id, title)
    `)
    .order("starts_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Falha ao listar janelas territoriais: ${error.message}`);
  return (data ?? []).map((item) => toView(item as TerritorialWindowRecord));
}

export async function getTerritorialListeningWindowSummary(): Promise<TerritorialListeningWindowSummary> {
  const windows = await listTerritorialListeningWindows(20);
  const activeWindow = windows.find((window) => window.status === "open") ?? null;
  return {
    activeWindow,
    openWindows: windows.filter((window) => window.status === "open"),
    recentWindows: windows,
    totalWindows: windows.length,
  };
}

export async function openTerritorialListeningWindow(input: {
  reportId: string;
  actionPlanId?: string | null;
  createdBy?: { id: string; email: string | null } | null;
  metadata?: Record<string, unknown>;
  startsAt?: string;
  durationDays?: number;
}) {
  const supabase = getSupabaseAdminClient();
  const startsAt = input.startsAt ?? new Date().toISOString();
  const endsAt = new Date(Date.parse(startsAt) + (input.durationDays ?? 7) * 24 * 60 * 60 * 1000).toISOString();

  const existing = await getTerritorialListeningWindowByReportId(input.reportId);
  if (existing) {
    const { data, error } = await supabase
      .from("territorial_listening_windows")
      .update({
        action_plan_id: input.actionPlanId ?? existing.actionPlanId,
        status: "open",
        metadata: {
          ...((existing.metadata as Record<string, unknown> | null) ?? {}),
          ...(input.metadata ?? {}),
          reopened_at: new Date().toISOString(),
        },
      })
      .eq("id", existing.id)
      .select(`
        *,
        report:mobilization_reports(id, title),
        action_plan:action_plans(id, title)
      `)
      .single();

    if (error) throw new Error(`Falha ao atualizar janela territorial: ${error.message}`);
    return data ? toView(data as TerritorialWindowRecord) : existing;
  }

  const { data, error } = await supabase
    .from("territorial_listening_windows")
    .insert({
      source_report_id: input.reportId,
      action_plan_id: input.actionPlanId ?? null,
      starts_at: startsAt,
      ends_at: endsAt,
      status: "open",
      created_by: input.createdBy?.id ?? null,
      created_by_email: input.createdBy?.email ?? null,
      metadata: {
        ...(input.metadata ?? {}),
        opened_at: startsAt,
        duration_days: input.durationDays ?? 7,
      },
    })
    .select(`
      *,
      report:mobilization_reports(id, title),
      action_plan:action_plans(id, title)
    `)
    .single();

  if (error) throw new Error(`Falha ao abrir janela territorial: ${error.message}`);
  return data ? toView(data as TerritorialWindowRecord) : null;
}