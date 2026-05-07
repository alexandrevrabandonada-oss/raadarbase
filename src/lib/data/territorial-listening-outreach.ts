import { shouldUseMockData } from "@/lib/config";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getActionPlanByReportId } from "@/lib/data/action-plans";
import type { Json } from "@/lib/supabase/database.types";

export type TerritorialOutreachChannel = "instagram_story" | "instagram_feed" | "whatsapp" | "reuniao" | "outro";
export type TerritorialOutreachStatus = "planned" | "shared" | "archived";

export type TerritorialOutreachLogView = {
  id: string;
  windowId: string;
  channel: TerritorialOutreachChannel;
  status: TerritorialOutreachStatus;
  sharedAt: string | null;
  publicUrl: string | null;
  notes: string | null;
  createdBy: string | null;
  createdByEmail: string | null;
  createdAt: string;
  metadata: Json;
};

type TerritorialOutreachLogRow = {
  id: string;
  window_id: string;
  channel: TerritorialOutreachChannel;
  status: TerritorialOutreachStatus;
  shared_at: string | null;
  public_url: string | null;
  notes: string | null;
  created_by: string | null;
  created_by_email: string | null;
  created_at: string;
  metadata: Json;
};

function toView(row: TerritorialOutreachLogRow): TerritorialOutreachLogView {
  return {
    id: row.id,
    windowId: row.window_id,
    channel: row.channel,
    status: row.status,
    sharedAt: row.shared_at,
    publicUrl: row.public_url,
    notes: row.notes,
    createdBy: row.created_by,
    createdByEmail: row.created_by_email,
    createdAt: row.created_at,
    metadata: row.metadata,
  };
}

export async function listTerritorialOutreachLogs(windowId: string): Promise<TerritorialOutreachLogView[]> {
  if (shouldUseMockData()) return [];

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("territorial_listening_outreach_logs")
    .select("*")
    .eq("window_id", windowId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Falha ao listar reforços territoriais: ${error.message}`);
  return (data ?? []).map((row) => toView(row as TerritorialOutreachLogRow));
}

export async function getTerritorialOutreachLog(id: string): Promise<TerritorialOutreachLogView | null> {
  if (shouldUseMockData()) return null;

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("territorial_listening_outreach_logs")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Falha ao buscar reforço territorial: ${error.message}`);
  return data ? toView(data as TerritorialOutreachLogRow) : null;
}

export type TerritorialOutreachSummary = {
  plannedCount: number;
  sharedCount: number;
  archivedCount: number;
};

export type TerritorialConversionStatus =
  | "no_shared_yet"
  | "waiting_results"
  | "conversion_detected"
  | "no_conversion_yet";

export type TerritorialConversionMetrics = {
  plannedCount: number;
  sharedCount: number;
  reportsBeforeFirstShared: number;
  reportsAfterFirstShared: number;
  differenceAbsolute: number;
  firstSharedAt: string | null;
  status: TerritorialConversionStatus;
};

export type TerritorialNewBatchConversionMetrics = {
  newBatchLogIds: string[];
  newBatchLogs: TerritorialOutreachLogView[];
  newBatchSharedCount: number;
  firstNewBatchSharedAt: string | null;
  reportsBeforeFirstNewBatchShared: number;
  reportsAfterFirstNewBatchShared: number;
  conversionDifferenceAbsolute: number;
  conversionStatus: TerritorialConversionStatus;
};

async function getWindowSourceReportId(windowId: string): Promise<string | null> {
  if (shouldUseMockData()) return null;

  const supabase = getSupabaseAdminClient();
  const { data: windowRow, error: windowError } = await supabase
    .from("territorial_listening_windows")
    .select("source_report_id")
    .eq("id", windowId)
    .maybeSingle();

  if (windowError) throw new Error(`Falha ao buscar janela territorial: ${windowError.message}`);
  return windowRow?.source_report_id ?? null;
}

