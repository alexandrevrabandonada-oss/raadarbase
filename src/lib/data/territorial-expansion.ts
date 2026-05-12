"use server";

import { shouldUseMockData } from "@/lib/config";
import { listTerritorySummaries } from "@/lib/data/territories";
import { mapTerritoryToPhase, type TerritoryPhaseId } from "@/lib/data/territory-mapper";
import { listFieldAgendaEvents } from "@/lib/data/field-agenda";
import { getTeamFlowAdoptionMetrics } from "@/lib/data/team-flow-adoption";
import type { TerritorySummary } from "@/lib/types";

export type ExpansionReadinessChecklistItem = {
  id: string;
  label: string;
  description: string;
  status: "met" | "not_met" | "partial";
  evidence?: string;
};

export type TerritorialExpansionCandidate = TerritorySummary & {
  phaseId: TerritoryPhaseId;
  readinessScore: number; // 0-100
  daysSinceAction: number;
  hasPlannedEvent: boolean;
  availableOperators: number;
  checklist: ExpansionReadinessChecklistItem[];
  priorityReason: string; // "mobilizacao", "escuta_with_signals", "stale", etc
};

export type TerritorialExpansionResult = {
  candidates: TerritorialExpansionCandidate[];
  grouped: {
    readyToOpen: TerritorialExpansionCandidate[];
    needsPrep: TerritorialExpansionCandidate[];
    atRisk: TerritorialExpansionCandidate[];
  };
  metrics: {
    totalCandidates: number;
    readyCount: number;
    needsPrepCount: number;
    atRiskCount: number;
  };
};

function calculateDaysSinceAction(lastActionAt: string | null): number {
  if (!lastActionAt) return Number.MAX_SAFE_INTEGER;
  const lastDate = new Date(lastActionAt);
  const now = new Date();
  return Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
}

function buildExpansionChecklist(
  territory: TerritorySummary,
  phase: TerritoryPhaseId,
  daysSinceAction: number,
  hasPlannedEvent: boolean,
  availableOperators: number
): ExpansionReadinessChecklistItem[] {
  const checklist: ExpansionReadinessChecklistItem[] = [];

  // 1. Bairro tem sinais suficientes?
  const hasEnoughSignals = territory.peopleMonitored >= 10;
  checklist.push({
    id: "has_signals",
    label: "Bairro tem sinais suficientes?",
    description: "Mínimo 10 pessoas monitoradas ou pautas recorrentes",
    status: hasEnoughSignals ? "met" : "not_met",
    evidence: `${territory.peopleMonitored} pessoas monitoradas`,
  });

  // 2. Tem pauta clara?
  const hasTopThemes = territory.topThemes && territory.topThemes.length > 0;
  checklist.push({
    id: "has_agenda",
    label: "Tem pauta clara?",
    description: "Pelo menos um tema recorrente identificado",
    status: hasTopThemes ? "met" : "not_met",
    evidence: hasTopThemes ? territory.topThemes.map(t => t.theme).join(", ") : "Nenhum tema identificado",
  });

  // 3. Tem operador responsável?
  const hasResponsibleOperator = availableOperators > 0;
  checklist.push({
    id: "has_operator",
    label: "Tem operador responsável?",
    description: "Operador disponível ou designado para o território",
    status: hasResponsibleOperator ? "met" : "not_met",
    evidence: `${availableOperators} operador(es) disponível(eis)`,
  });

  // 4. Tem ação possível?
  const hasFieldCapacity = territory.volunteers >= 2 || territory.openTasks > 0;
  checklist.push({
    id: "has_action",
    label: "Tem ação possível?",
    description: "Pelo menos 2 voluntários ou tarefas abertas",
    status: hasFieldCapacity ? "met" : "not_met",
    evidence: `${territory.volunteers} voluntários, ${territory.openTasks} tarefas abertas`,
  });

  // 5. Tem capacidade de follow-up?
  const hasFollowUpCapacity = territory.referrals > 0 || daysSinceAction < 30;
  checklist.push({
    id: "has_followup",
    label: "Tem capacidade de follow-up?",
    description: "Encaminhamentos pendentes ou ação recente indicam ciclo ativo",
    status: hasFollowUpCapacity ? "met" : "not_met",
    evidence: daysSinceAction === Number.MAX_SAFE_INTEGER ? "Sem ações registradas" : `Última ação: ${daysSinceAction} dias atrás`,
  });

  // 6. Há guardrails de privacidade?
  // This is a meta-commitment that should be verified separately in training
  const guardrailsNote = phase === "mobilizacao" ? "met" : phase === "escuta" ? "partial" : "not_met";
  checklist.push({
    id: "has_guardrails",
    label: "Há guardrails de privacidade?",
    description: "Equipe certificada sobre não-automação e LGPD",
    status: guardrailsNote,
    evidence: "Verificar documentação de treinamento OPREAL 04",
  });

  return checklist;
}

