import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/config", () => ({
  shouldUseMockData: () => true,
}));

vi.mock("@/lib/audit/write-audit-log", () => ({
  writeAuditLog: async () => undefined,
}));

describe("field agenda mock mode", () => {
  it("cria evento e resultado em modo mock para QA operacional", async () => {
    const {
      createFieldAgendaEvent,
      createFieldAgendaEventResult,
      getFieldAgendaEvent,
      getFieldAgendaEventResult,
    } = await import("./field-agenda");

    const event = await createFieldAgendaEvent(
      {
        title: "QA Campo",
        type: "roda_escuta",
        neighborhood: "Vila QA",
        status: "planned",
      },
      { id: "tester", email: "tester@radar.dev" },
    );

    expect(event?.id).toBeTruthy();

    const loadedEvent = await getFieldAgendaEvent(event!.id);
    expect(loadedEvent?.title).toBe("QA Campo");

    await createFieldAgendaEventResult(
      {
        eventId: event!.id,
        resultSummary: "Resumo agregado do campo.",
        estimatedPeopleCount: 10,
      },
      { id: "tester", email: "tester@radar.dev" },
    );

    const loadedResult = await getFieldAgendaEventResult(event!.id);
    expect(loadedResult?.resultSummary).toBe("Resumo agregado do campo.");
    expect(loadedResult?.estimatedPeopleCount).toBe(10);
  });
});
