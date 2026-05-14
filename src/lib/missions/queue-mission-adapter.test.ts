import { describe, expect, it } from "vitest";
import type { PriorityPerson } from "@/lib/types";
import type { RadarMission } from "./mission-types";
import { buildRecommendedMissionBlock, buildQueueMissionPlan, orderQueueByMissionPlan, type QueueMissionSource } from "./queue-mission-adapter";

function person(id: string, overrides: Partial<PriorityPerson> = {}): PriorityPerson {
  return {
    id,
    username: id,
    displayName: id,
    totalInteractions: 2,
    lastInteractionAt: "2026-05-10T10:00:00.000Z",
    themes: ["saude"],
    status: "novo",
    notes: "",
    doNotContactReason: null,
    syncedAt: null,
    responsibleId: null,
    responsibleName: null,
    contact: null,
    mainTheme: "saude",
    temperature: "morno",
    priorityScore: 10,
    priorityReason: "Motivo",
    nextAction: "Próxima ação",
    latestInteractionLabel: "Ontem",
    latestInteractionType: "comentario",
    outreachStatusLabel: "Novo",
    suggestedMessage: "Oi",
    suggestedTemplateName: null,
    instagramUrl: null,
    hasPendingTask: false,
    isPendingResponse: false,
    hasReferral: false,
    priorityEligible: true,
    scoreLabel: "morno",
    scoreIntensity: 30,
    scoreTooltip: "tooltip",
    riskFlags: {
      noReferralAfterResponse: false,
      recentOutreach: false,
      doNotContact: false,
    },
    ...overrides,
  };
}

function source(input: PriorityPerson): QueueMissionSource {
  return {
    person: input,
    interactions: [],
    tasks: [],
    referrals: [],
    auditLogs: [],
  };
}

function mission(id: string, type: RadarMission["type"], score: number): RadarMission {
  return {
    id,
    type,
    phase: "PREPARAR",
    state: "SUGERIDA",
    title: id,
    subjectType: "person",
    subjectId: id,
    reason: "reason",
    signals: [],
    guardrail: {
      code: "none",
      label: "none",
      message: "none",
      blocksContact: false,
    },
    nextStep: "next",
    primaryAction: {
      id: "open",
      label: "Open",
      kind: "review",
    },
    secondaryActions: [],
    priority: {
      score,
      tier: 1,
      label: "label",
    },
    createdFrom: [],
    explainabilityText: "explain",
  };
}

describe("queue mission adapter", () => {
  it("reordena a fila pelo plano da engine", () => {
    const queue = [person("a"), person("b"), person("c")];
    const ordered = orderQueueByMissionPlan(queue, {
      missions: [],
      orderedPersonIds: ["c", "a"],
    });

    expect(ordered.map((item) => item.id)).toEqual(["c", "a", "b"]);
  });

  it("cria plano de missão com ids ordenados", () => {
    const plan = buildQueueMissionPlan(
      [
        source(person("care", { status: "nao_abordar", doNotContactReason: "Pediu exclusão." })),
        source(person("listen")),
      ],
      new Date("2026-05-14T12:00:00.000Z"),
    );

    expect(plan.missions.length).toBeGreaterThan(0);
    expect(plan.orderedPersonIds[0]).toBe("care");
  });

  it("monta bloco recomendado equilibrado", () => {
    const block = buildRecommendedMissionBlock([
      mission("care-1", "CUIDADO", 1000),
      mission("route-1", "ENCAMINHAMENTO", 800),
      mission("listen-1", "ESCUTA", 700),
      mission("bond-1", "VINCULO", 650),
      mission("return-1", "RETORNO", 620),
      mission("field-1", "CAMPO", 400),
    ]);

    expect(block[0].type).toBe("CUIDADO");
    expect(block.some((item) => item.type === "ENCAMINHAMENTO")).toBe(true);
    expect(block.filter((item) => item.type === "ESCUTA" || item.type === "VINCULO").length).toBeGreaterThanOrEqual(2);
    expect(block).toHaveLength(5);
  });

  it("filtra modos de trabalho", () => {
    const missions = [
      mission("care-1", "CUIDADO", 1000),
      mission("return-1", "RETORNO", 900),
      mission("listen-1", "ESCUTA", 700),
      mission("bond-1", "VINCULO", 650),
      mission("route-1", "ENCAMINHAMENTO", 800),
    ];

    expect(buildRecommendedMissionBlock(missions, "returns").every((item) => item.type === "CUIDADO" || item.type === "RETORNO")).toBe(true);
    expect(buildRecommendedMissionBlock(missions, "listening").every((item) => item.type === "ESCUTA" || item.type === "VINCULO")).toBe(true);
    expect(buildRecommendedMissionBlock(missions, "routing").every((item) => item.type === "ENCAMINHAMENTO")).toBe(true);
  });
});