export async function getNewBatchOutreachIds(windowId: string): Promise<string[]> {
  if (shouldUseMockData()) return [];

  const sourceReportId = await getWindowSourceReportId(windowId);
  if (!sourceReportId) return [];

  const plan = await getActionPlanByReportId(sourceReportId);
  const item = plan?.items?.find((currentItem) => currentItem.title.toLowerCase().includes("nova chamada de 30 segundos"));
  if (!item || !item.metadata || typeof item.metadata !== "object" || Array.isArray(item.metadata)) return [];

  const metadata = item.metadata as Record<string, unknown>;
  const rawIds = metadata.latest_outreach_ids;
  if (!Array.isArray(rawIds)) return [];

  return rawIds.filter((value) => typeof value === "string") as string[];
}

export async function getNewBatchOutreachLogs(windowId: string): Promise<TerritorialOutreachLogView[]> {
  const ids = await getNewBatchOutreachIds(windowId);
  if (ids.length === 0) return [];

  const logs = await listTerritorialOutreachLogs(windowId);
  return logs.filter((log) => ids.includes(log.id));
}

export async function getTerritorialOutreachSummary(windowId: string): Promise<TerritorialOutreachSummary> {
  const logs = await listTerritorialOutreachLogs(windowId);
  return {
    plannedCount: logs.filter((log) => log.status === "planned").length,
    sharedCount: logs.filter((log) => log.status === "shared").length,
    archivedCount: logs.filter((log) => log.status === "archived").length,
  };
}

export async function getTerritorialConversionMetrics(windowId: string): Promise<TerritorialConversionMetrics> {
  if (shouldUseMockData()) {
    return {
      plannedCount: 0,
      sharedCount: 0,
      reportsBeforeFirstShared: 0,
      reportsAfterFirstShared: 0,
      differenceAbsolute: 0,
      firstSharedAt: null,
      status: "no_shared_yet",
    };
  }

  const supabase = getSupabaseAdminClient();
  const logs = await listTerritorialOutreachLogs(windowId);
  const plannedCount = logs.filter((log) => log.status === "planned").length;
  const sharedLogs = logs.filter((log) => log.status === "shared" && log.sharedAt);
  const sharedCount = sharedLogs.length;

  const firstSharedAt = sharedLogs
    .map((log) => log.sharedAt as string)
    .sort((a, b) => a.localeCompare(b))[0] ?? null;

  const { data: windowRow, error: windowError } = await supabase
    .from("territorial_listening_windows")
    .select("source_report_id,starts_at,ends_at")
    .eq("id", windowId)
    .maybeSingle();

  if (windowError) throw new Error(`Falha ao buscar janela territorial para conversão: ${windowError.message}`);
  if (!windowRow) {
    return {
      plannedCount,
      sharedCount,
      reportsBeforeFirstShared: 0,
      reportsAfterFirstShared: 0,
      differenceAbsolute: 0,
      firstSharedAt,
      status: sharedCount > 0 ? "waiting_results" : "no_shared_yet",
    };
  }

  const { data: submissions, error: submissionsError } = await supabase
    .from("bairro_escuta_submissions")
    .select("created_at")
    .eq("source_report_id", windowRow.source_report_id)
    .gte("created_at", windowRow.starts_at)
    .lte("created_at", windowRow.ends_at)
    .order("created_at", { ascending: true });

  if (submissionsError) throw new Error(`Falha ao calcular conversão territorial: ${submissionsError.message}`);

  const rows = submissions ?? [];
  const reportsBeforeFirstShared = firstSharedAt
    ? rows.filter((row) => row.created_at < firstSharedAt).length
    : rows.length;
  const reportsAfterFirstShared = firstSharedAt
    ? rows.filter((row) => row.created_at >= firstSharedAt).length
    : 0;

  let status: TerritorialConversionStatus = "no_shared_yet";
  if (sharedCount > 0) {
    if (reportsAfterFirstShared > 0) {
      status = "conversion_detected";
    } else {
      const firstSharedTime = Date.parse(firstSharedAt ?? "");
      if (Number.isFinite(firstSharedTime) && Date.now() - firstSharedTime < 24 * 60 * 60 * 1000) {
        status = "waiting_results";
      } else {
        status = "no_conversion_yet";
      }
    }
  }

  return {
    plannedCount,
    sharedCount,
    reportsBeforeFirstShared,
    reportsAfterFirstShared,
    differenceAbsolute: Math.abs(reportsAfterFirstShared - reportsBeforeFirstShared),
    firstSharedAt,
    status,
  };
}

