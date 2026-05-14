import AppShell from "@/components/app-shell";
import { RadarPageHeader } from "@/components/radar/radar-page-header";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import { getPilotDashboardData } from "@/lib/data/pilot-stats";
import { getCollectiveProgressMetrics } from "@/lib/data/collective-progress-data";
import { getBaseQualityStats } from "@/lib/data/data-quality";
import { listTerritorySummaries } from "@/lib/data/territories";
import { mapTerritoryToPhase } from "@/lib/data/territory-mapper";
import { listFieldAgendaEvents, listFieldAgendaEventResultsByEventIds } from "@/lib/data/field-agenda";
import { calculateOperatorMission } from "@/lib/data/mission-engine";
import { calculateWeeklyRhythm } from "@/lib/data/weekly-rhythm";
import { assessQueueWellness } from "@/lib/data/operator-wellness";
import { getOperationalCycleAlerts } from "@/lib/data/operational-cycle-alerts";
import { getTeamFlowAdoptionMetrics } from "@/lib/data/team-flow-adoption";
import { getStrategicMemoryStats } from "@/lib/data/strategic-memory";
import { getTerritorialExpansionCandidates } from "@/lib/data/territorial-expansion";
import { buildCycleAlerts } from "@/lib/rhythm/cycle-alert-engine";
import { buildNextDecision } from "@/lib/rhythm/next-decision";
import { buildRhythmSummary } from "@/lib/rhythm/rhythm-summary";
import { RitmoClient } from "./ritmo-client";
import { countStrategicMemoryLinksByEntity } from "@/lib/data/strategic-memory";
import { buildFieldMemoryLoop } from "@/lib/field-memory/field-memory-loop";
import { getPilotFeedbackLoop } from "@/lib/data/pilot-feedback-loop";

export const dynamic = "force-dynamic";

