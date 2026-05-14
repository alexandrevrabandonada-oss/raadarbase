import type { FieldAgendaEvent, FieldAgendaEventResult } from "@/lib/data/field-agenda";
import { getFieldJourneySnapshot, type FieldJourneyPhaseKey } from "@/lib/data/field-agenda-journey";
import type { PilotFeedbackLoopResult } from "@/lib/data/pilot-feedback-loop";
import type { OperationalCycleSeverity, OperationalCycleState } from "@/lib/operational-cycle/cycle-types";
import { OPERATIONAL_CYCLE_COPY } from "@/lib/operational-cycle/cycle-copy";
import { buildFieldResultMemoryHref } from "./assisted-memory";

export type FieldLoopMissionType =
  | "CAMPO_SEM_FECHAMENTO"
  | "CONFIRMACAO_PENDENTE"
  | "FOLLOW_UP_PENDENTE";

export type MemorySuggestionType =
  | "REGISTRO_DE_CAMPO"
  | "PAUTA_VIVA"
  | "TRAVA_RECORRENTE"
  | "CUIDADO_DA_BASE"
  | "DEVOLUTIVA_TERRITORIAL"
  | "APRENDIZADO_DE_MENSAGEM"
  | "MEMORIA_DA_SEMANA";

export interface FieldLoopMission {
  type: FieldLoopMissionType;
  state: Extract<OperationalCycleState, "active" | "blocked" | "waiting">;
  title: string;
  description: string;
  recommendedAction: string;
  href: string;
  count: number;
  severity: Extract<OperationalCycleSeverity, "attention" | "critical">;
}

export interface FieldMemorySuggestion {
  id: string;
  type: MemorySuggestionType;
  state: Extract<OperationalCycleState, "suggested" | "completed">;
  title: string;
  summary: string;
  sourceCount: number;
  href: string;
  sourceHref?: string;
  territory?: string | null;
}

export interface FieldMemoryLoopInput {
  events: FieldAgendaEvent[];
  resultsByEventId: Record<string, FieldAgendaEventResult>;
  resultMemoryLinksByResultId?: Record<string, number>;
  weeklyClosuresGenerated?: number;
  feedbackLoop?: PilotFeedbackLoopResult | null;
}

export interface FieldMemoryLoopOutput {
  phaseCounts: Record<FieldJourneyPhaseKey, number>;
  missions: FieldLoopMission[];
  memorySuggestions: FieldMemorySuggestion[];
  stats: {
    fieldWithoutClosureCount: number;
    pendingConfirmationCount: number;
    pendingFollowUpCount: number;
    resultsWithoutMemoryCount: number;
  };
}

function topFeedbackCategory(feedbackLoop: PilotFeedbackLoopResult | null | undefined) {
  if (!feedbackLoop) return null;

  const entries = Object.entries(feedbackLoop.countsByCategory)
    .filter(([, count]) => count >= 2)
    .sort((left, right) => right[1] - left[1]);

  if (entries.length === 0) return null;
  const [category, count] = entries[0];
  return { category, count };
}

function buildRecurringFeedbackSuggestion(
  feedbackLoop: PilotFeedbackLoopResult | null | undefined,
): FieldMemorySuggestion | null {
  const topCategory = topFeedbackCategory(feedbackLoop);
  if (!topCategory) return null;

  const firstItem = feedbackLoop?.grouped[topCategory.category as keyof PilotFeedbackLoopResult["grouped"]]?.[0];
  if (!firstItem) return null;

  const type: MemorySuggestionType =
    topCategory.category === "duvida_etica"
      ? "CUIDADO_DA_BASE"
      : topCategory.category === "duvida_tela"
        ? "APRENDIZADO_DE_MENSAGEM"
        : "TRAVA_RECORRENTE";

  return {
    id: `feedback-${type}-${topCategory.category}`,
    type,
    title:
      type === "CUIDADO_DA_BASE"
        ? "Cuidado da Base"
        : type === "APRENDIZADO_DE_MENSAGEM"
          ? "Aprendizado de Mensagem"
          : "Trava Recorrente",
    summary:
      type === "CUIDADO_DA_BASE"
        ? "Há dúvidas éticas recorrentes. Vale consolidar cuidado operacional sem expor casos individuais."
        : type === "APRENDIZADO_DE_MENSAGEM"
          ? "Há dúvidas recorrentes de leitura e mensagem. Consolidar o aprendizado evita repetição de erro no próximo ciclo."
          : `O feedback recorrente em ${firstItem.route} indica uma trava operacional que pede síntese compartilhável.`,
    sourceCount: topCategory.count,
    href: "/memoria/nova",
    sourceHref: "/ritmo",
    state: "suggested",
  };
}

