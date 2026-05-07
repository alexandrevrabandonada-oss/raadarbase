import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { shouldUseMockData } from "@/lib/config";
import {
  type CorrectiveActionTargetType,
  getSilenceRadarCorrectiveActionById,
  listSilenceRadarCorrectiveActions,
} from "@/lib/data/silence-radar-corrective-actions";
import { getActiveTerritorialListeningWindow } from "@/lib/data/territorial-listening-monitoring";
import { listTerritorialListeningWindows, getTerritorialListeningWindowById } from "@/lib/data/territorial-listening-windows";

export type TimeSeriesTrend = "subindo" | "estavel" | "caindo" | "sem_dados_suficientes";

export type TimeSeriesPoint = {
  date: string; // YYYY-MM-DD
  reportCount: number;
  formCount: number;
  interactionCount: number;
  actionCreatedAt?: boolean; // marker
};

export type TargetDailyAggregate = {
  date: string;
  targetType: CorrectiveActionTargetType;
  targetLabel: string;
  reportCount: number;
  formCount: number;
  interactionCount: number;
};

export type TimeSeriesResult = {
  points: TimeSeriesPoint[];
  trend: TimeSeriesTrend;
  targetType: CorrectiveActionTargetType | "all";
  targetLabel: string | "all";
};

function truncateDate(isoString: string): string {
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
}

function getDaysBetween(start: string, end: string): string[] {
  const dates: string[] = [];
  const curr = new Date(start);
  const endDt = new Date(end);
  curr.setUTCHours(0, 0, 0, 0);
  endDt.setUTCHours(0, 0, 0, 0);
  
  if (curr > endDt) return dates;

  while (curr <= endDt) {
    dates.push(curr.toISOString().split("T")[0]);
    curr.setUTCDate(curr.getUTCDate() + 1);
  }
  return dates;
}

export function classifyTimeSeriesTrend(points: TimeSeriesPoint[]): TimeSeriesTrend {
  if (points.length < 2) return "sem_dados_suficientes";
  
  // Calculate a simple moving average or split in half
  const half = Math.floor(points.length / 2);
  const firstHalf = points.slice(0, half);
  const secondHalf = points.slice(half);

  const sumFirst = firstHalf.reduce((acc, p) => acc + p.reportCount + p.interactionCount + p.formCount, 0);
  const sumSecond = secondHalf.reduce((acc, p) => acc + p.reportCount + p.interactionCount + p.formCount, 0);

  const avgFirst = sumFirst / firstHalf.length;
  const avgSecond = sumSecond / secondHalf.length;

  if (avgSecond > avgFirst) return "subindo";
  if (avgSecond < avgFirst) return "caindo";
  return "estavel";
}

export async function getTargetDailyAggregates(
  targetType: CorrectiveActionTargetType | "all",
  targetLabel: string | "all",
  from: string | null,
  to: string | null
): Promise<TargetDailyAggregate[]> {
  if (shouldUseMockData()) return [];

  const supabase = getSupabaseAdminClient();
  const aggregatesByDate = new Map<string, TargetDailyAggregate>();

  function getOrInit(date: string) {
    if (!aggregatesByDate.has(date)) {
      aggregatesByDate.set(date, {
        date,
        targetType: targetType === "all" ? "janela" : targetType,
        targetLabel: targetLabel === "all" ? "geral" : targetLabel,
        reportCount: 0,
        formCount: 0,
        interactionCount: 0,
      });
    }
    return aggregatesByDate.get(date)!;
  }

  const fromDateStr = from ? new Date(from).toISOString() : "2000-01-01T00:00:00Z";
  const toDateStr = to ? new Date(`${to}T23:59:59Z`).toISOString() : new Date().toISOString();

  // Bairro and Pauta -> forms & reports
  if (targetType === "bairro" || targetType === "pauta" || targetType === "all" || targetType === "janela") {
    let query = supabase
      .from("bairro_escuta_submissions")
      .select("created_at, bairro, pauta")
      .gte("created_at", fromDateStr)
      .lte("created_at", toDateStr);

    if (targetType === "bairro") query = query.eq("bairro", targetLabel);
    if (targetType === "pauta") query = query.eq("pauta", targetLabel);

    const { data: submissions } = await query;

    for (const sub of submissions ?? []) {
      const date = truncateDate(sub.created_at);
      if (!date) continue;
      const agg = getOrInit(date);
      agg.reportCount += 1;
      agg.formCount += 1;
    }
  }

  // Pauta and Post -> interactions
  if (targetType === "pauta" || targetType === "post" || targetType === "all" || targetType === "janela") {
    let query = supabase
      .from("ig_posts")
      .select("published_at, metrics, shortcode")
      .gte("published_at", fromDateStr)
      .lte("published_at", toDateStr);

    if (targetType === "post") query = query.eq("shortcode", targetLabel);

    const { data: posts } = await query;
    for (const post of posts ?? []) {
      const date = truncateDate(post.published_at ?? "");
      if (!date) continue;
      const m = post.metrics && typeof post.metrics === "object" && !Array.isArray(post.metrics)
        ? (post.metrics as Record<string, unknown>)
        : {};
      
      const topic = String(m.topic_category ?? "").toLowerCase();
      
      if (targetType === "pauta" && topic !== targetLabel.toLowerCase()) {
        continue;
      }

      const commentsCount = Number(m.comments_count ?? 0);
      const likesCount = Number(m.like_count ?? 0);
      
      if (commentsCount > 0 || likesCount > 0) {
        const agg = getOrInit(date);
        agg.interactionCount += (targetType === "post" ? commentsCount + likesCount : commentsCount);
      }
    }
  }

  const result = Array.from(aggregatesByDate.values());
  result.sort((a, b) => a.date.localeCompare(b.date));
  return result;
}

