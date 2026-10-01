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

export type ClimateIntegration = {
  id: string;
  provider: "change_org";
  status: "draft" | "active" | "disabled";
  public_url: string | null;
  minimum_age: number;
  public_label: string;
  updated_at: string;
};

export type ClimateOpsSummary = {
  reports: number;
  schoolsWithReports: number;
  signatures: number;
  studentSupports: number;
  totalSupports: number;
  protocols: ClimateProtocol[];
  integrations: ClimateIntegration[];
};

function climateClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = getSupabaseSecretKey();
  if (!url || !secret) throw new Error("Supabase não configurado para a operação de climatização.");
  return createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function listClimateOpsSummary(): Promise<ClimateOpsSummary> {
  const db = climateClient();
  const [reports, schools, signatures, studentSupports, protocols, integrations] = await Promise.all([
    db.from("clima_reports").select("id", { count: "exact", head: true }),
    db.from("clima_school_stats").select("id").gt("report_count", 0),
    db.from("clima_signatures").select("id", { count: "exact", head: true }),
    db.from("clima_student_supports").select("id", { count: "exact", head: true }),
    db.from("clima_protocols")
      .select("id,title,recipient,channel,protocol_number,status,submitted_at,due_at,extension_due_at,request_text,legal_basis,tracking_url,public_note,response_url,response_summary,last_checked_at,updated_at")
      .order("created_at", { ascending: true }),
    db.from("clima_integrations")
      .select("id,provider,status,public_url,minimum_age,public_label,updated_at")
      .order("provider", { ascending: true }),
  ]);

  if (reports.error) throw new Error(reports.error.message);
  if (schools.error) throw new Error(schools.error.message);
  if (signatures.error) throw new Error(signatures.error.message);
  if (studentSupports.error) throw new Error(studentSupports.error.message);
  if (protocols.error) throw new Error(protocols.error.message);
  if (integrations.error) throw new Error(integrations.error.message);

  const adultSignatures = signatures.count ?? 0;
  const minorSupports = studentSupports.count ?? 0;

  return {
    reports: reports.count ?? 0,
    schoolsWithReports: schools.data?.length ?? 0,
    signatures: adultSignatures,
    studentSupports: minorSupports,
    totalSupports: adultSignatures + minorSupports,
    protocols: (protocols.data ?? []) as ClimateProtocol[],
    integrations: (integrations.data ?? []) as ClimateIntegration[],
  };
}

export function getClimateAdminClient() {
  return climateClient();
}


export type ClimateEvidence = {
  id: string;
  school_id: number | null;
  protocol_id: string | null;
  evidence_type: string;
  source_kind: string;
  title: string;
  source_url: string | null;
  source_authority: string | null;
  document_date: string | null;
  content_sha256: string | null;
  verification_status: string;
  public_note: string | null;
  created_at: string;
};

export type ClimateSchoolOption = {
  id: number;
  name: string;
  network: string;
};

export type ClimateEvidenceOps = {
  evidence: ClimateEvidence[];
  schools: ClimateSchoolOption[];
  ledgerCount: number;
  ledgerHead: { id: number; entry_hash: string; created_at: string } | null;
};

