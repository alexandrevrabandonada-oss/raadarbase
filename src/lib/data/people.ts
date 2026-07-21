import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { shouldUseMockData } from "@/lib/config";
import { people as mockPeople } from "@/lib/mock-data";
import type { ContactRecord, PersonStatus, PersonWithContact } from "@/lib/types";
import type { TableRow } from "@/lib/supabase/database.types";
import { handleSupabaseReadError } from "./utils";

type PersonRowWithOwner = TableRow<"ig_people"> & {
  internal_users?: { full_name: string | null } | null;
};

const SUPABASE_PAGE_SIZE = 1000;
const CONTACT_LOOKUP_PAGE_SIZE = 200;

function mapPerson(person: PersonRowWithOwner, contact: ContactRecord | null): PersonWithContact {
  return {
    id: person.id,
    username: person.username,
    displayName: person.display_name,
    totalInteractions: person.total_interactions,
    lastInteractionAt: person.last_interaction_at,
    themes: person.themes,
    status: person.status,
    notes: person.notes,
    doNotContactReason: person.do_not_contact_reason,
    syncedAt: person.synced_at ?? null,
    responsibleId: person.responsible_id ?? null,
    responsibleName: person.internal_users?.full_name ?? null,
    contact,
  };
}

async function listContactsForPeople(personIds: string[]): Promise<ContactRecord[]> {
  if (personIds.length === 0) return [];
  const supabase = getSupabaseAdminClient();
  const contacts: ContactRecord[] = [];

  for (let index = 0; index < personIds.length; index += CONTACT_LOOKUP_PAGE_SIZE) {
    const ids = personIds.slice(index, index + CONTACT_LOOKUP_PAGE_SIZE);
    const { data, error } = await supabase.from("contacts").select("*").in("person_id", ids);
    if (error) throw error;
    contacts.push(...(data ?? []));
  }

  return contacts;
}

export async function listPeople(cutoff?: string, limit?: number): Promise<PersonWithContact[]> {
  if (shouldUseMockData()) return mockPeople.slice(0, limit);
  try {
    const supabase = getSupabaseAdminClient();

    const peopleData: TableRow<"ig_people">[] = [];
    const maxRows = limit ?? Number.POSITIVE_INFINITY;

    for (let from = 0; peopleData.length < maxRows; from += SUPABASE_PAGE_SIZE) {
      const to = Math.min(from + SUPABASE_PAGE_SIZE - 1, from + (maxRows - peopleData.length) - 1);
      let peopleQuery = supabase
        .from("ig_people")
        .select("*, internal_users(full_name)")
        .order("last_interaction_at", { ascending: false, nullsFirst: false })
        .order("updated_at", { ascending: false })
        .range(from, to);

      if (cutoff) {
        peopleQuery = peopleQuery.gte("last_interaction_at", cutoff);
      }

      const { data, error } = await peopleQuery;
      if (error) throw error;
      peopleData.push(...(data ?? []));
      if (!data || data.length < SUPABASE_PAGE_SIZE) break;
    }

    const contactsData = await listContactsForPeople(peopleData.map((person) => person.id));
    const contactsByPerson = new Map(contactsData.map((contact) => [contact.person_id, contact]));
    return (peopleData ?? []).map((person) => mapPerson(person as unknown as PersonRowWithOwner, contactsByPerson.get(person.id) ?? null));
  } catch (error) {
    handleSupabaseReadError("listPeople", error);
  }
}

export async function listPeopleByStatuses(
  statuses: PersonStatus[],
  limit?: number,
  options?: { excludeDelivered?: boolean },
): Promise<PersonWithContact[]> {
  if (shouldUseMockData()) return mockPeople.filter((person) => statuses.includes(person.status));
  try {
    const supabase = getSupabaseAdminClient();
    const peopleData: TableRow<"ig_people">[] = [];
    const maxRows = limit ?? Number.POSITIVE_INFINITY;

    if (options?.excludeDelivered) {
      const { data, error } = await supabase.rpc("list_pending_outreach_people", {
        p_statuses: statuses,
        p_limit: Number.isFinite(maxRows) ? maxRows : 500,
      });
      if (error) throw error;
      const contactsData = await listContactsForPeople((data ?? []).map((person) => person.id));
      const contactsByPerson = new Map(contactsData.map((contact) => [contact.person_id, contact]));
      return (data ?? []).map((person) => mapPerson(person as unknown as PersonRowWithOwner, contactsByPerson.get(person.id) ?? null));
    }

    for (let from = 0; peopleData.length < maxRows; from += SUPABASE_PAGE_SIZE) {
      const to = Math.min(from + SUPABASE_PAGE_SIZE - 1, from + (maxRows - peopleData.length) - 1);
      const peopleQuery = supabase
        .from("ig_people")
        .select("*, internal_users(full_name)")
        .in("status", statuses)
        .order("total_interactions", { ascending: false })
        .order("last_interaction_at", { ascending: false, nullsFirst: false })
        .order("updated_at", { ascending: false })
        .range(from, to);
      const { data, error } = await peopleQuery;
      if (error) throw error;
      peopleData.push(...(data ?? []));
      if (!data || data.length < SUPABASE_PAGE_SIZE) break;
    }

    if (peopleData.length === 0) return [];
    const contactsData = await listContactsForPeople(peopleData.map((person) => person.id));
    const contactsByPerson = new Map(contactsData.map((contact) => [contact.person_id, contact]));
    return peopleData.map((person) => mapPerson(person as unknown as PersonRowWithOwner, contactsByPerson.get(person.id) ?? null));
  } catch (error) {
    handleSupabaseReadError("listPeopleByStatuses", error);
  }
}

