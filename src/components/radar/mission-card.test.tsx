import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MissionCard } from "./mission-card";
import type { PriorityPerson } from "@/lib/types";

function buildPriorityPerson(): PriorityPerson {
  return {
    id: "person-1",
    username: "ana.muito.grande",
    displayName: "Ana",
    totalInteractions: 5,
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
    priorityScore: 12,
    priorityReason: "Motivo legado",
    nextAction: "Ação legada",
    latestInteractionLabel: "Comentário em 13/05 09:00",
    latestInteractionType: "comentario",
    outreachStatusLabel: "Novo",
    suggestedMessage: "Oi @ana",
    suggestedTemplateName: "Escuta",
    instagramUrl: "https://instagram.com/ana.muito.grande",
    hasPendingTask: false,
    isPendingResponse: false,
    hasReferral: false,
    priorityEligible: true,
    scoreLabel: "Muito quente",
    scoreIntensity: 90,
    scoreTooltip: "Score",
    riskFlags: {
      noReferralAfterResponse: false,
      recentOutreach: false,
      doNotContact: false,
    },
    missionTypeLabel: "Escuta",
    missionPhaseLabel: "Preparar",
    missionReason: "Comentário recente com tema claro pede resposta contextual.",
    missionNextStep: "Preparar resposta contextual antes de abrir conversa.",
    missionGuardrailText: "Mensagem manual: confirme apenas depois de enviar.",
    missionSignals: ["Comentário recente com tema claro"],
    missionBlocksContact: false,
    missionExplainability: "Explicação",
    missionFallbackUsed: false,
    missionPlan: {
      id: "mission:ESCUTA:person:person-1",
      type: "ESCUTA",
      phase: "PREPARAR",
      state: "SUGERIDA",
      title: "Preparar escuta",
      subjectType: "person",
      subjectId: "person-1",
      reason: "Comentário recente com tema claro pede resposta contextual.",
      signals: [
        {
          code: "thematic_comment",
          label: "Comentário recente com tema claro",
          severity: "info",
        },
      ],
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
      secondaryActions: [],
      priority: {
        score: 620,
        tier: 4,
        label: "Sinal recente",
      },
      createdFrom: [],
      explainabilityText: "Explicação",
    },
  };
}

describe("MissionCard", () => {
  it("renderiza metadata de missão para o dashboard e superfícies compartilhadas", () => {
    const html = renderToStaticMarkup(
      <MissionCard person={buildPriorityPerson()} primaryActionLabel="Abrir missão" />,
    );

    expect(html).toContain("Escuta");
    expect(html).toContain("Preparar");
    expect(html).toContain("Comentário recente com tema claro pede resposta contextual.");
    expect(html).toContain("Preparar resposta contextual antes de abrir conversa.");
  });
});
