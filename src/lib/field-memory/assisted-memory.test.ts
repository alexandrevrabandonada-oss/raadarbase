import { describe, expect, it } from "vitest";
import type { FieldAgendaEvent, FieldAgendaEventResult } from "@/lib/data/field-agenda";
import type { TopicCategoryRow } from "@/lib/data/topics";
import {
  buildAssistedMemorySummary,
  buildFieldResultMemoryDraft,
  buildFieldResultMemoryHref,
  detectObviousSensitiveMemoryContent,
  hasCompletedAssistedMemoryChecklist,
} from "./assisted-memory";

function event(overrides: Partial<FieldAgendaEvent> = {}): FieldAgendaEvent {
  return {
    id: "event-1",
    title: "Mutirão de escuta",
    description: null,
    type: "mutirao_conversa",
    status: "done",
    neighborhood: "Vila Esperança",
    topicSlug: "moradia",
    sourceReportId: null,
    sourceActionPlanId: null,
    sourceCorrectiveActionId: null,
    startsAt: "2026-05-12T18:00:00.000Z",
    endsAt: "2026-05-12T20:00:00.000Z",
    locationText: null,
    publicUrl: null,
    createdBy: null,
    createdByEmail: null,
    createdAt: "2026-05-10T10:00:00.000Z",
    updatedAt: "2026-05-10T10:00:00.000Z",
    metadata: {},
    metrics: {
      totalInvited: 10,
      confirmed: 5,
      attended: 4,
      helped: 1,
      pendingConfirmation: 0,
    },
    ...overrides,
  };
}

function result(overrides: Partial<FieldAgendaEventResult> = {}): FieldAgendaEventResult {
  return {
    id: "result-1",
    eventId: "event-1",
    resultSummary: "Escuta agregada sobre moradia e documentação.",
    estimatedPeopleCount: 12,
    topicsDiscussed: ["moradia"],
    neighborhoodsMentioned: ["Vila Esperança"],
    nextSteps: "Planejar devolutiva com recorte territorial.",
    createdBy: null,
    createdByEmail: null,
    createdAt: "2026-05-12T21:00:00.000Z",
    metadata: {},
    ...overrides,
  };
}

const topics: TopicCategoryRow[] = [
  {
    id: "topic-1",
    name: "Moradia",
    slug: "moradia",
    description: null,
    color: null,
    active: true,
    created_at: "2026-05-01T00:00:00.000Z",
    updated_at: "2026-05-01T00:00:00.000Z",
  },
];

describe("assisted field memory helpers", () => {
  it("monta href assistido para resultado de campo", () => {
    expect(buildFieldResultMemoryHref("event-1", "result-1")).toBe(
      "/memoria/nova?source=result&eventId=event-1&resultId=result-1",
    );
  });

  it("pré-preenche draft seguro a partir do resultado de campo", () => {
    const draft = buildFieldResultMemoryDraft({
      event: event(),
      result: result(),
      topics,
    });

    expect(draft.memoryType).toBe("Registro de Campo");
    expect(draft.topicId).toBe("topic-1");
    expect(draft.sourceEntityId).toBe("result-1");
    expect(draft.sourceHref).toBe("/campo/event-1");
  });

  it("exige checklist completo antes de salvar", () => {
    expect(
      hasCompletedAssistedMemoryChecklist({
        noCitizenName: true,
        noHandle: true,
        noDirectContact: true,
        noAddress: true,
        noSensitiveData: true,
        noIndividualStoryWithoutConsent: false,
      }),
    ).toBe(false);
  });

  it("detecta sinais óbvios de dado sensível em texto assistido", () => {
    expect(detectObviousSensitiveMemoryContent("@ana comentou")).toContain("handle");
    expect(detectObviousSensitiveMemoryContent("Contato: 11999990000")).toContain("phone");
    expect(detectObviousSensitiveMemoryContent("Rua das Flores, 42")).toContain("address");
  });

  it("gera resumo consolidado para strategic_memories", () => {
    const summary = buildAssistedMemorySummary({
      whatHappened: "A roda reuniu demandas de moradia.",
      whatLearned: "A devolutiva precisa sair no mesmo ciclo.",
      howToUseNextCycle: "Levar a síntese para a próxima escuta.",
      suggestedNextStep: "Planejar devolutiva territorial.",
    });

    expect(summary).toContain("O que aconteceu:");
    expect(summary).toContain("Próximo passo sugerido:");
  });
});
