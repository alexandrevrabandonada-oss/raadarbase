import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { shouldUseMockData } from "@/lib/config";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Json, TableUpdate } from "@/lib/supabase/database.types";
import type { VolunteerApplication, VolunteerApplicationRetentionStatus, VolunteerApplicationStatus } from "./volunteer-applications";
import { sanitizePublicText } from "./volunteer-applications";

type Actor = { id: string; email: string | null };

export type VolunteerApplicationRetentionFilters = {
  status?: VolunteerApplicationStatus;
  retentionStatus?: VolunteerApplicationRetentionStatus;
};

export type VolunteerApplicationRetentionSummary = {
  pendingOld: VolunteerApplication[];
  rejectedEligible: VolunteerApplication[];
  archivedEligible: VolunteerApplication[];
  retained: VolunteerApplication[];
  redacted: VolunteerApplication[];
  scheduled: VolunteerApplication[];
  eligibleForRedactionCount: number;
  redactedCount: number;
  scheduledRedactionCount: number;
  retainedCount: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const PENDING_REVIEW_DAYS = 90;
const REDACTION_ELIGIBLE_DAYS = 30;

function ageInDays(date: string, now = new Date()) {
  return Math.floor((now.getTime() - new Date(date).getTime()) / DAY_MS);
}

export function isPendingReviewStale(application: Pick<VolunteerApplication, "status" | "createdAt" | "retentionStatus">, now = new Date()) {
  return application.status === "pending" && application.retentionStatus === "active" && ageInDays(application.createdAt, now) > PENDING_REVIEW_DAYS;
}

export function isApplicationEligibleForRedaction(
  application: Pick<VolunteerApplication, "status" | "createdAt" | "convertedVolunteerId" | "retentionStatus">,
  now = new Date(),
) {
  if (application.retentionStatus === "redacted" || application.retentionStatus === "retained") return false;
  if (application.status === "approved" && application.convertedVolunteerId) return false;
  if (application.status !== "rejected" && application.status !== "archived") return false;
  return ageInDays(application.createdAt, now) > REDACTION_ELIGIBLE_DAYS;
}

export function validateRetentionReason(reason: string | null | undefined) {
  const clean = sanitizePublicText(reason, 1000);
  if (!clean) throw new Error("Informe uma justificativa operacional para retenção ou anonimização.");
  return clean;
}

export function buildRedactedApplicationUpdate(reason: string, actor: Actor, now = new Date()): TableUpdate<"campaign_volunteer_applications"> {
  return {
    display_name: "Inscrição anonimizada",
    contact_email: null,
    contact_phone: null,
    contact_preference: "nenhum",
    consent_to_contact: false,
    review_notes: "Notas de revisão redigidas por política de retenção.",
    metadata: { redacted: true, redactedReason: reason } as Json,
    retention_status: "redacted",
    retention_reason: reason,
    redacted_at: now.toISOString(),
    redacted_by: actor.id,
    redacted_by_email: actor.email,
    scheduled_redaction_at: null,
  };
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
    retentionStatus: String(row.retention_status ?? "active") as VolunteerApplicationRetentionStatus,
    retentionReason: row.retention_reason as string | null,
    redactedAt: row.redacted_at as string | null,
    redactedBy: row.redacted_by as string | null,
    redactedByEmail: row.redacted_by_email as string | null,
    scheduledRedactionAt: row.scheduled_redaction_at as string | null,
  };
}

async function listAllApplications() {
  if (shouldUseMockData()) return [];
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.from("campaign_volunteer_applications").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => toApplication(row));
}

export function buildRetentionSummary(applications: VolunteerApplication[], now = new Date()): VolunteerApplicationRetentionSummary {
  const rejectedEligible = applications.filter((item) => item.status === "rejected" && isApplicationEligibleForRedaction(item, now));
  const archivedEligible = applications.filter((item) => item.status === "archived" && isApplicationEligibleForRedaction(item, now));
  return {
    pendingOld: applications.filter((item) => isPendingReviewStale(item, now)),
    rejectedEligible,
    archivedEligible,
    retained: applications.filter((item) => item.retentionStatus === "retained"),
    redacted: applications.filter((item) => item.retentionStatus === "redacted"),
    scheduled: applications.filter((item) => item.retentionStatus === "scheduled_for_redaction"),
    eligibleForRedactionCount: rejectedEligible.length + archivedEligible.length,
    redactedCount: applications.filter((item) => item.retentionStatus === "redacted").length,
    scheduledRedactionCount: applications.filter((item) => item.retentionStatus === "scheduled_for_redaction").length,
    retainedCount: applications.filter((item) => item.retentionStatus === "retained").length,
  };
}

export async function getVolunteerApplicationRetentionSummary() {
  return buildRetentionSummary(await listAllApplications());
}

export async function listApplicationsEligibleForRetentionAction() {
  return getVolunteerApplicationRetentionSummary();
}

