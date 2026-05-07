import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { shouldUseMockData } from "@/lib/config";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Json, TableInsert, TableRow, TableUpdate } from "@/lib/supabase/database.types";
import { buildRetentionSummary, isApplicationEligibleForRedaction } from "./volunteer-application-retention";
import type { VolunteerApplication, VolunteerApplicationStatus } from "./volunteer-applications";
import { sanitizePublicText } from "./volunteer-applications";

type Actor = { id: string; email: string | null };
export type VolunteerReviewRoundStatus = "open" | "done" | "archived";
type RoundRow = TableRow<"volunteer_review_rounds">;

export type VolunteerReviewRound = {
  id: string;
  title: string;
  status: VolunteerReviewRoundStatus;
  reviewedPendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  archivedCount: number;
  redactedCount: number;
  retainedCount: number;
  notes: string | null;
  createdBy: string | null;
  createdByEmail: string | null;
  createdAt: string;
  completedAt: string | null;
  metadata: Json;
};

export type VolunteerReviewDashboard = {
  pending7d: VolunteerApplication[];
  pending30d: VolunteerApplication[];
  pending90d: VolunteerApplication[];
  rejectedEligible: VolunteerApplication[];
  archivedEligible: VolunteerApplication[];
  redacted: VolunteerApplication[];
  redactionScheduled: VolunteerApplication[];
  retained: VolunteerApplication[];
  consentIssues: VolunteerApplication[];
  missingNeighborhood: VolunteerApplication[];
  missingSkillsOrInterests: VolunteerApplication[];
  latestRound: VolunteerReviewRound | null;
  roundsCount: number;
  statusCounts: Record<VolunteerApplicationStatus, number>;
  recommendations: string[];
};

const DAY_MS = 24 * 60 * 60 * 1000;

function ageInDays(date: string, now = new Date()) {
  return Math.floor((now.getTime() - new Date(date).getTime()) / DAY_MS);
}

function toApplication(row: Record<string, unknown>): VolunteerApplication {
  const availability = row.availability && typeof row.availability === "object" && !Array.isArray(row.availability)
    ? row.availability as { weekdays?: unknown; periods?: unknown; notes?: unknown }
    : {};
  return {
    id: String(row.id),
    displayName: String(row.display_name ?? ""),
    neighborhood: row.neighborhood as string | null,
    city: row.city as string | null,
    contactEmail: row.contact_email as string | null,
    contactPhone: row.contact_phone as string | null,
    contactPreference: String(row.contact_preference ?? "nenhum") as VolunteerApplication["contactPreference"],
    consentToContact: Boolean(row.consent_to_contact),
    consentToStoreData: Boolean(row.consent_to_store_data),
    availability: {
      weekdays: Array.isArray(availability.weekdays) ? availability.weekdays as VolunteerApplication["availability"]["weekdays"] : [],
      periods: Array.isArray(availability.periods) ? availability.periods as VolunteerApplication["availability"]["periods"] : [],
      notes: typeof availability.notes === "string" ? availability.notes : null,
    },
    skills: Array.isArray(row.skills) ? row.skills.filter((item): item is string => typeof item === "string") : [],
    interests: Array.isArray(row.interests) ? row.interests.filter((item): item is string => typeof item === "string") : [],
    status: String(row.status) as VolunteerApplicationStatus,
    reviewNotes: row.review_notes as string | null,
    reviewedBy: row.reviewed_by as string | null,
    reviewedByEmail: row.reviewed_by_email as string | null,
    reviewedAt: row.reviewed_at as string | null,
    convertedVolunteerId: row.converted_volunteer_id as string | null,
    createdAt: String(row.created_at),
    metadata: row.metadata as Json,
    retentionStatus: String(row.retention_status ?? "active") as VolunteerApplication["retentionStatus"],
    retentionReason: row.retention_reason as string | null,
    redactedAt: row.redacted_at as string | null,
    redactedBy: row.redacted_by as string | null,
    redactedByEmail: row.redacted_by_email as string | null,
    scheduledRedactionAt: row.scheduled_redaction_at as string | null,
  };
}