export async function listPeopleByResponsible(responsibleId: string, limit?: number): Promise<PersonWithContact[]> {
  if (shouldUseMockData()) {
    return mockPeople.filter((person) => person.responsibleId === responsibleId).slice(0, limit);
  }
  try {
    const supabase = getSupabaseAdminClient();
    const peopleData: TableRow<"ig_people">[] = [];
    const maxRows = limit ?? Number.POSITIVE_INFINITY;

    for (let from = 0; peopleData.length < maxRows; from += SUPABASE_PAGE_SIZE) {
      const to = Math.min(from + SUPABASE_PAGE_SIZE - 1, from + (maxRows - peopleData.length) - 1);
      const { data, error } = await supabase
        .from("ig_people")
        .select("*, internal_users(full_name)")
        .eq("responsible_id", responsibleId)
        .order("last_interaction_at", { ascending: false, nullsFirst: false })
        .order("updated_at", { ascending: false })
        .range(from, to);
      if (error) throw error;
      peopleData.push(...(data ?? []));
      if (!data || data.length < SUPABASE_PAGE_SIZE) break;
    }

    if (peopleData.length === 0) return [];
    const contactsData = await listContactsForPeople(peopleData.map((person) => person.id));
    const contactsByPerson = new Map(contactsData.map((contact) => [contact.person_id, contact]));
    return peopleData.map((person) => mapPerson(person as unknown as PersonRowWithOwner, contactsByPerson.get(person.id) ?? null));
  } catch (error) {
    handleSupabaseReadError("listPeopleByResponsible", error);
  }
}

export async function getPersonById(id: string): Promise<PersonWithContact | null> {
  if (shouldUseMockData()) return mockPeople.find((person) => person.id === id) ?? null;
  try {
    const supabase = getSupabaseAdminClient();
    const { data: personData, error: personError } = await supabase.from("ig_people").select("*, internal_users(full_name)").eq("id", id).maybeSingle();
    if (personError) throw personError;
    if (!personData) return null;
    const { data: contactData, error: contactError } = await supabase.from("contacts").select("*").eq("person_id", id).maybeSingle();
    if (contactError) throw contactError;
    return mapPerson(personData as unknown as PersonRowWithOwner, contactData ?? null);
  } catch (error) {
    handleSupabaseReadError("getPersonById", error);
  }
}

export async function listConfirmedPeople(): Promise<PersonWithContact[]> {
  if (shouldUseMockData()) {
    return mockPeople.filter(
      (person) =>
        person.status === "contato_confirmado" ||
        person.contact?.consent_status === "confirmed",
    );
  }
  try {
    const supabase = getSupabaseAdminClient();
    
    const { data: contactsData, error: contactsError } = await supabase
      .from("contacts")
      .select("*")
      .eq("consent_status", "confirmed");
    if (contactsError) throw contactsError;

    const confirmedPersonIdsFromContacts = (contactsData ?? []).map((c) => c.person_id);
    
    let query = supabase.from("ig_people").select("*, internal_users(full_name)");
    if (confirmedPersonIdsFromContacts.length > 0) {
      query = query.or(`status.eq.contato_confirmado,id.in.(${confirmedPersonIdsFromContacts.join(",")})`);
    } else {
      query = query.eq("status", "contato_confirmado");
    }

    const { data: peopleData, error: peopleError } = await query.order("last_interaction_at", { ascending: false });
    if (peopleError) throw peopleError;

    const contactsByPerson = new Map((contactsData ?? []).map((contact) => [contact.person_id, contact]));
    return (peopleData ?? []).map((person) => mapPerson(person as unknown as PersonRowWithOwner, contactsByPerson.get(person.id) ?? null));
  } catch (error) {
    handleSupabaseReadError("listConfirmedPeople", error);
  }
}

export async function listPeopleWithoutTheme(): Promise<PersonWithContact[]> {
  if (shouldUseMockData()) return mockPeople.filter(p => !p.themes || p.themes.length === 0);
  try {
    const supabase = getSupabaseAdminClient();
    const { data: peopleData, error: peopleError } = await supabase
      .from("ig_people")
      .select("*, internal_users(full_name)")
      .or("themes.is.null,themes.eq.{}")
      .order("last_interaction_at", { ascending: false });

    if (peopleError) throw peopleError;
    if (!peopleData || peopleData.length === 0) return [];

    const personIds = peopleData.map((p) => p.id);
    const { data: contactsData, error: contactsError } = await supabase
      .from("contacts")
      .select("*")
      .in("person_id", personIds);

    if (contactsError) throw contactsError;
    const contactsByPerson = new Map((contactsData ?? []).map((contact) => [contact.person_id, contact]));
    return (peopleData ?? []).map((person) => mapPerson(person as unknown as PersonRowWithOwner, contactsByPerson.get(person.id) ?? null));
  } catch (error) {
    handleSupabaseReadError("listPeopleWithoutTheme", error);
  }
}
