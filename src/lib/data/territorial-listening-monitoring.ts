import { shouldUseMockData } from "@/lib/config";
import { createActionEvidence } from "@/lib/data/action-execution";
import { getActionPlanByReportId, updateActionPlanItem } from "@/lib/data/action-plans";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getTerritorialListeningWindowById, listTerritorialListeningWindows } from "@/lib/data/territorial-listening-windows";
import { getTerritorialConversionMetrics, getTerritorialNewBatchConversionMetrics } from "@/lib/data/territorial-listening-outreach";
import type { Json } from "@/lib/supabase/database.types";
import type { TerritorialListeningWindowView } from "@/lib/data/territorial-listening-windows";

export type TerritorialListeningSnapshotStatus = "ok" | "attention" | "blocked";

export type TerritorialNeighborhoodAggregate = { bairro: string; quantidade: number };
export type TerritorialTopicAggregate = { pauta: string; quantidade: number };

export type TerritorialListeningAggregates = {
  windowId: string;
  sourceReportId: string;
  actionPlanId: string | null;
  snapshotDate: string;
  totalReports: number;
  totalWithContactConsent: number;
  totalWithoutContactConsent: number;
  neighborhoodsCount: number;
  topicsCount: number;
  pendingReviewCount: number;
  reviewedCount: number;
  forwardedCount: number;
  archivedCount: number;
  topNeighborhoods: TerritorialNeighborhoodAggregate[];
  topTopics: TerritorialTopicAggregate[];
  status: TerritorialListeningSnapshotStatus;
  notes: string | null;
};

export type TerritorialListeningSnapshotView = {
  id: string;
  windowId: string;
  snapshotDate: string;
  totalReports: number;
  totalWithContactConsent: number;
  totalWithoutContactConsent: number;
  neighborhoodsCount: number;
  topicsCount: number;
  pendingReviewCount: number;
  reviewedCount: number;
  forwardedCount: number;
  archivedCount: number;
  topNeighborhoods: TerritorialNeighborhoodAggregate[];
  topTopics: TerritorialTopicAggregate[];
  status: TerritorialListeningSnapshotStatus;
  notes: string | null;
  generatedBy: string | null;
  generatedByEmail: string | null;
  generatedAt: string;
  metadata: Json;
};

type TerritorialDailySnapshotRow = {
  id: string;
  window_id: string;
  snapshot_date: string;
  total_reports: number;
  total_with_contact_consent: number;
  total_without_contact_consent: number;
  neighborhoods_count: number;
  topics_count: number;
  pending_review_count: number;
  reviewed_count: number;
  forwarded_count: number;
  archived_count: number;
  top_neighborhoods: Json;
  top_topics: Json;
  status: TerritorialListeningSnapshotStatus;
  notes: string | null;
  generated_by: string | null;
  generated_by_email: string | null;
  generated_at: string;
  metadata: Json;
};

function toJsonAggregates<T>(value: Json, fallback: T): T {
  return Array.isArray(value) ? (value as T) : fallback;
}

function toSnapshotView(row: TerritorialDailySnapshotRow): TerritorialListeningSnapshotView {
  return {
    id: row.id,
    windowId: row.window_id,
    snapshotDate: row.snapshot_date,
    totalReports: row.total_reports,
    totalWithContactConsent: row.total_with_contact_consent,
    totalWithoutContactConsent: row.total_without_contact_consent,
    neighborhoodsCount: row.neighborhoods_count,
    topicsCount: row.topics_count,
    pendingReviewCount: row.pending_review_count,
    reviewedCount: row.reviewed_count,
    forwardedCount: row.forwarded_count,
    archivedCount: row.archived_count,
    topNeighborhoods: toJsonAggregates<TerritorialNeighborhoodAggregate[]>(row.top_neighborhoods, []),
    topTopics: toJsonAggregates<TerritorialTopicAggregate[]>(row.top_topics, []),
    status: row.status,
    notes: row.notes,
    generatedBy: row.generated_by,
    generatedByEmail: row.generated_by_email,
    generatedAt: row.generated_at,
    metadata: row.metadata,
  };
}

