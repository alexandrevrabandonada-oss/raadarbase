import { shouldUseMockData } from "@/lib/config";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { PersonStatus } from "@/lib/types";
import { handleSupabaseReadError } from "./utils";

const TARGET_DATE = new Date(2026, 7, 15);
const PAGE_SIZE = 1000;

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

function daysUntilTarget(now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const target = new Date(TARGET_DATE.getFullYear(), TARGET_DATE.getMonth(), TARGET_DATE.getDate()).getTime();
  return Math.max(1, Math.floor((target - start) / (24 * 60 * 60 * 1000)) + 1);
}

async function countPeopleByStatus(statuses: PersonStatus[]) {
  const supabase = getSupabaseAdminClient();
  let total = 0;

  for (const status of statuses) {
    const { count, error } = await supabase
      .from("ig_people")
      .select("*", { count: "exact", head: true })
      .eq("status", status);
    if (error) throw error;
    total += count ?? 0;
  }

  return total;
}

async function listDmSentAuditLogs(limit = 2000) {
  const supabase = getSupabaseAdminClient();
  const rows: Array<{
    actor_id: string | null;
    actor_email: string | null;
    created_at: string;
  }> = [];

  for (let from = 0; rows.length < limit; from += PAGE_SIZE) {
    const to = Math.min(from + PAGE_SIZE - 1, from + (limit - rows.length) - 1);
    const { data, error } = await supabase
      .from("audit_logs")
      .select("actor_id, actor_email, created_at")
      .eq("action", "contact.dm_sent")
      .order("created_at", { ascending: false })
      .range(from, to);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) break;
  }

  return rows;
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
    const daysRemaining = daysUntilTarget(now);

    const [doNotContact, logs, operatorsResult] = await Promise.all([
      countPeopleByStatus(["nao_abordar"]),
      listDmSentAuditLogs(),
      supabase.from("internal_users").select("id, email, full_name").eq("status", "active"),
    ]);

    if (operatorsResult.error) throw operatorsResult.error;

    const { count: totalPeople, error: totalError } = await supabase
      .from("ig_people")
      .select("*", { count: "exact", head: true });
    if (totalError) throw totalError;

    const operatorsById = new Map((operatorsResult.data ?? []).map((operator) => [operator.id, operator]));
    const scores = new Map<string, OutreachOperatorScore>();
    const sentToday = logs.filter((log) => log.created_at >= todayStart).length;

    for (const operator of operatorsResult.data ?? []) {
      scores.set(operator.id, {
        operatorId: operator.id,
        operatorEmail: operator.email,
        operatorName: operator.full_name || operator.email || "Operador",
        totalSent: 0,
        sentToday: 0,
        lastSentAt: null,
      });
    }

    // Get distinct people who received DMs (avoid counting duplicate DMs to same person)
    const { data: dmsPerPerson } = await supabase
      .from("audit_logs")
      .select("entity_id")
      .eq("action", "contact.dm_sent")
      .order("entity_id");

    const uniquePeopleWithDms = new Set(dmsPerPerson?.map(log => log.entity_id) ?? []);

    for (const log of logs) {
      const key = log.actor_id ?? log.actor_email ?? "sem-operador";
      const operator = log.actor_id ? operatorsById.get(log.actor_id) : null;
      const current =
        scores.get(key) ??
        {
          operatorId: log.actor_id,
          operatorEmail: log.actor_email,
          operatorName: operator?.full_name || log.actor_email || "Sem operador identificado",
          totalSent: 0,
          sentToday: 0,
          lastSentAt: null,
        };

      current.totalSent += 1;
      if (log.created_at >= todayStart) current.sentToday += 1;
      if (!current.lastSentAt || log.created_at > current.lastSentAt) current.lastSentAt = log.created_at;
      scores.set(key, current);
    }

    const totalEligible = Math.max(0, (totalPeople ?? 0) - doNotContact);
    // Use audit logs as source of truth for totalSent (count unique people who received DMs)
    const totalSent = Math.min(uniquePeopleWithDms.size, totalEligible);
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
      sentToday,
      operatorScores: Array.from(scores.values()).sort((left, right) => right.totalSent - left.totalSent),
    };
  } catch (error) {
    handleSupabaseReadError("getOutreachGoalStats", error);
  }
}
