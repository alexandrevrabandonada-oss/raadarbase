import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { shouldUseMockData } from "@/lib/config";
import { people as mockPeople } from "@/lib/mock-data";
import type { ContactRecord, PersonWithContact } from "@/lib/types";
import { handleSupabaseReadError } from "./utils";

function mapPerson(person: {
  id: string;
  username: string;
  display_name: string | null;
  total_interactions: number;
  last_interaction_at: string | null;
  themes: string[];
  status: PersonWithContact["status"];
  notes: string;
  do_not_contact_reason: string | null;
  synced_at?: string | null;
}, contact: ContactRecord | null): PersonWithContact {
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
    contact,
  };
}

export async function listPeople(): Promise<PersonWithContact[]> {
  if (shouldUseMockData()) return mockPeople;
  try {
    const supabase = getSupabaseAdminClient();
    const [{ data: peopleData, error: peopleError }, { data: contactsData, error: contactsError }] = await Promise.all([
      supabase.from("ig_people").select("*").order("last_interaction_at", { ascending: false }),
      supabase.from("contacts").select("*"),
    ]);
    if (peopleError) throw peopleError;
    if (contactsError) throw contactsError;
    const contactsByPerson = new Map((contactsData ?? []).map((contact) => [contact.person_id, contact]));
    return (peopleData ?? []).map((person) => mapPerson(person, contactsByPerson.get(person.id) ?? null));
  } catch (error) {
    handleSupabaseReadError("listPeople", error);
  }
}

export async function getPersonById(id: string): Promise<PersonWithContact | null> {
  if (shouldUseMockData()) return mockPeople.find((person) => person.id === id) ?? null;
  try {
    const supabase = getSupabaseAdminClient();
    const { data: personData, error: personError } = await supabase.from("ig_people").select("*").eq("id", id).maybeSingle();
    if (personError) throw personError;
    if (!personData) return null;
    const { data: contactData, error: contactError } = await supabase.from("contacts").select("*").eq("person_id", id).maybeSingle();
    if (contactError) throw contactError;
    return mapPerson(personData, contactData ?? null);
  } catch (error) {
    handleSupabaseReadError("getPersonById", error);
  }
}

export async function listConfirmedPeople(): Promise<PersonWithContact[]> {
  const people = await listPeople();
  return people.filter(
    (person) =>
      person.status === "contato_confirmado" ||
      person.contact?.consent_status === "confirmed",
  );
}
