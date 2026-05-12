"use server";

import { shouldUseMockData } from "@/lib/config";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getPilotDashboardData } from "@/lib/data/pilot-stats";
import { getCollectiveProgressMetrics } from "@/lib/data/collective-progress-data";
import { getBaseQualityStats } from "@/lib/data/data-quality";
import { listFieldAgendaEvents, listFieldAgendaEventResultsByEventIds } from "@/lib/data/field-agenda";
import { listTerritorySummaries } from "@/lib/data/territories";
import { mapTerritoryToPhase } from "@/lib/data/territory-mapper";
import { assessQueueWellness } from "@/lib/data/operator-wellness";

export type OperationalCycleAlertId =
  | "vinculo_travado"
  | "campo_travado"
  | "territorio_travado"
  | "operador_sobrecarregado"
  | "dados_pedindo_revisao";

export type OperationalCycleAlert = {
  id: OperationalCycleAlertId;
  title: string;
  message: string;
  nextStep: string;
  count: number;
  href: string;
  severity: "warning" | "critical";
};

export type OperationalCycleAlertsResult = {
  alerts: OperationalCycleAlert[];
  totalBlockedCycles: number;
  thresholds: {
    stuckLinkDays: number;
    healthyQueueLimit: number;
  };
};

type AlertThresholds = {
  stuckLinkDays: number;
  healthyQueueLimit: number;
};

const DEFAULT_THRESHOLDS: AlertThresholds = {
  stuckLinkDays: 5,
  healthyQueueLimit: 5,
};

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

