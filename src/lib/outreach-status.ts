import type { PriorityPerson } from "@/lib/types";

type OutreachStatusPerson = Pick<PriorityPerson, "announcementStatus" | "isPendingResponse" | "status">;

export function isPriorityPersonAlreadySent(person: OutreachStatusPerson | null | undefined) {
  return Boolean(
    person &&
      (person.isPendingResponse || person.status === "abordado" || person.announcementStatus === "enviado"),
  );
}

export function onlyPendingFirstContact<T extends OutreachStatusPerson>(people: T[]) {
  return people.filter((person) => !isPriorityPersonAlreadySent(person));
}