async function getApplication(id: string) {
  const applications = await listAllApplications();
  return applications.find((item) => item.id === id) ?? null;
}

export async function scheduleVolunteerApplicationRedaction(id: string, reason: string, actor: Actor) {
  const cleanReason = validateRetentionReason(reason);
  if (shouldUseMockData()) return undefined;
  const application = await getApplication(id);
  if (!application) throw new Error("Inscrição não encontrada.");
  if (!isApplicationEligibleForRedaction(application)) throw new Error("Inscrição não é elegível para anonimização.");

  const scheduledAt = new Date().toISOString();
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("campaign_volunteer_applications")
    .update({ retention_status: "scheduled_for_redaction", retention_reason: cleanReason, scheduled_redaction_at: scheduledAt })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;

  await writeAuditLog({ actorId: actor.id, actorEmail: actor.email, action: "volunteer_application.redaction_scheduled", entityType: "campaign_volunteer_applications", entityId: id, summary: "Anonimização de inscrição pública agendada.", metadata: { reason: cleanReason } });
  return toApplication(data);
}

export async function redactVolunteerApplication(id: string, reason: string, actor: Actor) {
  const cleanReason = validateRetentionReason(reason);
  if (shouldUseMockData()) return undefined;
  const application = await getApplication(id);
  if (!application) throw new Error("Inscrição não encontrada.");
  if (!isApplicationEligibleForRedaction(application)) throw new Error("Inscrição não é elegível para anonimização.");

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("campaign_volunteer_applications")
    .update(buildRedactedApplicationUpdate(cleanReason, actor))
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;

  await writeAuditLog({ actorId: actor.id, actorEmail: actor.email, action: "volunteer_application.redacted", entityType: "campaign_volunteer_applications", entityId: id, summary: "Inscrição pública anonimizada com retenção de histórico operacional.", metadata: { reason: cleanReason } });
  return toApplication(data);
}

export async function markVolunteerApplicationRetained(id: string, reason: string, actor: Actor) {
  const cleanReason = validateRetentionReason(reason);
  if (shouldUseMockData()) return undefined;
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("campaign_volunteer_applications")
    .update({ retention_status: "retained", retention_reason: cleanReason, scheduled_redaction_at: null })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  await writeAuditLog({ actorId: actor.id, actorEmail: actor.email, action: "volunteer_application.retained", entityType: "campaign_volunteer_applications", entityId: id, summary: "Inscrição pública marcada como retida por justificativa operacional.", metadata: { reason: cleanReason } });
  return toApplication(data);
}

function matchesFilters(application: VolunteerApplication, filters?: VolunteerApplicationRetentionFilters) {
  if (filters?.status && application.status !== filters.status) return false;
  if (filters?.retentionStatus && application.retentionStatus !== filters.retentionStatus) return false;
  return true;
}

export async function bulkScheduleVolunteerApplicationRedaction(filters: VolunteerApplicationRetentionFilters, reason: string, actor: Actor) {
  const cleanReason = validateRetentionReason(reason);
  const applications = (await listAllApplications()).filter((item) => matchesFilters(item, filters) && isApplicationEligibleForRedaction(item));
  if (shouldUseMockData() || applications.length === 0) return { count: applications.length };
  const supabase = getSupabaseAdminClient();
  const ids = applications.map((item) => item.id);
  const { error } = await supabase
    .from("campaign_volunteer_applications")
    .update({ retention_status: "scheduled_for_redaction", retention_reason: cleanReason, scheduled_redaction_at: new Date().toISOString() })
    .in("id", ids);
  if (error) throw error;
  await writeAuditLog({ actorId: actor.id, actorEmail: actor.email, action: "volunteer_application.bulk_redaction_scheduled", entityType: "campaign_volunteer_applications", entityId: null, summary: "Anonimização em massa de inscrições agendada.", metadata: { count: ids.length, reason: cleanReason } });
  return { count: ids.length };
}

export async function bulkRedactVolunteerApplications(filters: VolunteerApplicationRetentionFilters, reason: string, actor: Actor) {
  const cleanReason = validateRetentionReason(reason);
  const applications = (await listAllApplications()).filter((item) => matchesFilters(item, filters) && isApplicationEligibleForRedaction(item));
  if (shouldUseMockData() || applications.length === 0) return { count: applications.length };
  const supabase = getSupabaseAdminClient();
  const ids = applications.map((item) => item.id);
  const { error } = await supabase
    .from("campaign_volunteer_applications")
    .update(buildRedactedApplicationUpdate(cleanReason, actor))
    .in("id", ids);
  if (error) throw error;
  await writeAuditLog({ actorId: actor.id, actorEmail: actor.email, action: "volunteer_application.bulk_redacted", entityType: "campaign_volunteer_applications", entityId: null, summary: "Inscrições públicas anonimizadas em massa.", metadata: { count: ids.length, reason: cleanReason } });
  return { count: ids.length };
}
