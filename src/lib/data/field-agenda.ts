import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { shouldUseMockData } from "@/lib/config";
import type { Json } from "@/lib/supabase/database.types";

export type FieldAgendaEventType = 
  | 'roda_escuta'
  | 'reuniao'
  | 'plenaria'
  | 'panfletagem'
  | 'visita_bairro'
  | 'visita_institucional'
  | 'live'
  | 'mutirao_conversa'
  | 'outro';

export type FieldAgendaEventStatus = 'draft' | 'planned' | 'done' | 'archived' | 'cancelled';

export type FieldEventMetrics = {
  totalInvited: number;
  confirmed: number;
  attended: number;
  helped: number;
  pendingConfirmation: number;
};

export type FieldAgendaEvent = {
  id: string;
  title: string;
  description: string | null;
  type: FieldAgendaEventType;
  status: FieldAgendaEventStatus;
  neighborhood: string | null;
  topicSlug: string | null;
  sourceReportId: string | null;
  sourceActionPlanId: string | null;
  sourceCorrectiveActionId: string | null;
  startsAt: string | null;
  endsAt: string | null;
  locationText: string | null;
  publicUrl: string | null;
  createdBy: string | null;
  createdByEmail: string | null;
  createdAt: string;
  updatedAt: string;
  metadata: Json;
  metrics?: FieldEventMetrics;
};

export type FieldAgendaEventResult = {
  id: string;
  eventId: string;
  resultSummary: string;
  estimatedPeopleCount: number | null;
  topicsDiscussed: string[];
  neighborhoodsMentioned: string[];
  nextSteps: string | null;
  createdBy: string | null;
  createdByEmail: string | null;
  createdAt: string;
  metadata: Json;
};

type FieldAgendaMockStore = {
  events: FieldAgendaEvent[];
  results: FieldAgendaEventResult[];
};

declare global {
  var __radarFieldAgendaMockStore: FieldAgendaMockStore | undefined;
}

const mockStore =
  globalThis.__radarFieldAgendaMockStore ??
  (globalThis.__radarFieldAgendaMockStore = {
    events: [],
    results: [],
  });

const mockFieldAgendaEvents = mockStore.events;
const mockFieldAgendaEventResults = mockStore.results;
const mockStoreFile = path.join(process.cwd(), "tmp", "field-agenda-mock-store.json");

function cloneMockEvent(event: FieldAgendaEvent): FieldAgendaEvent {
  return {
    ...event,
    metrics: event.metrics ? { ...event.metrics } : undefined,
  };
}

function cloneMockResult(result: FieldAgendaEventResult): FieldAgendaEventResult {
  return {
    ...result,
    topicsDiscussed: [...result.topicsDiscussed],
    neighborhoodsMentioned: [...result.neighborhoodsMentioned],
  };
}

async function readMockStoreFromDisk(): Promise<FieldAgendaMockStore> {
  try {
    const raw = await readFile(mockStoreFile, "utf-8");
    const parsed = JSON.parse(raw) as Partial<FieldAgendaMockStore>;
    return {
      events: Array.isArray(parsed.events) ? (parsed.events as FieldAgendaEvent[]) : [],
      results: Array.isArray(parsed.results) ? (parsed.results as FieldAgendaEventResult[]) : [],
    };
  } catch {
    return { events: [], results: [] };
  }
}

function replaceMockStore(next: FieldAgendaMockStore) {
  mockFieldAgendaEvents.splice(0, mockFieldAgendaEvents.length, ...next.events);
  mockFieldAgendaEventResults.splice(0, mockFieldAgendaEventResults.length, ...next.results);
}

async function syncMockStoreFromDisk() {
  replaceMockStore(await readMockStoreFromDisk());
}

async function persistMockStore() {
  await mkdir(path.dirname(mockStoreFile), { recursive: true });
  await writeFile(
    mockStoreFile,
    JSON.stringify({
      events: mockFieldAgendaEvents,
      results: mockFieldAgendaEventResults,
    }),
    "utf-8",
  );
}

function buildMockFieldMetrics(eventId: string): FieldEventMetrics {
  const existing = mockFieldAgendaEvents.find((item) => item.id === eventId)?.metrics;
  if (existing) {
    return { ...existing };
  }
  return { totalInvited: 0, confirmed: 0, attended: 0, helped: 0, pendingConfirmation: 0 };
}