export async function getTerritorialNewBatchConversionMetrics(windowId: string): Promise<TerritorialNewBatchConversionMetrics> {
  if (shouldUseMockData()) {
    return {
      newBatchLogIds: [],
      newBatchLogs: [],
      newBatchSharedCount: 0,
      firstNewBatchSharedAt: null,
      reportsBeforeFirstNewBatchShared: 0,
      reportsAfterFirstNewBatchShared: 0,
      conversionDifferenceAbsolute: 0,
      conversionStatus: "no_shared_yet",
    };
  }

  const supabase = getSupabaseAdminClient();
  const newBatchLogIds = await getNewBatchOutreachIds(windowId);
  const logs = await listTerritorialOutreachLogs(windowId);
  const newBatchLogs = logs.filter((log) => newBatchLogIds.includes(log.id));
  const sharedLogs = newBatchLogs.filter((log) => log.status === "shared" && log.sharedAt);
  const newBatchSharedCount = sharedLogs.length;
  const firstNewBatchSharedAt = sharedLogs
    .map((log) => log.sharedAt as string)
    .sort((a, b) => a.localeCompare(b))[0] ?? null;

  const { data: windowRow, error: windowError } = await supabase
    .from("territorial_listening_windows")
    .select("source_report_id,starts_at,ends_at")
    .eq("id", windowId)
    .maybeSingle();

  if (windowError) throw new Error(`Falha ao buscar janela territorial para novo lote: ${windowError.message}`);
  if (!windowRow) {
    return {
      newBatchLogIds,
      newBatchLogs,
      newBatchSharedCount,
      firstNewBatchSharedAt,
      reportsBeforeFirstNewBatchShared: 0,
      reportsAfterFirstNewBatchShared: 0,
      conversionDifferenceAbsolute: 0,
      conversionStatus: newBatchSharedCount > 0 ? "waiting_results" : "no_shared_yet",
    };
  }

  const { data: submissions, error: submissionsError } = await supabase
    .from("bairro_escuta_submissions")
    .select("created_at")
    .eq("source_report_id", windowRow.source_report_id)
    .gte("created_at", windowRow.starts_at)
    .lte("created_at", windowRow.ends_at)
    .order("created_at", { ascending: true });

  if (submissionsError) throw new Error(`Falha ao calcular conversão do novo lote: ${submissionsError.message}`);

  const rows = submissions ?? [];
  const reportsBeforeFirstNewBatchShared = firstNewBatchSharedAt
    ? rows.filter((row) => row.created_at < firstNewBatchSharedAt).length
    : rows.length;
  const reportsAfterFirstNewBatchShared = firstNewBatchSharedAt
    ? rows.filter((row) => row.created_at >= firstNewBatchSharedAt).length
    : 0;

  let conversionStatus: TerritorialConversionStatus = "no_shared_yet";
  if (newBatchSharedCount > 0) {
    if (reportsAfterFirstNewBatchShared > 0) {
      conversionStatus = "conversion_detected";
    } else {
      const firstSharedTime = Date.parse(firstNewBatchSharedAt ?? "");
      if (Number.isFinite(firstSharedTime) && Date.now() - firstSharedTime < 24 * 60 * 60 * 1000) {
        conversionStatus = "waiting_results";
      } else {
        conversionStatus = "no_conversion_yet";
      }
    }
  }

  return {
    newBatchLogIds,
    newBatchLogs,
    newBatchSharedCount,
    firstNewBatchSharedAt,
    reportsBeforeFirstNewBatchShared,
    reportsAfterFirstNewBatchShared,
    conversionDifferenceAbsolute: Math.abs(reportsAfterFirstNewBatchShared - reportsBeforeFirstNewBatchShared),
    conversionStatus,
  };
}