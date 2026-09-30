import { createClient } from "@supabase/supabase-js";
import { getSupabaseSecretKey } from "@/lib/config";

export type ClimateProtocol = {
  id: string;
  title: string;
  recipient: string;
  channel: string;
  protocol_number: string | null;
  status: "draft" | "submitted" | "answered" | "overdue" | "closed";
  submitted_at: string | null;
  due_at: string | null;
  extension_due_at: string | null;
  request_text: string | null;
  legal_basis: string | null;
  tracking_url: string | null;
  public_note: string | null;
  response_url: string | null;
  response_summary: string | null;
  last_checked_at: string | null;
  updated_at: string;
};

export type ClimateOpsSummary = {
  reports: number;
  schoolsWithReports: number;
  signatures: number;
  protocols: ClimateProtocol[];
};

function climateClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = getSupabaseSecretKey();
  if (!url || !secret) throw new Error("Supabase não configurado para a operação de climatização.");
  return createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function listClimateOpsSummary(): Promise<ClimateOpsSummary> {
  const db = climateClient();
  const [reports, schools, signatures, protocols] = await Promise.all([
    db.from("clima_reports").select("id", { count: "exact", head: true }),
    db.from("clima_school_stats").select("id").gt("report_count", 0),
    db.from("clima_signatures").select("id", { count: "exact", head: true }),
    db.from("clima_protocols")
      .select("id,title,recipient,channel,protocol_number,status,submitted_at,due_at,extension_due_at,request_text,legal_basis,tracking_url,public_note,response_url,response_summary,last_checked_at,updated_at")
      .order("created_at", { ascending: true }),
  ]);

  if (reports.error) throw new Error(reports.error.message);
  if (schools.error) throw new Error(schools.error.message);
  if (signatures.error) throw new Error(signatures.error.message);
  if (protocols.error) throw new Error(protocols.error.message);

  return {
    reports: reports.count ?? 0,
    schoolsWithReports: schools.data?.length ?? 0,
    signatures: signatures.count ?? 0,
    protocols: (protocols.data ?? []) as ClimateProtocol[],
  };
}

export function getClimateAdminClient() {
  return climateClient();
}
