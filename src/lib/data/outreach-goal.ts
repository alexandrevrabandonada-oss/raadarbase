import { shouldUseMockData } from "@/lib/config";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { handleSupabaseReadError } from "./utils";

const TARGET_DATE = new Date(2026, 7, 15);

export type OutreachOperatorScore = {
  operatorId: string | null;
  operatorEmail: string | null;
  operatorName: string;
  totalSent: number;
  sentToday: number;
  lastSentAt: string | null;
};

export type OutreachGoalStats = {
  targetDateLabel: string;
  totalEligible: number;
  totalSent: number;
  totalRemaining: number;
  progressPercent: number;
  daysRemaining: number;
  dailyGoal: number;
  sentToday: number;
  operatorScores: OutreachOperatorScore[];
};

export type OutreachGoalSnapshot = {
  total_people: number;
  do_not_contact: number;
  sent_by_status: number;
  sent_today: number;
  operator_scores: Array<{
    operator_id: string | null;
    operator_email: string | null;
    operator_name: string;
    total_sent: number;
    sent_today: number;
    last_sent_at: string | null;
  }>;
};

function daysUntilTarget(now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const target = new Date(TARGET_DATE.getFullYear(), TARGET_DATE.getMonth(), TARGET_DATE.getDate()).getTime();
  return Math.max(1, Math.floor((target - start) / (24 * 60 * 60 * 1000)) + 1);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function finiteNumber(value: unknown, field: string) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Resposta inválida da agregação de alcance: ${field}.`);
  }
  return value;
}

export function parseOutreachGoalSnapshot(value: unknown): OutreachGoalSnapshot {
  if (!isRecord(value) || !Array.isArray(value.operator_scores)) {
    throw new Error("Resposta inválida da agregação de alcance.");
  }

  return {
    total_people: finiteNumber(value.total_people, "total_people"),
    do_not_contact: finiteNumber(value.do_not_contact, "do_not_contact"),
    sent_by_status: finiteNumber(value.sent_by_status, "sent_by_status"),
    sent_today: finiteNumber(value.sent_today, "sent_today"),
    operator_scores: value.operator_scores.map((score, index) => {
      if (!isRecord(score) || typeof score.operator_name !== "string") {
        throw new Error(`Resposta inválida da agregação de alcance: operator_scores[${index}].`);
      }

      return {
        operator_id: typeof score.operator_id === "string" ? score.operator_id : null,
        operator_email: typeof score.operator_email === "string" ? score.operator_email : null,
        operator_name: score.operator_name,
        total_sent: finiteNumber(score.total_sent, `operator_scores[${index}].total_sent`),
        sent_today: finiteNumber(score.sent_today, `operator_scores[${index}].sent_today`),
        last_sent_at: typeof score.last_sent_at === "string" ? score.last_sent_at : null,
      };
    }),
  };
}

export function buildOutreachGoalStats(snapshot: OutreachGoalSnapshot, now = new Date()): OutreachGoalStats {
  const daysRemaining = daysUntilTarget(now);
  const totalEligible = Math.max(0, snapshot.total_people - snapshot.do_not_contact);
  const totalSent = Math.min(snapshot.sent_by_status, totalEligible);
  const totalRemaining = Math.max(0, totalEligible - totalSent);
  const progressPercent = totalEligible > 0 ? Math.round((totalSent / totalEligible) * 1000) / 10 : 0;

  return {
    targetDateLabel: "15 de agosto de 2026",
    totalEligible,
    totalSent,
    totalRemaining,
    progressPercent,
    daysRemaining,
    dailyGoal: Math.ceil(totalRemaining / daysRemaining),
    sentToday: snapshot.sent_today,
    operatorScores: snapshot.operator_scores.map((score) => ({
      operatorId: score.operator_id,
      operatorEmail: score.operator_email,
      operatorName: score.operator_name,
      totalSent: score.total_sent,
      sentToday: score.sent_today,
      lastSentAt: score.last_sent_at,
    })),
  };
}

export async function getOutreachGoalStats(): Promise<OutreachGoalStats> {
  if (shouldUseMockData()) {
    return {
      targetDateLabel: "15 de agosto de 2026",
      totalEligible: 38156,
      totalSent: 451,
      totalRemaining: 37705,
      progressPercent: 1,
      daysRemaining: daysUntilTarget(),
      dailyGoal: Math.ceil(37705 / daysUntilTarget()),
      sentToday: 0,
      operatorScores: [],
    };
  }

  try {
    const supabase = getSupabaseAdminClient();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const { data, error } = await supabase.rpc("get_outreach_goal_stats_snapshot", {
      p_today_start: todayStart,
    });
    if (error) throw error;

    return buildOutreachGoalStats(parseOutreachGoalSnapshot(data), now);
  } catch (error) {
    handleSupabaseReadError("getOutreachGoalStats", error);
  }
}