export async function getCorrectiveActionTimeSeries(actionId: string): Promise<TimeSeriesResult | null> {
  if (shouldUseMockData()) return null;

  const action = await getSilenceRadarCorrectiveActionById(actionId);
  if (!action) return null;

  const createdAtTrunc = truncateDate(action.created_at);
  const createdDate = new Date(createdAtTrunc);
  // Get 14 days before action
  const fromDate = new Date(createdDate);
  fromDate.setUTCDate(fromDate.getUTCDate() - 14);
  const from = fromDate.toISOString().split("T")[0];
  const to = new Date().toISOString().split("T")[0];

  const aggregates = await getTargetDailyAggregates(
    action.target_type as CorrectiveActionTargetType,
    action.target_label,
    from,
    to
  );

  const days = getDaysBetween(from, to);
  const points: TimeSeriesPoint[] = days.map((date) => {
    const agg = aggregates.find((a) => a.date === date);
    return {
      date,
      reportCount: agg?.reportCount ?? 0,
      formCount: agg?.formCount ?? 0,
      interactionCount: agg?.interactionCount ?? 0,
      actionCreatedAt: date === createdAtTrunc,
    };
  });

  return {
    points,
    trend: classifyTimeSeriesTrend(points),
    targetType: action.target_type as CorrectiveActionTargetType,
    targetLabel: action.target_label,
  };
}

