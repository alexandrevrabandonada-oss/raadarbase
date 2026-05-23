import AppShell from "@/components/app-shell";
import { RuntimeAlert } from "@/components/runtime-alert";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import { getPilotDashboardData } from "@/lib/data/pilot-stats";
import { listPriorityPeople } from "@/lib/data/people-priority";
import { getOperationalCycleAlerts } from "@/lib/data/operational-cycle-alerts";
import { getOperationalAlertsAction } from "./actions";
import { DashboardClient, type DashboardViewData } from "./dashboard-client";
import { getCollectiveProgressMetrics } from "@/lib/data/collective-progress-data";
import { getBaseQualityStats } from "@/lib/data/data-quality";
import { listTerritorySummaries } from "@/lib/data/territories";
import { mapTerritoryToPhase } from "@/lib/data/territory-mapper";
import {
  listFieldAgendaEvents,
  listFieldAgendaEventResultsByEventIds,
  type FieldAgendaEvent,
} from "@/lib/data/field-agenda";
import { calculateOperatorMission } from "@/lib/data/mission-engine";
import { calculateWeeklyRhythm } from "@/lib/data/weekly-rhythm";
import { assessQueueWellness } from "@/lib/data/operator-wellness";
import { getStrategicMemoryStats } from "@/lib/data/strategic-memory";
import { buildDailyNarrative } from "@/lib/narrative/daily-narrative";
import { buildWeeklyNarrative } from "@/lib/narrative/weekly-narrative";
import { buildSeasonNarrative } from "@/lib/narrative/season-narrative";
import { listAuditLogs } from "@/lib/data/audit";

export const dynamic = "force-dynamic";

function getCurrentTimestamp() {
  return Date.now();
}

function getOverallStatus(data: {
  staleTasksCount: number;
  tasksWithoutResponsible: number;
  territoriesWithoutRecentAction: number;
  pastEventsWithoutResult: number;
  queueLevel: "healthy" | "warning" | "critical";
}) {
  if (
    data.tasksWithoutResponsible > 0 ||
    data.pastEventsWithoutResult > 0 ||
    data.queueLevel === "critical"
  ) {
    return {
      label: "Sinais pedindo coordenação",
      tone: "critical" as const,
      detail: "Há travas de operação que pedem redistribuição e fechamento hoje.",
    };
  }

  if (data.staleTasksCount > 0 || data.territoriesWithoutRecentAction > 0 || data.queueLevel === "warning") {
    return {
      label: "Operação em ajuste fino",
      tone: "warning" as const,
      detail: "A base está andando, mas há missões e territórios que pedem atenção curta.",
    };
  }

  return {
    label: "Operação em ritmo saudável",
    tone: "healthy" as const,
    detail: "Missões, campo e território seguem com boa cadência neste ciclo.",
  };
}

function formatFieldEvent(event: FieldAgendaEvent) {
  return {
    id: event.id,
    title: event.title,
    neighborhood: event.neighborhood ?? "Território em definição",
    startsAt: event.startsAt,
    status: event.status,
    pendingConfirmation: event.metrics?.pendingConfirmation ?? 0,
    confirmed: event.metrics?.confirmed ?? 0,
    href: `/campo/${event.id}`,
  };
}