function aggregateNeighborhoods(rows: Array<{ bairro: string }>): TerritorialNeighborhoodAggregate[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const value = row.bairro.trim();
    if (!value) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([bairro, quantidade]) => ({ bairro, quantidade }))
    .sort((left, right) => right.quantidade - left.quantidade)
    .slice(0, 8);
}

function aggregateTopics(rows: Array<{ pauta: string }>): TerritorialTopicAggregate[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const value = row.pauta.trim();
    if (!value) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([pauta, quantidade]) => ({ pauta, quantidade }))
    .sort((left, right) => right.quantidade - left.quantidade)
    .slice(0, 8);
}

export function computeTerritorialSnapshotStatus(aggregates: Pick<TerritorialListeningAggregates, "totalReports" | "totalWithContactConsent" | "totalWithoutContactConsent" | "pendingReviewCount" | "reviewedCount" | "forwardedCount" | "archivedCount">): TerritorialListeningSnapshotStatus {
  if (aggregates.totalReports === 0) return "attention";
  if (aggregates.pendingReviewCount > 0) return "attention";
  if (aggregates.totalWithoutContactConsent > aggregates.totalWithContactConsent) return "attention";
  if (aggregates.reviewedCount === 0 && aggregates.forwardedCount === 0 && aggregates.archivedCount === 0) return "attention";
  return "ok";
}

export async function getActiveTerritorialListeningWindow(): Promise<TerritorialListeningWindowView | null> {
  const windows = await listTerritorialListeningWindows(20);
  return windows.find((window) => window.status === "open") ?? null;
}

export async function getTerritorialListeningAggregates(windowId: string): Promise<TerritorialListeningAggregates> {
  if (shouldUseMockData()) {
    return {
      windowId,
      sourceReportId: windowId,
      actionPlanId: null,
      snapshotDate: new Date().toISOString().slice(0, 10),
      totalReports: 0,
      totalWithContactConsent: 0,
      totalWithoutContactConsent: 0,
      neighborhoodsCount: 0,
      topicsCount: 0,
      pendingReviewCount: 0,
      reviewedCount: 0,
      forwardedCount: 0,
      archivedCount: 0,
      topNeighborhoods: [],
      topTopics: [],
      status: "attention",
      notes: null,
    };
  }

  const supabase = getSupabaseAdminClient();
  const { data: window, error: windowError } = await supabase
    .from("territorial_listening_windows")
    .select("id,source_report_id,action_plan_id,starts_at,ends_at,status")
    .eq("id", windowId)
    .maybeSingle();

  if (windowError) throw new Error(`Falha ao buscar janela territorial: ${windowError.message}`);
  if (!window) throw new Error("Janela territorial não encontrada.");

  const { data: submissions, error: submissionsError } = await supabase
    .from("bairro_escuta_submissions")
    .select("id,bairro,pauta,status,consent_to_contact,created_at")
    .eq("source_report_id", window.source_report_id)
    .gte("created_at", window.starts_at)
    .lte("created_at", window.ends_at)
    .order("created_at", { ascending: false });

  if (submissionsError) throw new Error(`Falha ao carregar relatos da janela territorial: ${submissionsError.message}`);

  const rows = submissions ?? [];
  const topNeighborhoods = aggregateNeighborhoods(rows);
  const topTopics = aggregateTopics(rows);
  const totalWithContactConsent = rows.filter((row) => row.consent_to_contact).length;
  const totalWithoutContactConsent = rows.length - totalWithContactConsent;
  const pendingReviewCount = rows.filter((row) => row.status === "novo").length;
  const reviewedCount = rows.filter((row) => row.status === "revisado").length;
  const forwardedCount = rows.filter((row) => row.status === "encaminhado").length;
  const archivedCount = rows.filter((row) => row.status === "arquivado").length;

  const notes = rows.length === 0
    ? "Chamada reforcada com fluxo de relato rapido; aguardar nova divulgacao manual."
    : null;

  const aggregates = {
    windowId: window.id,
    sourceReportId: window.source_report_id,
    actionPlanId: window.action_plan_id,
    snapshotDate: new Date().toISOString().slice(0, 10),
    totalReports: rows.length,
    totalWithContactConsent,
    totalWithoutContactConsent,
    neighborhoodsCount: new Set(rows.map((row) => row.bairro)).size,
    topicsCount: new Set(rows.map((row) => row.pauta)).size,
    pendingReviewCount,
    reviewedCount,
    forwardedCount,
    archivedCount,
    topNeighborhoods,
    topTopics,
    status: computeTerritorialSnapshotStatus({
      totalReports: rows.length,
      totalWithContactConsent,
      totalWithoutContactConsent,
      pendingReviewCount,
      reviewedCount,
      forwardedCount,
      archivedCount,
    }),
    notes,
  } satisfies TerritorialListeningAggregates;

  return aggregates;
}