export function buildFieldMemoryLoop(input: FieldMemoryLoopInput): FieldMemoryLoopOutput {
  const phaseCounts: Record<FieldJourneyPhaseKey, number> = {
    planejar: 0,
    convidar: 0,
    confirmar: 0,
    realizar: 0,
    registrar: 0,
    follow_up: 0,
  };

  const closureEventIds = new Set<string>();
  const pendingConfirmationEvents: FieldAgendaEvent[] = [];
  const pendingFollowUpEvents: FieldAgendaEvent[] = [];
  const resultsWithoutMemory: Array<{ event: FieldAgendaEvent; result: FieldAgendaEventResult }> = [];

  const topicCounts = new Map<string, number>();
  const neighborhoodCounts = new Map<string, number>();

  for (const event of input.events) {
    const result = input.resultsByEventId[event.id] ?? null;
    const snapshot = getFieldJourneySnapshot(event, result);
    phaseCounts[snapshot.currentPhase] += 1;

    if (snapshot.shouldShowClosureAlert) {
      closureEventIds.add(event.id);
    }

    if ((event.metrics?.pendingConfirmation ?? 0) > 0 && (event.status === "planned" || event.status === "draft")) {
      pendingConfirmationEvents.push(event);
    }

    if (((event.metrics?.attended ?? 0) > 0 || (event.metrics?.helped ?? 0) > 0) && !snapshot.hasFollowUpTasks) {
      pendingFollowUpEvents.push(event);
    }

    if (result) {
      const linkCount = input.resultMemoryLinksByResultId?.[result.id] ?? 0;
      if (linkCount === 0) {
        closureEventIds.add(event.id);
        resultsWithoutMemory.push({ event, result });
      }

      for (const topic of result.topicsDiscussed) {
        topicCounts.set(topic, (topicCounts.get(topic) ?? 0) + 1);
      }
      for (const neighborhood of result.neighborhoodsMentioned) {
        neighborhoodCounts.set(neighborhood, (neighborhoodCounts.get(neighborhood) ?? 0) + 1);
      }
    }
  }

  const missions: FieldLoopMission[] = [];
  if (closureEventIds.size > 0) {
    missions.push({
      type: "CAMPO_SEM_FECHAMENTO",
      state: "blocked",
      title: "Campo sem fechamento",
      description: "Há ações passadas sem resultado registrado ou sem memória vinculada ao aprendizado do campo.",
      recommendedAction: OPERATIONAL_CYCLE_COPY.fieldNeedsMemory,
      href: "/campo",
      count: closureEventIds.size,
      severity: "critical",
    });
  }
  if (pendingConfirmationEvents.length > 0) {
    missions.push({
      type: "CONFIRMACAO_PENDENTE",
      state: "active",
      title: "Confirmações pendentes",
      description: "Há pessoas interessadas em ações presenciais que ainda não tiveram confirmação consolidada.",
      recommendedAction: "Fechar a rodada de confirmação antes da execução do campo.",
      href: "/campo",
      count: pendingConfirmationEvents.length,
      severity: "attention",
    });
  }
  if (pendingFollowUpEvents.length > 0) {
    missions.push({
      type: "FOLLOW_UP_PENDENTE",
      state: "waiting",
      title: "Follow-up pendente",
      description: "Há presença registrada sem próximo passo explícito depois do campo.",
      recommendedAction: "Criar follow-up curto e registrar a continuidade sem presumir novo consentimento.",
      href: "/campo",
      count: pendingFollowUpEvents.length,
      severity: "attention",
    });
  }

  const memorySuggestions: FieldMemorySuggestion[] = resultsWithoutMemory.slice(0, 4).map(({ event, result }) => ({
    id: `result-${result.id}`,
    type: "REGISTRO_DE_CAMPO",
    state: "suggested",
    title: `Registro de Campo: ${event.title}`,
    summary: `O campo em ${event.neighborhood ?? "território em definição"} já tem resultado agregado e pede memória para orientar o próximo ciclo.`,
    sourceCount: 1,
    href: buildFieldResultMemoryHref(event.id, result.id),
    sourceHref: `/campo/${event.id}`,
    territory: event.neighborhood,
  }));

  if ((input.weeklyClosuresGenerated ?? 0) > 0) {
    memorySuggestions.push({
      id: "weekly-closure",
      type: "MEMORIA_DA_SEMANA",
      state: "suggested",
      title: "Memória da Semana",
      summary: "Há fechamento semanal registrado. Consolidar a memória agora ajuda a coordenação a abrir o próximo ciclo com contexto.",
      sourceCount: input.weeklyClosuresGenerated ?? 0,
      href: "/memoria/nova",
      sourceHref: "/ritmo",
    });
  }

  const recurringFeedbackSuggestion = buildRecurringFeedbackSuggestion(input.feedbackLoop);
  if (recurringFeedbackSuggestion) {
    memorySuggestions.push(recurringFeedbackSuggestion);
  }

  const topTopic = Array.from(topicCounts.entries()).sort((left, right) => right[1] - left[1])[0];
  if (topTopic && topTopic[1] >= 2) {
    memorySuggestions.push({
      id: `topic-${topTopic[0]}`,
      type: "PAUTA_VIVA",
      state: "suggested",
      title: "Pauta Viva",
      summary: `O tema ${topTopic[0]} apareceu de forma recorrente no campo. Vale consolidar a pauta viva para guiar escuta e devolutiva.`,
      sourceCount: topTopic[1],
      href: "/memoria/nova",
      sourceHref: "/campo",
    });
  }

  const topNeighborhood = Array.from(neighborhoodCounts.entries()).sort((left, right) => right[1] - left[1])[0];
  if (topNeighborhood && topNeighborhood[1] >= 2) {
    memorySuggestions.push({
      id: `territory-${topNeighborhood[0]}`,
      type: "DEVOLUTIVA_TERRITORIAL",
      state: "suggested",
      title: "Devolutiva Territorial",
      summary: `O território ${topNeighborhood[0]} concentrou aprendizados recentes. Uma devolutiva territorial ajuda a fechar o ciclo sem expor pessoas.`,
      sourceCount: topNeighborhood[1],
      href: "/memoria/nova",
      sourceHref: "/relatorios/territorios",
      territory: topNeighborhood[0],
    });
  }

  return {
    phaseCounts,
    missions,
    memorySuggestions,
    stats: {
      fieldWithoutClosureCount: closureEventIds.size,
      pendingConfirmationCount: pendingConfirmationEvents.length,
      pendingFollowUpCount: pendingFollowUpEvents.length,
      resultsWithoutMemoryCount: resultsWithoutMemory.length,
    },
  };
}