export async function getSilenceImpactTimeSeries(filters: {
  kind?: string;
  targetType?: string;
  status?: string;
  from?: string | null;
  to?: string | null;
  territorialWindowScope?: string;
  territorialWindowId?: string | null;
}): Promise<TimeSeriesResult> {
  if (shouldUseMockData()) return { points: [], trend: "sem_dados_suficientes", targetType: "all", targetLabel: "all" };

  const [allActions, activeWindow, windows] = await Promise.all([
    listSilenceRadarCorrectiveActions(),
    getActiveTerritorialListeningWindow(),
    listTerritorialListeningWindows(50),
  ]);

  const requestedWindow = filters.territorialWindowId
    ? windows.find((w) => w.id === filters.territorialWindowId)
    : null;

  let filteredActions = allActions;

  if (filters.kind && filters.kind !== "all") {
    filteredActions = filteredActions.filter((a) => a.kind === filters.kind);
  }
  if (filters.targetType && filters.targetType !== "all") {
    filteredActions = filteredActions.filter((a) => a.target_type === filters.targetType);
  }
  if (filters.status && filters.status !== "all") {
    filteredActions = filteredActions.filter((a) => a.status === filters.status);
  }

  let from = filters.from;
  let to = filters.to;

  if (filters.territorialWindowScope === "active" && activeWindow) {
    if (!from || new Date(from) < new Date(activeWindow.startsAt)) from = activeWindow.startsAt.split("T")[0];
    if (!to || new Date(to) > new Date(activeWindow.endsAt)) to = activeWindow.endsAt.split("T")[0];
  } else if (requestedWindow) {
    if (!from || new Date(from) < new Date(requestedWindow.startsAt)) from = requestedWindow.startsAt.split("T")[0];
    if (!to || new Date(to) > new Date(requestedWindow.endsAt)) to = requestedWindow.endsAt.split("T")[0];
  } else {
    if (!from) {
      const minDate = filteredActions.reduce((min, a) => {
        const ad = new Date(a.created_at);
        return ad < min ? ad : min;
      }, new Date());
      minDate.setUTCDate(minDate.getUTCDate() - 7);
      from = minDate.toISOString().split("T")[0];
    }
    if (!to) {
      to = new Date().toISOString().split("T")[0];
    }
  }

  const tt = (filters.targetType && filters.targetType !== "all") ? filters.targetType as CorrectiveActionTargetType : "all";
  
  // Aggregate data for all matching actions
  const allPointsByDate = new Map<string, TimeSeriesPoint>();
  const days = getDaysBetween(from, to);
  for (const d of days) {
    allPointsByDate.set(d, { date: d, reportCount: 0, formCount: 0, interactionCount: 0 });
  }

  // Optimize: group targets
  const targets = Array.from(new Set(filteredActions.map(a => `${a.target_type}|${a.target_label}`)));
  
  for (const t of targets) {
    const [tType, tLabel] = t.split("|");
    const aggs = await getTargetDailyAggregates(tType as CorrectiveActionTargetType, tLabel, from, to);
    for (const agg of aggs) {
      const p = allPointsByDate.get(agg.date);
      if (p) {
        p.reportCount += agg.reportCount;
        p.formCount += agg.formCount;
        p.interactionCount += agg.interactionCount;
      }
    }
  }

  // add actionCreatedAt markers
  for (const a of filteredActions) {
    const d = truncateDate(a.created_at);
    const p = allPointsByDate.get(d);
    if (p) p.actionCreatedAt = true;
  }

  const points = Array.from(allPointsByDate.values()).sort((a, b) => a.date.localeCompare(b.date));

  return {
    points,
    trend: classifyTimeSeriesTrend(points),
    targetType: tt,
    targetLabel: "all",
  };
}

export async function getWindowComparisonTimeSeries(
  activeWindowId: string,
  historicalWindowId?: string
): Promise<{ active: TimeSeriesPoint[], historical: TimeSeriesPoint[] | null }> {
  if (shouldUseMockData()) return { active: [], historical: null };

  const activeWindow = await getTerritorialListeningWindowById(activeWindowId);
  if (!activeWindow) return { active: [], historical: null };

  const activeAggs = await getTargetDailyAggregates(
    "janela",
    "geral",
    activeWindow.startsAt.split("T")[0],
    activeWindow.endsAt.split("T")[0]
  );
  
  const activeDays = getDaysBetween(activeWindow.startsAt.split("T")[0], activeWindow.endsAt.split("T")[0]);
  const activePoints = activeDays.map(d => {
    const agg = activeAggs.find(a => a.date === d);
    return {
      date: d,
      reportCount: agg?.reportCount ?? 0,
      formCount: agg?.formCount ?? 0,
      interactionCount: agg?.interactionCount ?? 0,
    };
  });

  if (!historicalWindowId) return { active: activePoints, historical: null };

  const histWindow = await getTerritorialListeningWindowById(historicalWindowId);
  if (!histWindow) return { active: activePoints, historical: null };

  const histAggs = await getTargetDailyAggregates(
    "janela",
    "geral",
    histWindow.startsAt.split("T")[0],
    histWindow.endsAt.split("T")[0]
  );

  const histDays = getDaysBetween(histWindow.startsAt.split("T")[0], histWindow.endsAt.split("T")[0]);
  const historicalPoints = histDays.map(d => {
    const agg = histAggs.find(a => a.date === d);
    return {
      date: d,
      reportCount: agg?.reportCount ?? 0,
      formCount: agg?.formCount ?? 0,
      interactionCount: agg?.interactionCount ?? 0,
    };
  });

  return { active: activePoints, historical: historicalPoints };
}
