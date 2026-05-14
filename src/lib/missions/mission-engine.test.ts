import { describe, expect, it } from "vitest";
import type { AuditLogEntry, InteractionWithPost, OutreachTask, PersonWithContact } from "@/lib/types";
import type { FieldAgendaEvent, FieldAgendaEventResult } from "@/lib/data/field-agenda";
import { buildMissionFeed, buildMissionForField, buildMissionForPerson } from "./mission-engine";

const now = new Date("2026-05-14T12:00:00.000Z");

function person(overrides: Partial<PersonWithContact> = {}): PersonWithContact {
  return {
    id: "person-1",
    username: "camila",
    displayName: "Camila",
    totalInteractions: 4,
    lastInteractionAt: "2026-05-10T10:00:00.000Z",
    themes: ["saude"],
    status: "novo",
    notes: "",
    doNotContactReason: null,
    syncedAt: null,
    responsibleId: null,
    responsibleName: null,
    contact: null,
    ...overrides,
  };
}

function interaction(overrides: Partial<InteractionWithPost> = {}): InteractionWithPost {
  return {
    id: "interaction-1",
    personId: "person-1",
    postId: null,
    type: "comentario",
    occurredAt: "2026-05-13T10:00:00.000Z",
    text: "Queria entender melhor esse tema no meu bairro.",
    theme: "moradia",
    post: null,
    ...overrides,
  };
}

function task(overrides: Partial<OutreachTask> = {}): OutreachTask {
  return {
    id: "task-1",
    personId: "person-1",
    column: "mensagem_enviada",
    title: "Confirmar envio",
    notes: "",
    dueAt: null,
    completedAt: null,
    createdAt: "2026-05-10T10:00:00.000Z",
    updatedAt: "2026-05-10T10:00:00.000Z",
    responsibleId: null,
    person: null,
    ...overrides,
  };
}

function auditLog(overrides: Partial<AuditLogEntry> = {}): AuditLogEntry {
  return {
    id: "audit-1",
    actorId: "actor-1",
    actorEmail: "operador@radar.dev",
    action: "contact.dm_prepared",
    entityType: "ig_people",
    entityId: "person-1",
    summary: "DM preparada",
    metadata: {},
    createdAt: "2026-05-14T09:00:00.000Z",
    ...overrides,
  };
}

function fieldEvent(overrides: Partial<FieldAgendaEvent> = {}): FieldAgendaEvent {
  return {
    id: "field-1",
    title: "Roda de escuta no Jardim Aurora",
    description: null,
    type: "roda_escuta",
    status: "planned",
    neighborhood: "Jardim Aurora",
    topicSlug: "moradia",
    sourceReportId: null,
    sourceActionPlanId: null,
    sourceCorrectiveActionId: null,
    startsAt: "2026-05-13T18:00:00.000Z",
    endsAt: "2026-05-13T20:00:00.000Z",
    locationText: "Quadra central",
    publicUrl: null,
    createdBy: null,
    createdByEmail: null,
    createdAt: "2026-05-10T10:00:00.000Z",
    updatedAt: "2026-05-10T10:00:00.000Z",
    metadata: {},
    ...overrides,
  };
}

const fieldResult: FieldAgendaEventResult = {
  id: "result-1",
  eventId: "field-1",
  resultSummary: "Tudo registrado",
  estimatedPeopleCount: 18,
  topicsDiscussed: ["moradia"],
  neighborhoodsMentioned: ["Jardim Aurora"],
  nextSteps: "Voltar com ação de continuidade.",
  createdBy: null,
  createdByEmail: null,
  createdAt: "2026-05-13T22:00:00.000Z",
  metadata: {},
};