export default async function RitmoPage() {
  await requireInternalPageSession("/ritmo");

  const [pilotData, collective, qualityStats, territories, fieldEvents, cycleAlerts, teamAdoption, memoryStats, territorialExpansion, feedbackLoop] = await Promise.all([
    getPilotDashboardData(),
    getCollectiveProgressMetrics(),
    getBaseQualityStats(),
    listTerritorySummaries(),
    listFieldAgendaEvents({ includeMetrics: true }),
    getOperationalCycleAlerts(),
    getTeamFlowAdoptionMetrics(),
    getStrategicMemoryStats(),
    getTerritorialExpansionCandidates(),
    getPilotFeedbackLoop(),
  ]);

  const eventResults = await listFieldAgendaEventResultsByEventIds(fieldEvents.map((event) => event.id));
  const resultMemoryLinks = await countStrategicMemoryLinksByEntity(
    "result",
    Object.values(eventResults).map((result) => result.id),
  );
  const fieldMemoryLoop = buildFieldMemoryLoop({
    events: fieldEvents,
    resultsByEventId: eventResults,
    resultMemoryLinksByResultId: resultMemoryLinks,
    weeklyClosuresGenerated: teamAdoption.indicators.dailyClosuresGenerated,
    feedbackLoop,
  });

  const territoryCounts = territories.reduce(
    (acc, territory) => {
      const phase = mapTerritoryToPhase(territory);
      if (phase.id === "mobilizacao") acc.mobilizacao += 1;
      if (phase.id === "campo") acc.campo += 1;
      if (phase.id === "continuidade") acc.continuidade += 1;
      return acc;
    },
    { mobilizacao: 0, campo: 0, continuidade: 0 }
  );

  const plannedActions = fieldEvents.filter((event) => event.status === "planned" || event.status === "draft").length;
  const actionsNeedingConfirmation = fieldEvents.reduce((sum, event) => sum + (event.metrics?.pendingConfirmation || 0), 0);
  const queueLoads = pilotData.responsibleBreakdown.length > 0
    ? pilotData.responsibleBreakdown.map((item) => item.openTasks)
    : [pilotData.summary.openTasks];

  const averageQueueLoad = Math.round(queueLoads.reduce((sum, value) => sum + value, 0) / Math.max(queueLoads.length, 1));
  const overloadAlerts = queueLoads.filter((load) => assessQueueWellness(load).level !== "healthy").length;
  const wellness = assessQueueWellness(averageQueueLoad);

  const wellnessRecommendation = overloadAlerts > 0
    ? "Carga acima do ideal em parte da equipe. Priorize redistribuição e pausas curtas por bloco."
    : "Carga estável no momento. Mantenha ritmo sustentável e revisão de pendências críticas.";

  const missionState = calculateOperatorMission({
    tasksAssumed: pilotData.responsibleBreakdown.filter((item) => item.openTasks > 0).length,
    tasksCompleted: pilotData.funnel.approached,
    repliesRecorded: pilotData.summary.responsesRecorded,
    referralsMade: pilotData.funnel.referred,
    stalePending: pilotData.summary.staleTasksCount,
  });

  const weeklyRhythmState = calculateWeeklyRhythm({
    dayOfWeek: new Date().getDay(),
    tasksDistributed: pilotData.summary.tasksWithoutResponsible === 0,
    prioritiesReviewed: true,
    responsesRecordedCount: pilotData.summary.responsesRecorded,
    referralsMadeCount: pilotData.funnel.referred,
    stalePendenciesCount: pilotData.summary.staleTasksCount,
    fieldActionsPlannedCount: plannedActions,
    weeklyClosureStarted: false,
  });

  const legacyTerritoryAlert =
    cycleAlerts.alerts.find((alert) => alert.id === "territorio_travado")?.count ?? 0;

  const rhythmAlerts = buildCycleAlerts({
    unassignedMissions: collective.operationHealth.tasksWithoutResponsible,
    pendingReturns: collective.operationHealth.waiting7DaysCount + Math.max(collective.operationHealth.dmsPreparedWithoutConfirmation, 0),
    openReferrals: pilotData.summary.pendingReferralsCount,
    urgentCare: collective.ethics.sensitiveNotesReviewed + collective.ethics.dataUnderReview,
    fieldWithoutClosure: fieldMemoryLoop.stats.fieldWithoutClosureCount,
    territoryWithoutAction: legacyTerritoryAlert,
    pendingMemory: memoryStats.draftCount + fieldMemoryLoop.memorySuggestions.filter((item) => item.type !== "REGISTRO_DE_CAMPO").length,
    highTeamLoad: overloadAlerts,
    territoriesReady: territorialExpansion.metrics.readyCount,
  });

  const nextDecision = buildNextDecision(rhythmAlerts);
  const rhythmSummary = buildRhythmSummary(rhythmAlerts);

  return (
    <AppShell>
      <RadarPageHeader
        eyebrow="Leitura da Operação"
        title="Central de Ritmo"
        description="Acompanhe o avanço coletivo sem pressão por volume."
      />

      <RitmoClient
        data={{
          missionState,
          weeklyRhythmState,
          collectiveNarrative: {
            linksPrepared: collective.progress.linksPrepared,
            conversationsRegistered: collective.progress.responsesRecorded,
            referralsMade: collective.progress.referralsMade,
            fieldActions: collective.progress.fieldActionsCompleted,
            territoriesInMobilization: collective.progress.territoriesInMobilization,
          },
          operationHealth: {
            staleTasksCount: collective.operationHealth.staleTasksCount,
            waiting7DaysCount: collective.operationHealth.waiting7DaysCount,
            dmsPreparedWithoutConfirmation: collective.operationHealth.dmsPreparedWithoutConfirmation,
            tasksWithoutResponsible: collective.operationHealth.tasksWithoutResponsible,
            territoriesWithoutRecentAction: collective.operationHealth.territoriesWithoutRecentAction,
          },
          careBase: {
            doNotContactRespected: collective.ethics.doNotContactRespected,
            sensitiveAlertsCount: collective.ethics.sensitiveNotesReviewed,
            dataUnderReview: collective.ethics.dataUnderReview,
            eligibleForReviewCount: qualityStats.eligibleForReviewCount,
          },
          territories: territoryCounts,
          field: {
            plannedActions,
            actionsNeedingConfirmation,
            pastEventsWithoutResult: fieldMemoryLoop.stats.fieldWithoutClosureCount,
          },
          wellness: {
            averageQueueLoad,
            overloadAlerts,
            recommendation: wellnessRecommendation,
            level: wellness.level,
          },
          teamAdoption,
          nextDecision,
          rhythmSummary,
          memory: {
            draftCount: memoryStats.draftCount,
            activeCount: memoryStats.activeCount,
          },
          expansion: {
            readyCount: territorialExpansion.metrics.readyCount,
            needsPrepCount: territorialExpansion.metrics.needsPrepCount,
          },
        }}
        cycleAlerts={rhythmAlerts}
      />
    </AppShell>
  );
}
