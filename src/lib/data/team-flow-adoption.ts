"use server";

import { shouldUseMockData } from "@/lib/config";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type AuditRow = {
  actor_id: string | null;
  action: string;
  metadata: Record<string, unknown> | null;
};

export type TeamFlowAdoptionMetrics = {
  indicators: {
    activeOperatorsToday: number;
    operatorsOpenedQueue: number;
    tasksAssumed: number;
    dmsPrepared: number;
    dmsConfirmed: number;
    responsesRecorded: number;
    referralsMade: number;
    dailyClosuresGenerated: number;
    feedbacksSent: number;
  };
  bottlenecks: {
    dmCopyToConfirmGap: number;
    responseToReferralGap: number;
  };
  stalledByStage: Array<{ stage: string; count: number }>;
  quickSheetUsage: {
    opens: number;
    operators: number;
  };
};

const STAGE_LABELS: Record<string, string> = {
  para_abordar: "Para abordar",
  mensagem_enviada: "Mensagem enviada",
  esperando_resposta: "Esperando resposta",
  precisa_encaminhar: "Precisa encaminhar",
  convidado: "Convidado",
  nao_insistir: "Pausa operacional",
};

function getTodayIso() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.toISOString();
}

function readEventName(row: AuditRow) {
  const metadata = row.metadata ?? {};
  const event = metadata.event;
  return typeof event === "string" ? event : null;
}

function readOrigin(row: AuditRow) {
  const metadata = row.metadata ?? {};
  const origin = metadata.origin;
  return typeof origin === "string" ? origin : null;
}

export async function getTeamFlowAdoptionMetrics(): Promise<TeamFlowAdoptionMetrics> {
  if (shouldUseMockData()) {
    return {
      indicators: {
        activeOperatorsToday: 6,
        operatorsOpenedQueue: 5,
        tasksAssumed: 24,
        dmsPrepared: 38,
        dmsConfirmed: 29,
        responsesRecorded: 18,
        referralsMade: 12,
        dailyClosuresGenerated: 2,
        feedbacksSent: 4,
      },
      bottlenecks: {
        dmCopyToConfirmGap: 9,
        responseToReferralGap: 6,
      },
      stalledByStage: [
        { stage: "Esperando resposta", count: 17 },
        { stage: "Precisa encaminhar", count: 11 },
        { stage: "Para abordar", count: 8 },
      ],
      quickSheetUsage: {
        opens: 42,
        operators: 6,
      },
    };
  }

  const supabase = getSupabaseAdminClient();
  const todayIso = getTodayIso();

  const [auditResult, tasksResult] = await Promise.all([
    supabase
      .from("audit_logs")
      .select("actor_id,action,metadata")
      .gte("created_at", todayIso),
    supabase
      .from("outreach_tasks")
      .select("column_key")
      .is("completed_at", null),
  ]);

  if (auditResult.error) throw auditResult.error;
  if (tasksResult.error) throw tasksResult.error;

  const rows = (auditResult.data || []) as AuditRow[];

  let tasksAssumed = 0;
  let dmsPrepared = 0;
  let dmsConfirmed = 0;
  let responsesRecorded = 0;
  let referralsMade = 0;
  let dailyClosuresGenerated = 0;
  let feedbacksSent = 0;
  let quickSheetOpens = 0;

  const activeOperators = new Set<string>();
  const operatorsOpenedQueue = new Set<string>();
  const quickSheetOperators = new Set<string>();

  for (const row of rows) {
    const eventName = readEventName(row);
    const origin = readOrigin(row);
    const actorId = row.actor_id;

    const isOperationalAction =
      row.action === "contact.dm_prepared" ||
      row.action === "contact.dm_sent" ||
      row.action === "contact.response_recorded" ||
      row.action === "contact.referral_recorded" ||
      row.action === "contact.responsible_assigned" ||
      row.action === "outreach_task.responsible_assigned" ||
      row.action === "outreach_task.bulk_assigned" ||
      row.action === "telemetry.event_recorded";

    if (isOperationalAction && actorId) {
      activeOperators.add(actorId);
    }

    if (row.action === "contact.responsible_assigned" || row.action === "outreach_task.responsible_assigned") {
      tasksAssumed += 1;
    }
    if (row.action === "outreach_task.bulk_assigned") {
      tasksAssumed += 1;
    }

    if (row.action === "contact.dm_prepared") {
      dmsPrepared += 1;
    }
    if (row.action === "contact.dm_sent") {
      dmsConfirmed += 1;
    }
    if (row.action === "contact.response_recorded") {
      responsesRecorded += 1;
    }
    if (row.action === "contact.referral_recorded") {
      referralsMade += 1;
    }
    if (row.action === "pilot.feedback_submitted") {
      feedbacksSent += 1;
    }

    if ((eventName === "minha_fila_opened" || origin === "minha_fila") && actorId) {
      operatorsOpenedQueue.add(actorId);
    }

    if (eventName === "quick_sheet_opened") {
      quickSheetOpens += 1;
      if (actorId) quickSheetOperators.add(actorId);
    }

    if (eventName === "daily_closure_generated") {
      dailyClosuresGenerated += 1;
    }
  }

  const stageCountMap = new Map<string, number>();
  for (const row of tasksResult.data || []) {
    const raw = row.column_key || "desconhecido";
    const label = STAGE_LABELS[raw] || raw;
    stageCountMap.set(label, (stageCountMap.get(label) || 0) + 1);
  }

  const stalledByStage = Array.from(stageCountMap.entries())
    .map(([stage, count]) => ({ stage, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return {
    indicators: {
      activeOperatorsToday: activeOperators.size,
      operatorsOpenedQueue: operatorsOpenedQueue.size,
      tasksAssumed,
      dmsPrepared,
      dmsConfirmed,
      responsesRecorded,
      referralsMade,
      dailyClosuresGenerated,
      feedbacksSent,
    },
    bottlenecks: {
      dmCopyToConfirmGap: Math.max(dmsPrepared - dmsConfirmed, 0),
      responseToReferralGap: Math.max(responsesRecorded - referralsMade, 0),
    },
    stalledByStage,
    quickSheetUsage: {
      opens: quickSheetOpens,
      operators: quickSheetOperators.size,
    },
  };
}