export async function listClimateEvidenceOps(): Promise<ClimateEvidenceOps> {
  const db = climateClient();
  const [evidence, schools, ledgerCount, ledgerHead] = await Promise.all([
    db.from("clima_evidence")
      .select("id,school_id,protocol_id,evidence_type,source_kind,title,source_url,source_authority,document_date,content_sha256,verification_status,public_note,created_at")
      .order("created_at", { ascending: false })
      .limit(30),
    db.from("clima_schools")
      .select("id,name,network")
      .eq("active", true)
      .order("name"),
    db.from("clima_public_ledger").select("id", { count: "exact", head: true }),
    db.from("clima_public_ledger")
      .select("id,entry_hash,created_at")
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (evidence.error) throw new Error(evidence.error.message);
  if (schools.error) throw new Error(schools.error.message);
  if (ledgerCount.error) throw new Error(ledgerCount.error.message);
  if (ledgerHead.error) throw new Error(ledgerHead.error.message);

  return {
    evidence: (evidence.data ?? []) as ClimateEvidence[],
    schools: (schools.data ?? []) as ClimateSchoolOption[],
    ledgerCount: ledgerCount.count ?? 0,
    ledgerHead: ledgerHead.data ?? null,
  };
}


export type ClimateCaseOpsItem = {
  id: string;
  school_id: number;
  school_name: string;
  school_network: string;
  issue: string;
  status: string;
  report_count: number;
  opened_at: string;
  last_report_at: string | null;
  updated_at: string;
  resolved_at: string | null;
  public_note: string | null;
  evidence_count: number;
  protocol_count: number;
};

export type ClimateEvidenceSubmission = {
  id: string;
  school_id: number;
  school_name: string;
  school_network: string;
  issue: string | null;
  title: string;
  source_url: string;
  source_kind: string;
  public_note: string | null;
  status: "pending" | "accepted" | "rejected";
  review_note: string | null;
  resulting_evidence_id: string | null;
  created_at: string;
  reviewed_at: string | null;
};

export type ClimateCaseOps = {
  cases: ClimateCaseOpsItem[];
  pendingSubmissions: ClimateEvidenceSubmission[];
};

export async function listClimateCaseOps(): Promise<ClimateCaseOps> {
  const db = climateClient();

  const [cases, submissions, schools, caseEvidence, caseProtocols] = await Promise.all([
    db.from("clima_school_cases")
      .select("id,school_id,issue,status,report_count,opened_at,last_report_at,updated_at,resolved_at,public_note")
      .order("updated_at", { ascending: false })
      .limit(200),
    db.from("clima_evidence_submissions")
      .select("id,school_id,issue,title,source_url,source_kind,public_note,status,review_note,resulting_evidence_id,created_at,reviewed_at")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(100),
    db.from("clima_schools")
      .select("id,name,network")
      .eq("active", true),
    db.from("clima_case_evidence").select("case_id,evidence_id"),
    db.from("clima_case_protocols").select("case_id,protocol_id"),
  ]);

  if (cases.error) throw new Error(cases.error.message);
  if (submissions.error) throw new Error(submissions.error.message);
  if (schools.error) throw new Error(schools.error.message);
  if (caseEvidence.error) throw new Error(caseEvidence.error.message);
  if (caseProtocols.error) throw new Error(caseProtocols.error.message);

  const schoolsById = new Map((schools.data ?? []).map((school) => [Number(school.id), school]));
  const evidenceCount = new Map<string, number>();
  const protocolCount = new Map<string, number>();

  for (const row of caseEvidence.data ?? []) {
    evidenceCount.set(row.case_id, (evidenceCount.get(row.case_id) ?? 0) + 1);
  }
  for (const row of caseProtocols.data ?? []) {
    protocolCount.set(row.case_id, (protocolCount.get(row.case_id) ?? 0) + 1);
  }

  return {
    cases: (cases.data ?? []).map((item) => {
      const school = schoolsById.get(Number(item.school_id));
      return {
        ...item,
        school_name: school?.name ?? "Unidade desconhecida",
        school_network: school?.network ?? "—",
        evidence_count: evidenceCount.get(item.id) ?? 0,
        protocol_count: protocolCount.get(item.id) ?? 0,
      };
    }) as ClimateCaseOpsItem[],
    pendingSubmissions: (submissions.data ?? []).map((item) => {
      const school = schoolsById.get(Number(item.school_id));
      return {
        ...item,
        school_name: school?.name ?? "Unidade desconhecida",
        school_network: school?.network ?? "—",
      };
    }) as ClimateEvidenceSubmission[],
  };
}