async function loadDashboardData() {
  const [
    priorityPeople,
    pilotStats,
    operationalAlerts,
    cycleAlerts,
    collective,
    qualityStats,
    territories,
    fieldEvents,
    memoryStats,
    recentLogs,
  ] = await Promise.all([
    listPriorityPeople(),
    getPilotDashboardData(),
    getOperationalAlertsAction(),
    getOperationalCycleAlerts(),
    getCollectiveProgressMetrics(),
    getBaseQualityStats(),
    listTerritorySummaries(),
    listFieldAgendaEvents({ includeMetrics: true }),
    getStrategicMemoryStats(),
    listAuditLogs(),
  ]);

  const eventResults = await listFieldAgendaEventResultsByEventIds(fieldEvents.map((event) => event.id));

  const territoryCounts = territories.reduce(
    (acc, territory) => {
      const phase = mapTerritoryToPhase(territory);
      if (phase.id === "mobilizacao") acc.mobilizacao += 1;
      if (phase.id === "campo") acc.campo += 1;
      if (phase.id === "continuidade") acc.continuidade += 1;
      return acc;
    },
    { mobilizacao: 0, campo: 0, continuidade: 0 },
  );

  const territoryHighlights = {
    mobilizacao:
      territories
        .filter((territory) => mapTerritoryToPhase(territory).id === "mobilizacao")
        .sort((a, b) => b.priorityPeople - a.priorityPeople)[0] ?? null,
    campo:
      territories
        .filter((territory) => mapTerritoryToPhase(territory).id === "campo")
        .sort((a, b) => b.fieldActions - a.fieldActions)[0] ?? null,
    continuidade:
      territories
        .filter((territory) => mapTerritoryToPhase(territory).id === "continuidade")
        .sort((a, b) => b.openTasks - a.openTasks)[0] ?? null,
  };

  const now = getCurrentTimestamp();
  const plannedActions = fieldEvents.filter((event) => event.status === "planned" || event.status === "draft");
  const futureActions = plannedActions
    .filter((event) => {
      if (!event.startsAt) return true;
      return new Date(event.startsAt).getTime() >= now;
    })
    .slice(0, 3)
    .map(formatFieldEvent);
  const confirmationActions = plannedActions
    .filter((event) => (event.metrics?.pendingConfirmation ?? 0) > 0)
    .sort((a, b) => (b.metrics?.pendingConfirmation ?? 0) - (a.metrics?.pendingConfirmation ?? 0))
    .slice(0, 3)
    .map(formatFieldEvent);
  const unresolvedPastEvents = fieldEvents.filter((event) => {
    const startsAt = event.startsAt ? new Date(event.startsAt).getTime() : Number.POSITIVE_INFINITY;
    return Number.isFinite(startsAt) && startsAt <= now && !eventResults[event.id];
  });
  const unresolvedPastActions = unresolvedPastEvents.slice(0, 3).map(formatFieldEvent);

  const queueLoads = pilotStats.responsibleBreakdown.length > 0
    ? pilotStats.responsibleBreakdown.map((item) => item.openTasks)
    : [pilotStats.summary.openTasks];
  const averageQueueLoad = Math.round(queueLoads.reduce((sum, value) => sum + value, 0) / Math.max(queueLoads.length, 1));
  const overloadAlerts = queueLoads.filter((load) => assessQueueWellness(load).level !== "healthy").length;
  const wellness = assessQueueWellness(averageQueueLoad);

  const missionState = calculateOperatorMission({
    tasksAssumed: pilotStats.responsibleBreakdown.filter((item) => item.openTasks > 0).length,
    tasksCompleted: pilotStats.summary.dmsConfirmedToday,
    repliesRecorded: pilotStats.summary.responsesRecorded,
    referralsMade: pilotStats.funnel.referred,
    stalePending: pilotStats.summary.staleTasksCount,
  });

  const weeklyRhythmState = calculateWeeklyRhythm({
    dayOfWeek: new Date().getDay(),
    tasksDistributed: pilotStats.summary.tasksWithoutResponsible === 0,
    prioritiesReviewed: priorityPeople.length > 0,
    responsesRecordedCount: pilotStats.summary.responsesRecorded,
    referralsMadeCount: pilotStats.funnel.referred,
    stalePendenciesCount: pilotStats.summary.staleTasksCount,
    fieldActionsPlannedCount: plannedActions.length,
    weeklyClosureStarted: false,
    dmsConfirmedThisWeekCount: pilotStats.summary.dmsConfirmedThisWeek,
  });

  const overallStatus = getOverallStatus({
    staleTasksCount: collective.operationHealth.staleTasksCount,
    tasksWithoutResponsible: collective.operationHealth.tasksWithoutResponsible,
    territoriesWithoutRecentAction: collective.operationHealth.territoriesWithoutRecentAction,
    pastEventsWithoutResult: unresolvedPastEvents.length,
    queueLevel: wellness.level,
  });

  const newSignalsCount = priorityPeople.filter((person) =>
    person.latestInteractionType === "comentario" ||
    person.latestInteractionType === "resposta_story",
  ).length;
  const recurringLinksCount = priorityPeople.filter((person) => person.totalInteractions >= 3).length;
  const urgentCareCount = collective.ethics.sensitiveNotesReviewed + collective.ethics.dataUnderReview;
  const pendingReturnsCount =
    pilotStats.summary.waiting3DaysCount +
    pilotStats.summary.dmsPreparedWithoutConfirmation +
    collective.operationHealth.staleTasksCount;
  const openReferralsCount = pilotStats.summary.pendingReferralsCount;
  const pendingMemoryCount = memoryStats.draftCount;
  const territoriesReadyCount = territories.filter((territory) => territory.priorityPeople > 0 && territory.openTasks === 0).length;

  const narrative = {
    today: buildDailyNarrative({
      pendingReturns: pendingReturnsCount,
      newSignals: newSignalsCount,
      urgentCare: urgentCareCount,
      openReferrals: openReferralsCount,
      fieldWithoutClosure: unresolvedPastEvents.length,
      pendingMemory: pendingMemoryCount,
      recurringLinks: recurringLinksCount,
    }),
    week: buildWeeklyNarrative({
      unassignedMissions: collective.operationHealth.tasksWithoutResponsible,
      pendingReturns: pendingReturnsCount,
      openReferrals: openReferralsCount,
      fieldWithoutClosure: unresolvedPastEvents.length,
      pendingMemory: pendingMemoryCount,
      territoriesReady: territoriesReadyCount,
      staleTasks: collective.operationHealth.staleTasksCount,
      urgentCare: urgentCareCount,
    }),
    season: buildSeasonNarrative({
      activeMissions: priorityPeople.length,
      recurringLinks: recurringLinksCount,
      openReferrals: openReferralsCount,
      fieldWithoutClosure: unresolvedPastEvents.length,
      pendingMemory: pendingMemoryCount,
      territoriesInMobilization: territoryCounts.mobilizacao,
      territoriesInField: territoryCounts.campo,
      territoriesInContinuity: territoryCounts.continuidade,
      urgentCare: urgentCareCount,
    }),
  };

  const dashboardData: DashboardViewData = {
    narrative,
    missionState,
    weeklyRhythmState,
    overallStatus,
    missionCounts: {
      active: priorityPeople.length,
      replies: pilotStats.summary.responsesRecorded,
      referrals: pilotStats.funnel.referred,
    },
    systemAlerts: {
      unassignedTasks: collective.operationHealth.tasksWithoutResponsible,
      staleTasks: collective.operationHealth.staleTasksCount,
      territoriesNeedingAction: collective.operationHealth.territoriesWithoutRecentAction,
      fieldWithoutClosure: unresolvedPastEvents.length,
    },
    quickMap: {
      counts: territoryCounts,
      highlights: {
        mobilizacao: territoryHighlights.mobilizacao
          ? {
              neighborhood: territoryHighlights.mobilizacao.neighborhood,
              detail: `${territoryHighlights.mobilizacao.priorityPeople} pessoas pedindo direção.`,
            }
          : null,
        campo: territoryHighlights.campo
          ? {
              neighborhood: territoryHighlights.campo.neighborhood,
              detail: `${territoryHighlights.campo.fieldActions} ações ligadas ao território.`,
            }
          : null,
        continuidade: territoryHighlights.continuidade
          ? {
              neighborhood: territoryHighlights.continuidade.neighborhood,
              detail: `${territoryHighlights.continuidade.openTasks} vínculos ainda abertos.`,
            }
          : null,
      },
    },
    field: {
      plannedCount: plannedActions.length,
      confirmationCount: plannedActions.reduce((sum, event) => sum + (event.metrics?.pendingConfirmation ?? 0), 0),
      unresolvedCount: unresolvedPastEvents.length,
      upcoming: futureActions,
      confirmation: confirmationActions,
      unresolved: unresolvedPastActions,
    },
    care: {
      averageQueueLoad,
      overloadAlerts,
      wellnessLevel: wellness.level,
      wellnessMicrocopy: wellness.microcopy,
      wellnessRecommendation: wellness.recommendation,
      baseReviewCount: qualityStats.eligibleForReviewCount,
      sensitiveAlertsCount: collective.ethics.sensitiveNotesReviewed,
      collectiveProgress: collective.funnel.conclude,
      referralsMade: collective.progress.referralsMade,
      doNotContactRespected: collective.ethics.doNotContactRespected,
      bairroListensSubmitted: collective.progress.bairroListensSubmitted,
      linksPrepared: collective.progress.linksPrepared,
      responsesRecorded: collective.progress.responsesRecorded,
      fieldActionsCompleted: collective.progress.fieldActionsCompleted,
      dmsConfirmedToday: pilotStats.summary.dmsConfirmedToday,
      dmsConfirmedThisWeek: pilotStats.summary.dmsConfirmedThisWeek,
    },
    integrationAlerts: {
      webhookQuarantineCount: operationalAlerts.webhookQuarantineCount,
      missingTemplatesCount: operationalAlerts.missingTemplates.length,
    },
    recentLogs: recentLogs ?? [],
  };

  return {
    priorityPeople,
    pilotStats,
    cycleAlerts: cycleAlerts.alerts,
    dashboardData,
  };
}

export default async function DashboardPage() {
  const session = await requireInternalPageSession("/dashboard");

  let loaded:
    | Awaited<ReturnType<typeof loadDashboardData>>
    | null = null;
  let loadError: string | null = null;

  try {
    loaded = await loadDashboardData();
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Não foi possível carregar o hub principal do sistema.";
  }

  if (!loaded) {
    return (
      <AppShell>
        <RuntimeAlert
          title="Falha ao carregar a Base de Operações"
          description={loadError ?? "Não foi possível carregar o hub principal do sistema."}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <DashboardClient
        session={session}
        priorityPeople={loaded.priorityPeople}
        pilotStats={loaded.pilotStats}
        cycleAlerts={loaded.cycleAlerts}
        data={loaded.dashboardData}
      />
    </AppShell>
  );
}
