import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { shouldUseMockData } from "@/lib/config";
import type { Json, TableInsert, TableRow, TableUpdate } from "@/lib/supabase/database.types";

export const VOLUNTEER_SKILLS = [
  "rua",
  "arte",
  "video",
  "texto",
  "dados",
  "formacao",
  "eventos",
  "transporte",
  "juridico",
  "saude",
  "educacao",
  "outro",
] as const;

export const VOLUNTEER_WEEKDAYS = ["segunda", "terca", "quarta", "quinta", "sexta", "sabado", "domingo"] as const;
export const VOLUNTEER_PERIODS = ["manha", "tarde", "noite", "fim_de_semana"] as const;

export type VolunteerSkill = (typeof VOLUNTEER_SKILLS)[number];
export type VolunteerWeekday = (typeof VOLUNTEER_WEEKDAYS)[number];
export type VolunteerPeriod = (typeof VOLUNTEER_PERIODS)[number];
export type VolunteerContactPreference = "whatsapp" | "email" | "telefone" | "nenhum";
export type VolunteerStatus = "novo" | "ativo" | "pausado" | "arquivado";
export type VolunteerSource = "formulario" | "evento_campo" | "indicacao" | "outro";
export type SquadKind = "rua" | "comunicacao" | "dados" | "formacao" | "eventos" | "territorio" | "outro";
export type SquadStatus = "ativo" | "pausado" | "arquivado";
export type SquadMemberStatus = "ativo" | "pausado" | "removido";
export type VolunteerEventStatus = "convidado" | "confirmado" | "presente" | "ausente" | "removido";

export type VolunteerAvailability = {
  weekdays: VolunteerWeekday[];
  periods: VolunteerPeriod[];
  notes: string | null;
};

export type CampaignVolunteer = {
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
  status: VolunteerStatus;
  source: VolunteerSource;
  createdBy: string | null;
  createdByEmail: string | null;
  createdAt: string;
  updatedAt: string;
  metadata: Json;
};

export type VolunteerListItem = Omit<CampaignVolunteer, "contactEmail" | "contactPhone"> & {
  hasContact: boolean;
};

export type SquadSummary = {
  id: string;
  name: string;
  description: string | null;
  kind: SquadKind;
  status: SquadStatus;
  createdBy: string | null;
  createdByEmail: string | null;
  createdAt: string;
  metadata: Json;
  memberCount: number;
  fieldActionCount: number;
};

export type VolunteerSquadMembership = {
  squadId: string;
  squadName: string;
  kind: SquadKind;
  squadStatus: SquadStatus;
  membershipStatus: SquadMemberStatus;
  role: string | null;
  joinedAt: string;
};

export type VolunteerFieldEventLink = {
  eventId: string;
  title: string;
  neighborhood: string | null;
  startsAt: string | null;
  eventStatus: string;
  volunteerStatus: VolunteerEventStatus;
  role: string | null;
};

export type VolunteerDetail = {
  volunteer: CampaignVolunteer;
  squads: VolunteerSquadMembership[];
  fieldEvents: VolunteerFieldEventLink[];
};

export type VolunteerExportItem = {
  volunteer: CampaignVolunteer;
  squads: string[];
};

export type SquadDetail = {
  squad: SquadSummary;
  members: Array<{
    volunteerId: string;
    displayName: string;
    neighborhood: string | null;
    status: VolunteerStatus;
    membershipStatus: SquadMemberStatus;
    role: string | null;
    joinedAt: string;
    skills: string[];
  }>;
  fieldEvents: Array<{
    eventId: string;
    title: string;
    startsAt: string | null;
    neighborhood: string | null;
    volunteerCount: number;
  }>;
};

export type VolunteerFilters = {
  search?: string;
  status?: VolunteerStatus;
  neighborhood?: string;
  skill?: string;
  availability?: string;
};

export type VolunteerMutationInput = {
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
  status?: VolunteerStatus;
  source?: VolunteerSource;
  metadata?: Json;
};

