import type { TableRow } from "@/lib/supabase/database.types";

export type TopicCategoryRow = TableRow<"topic_categories">;
export type MobilizationReportRow = TableRow<"mobilization_reports">;
export type OperationalIncidentRow = TableRow<"operational_incidents">;
export type StrategicMemoryRow = TableRow<"strategic_memories">;
export type ActionPlanRow = TableRow<"action_plans">;
export type ActionPlanItemRow = TableRow<"action_plan_items">;

const now = "2026-04-29T12:00:00.000Z";

export const mockTopics: TopicCategoryRow[] = [
  {
    id: "topic-saude",
    slug: "saude",
    name: "Saúde",
    description: "Demandas publicas relacionadas a saude, atendimento e unidades basicas.",
    color: "#ef4444",
    active: true,
    created_at: now,
    updated_at: now,
  },
  {
    id: "topic-transporte",
    slug: "transporte",
    name: "Transporte",
    description: "Relatos sobre onibus, mobilidade e deslocamento urbano.",
    color: "#2563eb",
    active: true,
    created_at: now,
    updated_at: now,
  },
  {
    id: "topic-infraestrutura",
    slug: "infraestrutura",
    name: "Infraestrutura",
    description: "Pautas de rua, iluminacao, calcadas e manutencao urbana.",
    color: "#16a34a",
    active: true,
    created_at: now,
    updated_at: now,
  },
];

export const mockReports: MobilizationReportRow[] = [
  {
    id: "report-mock-1",
    title: "Panorama de Mobilizacao - Abril 2026",
    description: "Resumo de pautas publicas com foco em escuta coletiva.",
    period_start: "2026-04-01",
    period_end: "2026-04-30",
    status: "generated",
    created_by: "e2e-user",
    created_by_email: "teste@radardebase.local",
    created_at: now,
    updated_at: now,
    generated_at: now,
    filters: { confirmedOnly: true },
    snapshot: { totalInteractions: 42 },
  },
];

export const mockIncidents: OperationalIncidentRow[] = [
  {
    id: "incident-mock-1",
    kind: "repeated_failure",
    severity: "warning",
    status: "open",
    title: "Fila de webhook aguardando revisao",
    description: "Evento em quarentena aguardando decisao operacional.",
    related_entity_type: "meta_webhook_events",
    related_entity_id: "webhook-mock-1",
    actor_email: null,
    acknowledged_at: null,
    resolved_at: null,
    created_at: now,
    metadata: {},
  },
];

export const mockStrategicMemories: StrategicMemoryRow[] = [
  {
    id: "memory-mock-1",
    title: "Aprendizados sobre Saúde",
    summary: "Escutas presenciais sobre saude geraram pautas objetivas sem citar pessoas individualmente.",
    topic_id: "topic-saude",
    period_start: "2026-04-01",
    period_end: "2026-04-20",
    territory: "Vila Rica",
    status: "active",
    created_by: "e2e-user",
    created_by_email: "teste@radardebase.local",
    created_at: now,
    updated_at: now,
    archived_at: null,
    metadata: {},
  },
  {
    id: "memory-mock-2",
    title: "Padrao de resposta em Transporte",
    summary: "Posts informativos sobre transporte concentraram mais comentarios publicos do que videos curtos.",
    topic_id: "topic-transporte",
    period_start: "2026-04-10",
    period_end: "2026-04-28",
    territory: "Centro",
    status: "draft",
    created_by: "e2e-user",
    created_by_email: "teste@radardebase.local",
    created_at: now,
    updated_at: now,
    archived_at: null,
    metadata: {},
  },
];

export const mockActionPlans: ActionPlanRow[] = [
  {
    id: "plan-mock-1",
    title: "Resposta publica para transporte",
    description: "Plano de resposta publica e escuta territorial para transporte.",
    source_report_id: "report-mock-1",
    topic_id: "topic-transporte",
    status: "active",
    priority: "high",
    due_date: "2026-05-10",
    created_by: "e2e-user",
    created_by_email: "teste@radardebase.local",
    created_at: now,
    updated_at: now,
    completed_at: null,
    metadata: {},
  },
];

export const mockActionPlanItems: ActionPlanItemRow[] = [
  {
    id: "plan-item-mock-1",
    action_plan_id: "plan-mock-1",
    type: "post_publico",
    title: "Publicar resumo da escuta sobre transporte",
    description: "Sintetizar demandas coletivas sem dados pessoais.",
    status: "doing",
    assigned_to_email: "teste@radardebase.local",
    due_date: "2026-05-02",
    created_at: now,
    updated_at: now,
    completed_at: null,
    metadata: {},
  },
  {
    id: "plan-item-mock-2",
    action_plan_id: "plan-mock-1",
    type: "escuta_bairro",
    title: "Registrar devolutiva da reuniao",
    description: "Consolidar proximos passos publicos da pauta.",
    status: "done",
    assigned_to_email: "teste@radardebase.local",
    due_date: "2026-04-25",
    created_at: now,
    updated_at: now,
    completed_at: now,
    metadata: {},
  },
];
