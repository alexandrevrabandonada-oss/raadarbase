import { describe, expect, it } from "vitest";
import type { PriorityPerson } from "@/lib/types";
import { isPriorityPersonAlreadySent, onlyPendingFirstContact } from "./outreach-status";

type OutreachStatusFixture = Pick<
  PriorityPerson,
  "announcementStatus" | "isPendingResponse" | "status" | "contact"
>;

function person(overrides: Partial<OutreachStatusFixture> = {}): OutreachStatusFixture {
  return {
    announcementStatus: "nao_iniciado",
    isPendingResponse: false,
    status: "novo",
    contact: null,
    ...overrides,
  };
}

describe("outreach status", () => {
  it("keeps a prepared but unsent person in the first-contact queue", () => {
    const prepared = person({ announcementStatus: "preparado" });

    expect(isPriorityPersonAlreadySent(prepared)).toBe(false);
    expect(onlyPendingFirstContact([prepared])).toEqual([prepared]);
  });

  it("removes people with a confirmed send signal", () => {
    expect(isPriorityPersonAlreadySent(person({ announcementStatus: "enviado" }))).toBe(true);
    expect(isPriorityPersonAlreadySent(person({ status: "abordado" }))).toBe(true);
    expect(isPriorityPersonAlreadySent(person({ isPendingResponse: true }))).toBe(true);
  });
});
