"use server";

import { requireRole } from "@/lib/authz/roles";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { createActionPlan, createActionPlanItem } from "@/lib/data/action-plans";
import {
  getPilotFeedbackCategory,
  getPilotFeedbackCategoryLabel,
  getPilotFeedbackTypeLabel,
  type PilotFeedbackLoopStatus,
} from "@/lib/data/pilot-feedback-loop";
import type { Json } from "@/lib/supabase/database.types";
import { type ActionResult, validateId, performAction, requireActor } from "./utils";

const PILOT_FEEDBACK_STATUSES: PilotFeedbackLoopStatus[] = [
  "novo",
  "em_analise",
  "resolvido",
  "adiado",
  "nao_sera_feito",
];
const PILOT_FEEDBACK_ACTION_PLAN_TITLE = "Correções rápidas de feedback";

type PilotFeedbackSubmission = {
  id: string;
  metadata: {
    type?: string;
    route?: string;
    description?: string;
    urgency?: "low" | "medium" | "high";
  } | null;
};

function assertPilotFeedbackStatus(status: string): asserts status is PilotFeedbackLoopStatus {
  if (!PILOT_FEEDBACK_STATUSES.includes(status as PilotFeedbackLoopStatus)) {
    throw new Error("Status de feedback inválido.");
  }
}

async function getPilotFeedbackSubmission(feedbackId: string): Promise<PilotFeedbackSubmission> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select("id, metadata")
    .eq("id", feedbackId)
    .eq("entity_type", "pilot_feedback")
    .eq("action", "pilot.feedback_submitted")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Feedback não encontrado.");
  return data as PilotFeedbackSubmission;
}

async function getExistingPilotFeedbackTask(feedbackId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select("id")
    .eq("entity_type", "pilot_feedback")
    .eq("entity_id", feedbackId)
    .eq("action", "pilot.feedback_converted_to_task")
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

async function ensurePilotFeedbackActionPlan(actor: { actorId: string; actorEmail: string | null }) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("action_plans")
    .select("id")
    .eq("title", PILOT_FEEDBACK_ACTION_PLAN_TITLE)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (data?.id) return data.id;

  const plan = await createActionPlan({
    title: PILOT_FEEDBACK_ACTION_PLAN_TITLE,
    description: "Backlog leve para correções rápidas e dúvidas recorrentes vindas da Voz da Equipe.",
    status: "active",
    priority: "medium",
    topic_id: null,
    created_by: actor.actorId,
    created_by_email: actor.actorEmail,
    metadata: {
      source: "pilot_feedback_loop",
      kind: "feedback_fast_fix",
    },
  });

  return plan.id;
}

export async function submitPilotFeedback(payload: {
  type: string;
  route: string;
  description: string;
  urgency: "low" | "medium" | "high";
}): Promise<ActionResult> {
  if (!payload.description.trim()) throw new Error("Descrição é obrigatória.");

  return performAction({
    action: "pilot.feedback_submitted",
    entityType: "pilot_feedback",
    entityId: null,
    summary: `Feedback do piloto enviado: ${payload.type} em ${payload.route}`,
    metadata: {
      type: payload.type,
      route: payload.route,
      description: payload.description,
      urgency: payload.urgency,
      timestamp: new Date().toISOString(),
    },
    mutate: async () => {
      // O mutate é intencionalmente vazio pois o feedback é persistido no audit_log
      // através da função performAction.
    },
    revalidate: ["/relatorios", "/relatorios/feedback-piloto"],
  });
}

export async function updatePilotFeedbackStatus(
  feedbackId: string,
  status: PilotFeedbackLoopStatus,
): Promise<ActionResult> {
  validateId(feedbackId, "Feedback");
  assertPilotFeedbackStatus(status);

  return performAction({
    action: "pilot.feedback_status_changed",
    entityType: "pilot_feedback",
    entityId: feedbackId,
    summary: `Feedback movido para ${status}.`,
    metadata: { status },
    mutate: async () => {
      await requireRole(["admin", "operador", "comunicacao"]);
      await getPilotFeedbackSubmission(feedbackId);
    },
    revalidate: ["/relatorios", "/ritmo"],
  });
}

export async function convertPilotFeedbackToTechnicalTask(feedbackId: string): Promise<ActionResult> {
  validateId(feedbackId, "Feedback");

  return performAction({
    action: "pilot.feedback_converted_to_task",
    entityType: "pilot_feedback",
    entityId: feedbackId,
    summary: "Feedback convertido em tarefa técnica.",
    metadata: await (async () => {
      const actor = await requireActor();
      await requireRole(["admin", "operador", "comunicacao"]);
      const existingTask = await getExistingPilotFeedbackTask(feedbackId);
      if (existingTask) throw new Error("Este feedback já foi transformado em tarefa técnica.");

      const submission = await getPilotFeedbackSubmission(feedbackId);
      const submissionMetadata = submission.metadata ?? {};
      const planId = await ensurePilotFeedbackActionPlan(actor);
      const category = getPilotFeedbackCategory(submissionMetadata.type ?? "ux_confuso");
      const item = await createActionPlanItem({
        action_plan_id: planId,
        type: "encaminhamento",
        title: `Resolver feedback: ${getPilotFeedbackTypeLabel(submissionMetadata.type ?? "ux_confuso")}`,
        description: [
          `Categoria: ${getPilotFeedbackCategoryLabel(category)}`,
          `Rota: ${submissionMetadata.route ?? "rota não informada"}`,
          `Urgência: ${submissionMetadata.urgency ?? "medium"}`,
          "",
          submissionMetadata.description ?? "Sem descrição informada.",
        ].join("\n"),
        status: "todo",
        metadata: {
          source: "pilot_feedback_loop",
          feedbackId,
          feedbackType: submissionMetadata.type ?? "ux_confuso",
          route: submissionMetadata.route ?? null,
        },
      });

      return {
        actionPlanId: planId,
        actionPlanItemId: item.id,
        status: "em_analise",
      } satisfies Json;
    })(),
    mutate: async () => {},
    revalidate: ["/relatorios", "/acoes", "/ritmo"],
  });
}

export async function exportPilotFeedbackToRetrospective(feedbackId: string): Promise<ActionResult> {
  validateId(feedbackId, "Feedback");

  return performAction({
    action: "pilot.feedback_exported_to_retrospective",
    entityType: "pilot_feedback",
    entityId: feedbackId,
    summary: "Feedback exportado para retrospectiva.",
    metadata: { exportedAt: new Date().toISOString() },
    mutate: async () => {
      await requireRole(["admin", "operador", "comunicacao"]);
      await getPilotFeedbackSubmission(feedbackId);
    },
    revalidate: ["/relatorios", "/ritmo"],
  });
}