export async function getFieldEventParticipantMetrics(eventId: string): Promise<FieldEventMetrics> {
  if (shouldUseMockData()) {
    await syncMockStoreFromDisk();
    return buildMockFieldMetrics(eventId);
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("ig_person_referrals")
    .select("status")
    .eq("target_type", "evento_campo")
    .eq("target_id", eventId);

  if (error) throw error;

  const metrics: FieldEventMetrics = {
    totalInvited: (data || []).length,
    confirmed: (data || []).filter(r => r.status === "confirmou").length,
    attended: (data || []).filter(r => r.status === "compareceu").length,
    helped: (data || []).filter(r => r.status === "ajudou").length,
    pendingConfirmation: (data || []).filter(r => r.status === "convidado" || r.status === "interessado" || r.status === "recomendado").length,
  };

  return metrics;
}

async function listFieldEventParticipantMetrics(eventIds: string[]): Promise<Record<string, FieldEventMetrics>> {
  const metricsByEventId: Record<string, FieldEventMetrics> = {};
  for (const eventId of eventIds) {
    metricsByEventId[eventId] = {
      totalInvited: 0,
      confirmed: 0,
      attended: 0,
      helped: 0,
      pendingConfirmation: 0,
    };
  }

  if (eventIds.length === 0) return metricsByEventId;

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("ig_person_referrals")
    .select("target_id, status")
    .eq("target_type", "evento_campo")
    .in("target_id", eventIds);

  if (error) throw error;

  for (const referral of data || []) {
    if (!referral.target_id || !(referral.target_id in metricsByEventId)) continue;
    const metrics = metricsByEventId[referral.target_id];
    metrics.totalInvited += 1;
    if (referral.status === "confirmou") metrics.confirmed += 1;
    if (referral.status === "compareceu") metrics.attended += 1;
    if (referral.status === "ajudou") metrics.helped += 1;
    if (referral.status === "convidado" || referral.status === "interessado" || referral.status === "recomendado") {
      metrics.pendingConfirmation += 1;
    }
  }

  return metricsByEventId;
}

export async function listFieldAgendaEvents(filters?: { 
  status?: FieldAgendaEventStatus;
  neighborhood?: string;
  topicSlug?: string;
  includeMetrics?: boolean;
}): Promise<FieldAgendaEvent[]> {
  if (shouldUseMockData()) {
    await syncMockStoreFromDisk();
    return mockFieldAgendaEvents
      .filter((event) => (filters?.status ? event.status === filters.status : true))
      .filter((event) => (filters?.neighborhood ? event.neighborhood === filters.neighborhood : true))
      .filter((event) => (filters?.topicSlug ? event.topicSlug === filters.topicSlug : true))
      .sort((left, right) => (left.startsAt ?? "").localeCompare(right.startsAt ?? ""))
      .map((event) => {
        const next = cloneMockEvent(event);
        if (filters?.includeMetrics) {
          next.metrics = buildMockFieldMetrics(event.id);
        }
        return next;
      });
  }

  const supabase = getSupabaseAdminClient();
  let query = supabase.from('field_agenda_events').select('*');

  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.neighborhood) query = query.eq('neighborhood', filters.neighborhood);
  if (filters?.topicSlug) query = query.eq('topic_slug', filters.topicSlug);

  const { data, error } = await query.order('starts_at', { ascending: true });
  if (error) throw error;

  const events: FieldAgendaEvent[] = (data || []).map(row => ({
    id: row.id,
    title: row.title,
    description: row.description,
    type: row.type as FieldAgendaEventType,
    status: row.status as FieldAgendaEventStatus,
    neighborhood: row.neighborhood,
    topicSlug: row.topic_slug,
    sourceReportId: row.source_report_id,
    sourceActionPlanId: row.source_action_plan_id,
    sourceCorrectiveActionId: row.source_corrective_action_id,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    locationText: row.location_text,
    publicUrl: row.public_url,
    createdBy: row.created_by,
    createdByEmail: row.created_by_email,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    metadata: row.metadata,
  }));

  if (filters?.includeMetrics) {
    const metricsByEventId = await listFieldEventParticipantMetrics(events.map((event) => event.id));
    events.forEach((event) => {
      event.metrics = metricsByEventId[event.id];
    });
  }

  return events;
}

