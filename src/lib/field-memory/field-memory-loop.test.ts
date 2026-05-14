import { describe, expect, it } from "vitest";
import type { FieldAgendaEvent, FieldAgendaEventResult } from "@/lib/data/field-agenda";
import type { PilotFeedbackLoopResult } from "@/lib/data/pilot-feedback-loop";
import { buildFieldMemoryLoop } from "./field-memory-loop";

function event(overrides: Partial<FieldAgendaEvent> = {}): FieldAgendaEvent {
  return {
    id: "event-1",
    title: "Roda de escuta",
    description: null,
    type: "roda_escuta",
    status: "planned",
    neighborhood: "Jardim Aurora",
    topicSlug: "moradia",
    sourceReportId: null,
    sourceActionPlanId: null,
    sourceCorrectiveActionId: null,
    startsAt: "2026-05-10T18:00:00.000Z",
    endsAt: "2026-05-10T20:00:00.000Z",
    locationText: "Praça central",
    publicUrl: null,
    createdBy: null,
    createdByEmail: null,
    createdAt: "2026-05-08T10:00:00.000Z",
    updatedAt: "2026-05-08T10:00:00.000Z",
    metadata: {},
    metrics: {
      totalInvited: 8,
      confirmed: 4,
      attended: 0,
      helped: 0,
      pendingConfirmation: 2,
    },
    ...overrides,
  };
}

function result(overrides: Partial<FieldAgendaEventResult> = {}): FieldAgendaEventResult {
  return {
    id: "result-1",
    eventId: "event-1",
    resultSummary: "Escuta realizada.",
    estimatedPeopleCount: 12,
    topicsDiscussed: ["moradia"],
    neighborhoodsMentioned: ["Jardim Aurora"],
    nextSteps: "Retornar com devolutiva.",
    createdBy: null,
    createdByEmail: null,
    createdAt: "2026-05-10T21:00:00.000Z",
    metadata: {},
    ...overrides,
  };
}

function feedbackLoop(overrides?: Partial<PilotFeedbackLoopResult>): PilotFeedbackLoopResult {
  return {
    items: [
      {
        id: "f1",
        createdAt: "2026-05-11T10:00:00.000Z",
        actorEmail: "op@radar.dev",
        category: "fluxo_lento",
        categoryLabel: "Fluxo lento",
        status: "novo",
        statusLabel: "Novo",
        type: "fluxo_lento",
        typeLabel: "Fluxo lento",
        route: "/campo",
        description: "Falta síntese depois do campo.",
        urgency: "medium",
        exportedToRetrospectiveAt: null,
        convertedToTaskAt: null,
        actionPlanId: null,
        actionPlanItemId: null,
        latestActionAt: "2026-05-11T10:00:00.000Z",
      },
    ],
    grouped: {
      bug: [],
      duvida_tela: [],
      duvida_etica: [],
      fluxo_lento: [],
      sugestao: [],
    },
    countsByStatus: {
      novo: 1,
      em_analise: 0,
      resolvido: 0,
      adiado: 0,
      nao_sera_feito: 0,
    },
    countsByCategory: {
      bug: 0,
      duvida_tela: 0,
      duvida_etica: 0,
      fluxo_lento: 2,
      sugestao: 0,
    },
    ...overrides,
  };
}

describe("field memory loop", () => {
  it("gera trava de campo sem fechamento quando evento passou sem resultado", () => {
    const output = buildFieldMemoryLoop({
      events: [event()],
      resultsByEventId: {},
    });

    expect(output.stats.fieldWithoutClosureCount).toBe(1);
    expect(output.missions.some((mission) => mission.type === "CAMPO_SEM_FECHAMENTO")).toBe(true);
  });

  it("gera missão de confirmação quando há interessados sem confirmação", () => {
    const output = buildFieldMemoryLoop({
      events: [event({ startsAt: "2099-05-10T18:00:00.000Z" })],
      resultsByEventId: {},
    });

    expect(output.stats.pendingConfirmationCount).toBe(1);
    expect(output.missions.some((mission) => mission.type === "CONFIRMACAO_PENDENTE")).toBe(true);
  });

  it("gera missão de follow-up quando há presença sem continuidade", () => {
    const output = buildFieldMemoryLoop({
      events: [
        event({
          status: "done",
          metrics: {
            totalInvited: 8,
            confirmed: 4,
            attended: 6,
            helped: 1,
            pendingConfirmation: 0,
          },
        }),
      ],
      resultsByEventId: {
        "event-1": result({ nextSteps: null }),
      },
      resultMemoryLinksByResultId: {
        "result-1": 1,
      },
    });

    expect(output.stats.pendingFollowUpCount).toBe(1);
    expect(output.missions.some((mission) => mission.type === "FOLLOW_UP_PENDENTE")).toBe(true);
  });

  it("sugere Registro de Campo quando já há resultado sem memória", () => {
    const output = buildFieldMemoryLoop({
      events: [event({ status: "done" })],
      resultsByEventId: {
        "event-1": result(),
      },
      resultMemoryLinksByResultId: {},
    });

    expect(output.stats.resultsWithoutMemoryCount).toBe(1);
    expect(output.memorySuggestions.some((suggestion) => suggestion.type === "REGISTRO_DE_CAMPO")).toBe(true);
    expect(output.memorySuggestions.find((suggestion) => suggestion.type === "REGISTRO_DE_CAMPO")?.href).toContain(
      "source=result",
    );
  });

  it("não duplica Registro de Campo quando o resultado já tem memória vinculada", () => {
    const output = buildFieldMemoryLoop({
      events: [event({ status: "done" })],
      resultsByEventId: {
        "event-1": result(),
      },
      resultMemoryLinksByResultId: {
        "result-1": 1,
      },
    });

    expect(output.stats.resultsWithoutMemoryCount).toBe(0);
    expect(output.memorySuggestions.some((suggestion) => suggestion.type === "REGISTRO_DE_CAMPO")).toBe(false);
  });

  it("sugere Memória da Semana quando existe fechamento semanal", () => {
    const output = buildFieldMemoryLoop({
      events: [],
      resultsByEventId: {},
      weeklyClosuresGenerated: 2,
    });

    expect(output.memorySuggestions.some((suggestion) => suggestion.type === "MEMORIA_DA_SEMANA")).toBe(true);
  });

  it("sugere Trava Recorrente quando há feedback recorrente", () => {
    const loop = feedbackLoop();
    loop.grouped.fluxo_lento = [loop.items[0]];

    const output = buildFieldMemoryLoop({
      events: [],
      resultsByEventId: {},
      feedbackLoop: loop,
    });

    expect(output.memorySuggestions.some((suggestion) => suggestion.type === "TRAVA_RECORRENTE")).toBe(true);
  });
});