function toRound(row: RoundRow): VolunteerReviewRound {
  return {
    id: row.id,
    title: row.title,
    status: row.status as VolunteerReviewRoundStatus,
    reviewedPendingCount: row.reviewed_pending_count,
    approvedCount: row.approved_count,
    rejectedCount: row.rejected_count,
    archivedCount: row.archived_count,
    redactedCount: row.redacted_count,
    retainedCount: row.retained_count,
    notes: row.notes,
    createdBy: row.created_by,
    createdByEmail: row.created_by_email,
    createdAt: row.created_at,
    completedAt: row.completed_at,
    metadata: row.metadata,
  };
}

async function listApplications() {
  if (shouldUseMockData()) return [];
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.from("campaign_volunteer_applications").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toApplication);
}

export async function listVolunteerReviewRounds() {
  if (shouldUseMockData()) return [];
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.from("volunteer_review_rounds").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toRound);
}

export function getPendingApplicationsByAge(applications: VolunteerApplication[], days: number, now = new Date()) {
  return applications.filter((item) => item.status === "pending" && ageInDays(item.createdAt, now) > days);
}

export function getApplicationsEligibleForRedaction(applications: VolunteerApplication[], now = new Date()) {
  return applications.filter((item) => isApplicationEligibleForRedaction(item, now));
}

export function getApplicationsWithConsentIssues(applications: VolunteerApplication[]) {
  return applications.filter((item) => Boolean(item.contactEmail || item.contactPhone) && !item.consentToContact);
}

export function getApplicationsNeedingReview(applications: VolunteerApplication[], now = new Date()) {
  return applications.filter((item) => item.status === "pending" || ageInDays(item.createdAt, now) > 30 || getApplicationsWithConsentIssues([item]).length > 0);
}

export function getVolunteerReviewRecommendations(dashboard: Pick<VolunteerReviewDashboard, "pending7d" | "pending30d" | "pending90d" | "rejectedEligible" | "archivedEligible" | "retained" | "consentIssues">) {
  const recommendations: string[] = [];
  if (dashboard.pending7d.length > 0) recommendations.push("revisar inscrição");
  if (dashboard.pending30d.length > 0) recommendations.push("aprovar manualmente, se fizer sentido");
  if (dashboard.pending90d.length > 0) recommendations.push("arquivar inscrição antiga");
  if (dashboard.rejectedEligible.length + dashboard.archivedEligible.length > 0) recommendations.push("agendar anonimização");
  if (dashboard.retained.length > 0) recommendations.push("marcar como retida com justificativa");
  if (dashboard.consentIssues.length > 0) recommendations.push("resolver consentimento incompleto");
  return Array.from(new Set(recommendations));
}

export function buildVolunteerReviewDashboard(applications: VolunteerApplication[], rounds: VolunteerReviewRound[], now = new Date()): VolunteerReviewDashboard {
  const retention = buildRetentionSummary(applications, now);
  const dashboard: VolunteerReviewDashboard = {
    pending7d: getPendingApplicationsByAge(applications, 7, now),
    pending30d: getPendingApplicationsByAge(applications, 30, now),
    pending90d: getPendingApplicationsByAge(applications, 90, now),
    rejectedEligible: retention.rejectedEligible,
    archivedEligible: retention.archivedEligible,
    redacted: retention.redacted,
    redactionScheduled: retention.scheduled,
    retained: retention.retained,
    consentIssues: getApplicationsWithConsentIssues(applications),
    missingNeighborhood: applications.filter((item) => !item.neighborhood),
    missingSkillsOrInterests: applications.filter((item) => item.skills.length === 0 && item.interests.length === 0),
    latestRound: rounds[0] ?? null,
    roundsCount: rounds.length,
    statusCounts: {
      pending: applications.filter((item) => item.status === "pending").length,
      approved: applications.filter((item) => item.status === "approved").length,
      rejected: applications.filter((item) => item.status === "rejected").length,
      archived: applications.filter((item) => item.status === "archived").length,
    },
    recommendations: [],
  };
  dashboard.recommendations = getVolunteerReviewRecommendations(dashboard);
  return dashboard;
}

