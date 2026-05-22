import { headers } from "next/headers";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { canManageContacts } from "@/lib/authz/roles";
import { shouldUseMockData } from "@/lib/config";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Json, TableInsert, TableRow, TableUpdate } from "@/lib/supabase/database.types";
import type { AuditAction } from "@/lib/types";
import {
  createVolunteer,
  VOLUNTEER_PERIODS,
  VOLUNTEER_SKILLS,
  VOLUNTEER_WEEKDAYS,
  type VolunteerAvailability,
  type VolunteerContactPreference,
  type VolunteerPeriod,
  type VolunteerStatus,
  type VolunteerWeekday,
} from "./volunteers";

export type VolunteerApplicationStatus = "pending" | "approved" | "rejected" | "archived";
export type VolunteerApplicationRetentionStatus = "active" | "scheduled_for_redaction" | "redacted" | "retained";
export type VolunteerApplicationRow = TableRow<"campaign_volunteer_applications">;

export type VolunteerApplication = {
  id: string;
  displayName: string;
  neighborhood: string | null;
  city: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  contactPreference: VolunteerContactPreference;
  consentToContact: boolean;
  consentToStoreData: boolean;
  availability: VolunteerAvailability;
  skills: string[];
  interests: string[];
  status: VolunteerApplicationStatus;
  reviewNotes: string | null;
  reviewedBy: string | null;
  reviewedByEmail: string | null;
  reviewedAt: string | null;
  convertedVolunteerId: string | null;
  createdAt: string;
  metadata: Json;
  retentionStatus: VolunteerApplicationRetentionStatus;
  retentionReason: string | null;
  redactedAt: string | null;
  redactedBy: string | null;
  redactedByEmail: string | null;
  scheduledRedactionAt: string | null;
};

export type VolunteerApplicationListItem = Omit<VolunteerApplication, "contactEmail" | "contactPhone"> & {
  hasContact: boolean;
};

export type VolunteerApplicationInput = {
  displayName: string;
  neighborhood?: string | null;
  city?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  contactPreference?: VolunteerContactPreference;
  consentToContact: boolean;
  consentToStoreData: boolean;
  availability?: Partial<VolunteerAvailability> | null;
  skills?: string[];
  interests?: string[];
  honeypot?: string | null;
  metadata?: Json;
};

export type VolunteerApplicationFilters = {
  status?: VolunteerApplicationStatus;
  neighborhood?: string;
  skill?: string;
  interest?: string;
};

type Actor = { id: string; email: string | null };

const publicRateLimit = new Map<string, number[]>();
const MAX_PUBLIC_SUBMISSIONS_PER_HOUR = 5;

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, " ").replace(/[<>]/g, " ");
}

export function sanitizePublicText(value: string | null | undefined, maxLength = 160) {
  const trimmed = stripHtml(value ?? "").replace(/\s+/g, " ").trim();
  return trimmed.slice(0, maxLength) || null;
}

function normalizeArray(values: string[] | null | undefined, maxItems = 12, maxLength = 60) {
  return Array.from(
    new Set(
      (values ?? [])
        .map((value) => sanitizePublicText(value, maxLength))
        .filter((value): value is string => Boolean(value)),
    ),
  ).slice(0, maxItems);
}

function normalizeSkills(values: string[] | null | undefined) {
  const allowed = new Set(VOLUNTEER_SKILLS);
  return normalizeArray(values).filter((value) => allowed.has(value as (typeof VOLUNTEER_SKILLS)[number]) || value === "outro");
}

function parseJsonStringArray(value: Json | null | undefined) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
}

function toAvailability(value: Json | null | undefined): VolunteerAvailability {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { weekdays: [], periods: [], notes: null };
  const weekdays = Array.isArray(value.weekdays)
    ? value.weekdays.filter((item): item is VolunteerWeekday => typeof item === "string" && VOLUNTEER_WEEKDAYS.includes(item as VolunteerWeekday))
    : [];
  const periods = Array.isArray(value.periods)
    ? value.periods.filter((item): item is VolunteerPeriod => typeof item === "string" && VOLUNTEER_PERIODS.includes(item as VolunteerPeriod))
    : [];
  return { weekdays, periods, notes: sanitizePublicText(typeof value.notes === "string" ? value.notes : null, 280) };
}

