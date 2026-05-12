import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { shouldUseMockData } from "@/lib/config";
import type { PersonReferral, PersonReferralType, PersonReferralStatus } from "@/lib/types";
import { writeAuditLog } from "@/lib/audit/write-audit-log";

export async function listPersonReferralsForPerson(personId: string): Promise<PersonReferral[]> {
  if (shouldUseMockData()) return [];

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("ig_person_referrals")
    .select("*")
    .eq("person_id", personId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((row) => ({
    id: row.id,
    personId: row.person_id,
    targetType: row.target_type as PersonReferralType,
    targetId: row.target_id,
    status: row.status as PersonReferralStatus,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    responsibleId: row.responsible_id,
    externalId: row.external_id,
    lastEventAt: row.last_event_at,
    lastEventType: row.last_event_type,
    lastEventSource: row.last_event_source as "manual" | "webhook" | null,
    metadata: row.metadata,
  }));
}

export async function upsertPersonReferral(
  referralId: string | null,
  payload: Pick<PersonReferral, "personId" | "targetType" | "targetId" | "status" | "notes">,
  actor?: { id: string; email: string | null }
): Promise<PersonReferral> {
  if (shouldUseMockData()) {
     return {
        id: referralId || crypto.randomUUID(),
        ...payload,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
     };
  }

  const supabase = getSupabaseAdminClient();
  
  const dbPayload = {
    person_id: payload.personId,
    target_type: payload.targetType,
    target_id: payload.targetId,
    status: payload.status,
    notes: payload.notes,
    updated_at: new Date().toISOString(),
  };

  let result;
  if (referralId) {
    const { data, error } = await supabase
      .from("ig_person_referrals")
      .update(dbPayload)
      .eq("id", referralId)
      .select()
      .single();
    if (error) throw error;
    result = data;
  } else {
    const { data, error } = await supabase
      .from("ig_person_referrals")
      .insert(dbPayload)
      .select()
      .single();
    if (error) throw error;
    result = data;
  }

  await writeAuditLog({
    actorId: actor?.id || null,
    actorEmail: actor?.email || null,
    action: referralId ? "referral.updated" : "referral.created",
    entityType: "ig_person_referrals",
    entityId: result.id,
    summary: `${referralId ? "Atualizado" : "Criado"} encaminhamento: ${payload.targetType} (${payload.status})`,
    metadata: { personId: payload.personId, targetType: payload.targetType, status: payload.status },
  });

  return {
    id: result.id,
    personId: result.person_id,
    targetType: result.target_type as PersonReferralType,
    targetId: result.target_id,
    status: result.status as PersonReferralStatus,
    notes: result.notes,
    createdAt: result.created_at,
    updatedAt: result.updated_at,
    responsibleId: result.responsible_id,
    externalId: result.external_id,
    lastEventAt: result.last_event_at,
    lastEventType: result.last_event_type,
    lastEventSource: result.last_event_source as "manual" | "webhook" | null,
    metadata: result.metadata,
  };
}
export async function listPersonReferralsForEvent(eventId: string): Promise<PersonReferral[]> {
  if (shouldUseMockData()) return [];

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("ig_person_referrals")
    .select("*, ig_people(username, display_name, status)")
    .eq("target_type", "evento_campo")
    .eq("target_id", eventId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((row) => ({
    id: row.id,
    personId: row.person_id,
    targetType: row.target_type as PersonReferralType,
    targetId: row.target_id,
    status: row.status as PersonReferralStatus,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    responsibleId: row.responsible_id,
    externalId: row.external_id,
    lastEventAt: row.last_event_at,
    lastEventType: row.last_event_type,
    lastEventSource: row.last_event_source as "manual" | "webhook" | null,
    metadata: {
      ...(row.metadata as Record<string, unknown>),
      person: row.ig_people,
    },
  }));
}