export async function getVolunteerReviewDashboard() {
  const [applications, rounds] = await Promise.all([listApplications(), listVolunteerReviewRounds()]);
  return buildVolunteerReviewDashboard(applications, rounds);
}

export async function createVolunteerReviewRound(input: { title: string; notes?: string | null }, actor: Actor) {
  if (shouldUseMockData()) return undefined;
  const title = sanitizePublicText(input.title, 160);
  if (!title) throw new Error("Título da rodada é obrigatório.");
  const supabase = getSupabaseAdminClient();
  const payload: TableInsert<"volunteer_review_rounds"> = {
    title,
    notes: sanitizePublicText(input.notes, 1000),
    created_by: actor.id,
    created_by_email: actor.email,
  };
  const { data, error } = await supabase.from("volunteer_review_rounds").insert(payload).select("*").single();
  if (error) throw error;
  await writeAuditLog({ actorId: actor.id, actorEmail: actor.email, action: "volunteer_review_round.created", entityType: "volunteer_review_rounds", entityId: data.id, summary: "Rodada de revisão de voluntariado criada." });
  return toRound(data);
}

export async function completeVolunteerReviewRound(id: string, summary: Partial<Omit<VolunteerReviewRound, "id" | "title" | "status" | "createdAt" | "createdBy" | "createdByEmail" | "completedAt" | "metadata">>, actor: Actor) {
  if (shouldUseMockData()) return undefined;
  const update: TableUpdate<"volunteer_review_rounds"> = {
    status: "done",
    reviewed_pending_count: summary.reviewedPendingCount ?? 0,
    approved_count: summary.approvedCount ?? 0,
    rejected_count: summary.rejectedCount ?? 0,
    archived_count: summary.archivedCount ?? 0,
    redacted_count: summary.redactedCount ?? 0,
    retained_count: summary.retainedCount ?? 0,
    notes: sanitizePublicText(summary.notes, 1000),
    completed_at: new Date().toISOString(),
  };
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.from("volunteer_review_rounds").update(update).eq("id", id).select("*").single();
  if (error) throw error;
  await writeAuditLog({ actorId: actor.id, actorEmail: actor.email, action: "volunteer_review_round.completed", entityType: "volunteer_review_rounds", entityId: id, summary: "Rodada de revisão de voluntariado concluída.", metadata: update as Json });
  return toRound(data);
}

export async function archiveVolunteerReviewRound(id: string, actor: Actor) {
  if (shouldUseMockData()) return undefined;
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.from("volunteer_review_rounds").update({ status: "archived" }).eq("id", id).select("*").single();
  if (error) throw error;
  await writeAuditLog({ actorId: actor.id, actorEmail: actor.email, action: "volunteer_review_round.archived", entityType: "volunteer_review_rounds", entityId: id, summary: "Rodada de revisão de voluntariado arquivada." });
  return toRound(data);
}

export function buildVolunteerReviewDashboardExport(dashboard: VolunteerReviewDashboard) {
  return {
    pending_7d_count: dashboard.pending7d.length,
    pending_30d_count: dashboard.pending30d.length,
    pending_90d_count: dashboard.pending90d.length,
    eligible_for_redaction_count: dashboard.rejectedEligible.length + dashboard.archivedEligible.length,
    redacted_count: dashboard.redacted.length,
    scheduled_redaction_count: dashboard.redactionScheduled.length,
    retained_count: dashboard.retained.length,
    approved_count: dashboard.statusCounts.approved,
    rejected_count: dashboard.statusCounts.rejected,
    archived_count: dashboard.statusCounts.archived,
    latest_round: dashboard.latestRound
      ? { title: dashboard.latestRound.title, status: dashboard.latestRound.status, created_at: dashboard.latestRound.createdAt, completed_at: dashboard.latestRound.completedAt }
      : null,
  };
}
