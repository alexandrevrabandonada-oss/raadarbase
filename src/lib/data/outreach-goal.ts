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

async function listDmSentAuditLogs() {
  const supabase = getSupabaseAdminClient();
  const rows: Array<{
    actor_id: string | null;
    actor_email: string | null;
    created_at: string;
  }> = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("actor_id, actor_email, created_at")
      .eq("action", "contact.dm_sent")
      .order("created_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
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

    // sentByStatus é a fonte de verdade da barra geral.
    // O placar por operador, porém, precisa refletir histórico real de envios.
    const [sentByStatus, doNotContact, logs, operatorsResult] = await Promise.all([
      countPeopleByStatus(["abordado", "respondeu", "contato_confirmado"]),
      countPeopleByStatus(["nao_abordar"]),
      listDmSentAuditLogs(),
      supabase.from("internal_users").select("id, email, full_name").eq("status", "active"),
    ]);

    if (operatorsResult.error) throw operatorsResult.error;

    const { count: totalPeople, error: totalError } = await supabase
      .from("ig_people")
      .select("*", { count: "exact", head: true });
    if (totalError) throw totalError;

    const operatorsById = new Map((operatorsResult.data ?? []).map((op) => [op.id, op]));
    const scores = new Map<string, OutreachOperatorScore>();
    const sentToday = logs.filter((log) => log.created_at >= todayStart).length;

    // Inicializar scores para todos os operadores ativos
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

    // Contabilizar totalSent por operador via ig_people.responsible_id (paginado)
    // Esta é a fonte mais completa: cobre 100% dos envios históricos,
    // inclusive anteriores ao sistema de audit_logs
    const sentPeople: Array<{ responsible_id: string | null }> = [];
    for (let from = 0; ; from += PAGE_SIZE) {
      const { data, error } = await supabase
        .from("ig_people")
        .select("responsible_id")
        .in("status", ["abordado", "respondeu", "contato_confirmado"])
        .not("responsible_id", "is", null)
        .range(from, from + PAGE_SIZE - 1);
      if (error) throw error;
      sentPeople.push(...(data ?? []));
      if (!data || data.length < PAGE_SIZE) break;
    }

    for (const person of sentPeople) {
      const key = person.responsible_id!;
      const operator = operatorsById.get(key);
      const current = scores.get(key) ?? {
        operatorId: key,
        operatorEmail: operator?.email ?? null,
        operatorName: operator?.full_name || operator?.email || "Operador",
        totalSent: 0,
        sentToday: 0,
        lastSentAt: null,
      };
      current.totalSent += 1;
      scores.set(key, current);
    }

    // Complementar sentToday e lastSentAt via audit_logs (precisão de data/hora)
    for (const log of logs) {
      const key = log.actor_id ?? log.actor_email ?? "sem-operador";
      const current = scores.get(key);
      if (!current) continue;
      if (log.created_at >= todayStart) current.sentToday += 1;
      if (!current.lastSentAt || log.created_at > current.lastSentAt) current.lastSentAt = log.created_at;
      scores.set(key, current);
    }


    const totalEligible = Math.max(0, (totalPeople ?? 0) - doNotContact);
    // Status é a fonte de verdade: pessoas efetivamente abordadas no banco
    const totalSent = Math.min(sentByStatus, totalEligible);
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
      operatorScores: Array.from(scores.values())
        .filter((score) => score.totalSent > 0 || score.sentToday > 0)
        .sort((left, right) => {
          if (right.totalSent !== left.totalSent) return right.totalSent - left.totalSent;
          return right.sentToday - left.sentToday;
        }),
    };
  } catch (error) {
    handleSupabaseReadError("getOutreachGoalStats", error);
  }
}
