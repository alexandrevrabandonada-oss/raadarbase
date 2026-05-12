import { shouldUseMockData } from "@/lib/config";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AuditLogEntry } from "@/lib/types";
import { handleSupabaseReadError } from "./utils";

export type PilotFeedbackLoopCategory = "bug" | "duvida_tela" | "duvida_etica" | "fluxo_lento" | "sugestao";
export type PilotFeedbackLoopStatus = "novo" | "em_analise" | "resolvido" | "adiado" | "nao_sera_feito";
type FeedbackUrgency = "low" | "medium" | "high";

type FeedbackSubmissionMetadata = {
  type?: string;
  route?: string;
  description?: string;
  urgency?: FeedbackUrgency;
  timestamp?: string;
};

type FeedbackStatusMetadata = {
  status?: PilotFeedbackLoopStatus;
};

type FeedbackTaskMetadata = {
  actionPlanId?: string;
  actionPlanItemId?: string;
  status?: PilotFeedbackLoopStatus;
};

const CATEGORY_LABELS: Record<PilotFeedbackLoopCategory, string> = {
  bug: "Bug",
  duvida_tela: "Dúvida de tela",
  duvida_etica: "Dúvida ética",
  fluxo_lento: "Fluxo lento",
  sugestao: "Sugestão",
};

const STATUS_LABELS: Record<PilotFeedbackLoopStatus, string> = {
  novo: "Novo",
  em_analise: "Em análise",
  resolvido: "Resolvido",
  adiado: "Adiado",
  nao_sera_feito: "Não será feito",
};

const TYPE_LABELS: Record<string, string> = {
  ux_confuso: "Não entendi a tela",
  botao_falha: "Botão não funcionou",
  copy_confuso: "Mensagem confusa",
  instagram_dif: "Dificuldade no Instagram",
  duvida_etica: "Dúvida ética",
  fluxo_lento: "Fluxo lento",
  bug_tecnico: "Bug técnico",
  sugestao: "Sugestão",
};

const FEEDBACK_ACTIONS = [
  "pilot.feedback_submitted",
  "pilot.feedback_status_changed",
  "pilot.feedback_converted_to_task",
  "pilot.feedback_exported_to_retrospective",
] as const;

export type PilotFeedbackLoopItem = {
  id: string;
  createdAt: string;
  actorEmail: string | null;
  category: PilotFeedbackLoopCategory;
  categoryLabel: string;
  status: PilotFeedbackLoopStatus;
  statusLabel: string;
  type: string;
  typeLabel: string;
  route: string;
  description: string;
  urgency: FeedbackUrgency;
  exportedToRetrospectiveAt: string | null;
  convertedToTaskAt: string | null;
  actionPlanId: string | null;
  actionPlanItemId: string | null;
  latestActionAt: string;
};

export type PilotFeedbackLoopResult = {
  items: PilotFeedbackLoopItem[];
  grouped: Record<PilotFeedbackLoopCategory, PilotFeedbackLoopItem[]>;
  countsByStatus: Record<PilotFeedbackLoopStatus, number>;
  countsByCategory: Record<PilotFeedbackLoopCategory, number>;
};

function mapAuditEntry(entry: {
  id: string;
  actor_id: string | null;
  actor_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  summary: string;
  metadata: AuditLogEntry["metadata"];
  created_at: string;
}): AuditLogEntry {
  return {
    id: entry.id,
    actorId: entry.actor_id,
    actorEmail: entry.actor_email,
    action: entry.action,
    entityType: entry.entity_type,
    entityId: entry.entity_id,
    summary: entry.summary,
    metadata: entry.metadata,
    createdAt: entry.created_at,
  };
}

export function getPilotFeedbackCategory(type: string): PilotFeedbackLoopCategory {
  if (type === "bug_tecnico" || type === "botao_falha") return "bug";
  if (type === "duvida_etica") return "duvida_etica";
  if (type === "fluxo_lento") return "fluxo_lento";
  if (type === "sugestao") return "sugestao";
  return "duvida_tela";
}

export function getPilotFeedbackCategoryLabel(category: PilotFeedbackLoopCategory) {
  return CATEGORY_LABELS[category];
}

export function getPilotFeedbackStatusLabel(status: PilotFeedbackLoopStatus) {
  return STATUS_LABELS[status];
}

export function getPilotFeedbackTypeLabel(type: string) {
  return TYPE_LABELS[type] ?? type;
}