export async function getOperationalCycleAlerts(
  thresholds: Partial<AlertThresholds> = {}
): Promise<OperationalCycleAlertsResult> {
  const resolvedThresholds: AlertThresholds = {
    ...DEFAULT_THRESHOLDS,
    ...thresholds,
  };

  if (shouldUseMockData()) {
    const alerts: OperationalCycleAlert[] = [
      {
        id: "vinculo_travado",
        title: "Vínculo travado",
        message: "Este vínculo precisa de fechamento ou pausa.",
        nextStep: "Revisar as pendências em Registrar/Encaminhar e decidir fechamento ou pausa ética.",
        count: 6,
        href: "/abordagem",
        severity: "warning",
      },
      {
        id: "campo_travado",
        title: "Campo travado",
        message: "Esta ação precisa virar memória e aprendizado.",
        nextStep: "Fechar o resultado pós-evento para consolidar o aprendizado da equipe.",
        count: 2,
        href: "/campo",
        severity: "critical",
      },
      {
        id: "territorio_travado",
        title: "Território travado",
        message: "O bairro tem sinais suficientes. Planeje uma escuta ou ação.",
        nextStep: "Escolher um bairro em mobilização e registrar ação de campo planejada.",
        count: 3,
        href: "/relatorios/territorios",
        severity: "warning",
      },
      {
        id: "operador_sobrecarregado",
        title: "Operador sobrecarregado",
        message: "Redistribua ou trabalhe em blocos menores.",
        nextStep: "Redistribuir filas acima do limite saudável e combinar blocos curtos de execução.",
        count: 2,
        href: "/dashboard",
        severity: "warning",
      },
      {
        id: "dados_pedindo_revisao",
        title: "Dados pedindo revisão",
        message: "Há dados que precisam de cuidado.",
        nextStep: "Revisar registros inativos e notas sensíveis pendentes para manter qualidade ética.",
        count: 5,
        href: "/relatorios",
        severity: "warning",
      },
    ];

    return {
      alerts,
      totalBlockedCycles: alerts.reduce((sum, item) => sum + item.count, 0),
      thresholds: resolvedThresholds,
    };
  }

  const supabase = getSupabaseAdminClient();
  const cutoffIso = getPastIso(resolvedThresholds.stuckLinkDays);

  const [
    stuckLinkTasks,
    fieldEvents,
    territories,
    pilotData,
    qualityStats,
    collective,
  ] = await Promise.all([
    supabase
      .from("outreach_tasks")
      .select("id,column_key")
      .is("completed_at", null)
      .in("column_key", LINKAGE_COLUMNS)
      .lt("updated_at", cutoffIso),
    listFieldAgendaEvents({ includeMetrics: true }),
    listTerritorySummaries(),
    getPilotDashboardData(),
    getBaseQualityStats(),
    getCollectiveProgressMetrics(),
  ]);

  if (stuckLinkTasks.error) throw stuckLinkTasks.error;

  const stuckLinkCount = (stuckLinkTasks.data || []).length;

  const eventResults = await listFieldAgendaEventResultsByEventIds(fieldEvents.map((event) => event.id));
  const now = getCurrentTimestamp();
  const fieldStuckCount = fieldEvents.filter((event) => {
    const startsAt = event.startsAt ? new Date(event.startsAt).getTime() : Number.POSITIVE_INFINITY;
    return Number.isFinite(startsAt) && startsAt <= now && !eventResults[event.id];
  }).length;

  const plannedNeighborhoods = new Set(
    fieldEvents
      .filter((event) => event.status === "planned" || event.status === "draft")
      .map((event) => event.neighborhood)
      .filter((value): value is string => Boolean(value))
  );

  const mobilizationNeighborhoods = territories
    .filter((territory) => mapTerritoryToPhase(territory).id === "mobilizacao")
    .map((territory) => territory.neighborhood);

  const stuckTerritoryCount = mobilizationNeighborhoods.filter(
    (neighborhood) => !plannedNeighborhoods.has(neighborhood)
  ).length;

  const overloadedOperatorsCount = pilotData.responsibleBreakdown.filter(
    (operator) =>
      operator.openTasks > resolvedThresholds.healthyQueueLimit &&
      assessQueueWellness(operator.openTasks).level !== "healthy"
  ).length;

  const dataNeedsReviewCount = qualityStats.eligibleForReviewCount + collective.ethics.dataUnderReview;

  const alerts: OperationalCycleAlert[] = [];

  if (stuckLinkCount > 0) {
    alerts.push({
      id: "vinculo_travado",
      title: "Vínculo travado",
      message: "Este vínculo precisa de fechamento ou pausa.",
      nextStep: "Revisar pendências antigas em Registrar/Encaminhar e decidir fechamento ou pausa cuidadosa.",
      count: stuckLinkCount,
      href: "/abordagem",
      severity: "warning",
    });
  }

  if (fieldStuckCount > 0) {
    alerts.push({
      id: "campo_travado",
      title: "Campo travado",
      message: "Esta ação precisa virar memória e aprendizado.",
      nextStep: "Fechar o resultado dos eventos passados para consolidar memória operacional.",
      count: fieldStuckCount,
      href: "/campo",
      severity: "critical",
    });
  }

  if (stuckTerritoryCount > 0) {
    alerts.push({
      id: "territorio_travado",
      title: "Território travado",
      message: "O bairro tem sinais suficientes. Planeje uma escuta ou ação.",
      nextStep: "Escolher os bairros em mobilização sem planejamento e abrir ação de campo.",
      count: stuckTerritoryCount,
      href: "/relatorios/territorios",
      severity: "warning",
    });
  }

  if (overloadedOperatorsCount > 0) {
    alerts.push({
      id: "operador_sobrecarregado",
      title: "Operador sobrecarregado",
      message: "Redistribua ou trabalhe em blocos menores.",
      nextStep: "Redistribuir filas acima do limite saudável e manter blocos curtos de execução.",
      count: overloadedOperatorsCount,
      href: "/dashboard",
      severity: "warning",
    });
  }

  if (dataNeedsReviewCount > 0) {
    alerts.push({
      id: "dados_pedindo_revisao",
      title: "Dados pedindo revisão",
      message: "Há dados que precisam de cuidado.",
      nextStep: "Revisar registros inativos (+180 dias) e notas sensíveis pendentes.",
      count: dataNeedsReviewCount,
      href: "/relatorios",
      severity: "warning",
    });
  }

  return {
    alerts,
    totalBlockedCycles: alerts.reduce((sum, item) => sum + item.count, 0),
    thresholds: resolvedThresholds,
  };
}
