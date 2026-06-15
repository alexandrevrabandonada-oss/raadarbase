import type { PriorityPerson } from "@/lib/types";

type OutreachStatusPerson = Pick<PriorityPerson, "announcementStatus" | "isPendingResponse" | "status" | "contact">;

export function isPriorityPersonAlreadySent(person: OutreachStatusPerson | null | undefined) {
  if (!person) return false;

  // Status that unambiguously mean "already contacted"
  if (
    person.isPendingResponse ||
    person.status === "abordado" ||
    person.status === "respondeu" ||
    person.status === "contato_confirmado"
  ) {
    return true;
  }

  // announcementStatus derived from audit logs / legacy signals
  if (
    person.announcementStatus === "enviado" ||
    person.announcementStatus === "respondeu" ||
    person.announcementStatus === "revisar_depois" ||
    person.announcementStatus === "preparado"
  ) {
    return true;
  }

  // Legacy fallback: contacts table has a last_contacted_at timestamp
  if (person.contact?.last_contacted_at) {
    return true;
  }

  return false;
}

export function onlyPendingFirstContact<T extends OutreachStatusPerson>(people: T[]) {
  return people.filter((person) => !isPriorityPersonAlreadySent(person));
}

