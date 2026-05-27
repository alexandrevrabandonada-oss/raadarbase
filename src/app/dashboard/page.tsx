import AppShell from "@/components/app-shell";
import { RuntimeAlert } from "@/components/runtime-alert";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getPilotDashboardData } from "@/lib/data/pilot-stats";
import { listPriorityPeople } from "@/lib/data/people-priority";
import type { OperationalCycleAlert } from "@/lib/data/operational-cycle-alerts";
import { getOperationalAlertsAction } from "./actions";
import { DashboardClient, type DashboardViewData } from "./dashboard-client";
import { getCollectiveProgressMetrics } from "@/lib/data/collective-progress-data";
import { countPeopleEligibleForReview } from "@/lib/data/data-quality";
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
import { countDraftStrategicMemories } from "@/lib/data/strategic-memory";
import { buildDailyNarrative } from "@/lib/narrative/daily-narrative";
import { buildWeeklyNarrative } from "@/lib/narrative/weekly-narrative";
import { buildSeasonNarrative } from "@/lib/narrative/season-narrative";
import { listAuditLogs } from "@/lib/data/audit";

export const dynamic = "force-dynamic";

const STUCK_LINK_DAYS = 5;
const HEALTHY_QUEUE_LIMIT = 5;
const LINKAGE_COLUMNS = [
  "esperando_resposta",
  "aguardando_resposta",
  "precisa_encaminhar",
  "convidar_grupo",
];

function getCurrentTimestamp() {
  return Date.now();
}

function getPastIso(days: number) {
  const reference = new Date();
  reference.setDate(reference.getDate() - days);
  return reference.toISOString();
}

