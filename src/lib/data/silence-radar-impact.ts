import { shouldUseMockData } from "@/lib/config";
import {
  getCorrectiveActionImpact,
  listSilenceRadarCorrectiveActions,
  type CorrectiveActionImpact,
  type CorrectiveActionKind,
  type CorrectiveActionRow,
  type CorrectiveActionStatus,
  type CorrectiveActionTargetType,
} from "@/lib/data/silence-radar-corrective-actions";
import {
  getActiveTerritorialListeningWindow,
} from "@/lib/data/territorial-listening-monitoring";
import { listTerritorialListeningWindows } from "@/lib/data/territorial-listening-windows";

export type CorrectiveActionImpactStatus = "melhoria" | "estavel" | "atencao" | "sem_dados_suficientes";

export type SilenceRadarImpactFilters = {
  kind?: CorrectiveActionKind | "all";
  targetType?: CorrectiveActionTargetType | "all";
  status?: CorrectiveActionStatus | "all";
  from?: string | null;
  to?: string | null;
  impact?: CorrectiveActionImpactStatus | "all";
  territorialWindowScope?: "all" | "active" | "historical";
  territorialWindowId?: string | null;
};

export type CorrectiveActionImpactTableRow = {
  actionId: string;
  kind: CorrectiveActionKind;
  targetType: CorrectiveActionTargetType;
  targetLabel: string;
  status: CorrectiveActionStatus;
  baselineValue: number | null;
  currentValue: number | null;
  deltaAbsolute: number | null;
  deltaPercent: number | null;
  createdAt: string;
  completedAt: string | null;
  actionPlanItemId: string | null;
  impactStatus: CorrectiveActionImpactStatus;
  baselineReportCount: number | null;
  currentReportCount: number | null;
  baselineFormCount: number | null;
  currentFormCount: number | null;
  baselineInteractionCount: number | null;
  currentInteractionCount: number | null;
};

export type CorrectiveActionsImpactSummary = {
  totalActions: number;
  plannedActions: number;
  doingActions: number;
  doneActions: number;
  archivedActions: number;
  positiveImpactActions: number;
  unchangedActions: number;
  retryNeededActions: number;
  insufficientDataActions: number;
  createdActions: number;
  completedActions: number;
  reportsBefore: number;
  reportsAfter: number;
  interactionsBefore: number;
  interactionsAfter: number;
  topicsWithImprovement: number;
  stillSilentNeighborhoods: number;
};

export type SilenceRadarImpactDashboard = {
  summary: CorrectiveActionsImpactSummary;
  rows: CorrectiveActionImpactTableRow[];
  stillSilentTargets: string[];
};

type ClassificationInput = {
  baseline: number | null;
  current: number | null;
  delta: number | null;
  hasComparablePeriod: boolean;
};