function toAvailabilityJson(value: Partial<VolunteerAvailability> | null | undefined): Json {
  return {
    weekdays: Array.from(new Set((value?.weekdays ?? []).filter((item): item is VolunteerWeekday => VOLUNTEER_WEEKDAYS.includes(item as VolunteerWeekday)))),
    periods: Array.from(new Set((value?.periods ?? []).filter((item): item is VolunteerPeriod => VOLUNTEER_PERIODS.includes(item as VolunteerPeriod)))),
    notes: sanitizePublicText(value?.notes, 280),
  };
}

function toApplication(row: VolunteerApplicationRow): VolunteerApplication {
  return {
    id: row.id,
    displayName: row.display_name,
    neighborhood: row.neighborhood,
    city: row.city,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    contactPreference: row.contact_preference as VolunteerContactPreference,
    consentToContact: row.consent_to_contact,
    consentToStoreData: row.consent_to_store_data,
    availability: toAvailability(row.availability),
    skills: parseJsonStringArray(row.skills),
    interests: parseJsonStringArray(row.interests),
    status: row.status as VolunteerApplicationStatus,
    reviewNotes: row.review_notes,
    reviewedBy: row.reviewed_by,
    reviewedByEmail: row.reviewed_by_email,
    reviewedAt: row.reviewed_at,
    convertedVolunteerId: row.converted_volunteer_id,
    createdAt: row.created_at,
    metadata: row.metadata,
    retentionStatus: (row.retention_status ?? "active") as VolunteerApplicationRetentionStatus,
    retentionReason: row.retention_reason ?? null,
    redactedAt: row.redacted_at ?? null,
    redactedBy: row.redacted_by ?? null,
    redactedByEmail: row.redacted_by_email ?? null,
    scheduledRedactionAt: row.scheduled_redaction_at ?? null,
  };
}

export function sanitizeApplicationForList(application: VolunteerApplication): VolunteerApplicationListItem {
  const { contactEmail, contactPhone, ...rest } = application;
  return { ...rest, hasContact: Boolean(contactEmail || contactPhone) };
}

export function validateVolunteerApplicationInput(input: VolunteerApplicationInput) {
  const errors: string[] = [];
  const displayName = sanitizePublicText(input.displayName, 120);
  const contactEmail = sanitizePublicText(input.contactEmail, 160);
  const contactPhone = sanitizePublicText(input.contactPhone, 40);
  const hasContact = Boolean(contactEmail || contactPhone);

  if (sanitizePublicText(input.honeypot, 80)) errors.push("Inscrição bloqueada.");
  if (!displayName) errors.push("Nome de exibição é obrigatório.");
  if (!input.consentToStoreData) errors.push("Consentimento para guardar dados é obrigatório.");
  if (hasContact && !input.consentToContact) errors.push("Contato preenchido exige consentimento para contato.");
  if (!hasContact && (input.contactPreference ?? "nenhum") !== "nenhum") {
    errors.push("Preferência de contato só pode ser definida quando houver contato consentido.");
  }

  return { valid: errors.length === 0, errors };
}

export function checkPublicVolunteerApplicationRateLimit(ip: string, now = Date.now()) {
  const windowStart = now - 60 * 60 * 1000;
  const entries = (publicRateLimit.get(ip) ?? []).filter((timestamp) => timestamp > windowStart);
  if (entries.length >= MAX_PUBLIC_SUBMISSIONS_PER_HOUR) return false;
  entries.push(now);
  publicRateLimit.set(ip, entries);
  return true;
}

export function resetVolunteerApplicationRateLimitForTests() {
  publicRateLimit.clear();
}

async function getRequestIp() {
  const requestHeaders = await headers();
  return requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || requestHeaders.get("x-real-ip") || "local";
}

function buildApplicationInsert(input: VolunteerApplicationInput): TableInsert<"campaign_volunteer_applications"> {
  const contactEmail = sanitizePublicText(input.contactEmail, 160);
  const contactPhone = sanitizePublicText(input.contactPhone, 40);
  const hasContact = Boolean(contactEmail || contactPhone);
  return {
    display_name: sanitizePublicText(input.displayName, 120) ?? "",
    neighborhood: sanitizePublicText(input.neighborhood, 120),
    city: sanitizePublicText(input.city, 120),
    contact_email: contactEmail,
    contact_phone: contactPhone,
    contact_preference: hasContact && input.consentToContact ? input.contactPreference ?? "nenhum" : "nenhum",
    consent_to_contact: input.consentToContact,
    consent_to_store_data: input.consentToStoreData,
    availability: toAvailabilityJson(input.availability),
    skills: normalizeSkills(input.skills),
    interests: normalizeArray(input.interests),
    status: "pending",
    metadata: input.metadata ?? {},
  };
}