function calculateReadinessScore(checklist: ExpansionReadinessChecklistItem[]): number {
  const weights: Record<string, number> = {
    has_signals: 20,
    has_agenda: 15,
    has_operator: 25,
    has_action: 15,
    has_followup: 15,
    has_guardrails: 10,
  };

  let totalScore = 0;
  for (const item of checklist) {
    const weight = weights[item.id] || 0;
    const itemScore = item.status === "met" ? weight : item.status === "partial" ? weight * 0.5 : 0;
    totalScore += itemScore;
  }

  return Math.round(totalScore);
}

function determinePriorityReason(
  phase: TerritoryPhaseId,
  territory: TerritorySummary,
  daysSinceAction: number,
  _hasPlannedEvent: boolean
): string {
  if (phase === "mobilizacao") return "mobilizacao";
  if (phase === "escuta" && territory.priorityScore >= 60) return "escuta_with_signals";
  if (daysSinceAction >= 15 && daysSinceAction < Number.MAX_SAFE_INTEGER) return "stale_territory";
  return "emerging";
}

export async function getTerritorialExpansionCandidates(): Promise<TerritorialExpansionResult> {
  if (shouldUseMockData()) {
    return {
      candidates: [
        {
          neighborhood: "Vila Rica",
          peopleMonitored: 45,
          priorityPeople: 12,
          topThemes: [
            { theme: "infraestrutura", count: 15 },
            { theme: "saúde", count: 8 },
          ],
          referrals: 5,
          volunteers: 10,
          openTasks: 3,
          fieldActions: 4,
          lastActionAt: "2026-04-20T10:00:00Z",
          priorityScore: 85,
          phaseId: "mobilizacao",
          readinessScore: 85,
          daysSinceAction: 17,
          hasPlannedEvent: true,
          availableOperators: 2,
          checklist: [
            { id: "has_signals", label: "Bairro tem sinais suficientes?", description: "Mínimo 10 pessoas monitoradas", status: "met", evidence: "45 pessoas monitoradas" },
            { id: "has_agenda", label: "Tem pauta clara?", description: "Tema recorrente identificado", status: "met", evidence: "infraestrutura, saúde" },
            { id: "has_operator", label: "Tem operador responsável?", description: "Operador disponível", status: "met", evidence: "2 operadores disponíveis" },
            { id: "has_action", label: "Tem ação possível?", description: "Voluntários ou tarefas", status: "met", evidence: "10 voluntários, 3 tarefas" },
            { id: "has_followup", label: "Tem capacidade de follow-up?", description: "Ações ativas", status: "met", evidence: "Última ação: 17 dias atrás" },
            { id: "has_guardrails", label: "Há guardrails de privacidade?", description: "Equipe certificada", status: "met", evidence: "Treinamento OK" },
          ],
          priorityReason: "mobilizacao",
        },
        {
          neighborhood: "Retiro",
          peopleMonitored: 28,
          priorityPeople: 15,
          topThemes: [
            { theme: "educação", count: 10 },
            { theme: "lazer", count: 7 },
          ],
          referrals: 8,
          volunteers: 12,
          openTasks: 2,
          fieldActions: 1,
          lastActionAt: "2026-04-15T09:00:00Z",
          priorityScore: 94,
          phaseId: "escuta",
          readinessScore: 75,
          daysSinceAction: 22,
          hasPlannedEvent: false,
          availableOperators: 1,
          checklist: [
            { id: "has_signals", label: "Bairro tem sinais suficientes?", description: "Mínimo 10 pessoas monitoradas", status: "met", evidence: "28 pessoas monitoradas" },
            { id: "has_agenda", label: "Tem pauta clara?", description: "Tema recorrente identificado", status: "met", evidence: "educação, lazer" },
            { id: "has_operator", label: "Tem operador responsável?", description: "Operador disponível", status: "partial", evidence: "1 operador disponível (necessário 2)" },
            { id: "has_action", label: "Tem ação possível?", description: "Voluntários ou tarefas", status: "met", evidence: "12 voluntários, 2 tarefas" },
            { id: "has_followup", label: "Tem capacidade de follow-up?", description: "Ações ativas", status: "partial", evidence: "Última ação: 22 dias atrás" },
            { id: "has_guardrails", label: "Há guardrails de privacidade?", description: "Equipe certificada", status: "partial", evidence: "Em revisão" },
          ],
          priorityReason: "escuta_with_signals",
        },
      ],
      grouped: {
        readyToOpen: [], // Will be populated below
        needsPrep: [], // Will be populated below
        atRisk: [], // Will be populated below
      },
      metrics: {
        totalCandidates: 2,
        readyCount: 0,
        needsPrepCount: 0,
        atRiskCount: 0,
      },
    };
  }

  try {
    const [territories, events, teamMetrics] = await Promise.all([
      listTerritorySummaries(),
      listFieldAgendaEvents({ status: "planned" }),
      getTeamFlowAdoptionMetrics(),
    ]);

    // Build a map of neighborhoods to planned events
    const eventsByNeighborhood = new Map<string, typeof events[0][]>();
    (events || []).forEach((event) => {
      if (!event.neighborhood) return;
      if (!eventsByNeighborhood.has(event.neighborhood)) {
        eventsByNeighborhood.set(event.neighborhood, []);
      }
      eventsByNeighborhood.get(event.neighborhood)!.push(event);
    });

    // Average operators availability (simple estimate)
    const totalActiveOperators = teamMetrics.indicators.activeOperatorsToday;
    const avgOperatorsPerTerritory = Math.max(1, Math.floor(totalActiveOperators / Math.max(1, territories.length)));

    // Build candidates with expansion readiness data
    const candidates: TerritorialExpansionCandidate[] = territories
      .map((territory) => {
        const phase = mapTerritoryToPhase(territory);
        const daysSinceAction = calculateDaysSinceAction(territory.lastActionAt);
        const hasPlannedEvent = (eventsByNeighborhood.get(territory.neighborhood) || []).length > 0;
        const availableOperators = avgOperatorsPerTerritory; // Simplified for now
        
        const checklist = buildExpansionChecklist(
          territory,
          phase.id,
          daysSinceAction,
          hasPlannedEvent,
          availableOperators
        );
        const readinessScore = calculateReadinessScore(checklist);
        const priorityReason = determinePriorityReason(
          phase.id,
          territory,
          daysSinceAction,
          hasPlannedEvent
        );

        return {
          ...territory,
          phaseId: phase.id,
          readinessScore,
          daysSinceAction,
          hasPlannedEvent,
          availableOperators,
          checklist,
          priorityReason,
        };
      })
      // Filter to candidates worth considering for expansion
      .filter((c) => {
        // Include territories in mobilização or escuta phases
        if (c.phaseId === "mobilizacao") return true;
        if (c.phaseId === "escuta" && c.priorityScore >= 60) return true;
        // Include stale territories (15+ days without action)
        if (c.daysSinceAction >= 15 && c.daysSinceAction < Number.MAX_SAFE_INTEGER) return true;
        return false;
      })
      .sort((a, b) => b.readinessScore - a.readinessScore);

    // Group by readiness level
    const readyToOpen = candidates.filter((c) => c.readinessScore >= 75);
    const needsPrep = candidates.filter((c) => c.readinessScore >= 50 && c.readinessScore < 75);
    const atRisk = candidates.filter((c) => c.readinessScore < 50);

    return {
      candidates,
      grouped: {
        readyToOpen,
        needsPrep,
        atRisk,
      },
      metrics: {
        totalCandidates: candidates.length,
        readyCount: readyToOpen.length,
        needsPrepCount: needsPrep.length,
        atRiskCount: atRisk.length,
      },
    };
  } catch (error) {
    console.error("Error fetching territorial expansion candidates:", error);
    // Return empty result on error
    return {
      candidates: [],
      grouped: {
        readyToOpen: [],
        needsPrep: [],
        atRisk: [],
      },
      metrics: {
        totalCandidates: 0,
        readyCount: 0,
        needsPrepCount: 0,
        atRiskCount: 0,
      },
    };
  }
}