function toFinite(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function inDateRange(isoDate: string, from?: string | null, to?: string | null): boolean {
  const time = Date.parse(isoDate);
  if (!Number.isFinite(time)) return false;

  if (from) {
    const min = Date.parse(from);
    if (Number.isFinite(min) && time < min) return false;
  }

  if (to) {
    const maxInclusive = Date.parse(`${to}T23:59:59.999Z`);
    if (Number.isFinite(maxInclusive) && time > maxInclusive) return false;
  }

  return true;
}

function pickPrimaryMetric(action: CorrectiveActionRow, impact: CorrectiveActionImpact | null): {
  baselineValue: number | null;
  currentValue: number | null;
  deltaAbsolute: number | null;
} {
  const snapshot = action.baseline_snapshot && typeof action.baseline_snapshot === "object"
    ? (action.baseline_snapshot as Record<string, unknown>)
    : {};

  if (!impact) {
    const baseline = toFinite(snapshot.reportCount) ?? toFinite(snapshot.formCount) ?? toFinite(snapshot.commentCount) ?? toFinite(action.baseline_value);
    return {
      baselineValue: baseline,
      currentValue: null,
      deltaAbsolute: null,
    };
  }

  if (action.target_type === "bairro") {
    const baseline = toFinite(snapshot.reportCount) ?? toFinite(action.baseline_value) ?? 0;
    const current = impact.currentReportCount;
    return {
      baselineValue: baseline,
      currentValue: current,
      deltaAbsolute: current - baseline,
    };
  }

  if (action.target_type === "pauta") {
    const baselineForms = toFinite(snapshot.formCount);
    const baselineComments = toFinite(snapshot.commentCount);

    if (baselineForms !== null) {
      const current = impact.currentFormCount;
      return {
        baselineValue: baselineForms,
        currentValue: current,
        deltaAbsolute: current - baselineForms,
      };
    }

    const commentsBaseline = baselineComments ?? toFinite(action.baseline_value) ?? 0;
    const currentComments = impact.currentCommentCount;
    return {
      baselineValue: commentsBaseline,
      currentValue: currentComments,
      deltaAbsolute: currentComments - commentsBaseline,
    };
  }

  if (action.target_type === "post") {
    const baseline = toFinite(snapshot.commentCount) ?? toFinite(action.baseline_value) ?? 0;
    const current = impact.currentCommentCount;
    return {
      baselineValue: baseline,
      currentValue: current,
      deltaAbsolute: current - baseline,
    };
  }

  return {
    baselineValue: toFinite(action.baseline_value),
    currentValue: null,
    deltaAbsolute: null,
  };
}

function toRow(action: CorrectiveActionRow, impact: CorrectiveActionImpact | null, hasComparablePeriod: boolean): CorrectiveActionImpactTableRow {
  const snapshot = action.baseline_snapshot && typeof action.baseline_snapshot === "object"
    ? (action.baseline_snapshot as Record<string, unknown>)
    : {};

  const baselineReportCount = toFinite(snapshot.reportCount);
  const baselineFormCount = toFinite(snapshot.formCount);
  const baselineInteractionCount = toFinite(snapshot.commentCount);

  const metric = pickPrimaryMetric(action, impact);
  const deltaPercent =
    metric.baselineValue !== null &&
    metric.baselineValue > 0 &&
    metric.deltaAbsolute !== null
      ? (metric.deltaAbsolute / metric.baselineValue) * 100
      : null;

  return {
    actionId: action.id,
    kind: action.kind as CorrectiveActionKind,
    targetType: action.target_type as CorrectiveActionTargetType,
    targetLabel: action.target_label,
    status: action.status as CorrectiveActionStatus,
    baselineValue: metric.baselineValue,
    currentValue: metric.currentValue,
    deltaAbsolute: metric.deltaAbsolute,
    deltaPercent,
    createdAt: action.created_at,
    completedAt: action.completed_at,
    actionPlanItemId: action.action_plan_item_id,
    impactStatus: classifyCorrectiveActionImpact({
      baseline: metric.baselineValue,
      current: metric.currentValue,
      delta: metric.deltaAbsolute,
      hasComparablePeriod,
    }),
    baselineReportCount,
    currentReportCount: impact?.currentReportCount ?? null,
    baselineFormCount,
    currentFormCount: impact?.currentFormCount ?? null,
    baselineInteractionCount,
    currentInteractionCount: impact?.currentCommentCount ?? null,
  };
}

function buildSummary(rows: CorrectiveActionImpactTableRow[]): CorrectiveActionsImpactSummary {
  const kindsWithImprovement = new Set<string>();
  const stillSilentNeighborhoodSet = new Set<string>();

  for (const row of rows) {
    if (row.impactStatus === "melhoria" && row.targetType === "pauta") {
      kindsWithImprovement.add(normalizeText(row.targetLabel));
    }
    if (
      row.targetType === "bairro" &&
      (row.impactStatus === "atencao" || row.impactStatus === "sem_dados_suficientes")
    ) {
      stillSilentNeighborhoodSet.add(normalizeText(row.targetLabel));
    }
  }

  return {
    totalActions: rows.length,
    plannedActions: rows.filter((row) => row.status === "planned").length,
    doingActions: rows.filter((row) => row.status === "doing").length,
    doneActions: rows.filter((row) => row.status === "done").length,
    archivedActions: rows.filter((row) => row.status === "archived").length,
    positiveImpactActions: rows.filter((row) => row.impactStatus === "melhoria").length,
    unchangedActions: rows.filter((row) => row.impactStatus === "estavel").length,
    retryNeededActions: rows.filter((row) => row.impactStatus === "atencao").length,
    insufficientDataActions: rows.filter((row) => row.impactStatus === "sem_dados_suficientes").length,
    createdActions: rows.length,
    completedActions: rows.filter((row) => row.status === "done").length,
    reportsBefore: rows.reduce((sum, row) => sum + (row.baselineReportCount ?? 0), 0),
    reportsAfter: rows.reduce((sum, row) => sum + (row.currentReportCount ?? 0), 0),
    interactionsBefore: rows.reduce((sum, row) => sum + (row.baselineInteractionCount ?? 0), 0),
    interactionsAfter: rows.reduce((sum, row) => sum + (row.currentInteractionCount ?? 0), 0),
    topicsWithImprovement: kindsWithImprovement.size,
    stillSilentNeighborhoods: stillSilentNeighborhoodSet.size,
  };
}

export function classifyCorrectiveActionImpact(delta: ClassificationInput): CorrectiveActionImpactStatus {
  if (!delta.hasComparablePeriod || delta.delta === null || delta.baseline === null || delta.current === null) {
    return "sem_dados_suficientes";
  }

  if (delta.delta > 0) return "melhoria";
  if (delta.delta === 0 && delta.baseline > 0) return "estavel";
  if (delta.baseline === 0 && delta.current === 0) return "atencao";
  return "atencao";
}

export async function getStillSilentTargets(filters: SilenceRadarImpactFilters = {}): Promise<string[]> {
  const dashboard = await getSilenceRadarImpactDashboard(filters);
  const targets = dashboard.rows
    .filter((row) => row.targetType === "bairro" && row.currentReportCount === 0)
    .map((row) => row.targetLabel.trim())
    .filter(Boolean);

  return Array.from(new Set(targets)).sort((a, b) => a.localeCompare(b, "pt-BR"));
}

export async function getCorrectiveActionsImpactSummary(
  filters: SilenceRadarImpactFilters = {},
): Promise<CorrectiveActionsImpactSummary> {
  const dashboard = await getSilenceRadarImpactDashboard(filters);
  return dashboard.summary;
}

export async function getSilenceRadarImpactDashboard(
  filters: SilenceRadarImpactFilters = {},
): Promise<SilenceRadarImpactDashboard> {
  if (shouldUseMockData()) {
    return {
      summary: {
        totalActions: 0,
        plannedActions: 0,
        doingActions: 0,
        doneActions: 0,
        archivedActions: 0,
        positiveImpactActions: 0,
        unchangedActions: 0,
        retryNeededActions: 0,
        insufficientDataActions: 0,
        createdActions: 0,
        completedActions: 0,
        reportsBefore: 0,
        reportsAfter: 0,
        interactionsBefore: 0,
        interactionsAfter: 0,
        topicsWithImprovement: 0,
        stillSilentNeighborhoods: 0,
      },
      rows: [],
      stillSilentTargets: [],
    };
  }

  const [allActions, activeWindow, windows] = await Promise.all([
    listSilenceRadarCorrectiveActions(),
    getActiveTerritorialListeningWindow(),
    listTerritorialListeningWindows(50),
  ]);

  const requestedWindow = filters.territorialWindowId
    ? windows.find((window) => window.id === filters.territorialWindowId)
    : null;

  let filteredActions = allActions;

  if (filters.kind && filters.kind !== "all") {
    filteredActions = filteredActions.filter((action) => action.kind === filters.kind);
  }

  if (filters.targetType && filters.targetType !== "all") {
    filteredActions = filteredActions.filter((action) => action.target_type === filters.targetType);
  }

  if (filters.status && filters.status !== "all") {
    filteredActions = filteredActions.filter((action) => action.status === filters.status);
  }

  filteredActions = filteredActions.filter((action) => inDateRange(action.created_at, filters.from, filters.to));

  if (filters.territorialWindowScope === "active" && activeWindow) {
    filteredActions = filteredActions.filter((action) =>
      Date.parse(action.created_at) >= Date.parse(activeWindow.startsAt) &&
      Date.parse(action.created_at) <= Date.parse(activeWindow.endsAt),
    );
  }

  if (filters.territorialWindowScope === "historical") {
    const historicalWindows = windows.filter((window) => window.status !== "open");
    filteredActions = filteredActions.filter((action) => {
      const actionTime = Date.parse(action.created_at);
      return historicalWindows.some((window) =>
        actionTime >= Date.parse(window.startsAt) && actionTime <= Date.parse(window.endsAt),
      );
    });
  }

  if (requestedWindow) {
    filteredActions = filteredActions.filter((action) => {
      const actionTime = Date.parse(action.created_at);
      return actionTime >= Date.parse(requestedWindow.startsAt) && actionTime <= Date.parse(requestedWindow.endsAt);
    });
  }

  const impacts = await Promise.all(filteredActions.map((action) => getCorrectiveActionImpact(action.id)));

  const comparableWindowCount = windows.length;
  const rows = filteredActions.map((action, index) => {
    const hasComparablePeriod = comparableWindowCount > 0 || action.target_type !== "janela";
    return toRow(action, impacts[index], hasComparablePeriod);
  });

  const impactFilter = filters.impact && filters.impact !== "all" ? filters.impact : null;
  const finalRows = impactFilter ? rows.filter((row) => row.impactStatus === impactFilter) : rows;

  const summary = buildSummary(finalRows);

  const stillSilentTargets = finalRows
    .filter((row) => row.targetType === "bairro" && row.currentReportCount === 0)
    .map((row) => row.targetLabel)
    .filter(Boolean);

  const uniqueStillSilentTargets = Array.from(new Set(stillSilentTargets)).sort((a, b) => a.localeCompare(b, "pt-BR"));

  return {
    summary,
    rows: finalRows,
    stillSilentTargets: uniqueStillSilentTargets,
  };
}