export async function submitVolunteerApplication(input: VolunteerApplicationInput) {
  const validation = validateVolunteerApplicationInput(input);
  if (!validation.valid) throw new Error(validation.errors.join(" "));
  const ip = await getRequestIp();
  if (!checkPublicVolunteerApplicationRateLimit(ip)) throw new Error("Muitas inscrições recentes. Tente novamente mais tarde.");
  if (shouldUseMockData()) return undefined;

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.from("campaign_volunteer_applications").insert(buildApplicationInsert(input)).select("*").single();
  if (error) throw error;

  await writeAuditLog({
    actorId: null,
    actorEmail: null,
    action: "volunteer_application.submitted",
    entityType: "campaign_volunteer_applications",
    entityId: data.id,
    summary: "Inscrição pública de voluntariado recebida para revisão.",
    metadata: { status: data.status, hasContact: Boolean(data.contact_email || data.contact_phone) },
  });

  return toApplication(data);
}

function applyFilters(items: VolunteerApplicationListItem[], filters?: VolunteerApplicationFilters) {
  return items.filter((item) => {
    if (filters?.status && item.status !== filters.status) return false;
    if (filters?.neighborhood && item.neighborhood !== filters.neighborhood) return false;
    if (filters?.skill && !item.skills.includes(filters.skill)) return false;
    if (filters?.interest && !item.interests.includes(filters.interest)) return false;
    return true;
  });
}

export async function listVolunteerApplications(filters?: VolunteerApplicationFilters) {
  if (shouldUseMockData()) return [];
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.from("campaign_volunteer_applications").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return applyFilters((data ?? []).map((row) => sanitizeApplicationForList(toApplication(row))), filters);
}

export async function getVolunteerApplication(id: string, options?: { includeContact?: boolean }) {
  if (shouldUseMockData()) return null;
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.from("campaign_volunteer_applications").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const application = toApplication(data);
  return options?.includeContact ? application : { ...application, contactEmail: null, contactPhone: null };
}

export async function approveVolunteerApplication(id: string, input: { volunteerStatus?: VolunteerStatus; reviewNotes?: string | null }, actor: Actor) {
  if (shouldUseMockData()) return undefined;
  const application = await getVolunteerApplication(id, { includeContact: true });
  if (!application) throw new Error("Inscrição não encontrada.");
  if (application.status !== "pending") throw new Error("Apenas inscrições pendentes podem ser aprovadas.");

  const volunteer = await createVolunteer(
    {
      displayName: application.displayName,
      neighborhood: application.neighborhood,
      city: application.city,
      contactEmail: application.consentToContact ? application.contactEmail : null,
      contactPhone: application.consentToContact ? application.contactPhone : null,
      contactPreference: application.consentToContact ? application.contactPreference : "nenhum",
      consentToContact: application.consentToContact,
      consentToStoreData: application.consentToStoreData,
      availability: application.availability,
      skills: application.skills,
      interests: application.interests,
      status: input.volunteerStatus ?? "novo",
      source: "formulario",
      metadata: { publicApplicationId: application.id },
    },
    actor,
  );

  const update: TableUpdate<"campaign_volunteer_applications"> = {
    status: "approved",
    review_notes: sanitizePublicText(input.reviewNotes, 1000),
    reviewed_by: actor.id,
    reviewed_by_email: actor.email,
    reviewed_at: new Date().toISOString(),
    converted_volunteer_id: volunteer?.id ?? null,
  };

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.from("campaign_volunteer_applications").update(update).eq("id", id).select("*").single();
  if (error) throw error;

  await writeAuditLog({ actorId: actor.id, actorEmail: actor.email, action: "volunteer_application.approved", entityType: "campaign_volunteer_applications", entityId: id, summary: "Inscrição pública aprovada.", metadata: { volunteerId: volunteer?.id } });
  await writeAuditLog({ actorId: actor.id, actorEmail: actor.email, action: "volunteer_application.converted_to_volunteer", entityType: "campaign_volunteers", entityId: volunteer?.id ?? null, summary: "Inscrição pública convertida em voluntário após revisão humana.", metadata: { applicationId: id } });

  return toApplication(data);
}