type Actor = { id: string; email: string | null };
type VolunteerRow = TableRow<"campaign_volunteers">;
type EventRow = TableRow<"field_agenda_events">;

function normalizeText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeStringArray(values: string[] | null | undefined) {
  return Array.from(new Set((values ?? []).map((value) => value.trim()).filter(Boolean)));
}

function isVolunteerSkill(value: string): value is VolunteerSkill {
  return VOLUNTEER_SKILLS.includes(value as VolunteerSkill);
}

function toAvailability(value: Json | null | undefined): VolunteerAvailability {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { weekdays: [], periods: [], notes: null };
  }

  const weekdays = Array.isArray(value.weekdays) ? value.weekdays.filter((item): item is VolunteerWeekday => typeof item === "string" && VOLUNTEER_WEEKDAYS.includes(item as VolunteerWeekday)) : [];
  const periods = Array.isArray(value.periods) ? value.periods.filter((item): item is VolunteerPeriod => typeof item === "string" && VOLUNTEER_PERIODS.includes(item as VolunteerPeriod)) : [];
  const notes = typeof value.notes === "string" && value.notes.trim().length > 0 ? value.notes.trim() : null;

  return { weekdays, periods, notes };
}

function toAvailabilityJson(value: Partial<VolunteerAvailability> | null | undefined): Json {
  return {
    weekdays: Array.from(new Set((value?.weekdays ?? []).filter((item): item is VolunteerWeekday => VOLUNTEER_WEEKDAYS.includes(item as VolunteerWeekday)))),
    periods: Array.from(new Set((value?.periods ?? []).filter((item): item is VolunteerPeriod => VOLUNTEER_PERIODS.includes(item as VolunteerPeriod)))),
    notes: normalizeText(value?.notes) ?? null,
  };
}

function parseJsonStringArray(value: Json | null | undefined) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
}

function toVolunteer(row: VolunteerRow): CampaignVolunteer {
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
    status: row.status as VolunteerStatus,
    source: row.source as VolunteerSource,
    createdBy: row.created_by,
    createdByEmail: row.created_by_email,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    metadata: row.metadata,
  };
}

export function sanitizeVolunteerForList(volunteer: CampaignVolunteer): VolunteerListItem {
  const { contactEmail, contactPhone, ...rest } = volunteer;
  return {
    ...rest,
    hasContact: Boolean(contactEmail || contactPhone),
  };
}