describe("mission engine v1", () => {
  it("bloqueia contato quando há Não Abordar", () => {
    const mission = buildMissionForPerson(
      {
        person: person({ status: "nao_abordar", doNotContactReason: "Pediu para não receber contato." }),
        interactions: [],
      },
      now,
    );

    expect(mission?.type).toBe("CUIDADO");
    expect(mission?.state).toBe("BLOQUEADA");
    expect(mission?.phase).toBe("CONCLUIR");
    expect(mission?.primaryAction.label).toBe("Respeitar bloqueio");
    expect(mission?.secondaryActions.some((action) => /Instagram|DM/i.test(action.label))).toBe(false);
  });

  it("gera RETORNO quando há DM preparada sem confirmação", () => {
    const mission = buildMissionForPerson(
      {
        person: person(),
        interactions: [],
        auditLogs: [auditLog()],
      },
      now,
    );

    expect(mission?.type).toBe("RETORNO");
    expect(mission?.phase).toBe("REGISTRAR");
    expect(mission?.nextStep).toMatch(/Confirmar o envio manual/i);
  });

  it("gera ESCUTA para comentário recente com tema claro", () => {
    const mission = buildMissionForPerson(
      {
        person: person({ totalInteractions: 1 }),
        interactions: [interaction()],
      },
      now,
    );

    expect(mission?.type).toBe("ESCUTA");
    expect(mission?.phase).toBe("PREPARAR");
    expect(mission?.nextStep).toMatch(/Preparar resposta contextual/i);
  });

  it("gera VINCULO para recorrência de interações", () => {
    const mission = buildMissionForPerson(
      {
        person: person({ totalInteractions: 7, lastInteractionAt: "2026-05-13T09:00:00.000Z" }),
        interactions: [
          interaction({ id: "i1", occurredAt: "2026-05-13T09:00:00.000Z", theme: null, text: "curti" }),
          interaction({ id: "i2", occurredAt: "2026-05-09T09:00:00.000Z", type: "curtida", text: "", theme: null }),
          interaction({ id: "i3", occurredAt: "2026-05-05T09:00:00.000Z", type: "resposta_story", text: "vi aqui", theme: null }),
        ],
      },
      now,
    );

    expect(mission?.type).toBe("VINCULO");
    expect(mission?.phase).toBe("PREPARAR");
    expect(mission?.nextStep).toMatch(/conversa cuidadosa/i);
  });

  it("gera ENCAMINHAMENTO para resposta positiva sem destino", () => {
    const mission = buildMissionForPerson(
      {
        person: person({ status: "respondeu" }),
        interactions: [interaction({ type: "comentario", text: "Quero ir no evento e entender como participar.", theme: "juventude" })],
        referrals: [],
      },
      now,
    );

    expect(mission?.type).toBe("ENCAMINHAMENTO");
    expect(mission?.phase).toBe("ENCAMINHAR");
    expect(mission?.nextStep).toMatch(/Escolher o próximo caminho/i);
  });

  it("gera CUIDADO para espera longa", () => {
    const mission = buildMissionForPerson(
      {
        person: person({ status: "abordado", lastInteractionAt: "2026-05-01T09:00:00.000Z" }),
        interactions: [],
        tasks: [task({ column: "esperando_resposta", updatedAt: "2026-05-01T09:00:00.000Z" })],
      },
      now,
    );

    expect(mission?.type).toBe("CUIDADO");
    expect(mission?.state).toBe("EM_ESPERA");
    expect(mission?.nextStep).toMatch(/Revisar a trava/i);
  });

  it("gera CAMPO para evento sem fechamento", () => {
    const mission = buildMissionForField(
      {
        event: fieldEvent(),
        result: null,
      },
      now,
    );

    expect(["CAMPO", "MEMORIA"]).toContain(mission?.type);
    expect(mission?.phase).toBe("REGISTRAR");
    expect(mission?.nextStep).toMatch(/Registrar resultado/i);
  });

  it("prioriza cuidado antes de escuta", () => {
    const missions = buildMissionFeed({
      now,
      people: [
        {
          person: person({ id: "care", username: "care", status: "nao_abordar", doNotContactReason: "Pediu exclusão." }),
          interactions: [],
        },
        {
          person: person({ id: "escuta", username: "escuta", totalInteractions: 1, lastInteractionAt: "2026-05-13T10:00:00.000Z" }),
          interactions: [interaction({ id: "escuta-i1", personId: "escuta" })],
        },
      ],
    });

    expect(missions[0].type).toBe("CUIDADO");
    expect(missions[1].type).toBe("ESCUTA");
    expect(missions[0].priority.score).toBeGreaterThan(missions[1].priority.score);
  });

  it("não cria missão de campo quando já existe fechamento", () => {
    const mission = buildMissionForField(
      {
        event: fieldEvent({ status: "done" }),
        result: fieldResult,
      },
      now,
    );

    expect(mission).toBeNull();
  });
});
