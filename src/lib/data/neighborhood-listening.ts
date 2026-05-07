import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { BairroEscutaSubmissionRow } from "@/lib/types";

export type NeighborhoodListenStatus = BairroEscutaSubmissionRow["status"];

export type NeighborhoodListenSummary = {
  totalReports: number;
  consentToContact: number;
  withoutConsent: number;
  topBairros: Array<{ bairro: string; quantidade: number }>;
  topPautas: Array<{ pauta: string; quantidade: number }>;
  statusCounts: Array<{ status: NeighborhoodListenStatus; quantidade: number }>;
  recentSanitized: Array<{
    id: string;
    createdAt: string;
    bairro: string;
    pauta: string;
    status: NeighborhoodListenStatus;
    relatoPreview: string;
    consentToContact: boolean;
    contactRedacted: string | null;
    sourceReportId: string | null;
  }>;
};

export type NeighborhoodListenExportRow = {
  bairro: string;
  pauta: string;
  status: NeighborhoodListenStatus;
  quantidade: number;
};

function preview(text: string, maxLength = 140) {
  const compact = text.replace(/\s+/g, " ").trim();
  return compact.length > maxLength ? `${compact.slice(0, maxLength - 1)}…` : compact;
}

function aggregateBy(rows: BairroEscutaSubmissionRow[], keys: Array<"bairro" | "pauta" | "status">) {
  const groups = new Map<string, NeighborhoodListenExportRow>();

  for (const row of rows) {
    const signature = keys.map((key) => row[key]).join("::");
    const existing = groups.get(signature);
    if (existing) {
      existing.quantidade += 1;
      continue;
    }

    groups.set(signature, {
      bairro: row.bairro,
      pauta: row.pauta,
      status: row.status,
      quantidade: 1,
    });
  }

  return Array.from(groups.values()).sort((left, right) => right.quantidade - left.quantidade);
}

export async function getNeighborhoodListenSummary(): Promise<NeighborhoodListenSummary> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("bairro_escuta_submissions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Falha ao carregar escuta territorial: ${error.message}`);
  }

  const rows = (data ?? []) as BairroEscutaSubmissionRow[];
  const bairroCounts = new Map<string, number>();
  const pautaCounts = new Map<string, number>();
  const statusCounts = new Map<NeighborhoodListenStatus, number>();

  for (const row of rows) {
    bairroCounts.set(row.bairro, (bairroCounts.get(row.bairro) ?? 0) + 1);
    pautaCounts.set(row.pauta, (pautaCounts.get(row.pauta) ?? 0) + 1);
    statusCounts.set(row.status, (statusCounts.get(row.status) ?? 0) + 1);
  }

  return {
    totalReports: rows.length,
    consentToContact: rows.filter((row) => row.consent_to_contact).length,
    withoutConsent: rows.filter((row) => !row.consent_to_contact).length,
    topBairros: Array.from(bairroCounts.entries())
      .map(([bairro, quantidade]) => ({ bairro, quantidade }))
      .sort((left, right) => right.quantidade - left.quantidade)
      .slice(0, 8),
    topPautas: Array.from(pautaCounts.entries())
      .map(([pauta, quantidade]) => ({ pauta, quantidade }))
      .sort((left, right) => right.quantidade - left.quantidade)
      .slice(0, 8),
    statusCounts: Array.from(statusCounts.entries())
      .map(([status, quantidade]) => ({ status, quantidade }))
      .sort((left, right) => right.quantidade - left.quantidade),
    recentSanitized: rows.slice(0, 20).map((row) => ({
      id: row.id,
      createdAt: row.created_at,
      bairro: row.bairro,
      pauta: row.pauta,
      status: row.status,
      relatoPreview: preview(row.relato_curto),
      consentToContact: row.consent_to_contact,
      contactRedacted: row.contact_redacted,
      sourceReportId: row.source_report_id,
    })),
  };
}

export async function getNeighborhoodListenExportRows(): Promise<NeighborhoodListenExportRow[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("bairro_escuta_submissions")
    .select("bairro, pauta, status")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Falha ao exportar escuta territorial: ${error.message}`);
  }

  return aggregateBy((data ?? []) as BairroEscutaSubmissionRow[], ["bairro", "pauta", "status"]);
}

export function renderNeighborhoodListenExportCsv(rows: NeighborhoodListenExportRow[]) {
  const csvRows = [
    ["bairro", "pauta", "status", "quantidade"],
    ...rows.map((row) => [row.bairro, row.pauta, row.status, String(row.quantidade)]),
  ];

  return csvRows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
}