export async function listTerritorialSnapshots(windowId: string): Promise<TerritorialListeningSnapshotView[]> {
  if (shouldUseMockData()) return [];

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("territorial_listening_daily_snapshots")
    .select("*")
    .eq("window_id", windowId)
    .order("snapshot_date", { ascending: false });

  if (error) throw new Error(`Falha ao listar snapshots territoriais: ${error.message}`);
  return (data ?? []).map((row) => toSnapshotView(row as TerritorialDailySnapshotRow));
}

export async function getTerritorialSnapshot(id: string): Promise<TerritorialListeningSnapshotView | null> {
  if (shouldUseMockData()) return null;

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("territorial_listening_daily_snapshots")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Falha ao buscar snapshot territorial: ${error.message}`);
  return data ? toSnapshotView(data as TerritorialDailySnapshotRow) : null;
}

export async function generateDailyTerritorialSnapshot(windowId: string, createdBy?: { id: string; email: string | null } | null) {
  const window = await getTerritorialListeningWindowById(windowId);
  if (!window) throw new Error("Janela territorial não encontrada.");
  if (window.status !== "open") throw new Error("A janela territorial precisa estar aberta para gerar snapshot.");

  const aggregates = await getTerritorialListeningAggregates(windowId);
  const conversion = await getTerritorialConversionMetrics(windowId);
  const newBatchConversion = await getTerritorialNewBatchConversionMetrics(windowId);
  const snapshotNotes = aggregates.totalReports === 0 && newBatchConversion.newBatchSharedCount > 0
    ? "Novo reforço manual registrado; ainda sem conversão em relatos."
    : aggregates.totalReports === 0 && conversion.sharedCount > 0
      ? "Divulgacao manual registrada; aguardando conversao em relatos."
    : aggregates.notes;
  const supabase = getSupabaseAdminClient();
  const generatedAt = new Date().toISOString();

  const { data, error } = await supabase
    .from("territorial_listening_daily_snapshots")
    .upsert(
      {
        window_id: windowId,
        snapshot_date: aggregates.snapshotDate,
        total_reports: aggregates.totalReports,
        total_with_contact_consent: aggregates.totalWithContactConsent,
        total_without_contact_consent: aggregates.totalWithoutContactConsent,
        neighborhoods_count: aggregates.neighborhoodsCount,
        topics_count: aggregates.topicsCount,
        pending_review_count: aggregates.pendingReviewCount,
        reviewed_count: aggregates.reviewedCount,
        forwarded_count: aggregates.forwardedCount,
        archived_count: aggregates.archivedCount,
        top_neighborhoods: aggregates.topNeighborhoods,
        top_topics: aggregates.topTopics,
        status: aggregates.status,
        notes: snapshotNotes,
        generated_by: createdBy?.id ?? null,
        generated_by_email: createdBy?.email ?? null,
        generated_at: generatedAt,
        metadata: {
          source_report_id: aggregates.sourceReportId,
          action_plan_id: aggregates.actionPlanId,
          window_status: window.status,
          outreach_planned_count: conversion.plannedCount,
          outreach_shared_count: conversion.sharedCount,
          conversion_status: conversion.status,
          reports_before_first_shared: conversion.reportsBeforeFirstShared,
          reports_after_first_shared: conversion.reportsAfterFirstShared,
          conversion_difference_absolute: conversion.differenceAbsolute,
          first_shared_at: conversion.firstSharedAt,
          new_batch_outreach_ids: newBatchConversion.newBatchLogIds,
          new_batch_shared_count: newBatchConversion.newBatchSharedCount,
          first_new_batch_shared_at: newBatchConversion.firstNewBatchSharedAt,
          reports_before_first_new_batch_shared: newBatchConversion.reportsBeforeFirstNewBatchShared,
          reports_after_first_new_batch_shared: newBatchConversion.reportsAfterFirstNewBatchShared,
          new_batch_conversion_difference_absolute: newBatchConversion.conversionDifferenceAbsolute,
          new_batch_conversion_status: newBatchConversion.conversionStatus,
        },
      },
      { onConflict: "window_id,snapshot_date" },
    )
    .select("*")
    .single();

  if (error) throw new Error(`Falha ao gerar snapshot territorial: ${error.message}`);

  const snapshot = toSnapshotView(data as TerritorialDailySnapshotRow);
  const plan = await getActionPlanByReportId(window.sourceReportId);
  const monitorItem = plan?.items?.find((item) => item.type === "escuta_bairro");

  if (monitorItem) {
    const itemMetadata = monitorItem.metadata && typeof monitorItem.metadata === "object" && !Array.isArray(monitorItem.metadata)
      ? (monitorItem.metadata as Record<string, unknown>)
      : {};

    await updateActionPlanItem(monitorItem.id, {
      metadata: {
        ...itemMetadata,
        territorial_monitoring: {
          latest_snapshot_id: snapshot.id,
          latest_snapshot_date: snapshot.snapshotDate,
          latest_snapshot_status: snapshot.status,
          latest_snapshot_at: snapshot.generatedAt,
          latest_conversion_status: newBatchConversion.conversionStatus,
          latest_reports_after_shared: newBatchConversion.reportsAfterFirstNewBatchShared,
          latest_conversion_delta: newBatchConversion.conversionDifferenceAbsolute,
        },
      },
    });

    await createActionEvidence({
      action_plan_item_id: monitorItem.id,
      evidence_type: "resultado",
      title: `Snapshot diário territorial ${snapshot.snapshotDate}`,
      description: `Total de relatos: ${snapshot.totalReports}. Com consentimento: ${snapshot.totalWithContactConsent}. Sem consentimento: ${snapshot.totalWithoutContactConsent}. Status: ${snapshot.status}.`,
      url: null,
      metadata: {
        window_id: window.id,
        snapshot_id: snapshot.id,
        snapshot_date: snapshot.snapshotDate,
        top_neighborhoods: snapshot.topNeighborhoods,
        top_topics: snapshot.topTopics,
      },
      created_by: createdBy?.id ?? null,
      created_by_email: createdBy?.email ?? null,
    });

    await writeAuditLog({
      actorId: createdBy?.id ?? null,
      actorEmail: createdBy?.email ?? null,
      action: "action_execution.evidence_created",
      entityType: "action_item_evidence",
      entityId: null,
      summary: `Evidência registrada para snapshot territorial ${snapshot.snapshotDate}.`,
      metadata: {
        window_id: window.id,
        snapshot_id: snapshot.id,
        action_plan_item_id: monitorItem.id,
      },
    });

    await writeAuditLog({
      actorId: createdBy?.id ?? null,
      actorEmail: createdBy?.email ?? null,
      action: "action_plan.item_updated",
      entityType: "action_plan_items",
      entityId: monitorItem.id,
      summary: `Item de monitoramento territorial atualizado com snapshot ${snapshot.snapshotDate}.`,
      metadata: {
        window_id: window.id,
        snapshot_id: snapshot.id,
        latest_snapshot_status: snapshot.status,
      },
    });
  }

  await writeAuditLog({
    actorId: createdBy?.id ?? null,
    actorEmail: createdBy?.email ?? null,
    action: "territorial.snapshot_generated",
    entityType: "territorial_listening_daily_snapshots",
    entityId: snapshot.id,
    summary: `Snapshot diário gerado para ${snapshot.snapshotDate}.`,
    metadata: {
      window_id: window.id,
      source_report_id: window.sourceReportId,
      snapshot_date: snapshot.snapshotDate,
      total_reports: snapshot.totalReports,
      status: snapshot.status,
    },
  });

  return snapshot;
}