export async function getPilotFeedbackLoop(): Promise<PilotFeedbackLoopResult> {
  const emptyResult: PilotFeedbackLoopResult = {
    items: [],
    grouped: {
      bug: [],
      duvida_tela: [],
      duvida_etica: [],
      fluxo_lento: [],
      sugestao: [],
    },
    countsByStatus: {
      novo: 0,
      em_analise: 0,
      resolvido: 0,
      adiado: 0,
      nao_sera_feito: 0,
    },
    countsByCategory: {
      bug: 0,
      duvida_tela: 0,
      duvida_etica: 0,
      fluxo_lento: 0,
      sugestao: 0,
    },
  };

  if (shouldUseMockData()) return emptyResult;

  try {
    const supabase = getSupabaseAdminClient();
    const filters = FEEDBACK_ACTIONS.map((action) => `action.eq.${action}`).join(",");
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .eq("entity_type", "pilot_feedback")
      .or(filters)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const entries = (data ?? []).map(mapAuditEntry);
    const submissions = entries.filter((entry) => entry.action === "pilot.feedback_submitted");
    const eventsByFeedbackId = new Map<string, AuditLogEntry[]>();

    for (const entry of entries) {
      if (entry.action === "pilot.feedback_submitted" || !entry.entityId) continue;
      const current = eventsByFeedbackId.get(entry.entityId) ?? [];
      current.push(entry);
      eventsByFeedbackId.set(entry.entityId, current);
    }

    const items = submissions.map((submission) => {
      const metadata = (submission.metadata as FeedbackSubmissionMetadata | null) ?? {};
      const events = (eventsByFeedbackId.get(submission.id) ?? []).slice().sort((left, right) =>
        left.createdAt < right.createdAt ? -1 : left.createdAt > right.createdAt ? 1 : 0,
      );

      let status: PilotFeedbackLoopStatus = "novo";
      let exportedToRetrospectiveAt: string | null = null;
      let convertedToTaskAt: string | null = null;
      let actionPlanId: string | null = null;
      let actionPlanItemId: string | null = null;

      for (const event of events) {
        if (event.action === "pilot.feedback_status_changed") {
          const eventMetadata = (event.metadata as FeedbackStatusMetadata | null) ?? {};
          if (eventMetadata.status) status = eventMetadata.status;
        }
        if (event.action === "pilot.feedback_converted_to_task") {
          const eventMetadata = (event.metadata as FeedbackTaskMetadata | null) ?? {};
          status = eventMetadata.status ?? "em_analise";
          convertedToTaskAt = event.createdAt;
          actionPlanId = eventMetadata.actionPlanId ?? null;
          actionPlanItemId = eventMetadata.actionPlanItemId ?? null;
        }
        if (event.action === "pilot.feedback_exported_to_retrospective") {
          exportedToRetrospectiveAt = event.createdAt;
        }
      }

      const category = getPilotFeedbackCategory(metadata.type ?? "ux_confuso");
      return {
        id: submission.id,
        createdAt: submission.createdAt,
        actorEmail: submission.actorEmail,
        category,
        categoryLabel: getPilotFeedbackCategoryLabel(category),
        status,
        statusLabel: getPilotFeedbackStatusLabel(status),
        type: metadata.type ?? "ux_confuso",
        typeLabel: getPilotFeedbackTypeLabel(metadata.type ?? "ux_confuso"),
        route: metadata.route ?? "rota não informada",
        description: metadata.description ?? "Sem descrição informada.",
        urgency: metadata.urgency ?? "medium",
        exportedToRetrospectiveAt,
        convertedToTaskAt,
        actionPlanId,
        actionPlanItemId,
        latestActionAt: events.at(-1)?.createdAt ?? submission.createdAt,
      } satisfies PilotFeedbackLoopItem;
    });

    for (const item of items) {
      emptyResult.grouped[item.category].push(item);
      emptyResult.countsByStatus[item.status] += 1;
      emptyResult.countsByCategory[item.category] += 1;
    }

    emptyResult.items = items.sort((left, right) =>
      left.latestActionAt < right.latestActionAt ? 1 : left.latestActionAt > right.latestActionAt ? -1 : 0,
    );

    for (const category of Object.keys(emptyResult.grouped) as PilotFeedbackLoopCategory[]) {
      emptyResult.grouped[category].sort((left, right) =>
        left.latestActionAt < right.latestActionAt ? 1 : left.latestActionAt > right.latestActionAt ? -1 : 0,
      );
    }

    return emptyResult;
  } catch (error) {
    handleSupabaseReadError("getPilotFeedbackLoop", error);
  }
}