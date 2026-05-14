import { describe, expect, it } from "vitest";
import type { PriorityPerson } from "@/lib/types";
import { buildQuickSheetMissionView } from "./person-quick-sheet";

function buildPerson(overrides: Partial<PriorityPerson> = {}): PriorityPerson {
  return {
    id: "person-1",
    username: "ana",
    displayName: "Ana",
    totalInteractions: 4,
    lastInteractionAt: "2026-05-13T12:00:00.000Z",
    themes: ["juventude"],
    status: "novo",
    notes: "",
    doNotContactReason: null,
    syncedAt: null,
    responsibleId: null,
    responsibleName: null,
    contact: null,
    mainTheme: "juventude",
    temperature: "quente",
    priorityScore: 11,
    priorityReason: "Motivo legado",
    nextAction: "Próxima ação legada",
    latestInteractionLabel: "Comentário em 13/05 09:00",
    latestInteractionType: "comentario",
    outreachStatusLabel: "Novo",
    suggestedMessage: "Oi @ana, queria continuar essa conversa.",
    suggestedTemplateName: "Escuta",
    instagramUrl: "https://instagram.com/ana",
    hasPendingTask: false,
    isPendingResponse: false,
    hasReferral: false,
    priorityEligible: true,
    scoreLabel: "Quente",
    scoreIntensity: 85,
    scoreTooltip: "Score",
    riskFlags: {
      noReferralAfterResponse: false,
      recentOutreach: false,
      doNotContact: false,
    },
    ...overrides,
  };
}

describe("PersonQuickSheet mission view", () => {
  it("renderiza leitura de missão ESCUTA", () => {
    const person = buildPerson({
      missionTypeLabel: "Escuta",
      missionPhaseLabel: "Preparar",
      missionStateLabel: "Sugerida",
      missionReason: "Comentário recente com tema claro pede resposta contextual.",
      missionNextStep: "Preparar resposta contextual antes de abrir conversa.",
      missionGuardrailText: "Mensagem manual: confirme apenas depois de enviar.",
      missionSignals: ["Comentário recente com tema claro"],
      missionBlocksContact: false,
      missionPlan: {
        id: "mission:ESCUTA:person:person-1",
        type: "ESCUTA",
        phase: "PREPARAR",
        state: "SUGERIDA",
        title: "Preparar escuta",
        subjectType: "person",
        subjectId: "person-1",
        reason: "Comentário recente com tema claro pede resposta contextual.",
        signals: [{ code: "thematic_comment", label: "Comentário recente com tema claro", severity: "info" }],
        guardrail: {
          code: "manual_only",
          label: "Ação manual",
          message: "Mensagem manual: confirme apenas depois de enviar.",
          blocksContact: false,
        },
        nextStep: "Preparar resposta contextual antes de abrir conversa.",
        primaryAction: {
          id: "prepare",
          label: "Preparar resposta",
          kind: "review",
        },
        secondaryActions: [
          {
            id: "history",
            label: "Ver histórico",
            kind: "review",
          },
        ],
        priority: {
          score: 620,
          tier: 4,
          label: "Sinal recente",
        },
        createdFrom: [],
        explainabilityText: "Explicação",
      },
    });

    const view = buildQuickSheetMissionView(person);

    expect(view.hasMission).toBe(true);
    expect(view.typeLabel).toBe("Escuta");
    expect(view.phaseLabel).toBe("Preparar");
    expect(view.reason).toMatch(/Comentário recente/);
    expect(view.primaryActionLabel).toBe("Preparar resposta");
  });

  it("bloqueia contato para missão de cuidado bloqueada", () => {
    const person = buildPerson({
      status: "nao_abordar",
      doNotContactReason: "Pedido explícito de não contato.",
      riskFlags: {
        noReferralAfterResponse: false,
        recentOutreach: false,
        doNotContact: true,
      },
      missionTypeLabel: "Cuidado",
      missionPhaseLabel: "Concluir",
      missionStateLabel: "Bloqueada",
      missionReason: "Pessoa com restrição explícita de contato.",
      missionNextStep: "Respeitar bloqueio e evitar qualquer nova abordagem.",
      missionGuardrailText: "Pedido explícito de não contato.",
      missionBlocksContact: true,
      missionPlan: {
        id: "mission:CUIDADO:person:person-1",
        type: "CUIDADO",
        phase: "CONCLUIR",
        state: "BLOQUEADA",
        title: "Cuidado com Ana",
        subjectType: "person",
        subjectId: "person-1",
        reason: "Pessoa com restrição explícita de contato.",
        signals: [{ code: "do_not_contact", label: "Não abordar ativo", severity: "critical" }],
        guardrail: {
          code: "do_not_contact",
          label: "Não abordar",
          message: "Pedido explícito de não contato.",
          blocksContact: true,
        },
        nextStep: "Respeitar bloqueio e evitar qualquer nova abordagem.",
        primaryAction: {
          id: "respect",
          label: "Respeitar bloqueio",
          kind: "close",
        },
        secondaryActions: [],
        priority: {
          score: 1080,
          tier: 1,
          label: "Cuidado urgente",
        },
        createdFrom: [],
        explainabilityText: "Explicação",
      },
    });

    const view = buildQuickSheetMissionView(person);

    expect(view.contactBlocked).toBe(true);
    expect(view.guardrailText).toContain("não contato");
  });

  it("mantém fallback quando não há mission metadata", () => {
    const person = buildPerson({
      missionPlan: null,
      missionReason: null,
      missionNextStep: null,
      missionTypeLabel: null,
      missionPhaseLabel: null,
      missionStateLabel: null,
      missionGuardrailText: null,
      missionSignals: [],
      missionBlocksContact: false,
    });

    const view = buildQuickSheetMissionView(person);

    expect(view.hasMission).toBe(false);
    expect(view.reason).toBe("Motivo legado");
    expect(view.nextStep).toBe("Próxima ação legada");
  });

  it("copiar mensagem exige confirmação manual separada", () => {
    const person = buildPerson();
    const view = buildQuickSheetMissionView(person);

    expect(view.manualMessageWarning).toBe("Use como base. Personalize antes de enviar.");
    expect(view.primaryActionLabel).not.toMatch(/confirmar envio manual/i);
  });
});