export async function getFieldAgendaEvent(id: string): Promise<FieldAgendaEvent | null> {
  if (shouldUseMockData()) {
    await syncMockStoreFromDisk();
    const event = mockFieldAgendaEvents.find((item) => item.id === id);
    if (!event) return null;
    const next = cloneMockEvent(event);
    next.metrics = buildMockFieldMetrics(id);
    return next;
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('field_agenda_events')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const event: FieldAgendaEvent = {
    id: data.id,
    title: data.title,
    description: data.description,
    type: data.type as FieldAgendaEventType,
    status: data.status as FieldAgendaEventStatus,
    neighborhood: data.neighborhood,
    topicSlug: data.topic_slug,
    sourceReportId: data.source_report_id,
    sourceActionPlanId: data.source_action_plan_id,
    sourceCorrectiveActionId: data.source_corrective_action_id,
    startsAt: data.starts_at,
    endsAt: data.ends_at,
    locationText: data.location_text,
    publicUrl: data.public_url,
    createdBy: data.created_by,
    createdByEmail: data.created_by_email,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    metadata: data.metadata,
  };

  event.metrics = await getFieldEventParticipantMetrics(id);
  return event;
}

export async function createFieldAgendaEvent(input: Partial<FieldAgendaEvent> & { title: string; type: FieldAgendaEventType }, actor?: { id: string; email: string | null }): Promise<FieldAgendaEvent | undefined> {
  if (shouldUseMockData()) {
    await syncMockStoreFromDisk();
    const now = new Date().toISOString();
    const event: FieldAgendaEvent = {
      id: `field-event-${Date.now()}`,
      title: input.title,
      description: input.description ?? null,
      type: input.type,
      status: input.status || "draft",
      neighborhood: input.neighborhood ?? null,
      topicSlug: input.topicSlug ?? null,
      sourceReportId: input.sourceReportId ?? null,
      sourceActionPlanId: input.sourceActionPlanId ?? null,
      sourceCorrectiveActionId: input.sourceCorrectiveActionId ?? null,
      startsAt: input.startsAt ?? null,
      endsAt: input.endsAt ?? null,
      locationText: input.locationText ?? null,
      publicUrl: input.publicUrl ?? null,
      createdBy: actor?.id ?? null,
      createdByEmail: actor?.email ?? null,
      createdAt: now,
      updatedAt: now,
      metadata: input.metadata || {},
      metrics: { totalInvited: 0, confirmed: 0, attended: 0, helped: 0, pendingConfirmation: 0 },
    };
    mockFieldAgendaEvents.unshift(event);
    await persistMockStore();
    return cloneMockEvent(event);
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('field_agenda_events')
    .insert({
      title: input.title,
      description: input.description,
      type: input.type,
      status: input.status || 'draft',
      neighborhood: input.neighborhood,
      topic_slug: input.topicSlug,
      source_report_id: input.sourceReportId,
      source_action_plan_id: input.sourceActionPlanId,
      source_corrective_action_id: input.sourceCorrectiveActionId,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      location_text: input.locationText,
      public_url: input.publicUrl,
      created_by: actor?.id,
      created_by_email: actor?.email,
      metadata: input.metadata || {},
    })
    .select()
    .single();

  if (error) throw error;

  await writeAuditLog({
    actorId: actor?.id || null,
    actorEmail: actor?.email || null,
    action: 'field_agenda.event_created',
    entityType: 'field_agenda_events',
    entityId: data.id,
    summary: `Criado evento de campo: ${data.title} (${data.type})`,
    metadata: { type: data.type, neighborhood: data.neighborhood },
  });

  return {
    id: data.id,
    title: data.title,
    description: data.description,
    type: data.type as FieldAgendaEventType,
    status: data.status as FieldAgendaEventStatus,
    neighborhood: data.neighborhood,
    topicSlug: data.topic_slug,
    sourceReportId: data.source_report_id,
    sourceActionPlanId: data.source_action_plan_id,
    sourceCorrectiveActionId: data.source_corrective_action_id,
    startsAt: data.starts_at,
    endsAt: data.ends_at,
    locationText: data.location_text,
    publicUrl: data.public_url,
    createdBy: data.created_by,
    createdByEmail: data.created_by_email,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    metadata: data.metadata,
  };
}

export async function updateFieldAgendaEvent(id: string, input: Partial<FieldAgendaEvent>, actor?: { id: string; email: string | null }) {
  if (shouldUseMockData()) {
    await syncMockStoreFromDisk();
    const index = mockFieldAgendaEvents.findIndex((item) => item.id === id);
    if (index === -1) throw new Error("Evento de campo não encontrado.");
    const current = mockFieldAgendaEvents[index];
    const next: FieldAgendaEvent = {
      ...current,
      ...input,
      updatedAt: new Date().toISOString(),
      metrics: input.metrics ?? current.metrics,
    };
    mockFieldAgendaEvents[index] = next;
    await persistMockStore();
    return cloneMockEvent(next);
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('field_agenda_events')
    .update({
      title: input.title,
      description: input.description,
      type: input.type,
      status: input.status,
      neighborhood: input.neighborhood,
      topic_slug: input.topicSlug,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      location_text: input.locationText,
      public_url: input.publicUrl,
      metadata: input.metadata,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  await writeAuditLog({
    actorId: actor?.id || null,
    actorEmail: actor?.email || null,
    action: 'field_agenda.event_updated',
    entityType: 'field_agenda_events',
    entityId: id,
    summary: `Atualizado evento de campo: ${data.title}`,
    metadata: { status: data.status },
  });

  return data;
}

export async function markFieldAgendaEventDone(id: string, actor?: { id: string; email: string | null }) {
  const result = await updateFieldAgendaEvent(id, { status: 'done' }, actor);
  
  await writeAuditLog({
    actorId: actor?.id || null,
    actorEmail: actor?.email || null,
    action: 'field_agenda.event_done',
    entityType: 'field_agenda_events',
    entityId: id,
    summary: `Evento de campo marcado como concluído.`,
  });

  return result;
}

export async function createFieldAgendaEventResult(input: { 
  eventId: string; 
  resultSummary: string; 
  estimatedPeopleCount?: number;
  topicsDiscussed?: string[];
  neighborhoodsMentioned?: string[];
  nextSteps?: string;
}, actor?: { id: string; email: string | null }) {
  if (shouldUseMockData()) {
    await syncMockStoreFromDisk();
    const event = mockFieldAgendaEvents.find((item) => item.id === input.eventId);
    if (!event) throw new Error("Evento de campo não encontrado.");
    const result: FieldAgendaEventResult = {
      id: `field-result-${Date.now()}`,
      eventId: input.eventId,
      resultSummary: input.resultSummary,
      estimatedPeopleCount: input.estimatedPeopleCount ?? null,
      topicsDiscussed: input.topicsDiscussed || (event.topicSlug ? [event.topicSlug] : []),
      neighborhoodsMentioned: input.neighborhoodsMentioned || (event.neighborhood ? [event.neighborhood] : []),
      nextSteps: input.nextSteps ?? null,
      createdBy: actor?.id ?? null,
      createdByEmail: actor?.email ?? null,
      createdAt: new Date().toISOString(),
      metadata: {},
    };
    mockFieldAgendaEventResults.unshift(result);
    const metrics = buildMockFieldMetrics(event.id);
    const nextMetrics: FieldEventMetrics = {
      ...metrics,
      attended: result.estimatedPeopleCount ?? metrics.attended,
    };
    const eventIndex = mockFieldAgendaEvents.findIndex((item) => item.id === event.id);
    if (eventIndex >= 0) {
      mockFieldAgendaEvents[eventIndex] = {
        ...mockFieldAgendaEvents[eventIndex],
        metrics: nextMetrics,
      };
    }
    await persistMockStore();
    return cloneMockResult(result);
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('field_agenda_event_results')
    .insert({
      event_id: input.eventId,
      result_summary: input.resultSummary,
      estimated_people_count: input.estimatedPeopleCount,
      topics_discussed: input.topicsDiscussed || [],
      neighborhoods_mentioned: input.neighborhoodsMentioned || [],
      next_steps: input.nextSteps,
      created_by: actor?.id,
      created_by_email: actor?.email,
    })
    .select()
    .single();

  if (error) throw error;

  await writeAuditLog({
    actorId: actor?.id || null,
    actorEmail: actor?.email || null,
    action: 'field_agenda.result_created',
    entityType: 'field_agenda_event_results',
    entityId: data.id,
    summary: `Registrado resultado para evento de campo.`,
    metadata: { eventId: input.eventId },
  });

  return data;
}

export async function getFieldAgendaEventResult(eventId: string): Promise<FieldAgendaEventResult | null> {
    if (shouldUseMockData()) {
        await syncMockStoreFromDisk();
        const result = mockFieldAgendaEventResults.find((item) => item.eventId === eventId);
        return result ? cloneMockResult(result) : null;
    }

    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
        .from('field_agenda_event_results')
        .select('*')
        .eq('event_id', eventId)
        .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
        id: data.id,
        eventId: data.event_id,
        resultSummary: data.result_summary,
        estimatedPeopleCount: data.estimated_people_count,
        topicsDiscussed: data.topics_discussed as string[],
        neighborhoodsMentioned: data.neighborhoods_mentioned as string[],
        nextSteps: data.next_steps,
        createdBy: data.created_by,
        createdByEmail: data.created_by_email,
        createdAt: data.created_at,
        metadata: data.metadata,
    };
}

export async function listFieldAgendaEventResultsByEventIds(eventIds: string[]): Promise<Record<string, FieldAgendaEventResult>> {
  if (eventIds.length === 0) return {};
  if (shouldUseMockData()) {
    await syncMockStoreFromDisk();
    const results: Record<string, FieldAgendaEventResult> = {};
    for (const result of mockFieldAgendaEventResults) {
      if (eventIds.includes(result.eventId)) {
        results[result.eventId] = cloneMockResult(result);
      }
    }
    return results;
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("field_agenda_event_results")
    .select("*")
    .in("event_id", eventIds);

  if (error) throw error;

  const results: Record<string, FieldAgendaEventResult> = {};
  (data || []).forEach((row) => {
    results[row.event_id] = {
      id: row.id,
      eventId: row.event_id,
      resultSummary: row.result_summary,
      estimatedPeopleCount: row.estimated_people_count,
      topicsDiscussed: row.topics_discussed as string[],
      neighborhoodsMentioned: row.neighborhoods_mentioned as string[],
      nextSteps: row.next_steps,
      createdBy: row.created_by,
      createdByEmail: row.created_by_email,
      createdAt: row.created_at,
      metadata: row.metadata,
    };
  });

  return results;
}

// Sugestões
export async function suggestFieldAgendaFromSilenceRadar() {
    // Implementação simplificada para o tijolo
    return [];
}

export async function getFieldAgendaStats() {
    if (shouldUseMockData()) {
        await syncMockStoreFromDisk();
        const totalCount = mockFieldAgendaEvents.length;
        const plannedCount = mockFieldAgendaEvents.filter((item) => item.status === "planned").length;
        const doneCount = mockFieldAgendaEvents.filter((item) => item.status === "done").length;
        const resultEventIds = new Set(mockFieldAgendaEventResults.map((item) => item.eventId));
        const pendingResultsCount = mockFieldAgendaEvents.filter((item) => item.status === "done" && !resultEventIds.has(item.id)).length;
        return { totalCount, plannedCount, doneCount, pendingResultsCount };
    }

    const supabase = getSupabaseAdminClient();
    
    const [total, planned, done] = await Promise.all([
        supabase.from('field_agenda_events').select('*', { count: 'exact', head: true }),
        supabase.from('field_agenda_events').select('*', { count: 'exact', head: true }).eq('status', 'planned'),
        supabase.from('field_agenda_events').select('*', { count: 'exact', head: true }).eq('status', 'done'),
    ]);

    // Pending results: events that are 'done' but have no entry in 'field_agenda_event_results'
    // Simplified: just query done events and then check results
    const { data: doneEvents } = await supabase.from('field_agenda_events').select('id').eq('status', 'done');
    const doneIds = doneEvents?.map(e => e.id) || [];
    
    let pendingResultsCount = 0;
    if (doneIds.length > 0) {
        const { data: results } = await supabase.from('field_agenda_event_results').select('event_id').in('event_id', doneIds);
        const resultEventIds = new Set(results?.map(r => r.event_id) || []);
        pendingResultsCount = doneIds.filter(id => !resultEventIds.has(id)).length;
    }

    return {
        totalCount: total.count || 0,
        plannedCount: planned.count || 0,
        doneCount: done.count || 0,
        pendingResultsCount
    };
}