async function countDashboardStuckLinkTasks() {
  const supabase = getSupabaseAdminClient();
  const { count, error } = await supabase
    .from("outreach_tasks")
    .select("id", { count: "exact", head: true })
    .is("completed_at", null)
    .in("column_key", LINKAGE_COLUMNS)
    .lt("updated_at", getPastIso(STUCK_LINK_DAYS));

  if (error) throw error;
  return count ?? 0;
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

async function loadDashboardData(session: Awaited<ReturnType<typeof requireInternalPageSession>>) {
  const [
    priorityPeople,
    pilotStats,
    operationalAlerts,
    collective,
    baseReviewCount,
    territories,
    fieldEvents,
    draftMemoryCount,
    recentLogs,
    stuckLinkCount,
  ] = await Promise.all([
    listPriorityPeople({ limit: 250 }),
    getPilotDashboardData({ includeRetrospective: false }),
    getOperationalAlertsAction(),
    getCollectiveProgressMetrics(),
    countPeopleEligibleForReview(),
    listTerritorySummaries(),
    listFieldAgendaEvents({ includeMetrics: true }),
    countDraftStrategicMemories(),
    listAuditLogs(10),
    countDashboardStuckLinkTasks(),
  ]);

  const now = getCurrentTimestamp();
  const pastFieldEventIds = fieldEvents
    .filter((event) => {
      if (!event.startsAt) return false;
      const startsAt = new Date(event.startsAt).getTime();
      return Number.isFinite(startsAt) && startsAt <= now;
    })
    .map((event) => event.id);
  const eventResults = await listFieldAgendaEventResultsByEventIds(pastFieldEventIds);

  const territoriesWithPhase = territories.map((territory) => ({
    territory,
    phase: mapTerritoryToPhase(territory),
  }));

  const territoryCounts = territoriesWithPhase.reduce(
    (acc, territory) => {
      if (territory.phase.id === "mobilizacao") acc.mobilizacao += 1;
      if (territory.phase.id === "campo") acc.campo += 1;
      if (territory.phase.id === "continuidade") acc.continuidade += 1;
      return acc;
    },
    { mobilizacao: 0, campo: 0, continuidade: 0 },
  );

  const territoryHighlights = {
    mobilizacao:
      territoriesWithPhase
        .filter((item) => item.phase.id === "mobilizacao")
        .sort((a, b) => b.territory.priorityPeople - a.territory.priorityPeople)[0]?.territory ?? null,
    campo:
      territoriesWithPhase
        .filter((item) => item.phase.id === "campo")
        .sort((a, b) => b.territory.fieldActions - a.territory.fieldActions)[0]?.territory ?? null,
    continuidade:
      territoriesWithPhase
        .filter((item) => item.phase.id === "continuidade")
        .sort((a, b) => b.territory.openTasks - a.territory.openTasks)[0]?.territory ?? null,
  };

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
  const overloadedOperatorsCount = queueLoads.filter(
    (load) => load > HEALTHY_QUEUE_LIMIT && assessQueueWellness(load).level !== "healthy",
  ).length;

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
  const myQueueCount = priorityPeople.filter((person) => person.responsibleId === session.id).length;
  const recurringLinksCount = priorityPeople.filter((person) => person.totalInteractions >= 3).length;
  const urgentCareCount = collective.ethics.sensitiveNotesReviewed + collective.ethics.dataUnderReview;
  const pendingReturnsCount =
    pilotStats.summary.waiting3DaysCount +
    pilotStats.summary.dmsPreparedWithoutConfirmation +
    collective.operationHealth.staleTasksCount;
  const openReferralsCount = pilotStats.summary.pendingReferralsCount;
  const pendingMemoryCount = draftMemoryCount;
  const territoriesReadyCount = territories.filter((territory) => territory.priorityPeople > 0 && territory.openTasks === 0).length;
  const plannedNeighborhoods = new Set(
    fieldEvents
      .filter((event) => event.status === "planned" || event.status === "draft")
      .map((event) => event.neighborhood)
      .filter((value): value is string => Boolean(value)),
  );
  const stuckTerritoryCount = territoriesWithPhase
    .filter((item) => item.phase.id === "mobilizacao")
    .filter((item) => !plannedNeighborhoods.has(item.territory.neighborhood)).length;
  const dataNeedsReviewCount = baseReviewCount + collective.ethics.dataUnderReview;
  const cycleAlerts: OperationalCycleAlert[] = [
    stuckLinkCount > 0
      ? {
          id: "vinculo_travado",
          title: "Vínculo travado",
          message: "Este vínculo precisa de fechamento ou pausa.",
          nextStep: "Revisar pendências antigas em Registrar/Encaminhar e decidir fechamento ou pausa cuidadosa.",
          count: stuckLinkCount,
          href: "/abordagem",
          severity: "warning" as const,
        }
      : null,
    unresolvedPastEvents.length > 0
      ? {
          id: "campo_travado",
          title: "Campo travado",
          message: "Esta ação precisa virar memória e aprendizado.",
          nextStep: "Fechar o resultado dos eventos passados para consolidar memória operacional.",
          count: unresolvedPastEvents.length,
          href: "/campo",
          severity: "critical" as const,
        }
      : null,
    stuckTerritoryCount > 0
      ? {
          id: "territorio_travado",
          title: "Território travado",
          message: "O bairro tem sinais suficientes. Planeje uma escuta ou ação.",
          nextStep: "Escolher os bairros em mobilização sem planejamento e abrir ação de campo.",
          count: stuckTerritoryCount,
          href: "/relatorios/territorios",
          severity: "warning" as const,
        }
      : null,
    overloadedOperatorsCount > 0
      ? {
          id: "operador_sobrecarregado",
          title: "Operador sobrecarregado",
          message: "Redistribua ou trabalhe em blocos menores.",
          nextStep: "Redistribuir filas acima do limite saudável e manter blocos curtos de execução.",
          count: overloadedOperatorsCount,
          href: "/dashboard",
          severity: "warning" as const,
        }
      : null,
    dataNeedsReviewCount > 0
      ? {
          id: "dados_pedindo_revisao",
          title: "Dados pedindo revisão",
          message: "Há dados que precisam de cuidado.",
          nextStep: "Revisar registros inativos (+180 dias) e notas sensíveis pendentes.",
          count: dataNeedsReviewCount,
          href: "/relatorios",
          severity: "warning" as const,
        }
      : null,
  ].filter((alert): alert is OperationalCycleAlert => alert !== null);

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
      baseReviewCount,
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
    priorityPeople: priorityPeople.slice(0, 4),
    myQueueCount,
    cycleAlerts,
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
    loaded = await loadDashboardData(session);
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
        myQueueCount={loaded.myQueueCount}
        cycleAlerts={loaded.cycleAlerts}
        data={loaded.dashboardData}
      />
    </AppShell>
  );
}
