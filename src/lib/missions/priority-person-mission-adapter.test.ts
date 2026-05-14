import { describe, expect, it } from "vitest";
import type { AuditLogEntry, PriorityPerson } from "@/lib/types";
import {
  attachMissionMetadataToPriorityPeople,
  getPriorityPersonHoldState,
  getPriorityPersonHoldText,
  getPriorityPersonMissionNextStep,
  getPriorityPersonMissionReason,
} from "./priority-person-mission-adapter";

function buildPriorityPerson(overrides: Partial<PriorityPerson> = {}): PriorityPerson {
  return {
    id: "person-1",
    username: "pessoa",
    displayName: "Pessoa Teste",
    totalInteractions: 4,
    lastInteractionAt: "2026-05-13T12:00:00.000Z",
    themes: ["saúde"],
    status: "novo",
    notes: "",
    doNotContactReason: null,
    syncedAt: null,
    responsibleId: null,
    responsibleName: null,
    contact: null,
    mainTheme: "saúde",
    temperature: "morno",
    priorityScore: 8,
    priorityReason: "Lógica antiga",
    nextAction: "Próxima ação antiga",
    latestInteractionLabel: "Comentário em 13/05 09:00",
    latestInteractionType: "comentario",
    outreachStatusLabel: "Novo",
    suggestedMessage: "Oi @pessoa",
    suggestedTemplateName: "Escuta",
    instagramUrl: "https://instagram.com/pessoa",
    hasPendingTask: false,
    isPendingResponse: false,
    hasReferral: false,
    priorityEligible: true,
    scoreLabel: "Quente",
    scoreIntensity: 60,
    scoreTooltip: "Score antigo",
    riskFlags: {
      noReferralAfterResponse: false,
      recentOutreach: false,
      doNotContact: false,
    },
    ...overrides,
  };
}

function buildAuditLog(overrides: Partial<AuditLogEntry> = {}): AuditLogEntry {
  return {
    id: "audit-1",
    actorId: "operator-1",
    actorEmail: "coord@example.com",
    action: "contact.dm_prepared",
    entityType: "ig_people",
    entityId: "person-1",
    summary: "Mensagem preparada",
    metadata: {},
    createdAt: "2026-05-13T12:10:00.000Z",
    ...overrides,
  };
}

describe("priority person mission adapter", () => {
  it("bloqueia contato quando a pessoa está em Não Abordar", () => {
    const person = buildPriorityPerson({
      status: "nao_abordar",
      doNotContactReason: "Pediu para não receber contato.",
      riskFlags: {
        noReferralAfterResponse: false,
        recentOutreach: false,
        doNotContact: true,
      },
    });

    const [adapted] = attachMissionMetadataToPriorityPeople({
      priorityPeople: [person],
      interactions: [],
      tasks: [],
      now: new Date("2026-05-14T12:00:00.000Z"),
    });

    expect(adapted.missionPlan?.type).toBe("CUIDADO");
    expect(adapted.missionPlan?.state).toBe("BLOQUEADA");
    expect(adapted.missionBlocksContact).toBe(true);
    expect(getPriorityPersonHoldState(adapted)).toBe("blocked");
    expect(getPriorityPersonHoldText(adapted)).toContain("não receber contato");
  });

  it("gera missão de retorno para DM preparada sem confirmação", () => {
    const [adapted] = attachMissionMetadataToPriorityPeople({
      priorityPeople: [buildPriorityPerson()],
      interactions: [],
      tasks: [],
      auditLogs: [buildAuditLog()],
      now: new Date("2026-05-14T12:00:00.000Z"),
    });

    expect(adapted.missionPlan?.type).toBe("RETORNO");
    expect(adapted.missionPlan?.phase).toBe("REGISTRAR");
    expect(adapted.missionNextStep).toMatch(/Confirmar o envio manual/i);
  });

  it("gera missão de escuta para comentário recente com tema claro", () => {
    const [adapted] = attachMissionMetadataToPriorityPeople({
      priorityPeople: [buildPriorityPerson()],
      interactions: [
        {
          personId: "person-1",
          type: "comentario",
          occurredAt: "2026-05-14T10:30:00.000Z",
          text: "Queria falar melhor sobre o problema da saúde aqui no bairro.",
          theme: "saúde",
        },
      ],
      tasks: [],
      now: new Date("2026-05-14T12:00:00.000Z"),
    });

    expect(adapted.missionPlan?.type).toBe("ESCUTA");
    expect(adapted.missionReason).toMatch(/Comentário recente/i);
    expect(adapted.missionSignals).toContain("Comentário recente com tema claro");
  });

  it("mantém fallback antigo quando a engine não produz missão", () => {
    const [adapted] = attachMissionMetadataToPriorityPeople({
      priorityPeople: [
        buildPriorityPerson({
          totalInteractions: 1,
          latestInteractionType: null,
          latestInteractionLabel: "Sem interação recente",
        }),
      ],
      interactions: [],
      tasks: [],
      now: new Date("2026-05-14T12:00:00.000Z"),
    });

    expect(adapted.missionPlan).toBeNull();
    expect(getPriorityPersonMissionReason(adapted)).toBe("Lógica antiga");
    expect(getPriorityPersonMissionNextStep(adapted)).toBe("Próxima ação antiga");
  });
});