export function validateVolunteerInput(input: VolunteerMutationInput) {
  const errors: string[] = [];
  const displayName = normalizeText(input.displayName);
  const contactEmail = normalizeText(input.contactEmail);
  const contactPhone = normalizeText(input.contactPhone);
  const hasContact = Boolean(contactEmail || contactPhone);
  const contactPreference = input.contactPreference ?? "nenhum";

  if (!displayName) {
    errors.push("Nome de exibição é obrigatório.");
  }

  if (!input.consentToStoreData) {
    errors.push("Consentimento para guardar dados é obrigatório.");
  }

  if (hasContact && !input.consentToContact) {
    errors.push("Contato preenchido exige consentimento para contato.");
  }

  if (!hasContact && contactPreference !== "nenhum") {
    errors.push("Preferência de contato só pode ser definida quando houver contato consentido.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function buildVolunteerInsert(input: VolunteerMutationInput, actor?: Actor): TableInsert<"campaign_volunteers"> {
  const displayName = normalizeText(input.displayName);
  const contactEmail = normalizeText(input.contactEmail);
  const contactPhone = normalizeText(input.contactPhone);
  const hasContact = Boolean(contactEmail || contactPhone);
  const skills = normalizeStringArray((input.skills ?? []).filter(isVolunteerSkill));
  const interests = normalizeStringArray(input.interests);

  return {
    display_name: displayName ?? "",
    neighborhood: normalizeText(input.neighborhood),
    city: normalizeText(input.city) ?? "Volta Redonda",
    contact_email: contactEmail,
    contact_phone: contactPhone,
    contact_preference: hasContact && input.consentToContact ? input.contactPreference ?? "nenhum" : "nenhum",
    consent_to_contact: input.consentToContact,
    consent_to_store_data: input.consentToStoreData,
    availability: toAvailabilityJson(input.availability),
    skills,
    interests,
    status: input.status ?? "novo",
    source: input.source ?? "formulario",
    created_by: actor?.id ?? null,
    created_by_email: actor?.email ?? null,
    metadata: input.metadata ?? {},
  };
}

function applyVolunteerFilters(volunteers: VolunteerListItem[], filters?: VolunteerFilters) {
  let items = volunteers;

  if (filters?.search) {
    const search = filters.search.trim().toLowerCase();
    items = items.filter((volunteer) =>
      [volunteer.displayName, volunteer.neighborhood, volunteer.city]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(search)),
    );
  }

  if (filters?.status) {
    items = items.filter((volunteer) => volunteer.status === filters.status);
  }

  if (filters?.neighborhood) {
    items = items.filter((volunteer) => volunteer.neighborhood === filters.neighborhood);
  }

  if (filters?.skill) {
    items = items.filter((volunteer) => volunteer.skills.includes(filters.skill!));
  }

  if (filters?.availability) {
    const wanted = filters.availability.toLowerCase();
    items = items.filter((volunteer) => {
      const values = [
        ...volunteer.availability.weekdays,
        ...volunteer.availability.periods,
        volunteer.availability.notes ?? "",
      ].join(" ").toLowerCase();
      return values.includes(wanted);
    });
  }

  return items;
}

export function assertVolunteerExportAllowed(role: string, includeContact: boolean) {
  const canExport = role === "admin" || role === "operador";
  if (!canExport) {
    throw new Error("A exportação de voluntários exige perfil admin ou operador.");
  }
  if (includeContact && role !== "admin") {
    throw new Error("A exportação com contato exige perfil admin.");
  }
}

export function buildVolunteerExportRows(
  items: Array<{ volunteer: CampaignVolunteer | VolunteerListItem; squads?: string[] }>,
  options?: { includeContact?: boolean },
) {
  const includeContact = options?.includeContact ?? false;

  return items.map(({ volunteer, squads }) => {
    const base = {
      nome_exibicao: volunteer.displayName,
      bairro: volunteer.neighborhood,
      habilidades: volunteer.skills.join(", "),
      disponibilidade: [
        volunteer.availability.weekdays.join(", "),
        volunteer.availability.periods.join(", "),
        volunteer.availability.notes ?? "",
      ]
        .filter(Boolean)
        .join(" | "),
      status: volunteer.status,
      squads: (squads ?? []).join(", "),
    };

    if (!includeContact || !("contactEmail" in volunteer) || !("contactPhone" in volunteer)) {
      return base;
    }

    return {
      ...base,
      contact_email: volunteer.consentToContact ? volunteer.contactEmail : null,
      contact_phone: volunteer.consentToContact ? volunteer.contactPhone : null,
    };
  });
}

export async function listVolunteers(filters?: VolunteerFilters): Promise<VolunteerListItem[]> {
  if (shouldUseMockData()) return [];

  const supabase = getSupabaseAdminClient();
  let query = supabase.from("campaign_volunteers").select("*");

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  if (filters?.neighborhood) {
    query = query.eq("neighborhood", filters.neighborhood);
  }

  if (filters?.skill) {
    query = query.contains("skills", [filters.skill]);
  }

  if (filters?.search && filters.search.trim()) {
    const search = filters.search.trim();
    query = query.or(`display_name.ilike.%${search}%,neighborhood.ilike.%${search}%,city.ilike.%${search}%`);
  }

  query = query.order("created_at", { ascending: false });

  const { data, error } = await query;
  if (error) throw error;

  let items = (data ?? []).map((row) => sanitizeVolunteerForList(toVolunteer(row)));

  if (filters?.availability && filters.availability.trim()) {
    const wanted = filters.availability.trim().toLowerCase();
    items = items.filter((volunteer) => {
      const values = [
        ...volunteer.availability.weekdays,
        ...volunteer.availability.periods,
        volunteer.availability.notes ?? "",
      ].join(" ").toLowerCase();
      return values.includes(wanted);
    });
  }

  return items;
}

export async function getVolunteer(id: string, options?: { includeContact?: boolean }): Promise<VolunteerDetail | null> {
  if (shouldUseMockData()) return null;

  const supabase = getSupabaseAdminClient();
  const [volunteerResult, squadMemberResult, squadsResult, eventLinksResult, eventsResult] = await Promise.all([
    supabase.from("campaign_volunteers").select("*").eq("id", id).maybeSingle(),
    supabase.from("campaign_squad_members").select("*").eq("volunteer_id", id).neq("status", "removido"),
    supabase.from("campaign_squads").select("*"),
    supabase.from("field_agenda_event_volunteers").select("*").eq("volunteer_id", id).neq("status", "removido"),
    supabase.from("field_agenda_events").select("*"),
  ]);

  if (volunteerResult.error) throw volunteerResult.error;
  if (squadMemberResult.error) throw squadMemberResult.error;
  if (squadsResult.error) throw squadsResult.error;
  if (eventLinksResult.error) throw eventLinksResult.error;
  if (eventsResult.error) throw eventsResult.error;
  if (!volunteerResult.data) return null;

  const volunteer = toVolunteer(volunteerResult.data);
  const safeVolunteer = options?.includeContact
    ? volunteer
    : { ...volunteer, contactEmail: null, contactPhone: null, contactPreference: volunteer.contactPreference };

  const squadsById = new Map((squadsResult.data ?? []).map((row) => [row.id, row]));
  const eventsById = new Map((eventsResult.data ?? []).map((row) => [row.id, row]));

  return {
    volunteer: safeVolunteer,
    squads: (squadMemberResult.data ?? [])
      .map((membership) => {
        const squad = squadsById.get(membership.squad_id);
        if (!squad) return null;
        return {
          squadId: squad.id,
          squadName: squad.name,
          kind: squad.kind as SquadKind,
          squadStatus: squad.status as SquadStatus,
          membershipStatus: membership.status as SquadMemberStatus,
          role: membership.role,
          joinedAt: membership.joined_at,
        };
      })
      .filter((item): item is VolunteerSquadMembership => Boolean(item)),
    fieldEvents: (eventLinksResult.data ?? [])
      .map((link) => {
        const event = eventsById.get(link.event_id);
        if (!event) return null;
        return {
          eventId: event.id,
          title: event.title,
          neighborhood: event.neighborhood,
          startsAt: event.starts_at,
          eventStatus: event.status,
          volunteerStatus: link.status as VolunteerEventStatus,
          role: link.role,
        };
      })
      .filter((item): item is VolunteerFieldEventLink => Boolean(item)),
  };
}

export async function createVolunteer(input: VolunteerMutationInput, actor?: Actor) {
  if (shouldUseMockData()) return undefined;

  const validation = validateVolunteerInput(input);
  if (!validation.valid) {
    throw new Error(validation.errors.join(" "));
  }

  const supabase = getSupabaseAdminClient();
  const payload = buildVolunteerInsert(input, actor);
  const { data, error } = await supabase.from("campaign_volunteers").insert(payload).select("*").single();
  if (error) throw error;

  await writeAuditLog({
    actorId: actor?.id ?? null,
    actorEmail: actor?.email ?? null,
    action: "volunteer.created",
    entityType: "campaign_volunteers",
    entityId: data.id,
    summary: `Voluntário consentido criado: ${data.display_name}`,
    metadata: { source: data.source, status: data.status },
  });

  return toVolunteer(data);
}

export async function updateVolunteer(id: string, input: Partial<VolunteerMutationInput>, actor?: Actor) {
  if (shouldUseMockData()) return undefined;

  const supabase = getSupabaseAdminClient();
  const currentResult = await supabase.from("campaign_volunteers").select("*").eq("id", id).maybeSingle();
  if (currentResult.error) throw currentResult.error;
  if (!currentResult.data) throw new Error("Voluntário não encontrado.");

  const current = toVolunteer(currentResult.data);
  const merged: VolunteerMutationInput = {
    displayName: input.displayName ?? current.displayName,
    neighborhood: input.neighborhood ?? current.neighborhood,
    city: input.city ?? current.city,
    contactEmail: input.contactEmail ?? current.contactEmail,
    contactPhone: input.contactPhone ?? current.contactPhone,
    contactPreference: input.contactPreference ?? current.contactPreference,
    consentToContact: input.consentToContact ?? current.consentToContact,
    consentToStoreData: input.consentToStoreData ?? current.consentToStoreData,
    availability: input.availability ?? current.availability,
    skills: input.skills ?? current.skills,
    interests: input.interests ?? current.interests,
    status: input.status ?? current.status,
    source: input.source ?? current.source,
    metadata: input.metadata ?? current.metadata,
  };

  const validation = validateVolunteerInput(merged);
  if (!validation.valid) {
    throw new Error(validation.errors.join(" "));
  }

  const insertPayload = buildVolunteerInsert(merged, actor);
  const updatePayload: TableUpdate<"campaign_volunteers"> = {
    display_name: insertPayload.display_name,
    neighborhood: insertPayload.neighborhood,
    city: insertPayload.city,
    contact_email: insertPayload.contact_email,
    contact_phone: insertPayload.contact_phone,
    contact_preference: insertPayload.contact_preference,
    consent_to_contact: insertPayload.consent_to_contact,
    consent_to_store_data: insertPayload.consent_to_store_data,
    availability: insertPayload.availability,
    skills: insertPayload.skills,
    interests: insertPayload.interests,
    status: insertPayload.status,
    source: insertPayload.source,
    metadata: insertPayload.metadata,
  };

  const { data, error } = await supabase.from("campaign_volunteers").update(updatePayload).eq("id", id).select("*").single();
  if (error) throw error;

  await writeAuditLog({
    actorId: actor?.id ?? null,
    actorEmail: actor?.email ?? null,
    action: "volunteer.updated",
    entityType: "campaign_volunteers",
    entityId: id,
    summary: `Voluntário atualizado: ${data.display_name}`,
    metadata: { status: data.status },
  });

  return toVolunteer(data);
}

export async function archiveVolunteer(id: string, actor?: Actor) {
  if (shouldUseMockData()) return undefined;
  const updated = await updateVolunteer(id, { status: "arquivado" }, actor);
  await writeAuditLog({
    actorId: actor?.id ?? null,
    actorEmail: actor?.email ?? null,
    action: "volunteer.archived",
    entityType: "campaign_volunteers",
    entityId: id,
    summary: "Voluntário arquivado.",
  });
  return updated;
}

export async function listSquads(): Promise<SquadSummary[]> {
  if (shouldUseMockData()) return [];

  const supabase = getSupabaseAdminClient();
  const [squadsResult, membersResult, eventResult] = await Promise.all([
    supabase.from("campaign_squads").select("*").order("created_at", { ascending: false }),
    supabase.from("campaign_squad_members").select("*").neq("status", "removido"),
    supabase.from("field_agenda_event_volunteers").select("event_id, volunteer_id").neq("status", "removido"),
  ]);

  if (squadsResult.error) throw squadsResult.error;
  if (membersResult.error) throw membersResult.error;
  if (eventResult.error) throw eventResult.error;

  const memberRows = membersResult.data ?? [];
  const eventRows = eventResult.data ?? [];

  return (squadsResult.data ?? []).map((squad) => {
    const memberIds = memberRows.filter((member) => member.squad_id === squad.id).map((member) => member.volunteer_id);
    const fieldActionCount = new Set(eventRows.filter((row) => memberIds.includes(row.volunteer_id)).map((row) => row.event_id)).size;

    return {
      id: squad.id,
      name: squad.name,
      description: squad.description,
      kind: squad.kind as SquadKind,
      status: squad.status as SquadStatus,
      createdBy: squad.created_by,
      createdByEmail: squad.created_by_email,
      createdAt: squad.created_at,
      metadata: squad.metadata,
      memberCount: memberIds.length,
      fieldActionCount,
    };
  });
}

export async function getSquad(id: string): Promise<SquadDetail | null> {
  if (shouldUseMockData()) return null;

  const supabase = getSupabaseAdminClient();
  const [squadResult, membersResult, volunteersResult, eventLinksResult, eventsResult] = await Promise.all([
    supabase.from("campaign_squads").select("*").eq("id", id).maybeSingle(),
    supabase.from("campaign_squad_members").select("*").eq("squad_id", id).neq("status", "removido"),
    supabase.from("campaign_volunteers").select("*"),
    supabase.from("field_agenda_event_volunteers").select("*").neq("status", "removido"),
    supabase.from("field_agenda_events").select("*"),
  ]);

  if (squadResult.error) throw squadResult.error;
  if (membersResult.error) throw membersResult.error;
  if (volunteersResult.error) throw volunteersResult.error;
  if (eventLinksResult.error) throw eventLinksResult.error;
  if (eventsResult.error) throw eventsResult.error;
  if (!squadResult.data) return null;

  const volunteerMap = new Map((volunteersResult.data ?? []).map((row) => [row.id, row]));
  const eventMap = new Map((eventsResult.data ?? []).map((row) => [row.id, row]));
  const squadMemberships = membersResult.data ?? [];
  const squadVolunteerIds = squadMemberships.map((row) => row.volunteer_id);

  const fieldEvents = new Map<string, { event: EventRow; volunteerIds: Set<string> }>();
  for (const link of eventLinksResult.data ?? []) {
    if (!squadVolunteerIds.includes(link.volunteer_id)) continue;
    const event = eventMap.get(link.event_id);
    if (!event) continue;
    const current = fieldEvents.get(event.id) ?? { event, volunteerIds: new Set<string>() };
    current.volunteerIds.add(link.volunteer_id);
    fieldEvents.set(event.id, current);
  }

  const summaryList = await listSquads();
  const squadSummary = summaryList.find((item) => item.id === id);
  if (!squadSummary) return null;

  return {
    squad: squadSummary,
    members: squadMemberships
      .map((membership) => {
        const volunteer = volunteerMap.get(membership.volunteer_id);
        if (!volunteer) return null;
        return {
          volunteerId: volunteer.id,
          displayName: volunteer.display_name,
          neighborhood: volunteer.neighborhood,
          status: volunteer.status as VolunteerStatus,
          membershipStatus: membership.status as SquadMemberStatus,
          role: membership.role,
          joinedAt: membership.joined_at,
          skills: parseJsonStringArray(volunteer.skills),
        };
      })
      .filter((item): item is SquadDetail["members"][number] => Boolean(item)),
    fieldEvents: Array.from(fieldEvents.values()).map(({ event, volunteerIds }) => ({
      eventId: event.id,
      title: event.title,
      startsAt: event.starts_at,
      neighborhood: event.neighborhood,
      volunteerCount: volunteerIds.size,
    })),
  };
}

export async function createSquad(
  input: { name: string; description?: string | null; kind: SquadKind; status?: SquadStatus; metadata?: Json },
  actor?: Actor,
) {
  if (shouldUseMockData()) return undefined;

  const supabase = getSupabaseAdminClient();
  const payload: TableInsert<"campaign_squads"> = {
    name: input.name.trim(),
    description: normalizeText(input.description),
    kind: input.kind,
    status: input.status ?? "ativo",
    created_by: actor?.id ?? null,
    created_by_email: actor?.email ?? null,
    metadata: input.metadata ?? {},
  };

  const { data, error } = await supabase.from("campaign_squads").insert(payload).select("*").single();
  if (error) throw error;
  return data;
}

export async function addVolunteerToSquad(squadId: string, volunteerId: string, actor?: Actor, role?: string | null) {
  if (shouldUseMockData()) return undefined;

  const supabase = getSupabaseAdminClient();
  const payload: TableInsert<"campaign_squad_members"> = {
    squad_id: squadId,
    volunteer_id: volunteerId,
    role: normalizeText(role),
    status: "ativo",
  };

  const { data, error } = await supabase
    .from("campaign_squad_members")
    .upsert(payload, { onConflict: "squad_id,volunteer_id" })
    .select("*")
    .single();

  if (error) throw error;

  await writeAuditLog({
    actorId: actor?.id ?? null,
    actorEmail: actor?.email ?? null,
    action: "volunteer.assigned_to_squad",
    entityType: "campaign_squad_members",
    entityId: data.id,
    summary: "Voluntário vinculado a squad.",
    metadata: { squadId, volunteerId },
  });

  return data;
}

export async function removeVolunteerFromSquad(squadId: string, volunteerId: string, actor?: Actor) {
  if (shouldUseMockData()) return undefined;

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("campaign_squad_members")
    .update({ status: "removido" })
    .eq("squad_id", squadId)
    .eq("volunteer_id", volunteerId)
    .select("*")
    .single();

  if (error) throw error;

  await writeAuditLog({
    actorId: actor?.id ?? null,
    actorEmail: actor?.email ?? null,
    action: "volunteer.removed_from_squad",
    entityType: "campaign_squad_members",
    entityId: data.id,
    summary: "Voluntário removido de squad.",
    metadata: { squadId, volunteerId },
  });

  return data;
}

export async function assignVolunteerToFieldEvent(eventId: string, volunteerId: string, role?: string | null, actor?: Actor) {
  if (shouldUseMockData()) return undefined;

  const supabase = getSupabaseAdminClient();
  const payload: TableInsert<"field_agenda_event_volunteers"> = {
    event_id: eventId,
    volunteer_id: volunteerId,
    role: normalizeText(role),
    status: "convidado",
  };

  const { data, error } = await supabase
    .from("field_agenda_event_volunteers")
    .upsert(payload, { onConflict: "event_id,volunteer_id" })
    .select("*")
    .single();

  if (error) throw error;

  await writeAuditLog({
    actorId: actor?.id ?? null,
    actorEmail: actor?.email ?? null,
    action: "volunteer.assigned_to_field_event",
    entityType: "field_agenda_event_volunteers",
    entityId: data.id,
    summary: "Voluntário vinculado a ação de campo.",
    metadata: { eventId, volunteerId, role: data.role },
  });

  return data;
}

export async function updateVolunteerEventStatus(
  eventId: string,
  volunteerId: string,
  status: VolunteerEventStatus,
  actor?: Actor,
) {
  if (shouldUseMockData()) return undefined;

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("field_agenda_event_volunteers")
    .update({ status })
    .eq("event_id", eventId)
    .eq("volunteer_id", volunteerId)
    .select("*")
    .single();

  if (error) throw error;

  await writeAuditLog({
    actorId: actor?.id ?? null,
    actorEmail: actor?.email ?? null,
    action: "volunteer.event_status_updated",
    entityType: "field_agenda_event_volunteers",
    entityId: data.id,
    summary: `Status do voluntário na ação atualizado para ${status}.`,
    metadata: { eventId, volunteerId, status },
  });

  return data;
}

export async function listFieldEventVolunteers(eventId: string) {
  if (shouldUseMockData()) return [];

  const supabase = getSupabaseAdminClient();
  const [linksResult, volunteersResult] = await Promise.all([
    supabase.from("field_agenda_event_volunteers").select("*").eq("event_id", eventId).order("created_at", { ascending: true }),
    supabase.from("campaign_volunteers").select("*"),
  ]);

  if (linksResult.error) throw linksResult.error;
  if (volunteersResult.error) throw volunteersResult.error;

  const volunteerMap = new Map((volunteersResult.data ?? []).map((row) => [row.id, row]));

  return (linksResult.data ?? [])
    .map((link) => {
      const volunteer = volunteerMap.get(link.volunteer_id);
      if (!volunteer) return null;

      return {
        id: link.id,
        volunteerId: volunteer.id,
        displayName: volunteer.display_name,
        neighborhood: volunteer.neighborhood,
        status: link.status as VolunteerEventStatus,
        role: link.role,
        volunteerStatus: volunteer.status as VolunteerStatus,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
}

export async function getVolunteerStats() {
  const volunteers = await listVolunteers();
  const skills = new Map<string, number>();
  const neighborhoods = new Map<string, number>();
  const availability = new Map<string, number>();

  for (const volunteer of volunteers) {
    for (const skill of volunteer.skills) {
      skills.set(skill, (skills.get(skill) ?? 0) + 1);
    }

    if (volunteer.neighborhood) {
      neighborhoods.set(volunteer.neighborhood, (neighborhoods.get(volunteer.neighborhood) ?? 0) + 1);
    }

    for (const key of [...volunteer.availability.weekdays, ...volunteer.availability.periods]) {
      availability.set(key, (availability.get(key) ?? 0) + 1);
    }
  }

  return {
    totalCount: volunteers.length,
    newCount: volunteers.filter((volunteer) => volunteer.status === "novo").length,
    activeCount: volunteers.filter((volunteer) => volunteer.status === "ativo").length,
    pausedCount: volunteers.filter((volunteer) => volunteer.status === "pausado").length,
    skills: Array.from(skills.entries()).sort((a, b) => b[1] - a[1]),
    neighborhoods: Array.from(neighborhoods.entries()).sort((a, b) => b[1] - a[1]),
    availability: Array.from(availability.entries()).sort((a, b) => b[1] - a[1]),
  };
}

export async function listVolunteersForExport(options?: { includeContact?: boolean }): Promise<VolunteerExportItem[]> {
  if (shouldUseMockData()) return [];

  const includeContact = options?.includeContact ?? false;
  const supabase = getSupabaseAdminClient();
  const [volunteersResult, membershipsResult, squadsResult] = await Promise.all([
    supabase.from("campaign_volunteers").select("*").order("created_at", { ascending: false }),
    supabase.from("campaign_squad_members").select("*").neq("status", "removido"),
    supabase.from("campaign_squads").select("*"),
  ]);

  if (volunteersResult.error) throw volunteersResult.error;
  if (membershipsResult.error) throw membershipsResult.error;
  if (squadsResult.error) throw squadsResult.error;

  const squadMap = new Map((squadsResult.data ?? []).map((squad) => [squad.id, squad.name]));

  return (volunteersResult.data ?? []).map((row) => {
    const volunteer = toVolunteer(row);
    const safeVolunteer = includeContact
      ? volunteer
      : { ...volunteer, contactEmail: null, contactPhone: null, contactPreference: volunteer.contactPreference };

    const squads = (membershipsResult.data ?? [])
      .filter((membership) => membership.volunteer_id === row.id)
      .map((membership) => squadMap.get(membership.squad_id))
      .filter((value): value is string => Boolean(value));

    return { volunteer: safeVolunteer, squads };
  });
}

export async function getVolunteerHealthStats() {
  if (shouldUseMockData()) {
    return {
      volunteersCount: 0,
      activeVolunteersCount: 0,
      squadsCount: 0,
      fieldEventVolunteerAssignmentsCount: 0,
    };
  }

  const supabase = getSupabaseAdminClient();
  const [volunteers, activeVolunteers, squads, assignments] = await Promise.all([
    supabase.from("campaign_volunteers").select("*", { count: "exact", head: true }),
    supabase.from("campaign_volunteers").select("*", { count: "exact", head: true }).eq("status", "ativo"),
    supabase.from("campaign_squads").select("*", { count: "exact", head: true }),
    supabase.from("field_agenda_event_volunteers").select("*", { count: "exact", head: true }).neq("status", "removido"),
  ]);

  return {
    volunteersCount: volunteers.count ?? 0,
    activeVolunteersCount: activeVolunteers.count ?? 0,
    squadsCount: squads.count ?? 0,
    fieldEventVolunteerAssignmentsCount: assignments.count ?? 0,
  };
}