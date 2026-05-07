import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { shouldUseMockData } from "@/lib/config";
import { getActiveTerritorialListeningWindow, getTerritorialListeningAggregates } from "./territorial-listening-monitoring";
import { getCorrectiveActionsImpactSummary } from "./silence-radar-impact";
import { getSilenceImpactTimeSeries, type TimeSeriesPoint } from "./silence-radar-time-series";
import { getMobilizationReport } from "./reports";
import { listTerritorialListeningWindows } from "./territorial-listening-windows";

export type PublicReceiptTopicsSummary = {
  topics: Array<{ name: string; interactionCount: number; postCount: number }>;
  totalPostsAnalyzed: number;
  totalInteractionsAnalyzed: number;
  uniquePeopleReached: number;
};

export type PublicReceiptTerritorialSummary = {
  totalReports: number;
  topNeighborhoods: Array<{ name: string; count: number }>;
  topTopics: Array<{ name: string; count: number }>;
  windowStatus: string;
};

export type PublicReceiptActionsSummary = {
  totalActions: number;
  doneActions: number;
  plannedActions: number;
  doingActions: number;
};

export type PublicReceiptTimeSeriesSummary = {
  trend: string;
  points: TimeSeriesPoint[];
};

export type PublicListeningReceipt = {
  periodStart: string;
  periodEnd: string;
  windowId: string | null;
  topics: PublicReceiptTopicsSummary;
  territorial: PublicReceiptTerritorialSummary | null;
  actions: PublicReceiptActionsSummary;
  timeSeries: PublicReceiptTimeSeriesSummary;
  lastUpdatedAt: string;
};

export async function getReceiptTopicsSummary(reportId: string): Promise<PublicReceiptTopicsSummary> {
  const report = await getMobilizationReport(reportId);
  if (!report) {
    return { topics: [], totalPostsAnalyzed: 0, totalInteractionsAnalyzed: 0, uniquePeopleReached: 0 };
  }

  const snapshot = report.snapshot as Record<string, unknown>;
  const totals = (snapshot?.totals as Record<string, unknown>) || {};

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const topics = (report.topics || []).map((t: any) => ({
    name: t.topic?.name || "Desconhecido",
    interactionCount: t.interaction_count,
    postCount: t.post_count,
  }));

  return {
    topics,
    totalPostsAnalyzed: Number(totals.postsAnalyzed || 0),
    totalInteractionsAnalyzed: Number(totals.interactionsAnalyzed || 0),
    uniquePeopleReached: Number(totals.uniquePeople || 0),
  };
}

export async function getReceiptTerritorialSummary(windowId: string): Promise<PublicReceiptTerritorialSummary> {
  const aggs = await getTerritorialListeningAggregates(windowId);
  return {
    totalReports: aggs.totalReports,
    topNeighborhoods: aggs.topNeighborhoods.map(n => ({ name: n.bairro, count: n.quantidade })),
    topTopics: aggs.topTopics.map(t => ({ name: t.pauta, count: t.quantidade })),
    windowStatus: aggs.status,
  };
}

export async function getReceiptCorrectiveActionsSummary(windowId: string): Promise<PublicReceiptActionsSummary> {
  const summary = await getCorrectiveActionsImpactSummary({ territorialWindowScope: "active", territorialWindowId: windowId });
  return {
    totalActions: summary.totalActions,
    doneActions: summary.doneActions,
    plannedActions: summary.plannedActions,
    doingActions: summary.doingActions,
  };
}

export async function getReceiptTimeSeriesSummary(windowId: string): Promise<PublicReceiptTimeSeriesSummary> {
  const ts = await getSilenceImpactTimeSeries({ territorialWindowId: windowId });
  return {
    trend: ts.trend,
    points: ts.points,
  };
}

export async function getPublicListeningReceipt(): Promise<PublicListeningReceipt> {
  if (shouldUseMockData()) {
    return {
      periodStart: "2026-04-01",
      periodEnd: "2026-04-30",
      windowId: "mock-window",
      topics: {
        topics: [{ name: "Infraestrutura", interactionCount: 150, postCount: 5 }],
        totalPostsAnalyzed: 20,
        totalInteractionsAnalyzed: 500,
        uniquePeopleReached: 300,
      },
      territorial: {
        totalReports: 120,
        topNeighborhoods: [{ name: "Centro", count: 45 }],
        topTopics: [{ name: "Asfalto", count: 30 }],
        windowStatus: "ok",
      },
      actions: {
        totalActions: 10,
        doneActions: 4,
        plannedActions: 3,
        doingActions: 3,
      },
      timeSeries: {
        trend: "subindo",
        points: [],
      },
      lastUpdatedAt: new Date().toISOString(),
    };
  }

  let activeWindow = await getActiveTerritorialListeningWindow();
  
  if (!activeWindow) {
    // try to get the most recently closed window
    const allWindows = await listTerritorialListeningWindows(1);
    if (allWindows.length > 0) {
      activeWindow = allWindows[0];
    }
  }

  if (!activeWindow) {
    // No window at all
    return {
      periodStart: new Date().toISOString().split("T")[0],
      periodEnd: new Date().toISOString().split("T")[0],
      windowId: null,
      topics: { topics: [], totalPostsAnalyzed: 0, totalInteractionsAnalyzed: 0, uniquePeopleReached: 0 },
      territorial: null,
      actions: { totalActions: 0, doneActions: 0, plannedActions: 0, doingActions: 0 },
      timeSeries: { trend: "sem_dados_suficientes", points: [] },
      lastUpdatedAt: new Date().toISOString(),
    };
  }

  const reportId = activeWindow.sourceReportId;

  const [topics, territorial, actions, timeSeries] = await Promise.all([
    getReceiptTopicsSummary(reportId),
    getReceiptTerritorialSummary(activeWindow.id),
    getReceiptCorrectiveActionsSummary(activeWindow.id),
    getReceiptTimeSeriesSummary(activeWindow.id),
  ]);

  return {
    periodStart: activeWindow.startsAt.split("T")[0],
    periodEnd: activeWindow.endsAt.split("T")[0],
    windowId: activeWindow.id,
    topics,
    territorial,
    actions,
    timeSeries,
    lastUpdatedAt: new Date().toISOString(),
  };
}