export async function rejectVolunteerApplication(id: string, notes: string, actor: Actor) {
  return updateApplicationStatus(id, "rejected", notes, actor, "volunteer_application.rejected");
}

export async function archiveVolunteerApplication(id: string, actor: Actor) {
  return updateApplicationStatus(id, "archived", null, actor, "volunteer_application.archived");
}

async function updateApplicationStatus(id: string, status: "rejected" | "archived", notes: string | null, actor: Actor, action: AuditAction) {
  if (shouldUseMockData()) return undefined;
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("campaign_volunteer_applications")
    .update({
      status,
      review_notes: sanitizePublicText(notes, 1000),
      reviewed_by: actor.id,
      reviewed_by_email: actor.email,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  await writeAuditLog({ actorId: actor.id, actorEmail: actor.email, action, entityType: "campaign_volunteer_applications", entityId: id, summary: `Inscrição pública marcada como ${status}.` });
  return toApplication(data);
}

export async function updateVolunteerApplicationReviewNotes(id: string, notes: string, actor: Actor) {
  if (shouldUseMockData()) return undefined;
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("campaign_volunteer_applications")
    .update({ review_notes: sanitizePublicText(notes, 1000), reviewed_by: actor.id, reviewed_by_email: actor.email, reviewed_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  await writeAuditLog({ actorId: actor.id, actorEmail: actor.email, action: "volunteer_application.review_notes_updated", entityType: "campaign_volunteer_applications", entityId: id, summary: "Nota de revisão da inscrição atualizada." });
  return toApplication(data);
}

export function assertVolunteerApplicationExportAllowed(role: string, includeContact: boolean) {
  if (!(role === "admin" || role === "operador")) throw new Error("A exportação de inscrições exige perfil admin ou operador.");
  if (includeContact && role !== "admin") throw new Error("A exportação de inscrições com contato exige perfil admin.");
}

export function buildVolunteerApplicationExportRows(items: Array<VolunteerApplication | VolunteerApplicationListItem>, options?: { includeContact?: boolean }) {
  const includeContact = options?.includeContact ?? false;
  return items.map((item) => {
    const base = {
      nome_exibicao: item.displayName,
      bairro: item.neighborhood,
      cidade: item.city,
      habilidades: item.skills.join(", "),
      interesses: item.interests.join(", "),
      status: item.status,
      criado_em: item.createdAt,
      retention_status: item.retentionStatus,
    };
    if (item.retentionStatus === "redacted" || !includeContact || !("contactEmail" in item) || !("contactPhone" in item)) return base;
    return {
      ...base,
      contact_email: item.consentToContact ? item.contactEmail : null,
      contact_phone: item.consentToContact ? item.contactPhone : null,
    };
  });
}

export async function listVolunteerApplicationsForExport(role: string, includeContact: boolean) {
  const include = includeContact && canManageContacts(role);
  const items = await listVolunteerApplications();
  if (!include) return items;
  if (shouldUseMockData()) return [];
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.from("campaign_volunteer_applications").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toApplication);
}

export async function getVolunteerApplicationHealthStats() {
  if (shouldUseMockData()) return { volunteerApplicationsCount: 0, volunteerApplicationsPendingCount: 0, volunteerApplicationsApprovedCount: 0, volunteerApplicationsRejectedCount: 0 };
  const supabase = getSupabaseAdminClient();
  const [total, pending, approved, rejected] = await Promise.all([
    supabase.from("campaign_volunteer_applications").select("*", { count: "exact", head: true }),
    supabase.from("campaign_volunteer_applications").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("campaign_volunteer_applications").select("*", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("campaign_volunteer_applications").select("*", { count: "exact", head: true }).eq("status", "rejected"),
  ]);
  return {
    volunteerApplicationsCount: total.count ?? 0,
    volunteerApplicationsPendingCount: pending.count ?? 0,
    volunteerApplicationsApprovedCount: approved.count ?? 0,
    volunteerApplicationsRejectedCount: rejected.count ?? 0,
  };
}
