import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { shouldUseMockData } from "@/lib/config";
import type { TableRow, TableInsert, TableUpdate } from "@/lib/supabase/database.types";
import { getMobilizationReport } from "./reports";
import { mockActionPlans, mockActionPlanItems, mockTopics } from "./e2e-mocks";

export type ActionPlanRow = TableRow<"action_plans">;
export type ActionPlanItemRow = TablePlanItemRow;
type TablePlanItemRow = TableRow<"action_plan_items">;

export interface ActionPlanWithItems extends ActionPlanRow {
  items: ActionPlanItemRow[];
  topic?: TableRow<"topic_categories"> | null;
}

export async function listActionPlans(filters?: {
  status?: ActionPlanRow["status"];
  topic_id?: string;
  priority?: ActionPlanRow["priority"];
}) {
  if (shouldUseMockData()) {
    return mockActionPlans
      .filter((plan) => (filters?.status ? plan.status === filters.status : true))
      .filter((plan) => (filters?.topic_id ? plan.topic_id === filters.topic_id : true))
      .filter((plan) => (filters?.priority ? plan.priority === filters.priority : true))
      .map((plan) => ({
        ...plan,
        topic: mockTopics.find((topic) => topic.id === plan.topic_id) ?? null,
        itemCount: mockActionPlanItems.filter((item) => item.action_plan_id === plan.id).length,
      }));
  }

  const supabase = getSupabaseAdminClient();
  let query = supabase.from("action_plans").select(`
    *,
    topic:topic_categories(*)
  `).order("created_at", { ascending: false });

  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.topic_id) query = query.eq("topic_id", filters.topic_id);
  if (filters?.priority) query = query.eq("priority", filters.priority);

  const { data, error } = await query;
  if (error) throw new Error(`Falha ao listar planos de ação: ${error.message}`);
  
  // Get item counts for each plan
  const { data: itemCounts } = await supabase
    .from("action_plan_items")
    .select("action_plan_id");
  
  const counts: Record<string, number> = {};
  itemCounts?.forEach(item => {
    counts[item.action_plan_id] = (counts[item.action_plan_id] || 0) + 1;
  });

  return (data || []).map(plan => ({
    ...plan,
    itemCount: counts[plan.id] || 0
  }));
}

export async function getActionPlan(id: string): Promise<ActionPlanWithItems | null> {
  if (shouldUseMockData()) {
    const plan = mockActionPlans.find((item) => item.id === id);
    if (!plan) return null;

    return {
      ...plan,
      topic: mockTopics.find((topic) => topic.id === plan.topic_id) ?? null,
      items: mockActionPlanItems.filter((item) => item.action_plan_id === id),
    };
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("action_plans")
    .select(`
      *,
      topic:topic_categories(*),
      items:action_plan_items(*)
    `)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Falha ao buscar plano de ação: ${error.message}`);
  return data as ActionPlanWithItems | null;
}

export async function getActionPlanByReportId(reportId: string): Promise<ActionPlanWithItems | null> {
  if (shouldUseMockData()) {
    const plan = mockActionPlans.find((item) => item.source_report_id === reportId);
    if (!plan) return null;

    return {
      ...plan,
      topic: mockTopics.find((topic) => topic.id === plan.topic_id) ?? null,
      items: mockActionPlanItems.filter((item) => item.action_plan_id === plan.id),
    };
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("action_plans")
    .select(`
      *,
      topic:topic_categories(*),
      items:action_plan_items(*)
    `)
    .eq("source_report_id", reportId)
    .order("created_at", { ascending: false })
    .maybeSingle();

  if (error) throw new Error(`Falha ao buscar plano por relatório: ${error.message}`);
  return data as ActionPlanWithItems | null;
}

export async function createActionPlan(input: TableInsert<"action_plans">) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("action_plans")
    .insert(input)
    .select()
    .single();

  if (error) throw new Error(`Falha ao criar plano de ação: ${error.message}`);
  return data;
}

export async function updateActionPlan(id: string, input: TableUpdate<"action_plans">) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("action_plans")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`Falha ao atualizar plano de ação: ${error.message}`);
  return data;
}

export async function createActionPlanItem(input: TableInsert<"action_plan_items">) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("action_plan_items")
    .insert(input)
    .select()
    .single();

  if (error) throw new Error(`Falha ao criar item do plano: ${error.message}`);
  return data;
}

export async function updateActionPlanItem(id: string, input: TableUpdate<"action_plan_items">) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("action_plan_items")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`Falha ao atualizar item do plano: ${error.message}`);
  return data;
}

export async function getActionPlanItem(id: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("action_plan_items")
    .select(`
      *,
      plan:action_plans(
        id,
        title,
        topic:topic_categories(id, name)
      ),
      evidence:action_item_evidence(*),
      result:action_item_results(*)
    `)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Falha ao buscar item do plano: ${error.message}`);
  return data;
}

/**
 * Sugere itens de plano de ação baseados em um relatório de mobilização.
 */
export async function suggestActionPlanFromReport(reportId: string) {
  const report = await getMobilizationReport(reportId);
  if (!report) throw new Error("Relatório não encontrado.");

  const snapshot = report.snapshot as { topTopics?: Array<{ topic_id: string; topic?: { name?: string } | null }> } | null;
  const reportTopics = snapshot?.topTopics?.length ? snapshot.topTopics : report.topics ?? [];
  const topicNames = reportTopics
    .map((entry) => entry.topic?.name ?? null)
    .filter((value): value is string => Boolean(value));
  const highlightTopics = topicNames.slice(0, 4);
  const highlightLabel = highlightTopics.length > 0 ? highlightTopics.join(", ") : "as pautas mais recorrentes do Instagram";

  const suggestions: { type: TableInsert<"action_plan_items">["type"]; title: string; description: string }[] = [
    {
      type: "carrossel",
      title: `O que apareceu na escuta do Instagram: ${highlightLabel}`,
      description: "Sintetizar o relatório em linguagem pública, com foco em pauta coletiva e sem dados pessoais.",
    },
    {
      type: "post_publico",
      title: "Publicar devolutiva no Instagram",
      description: "Responder publicamente às pautas mais recorrentes com uma devolutiva clara, útil e coletiva.",
    },
    {
      type: "encaminhamento",
      title: "Compartilhar chamada em grupos",
      description: "Levar a chamada pública aos grupos certos sem automação, microtargeting ou contato em massa.",
    },
    {
      type: "escuta_bairro",
      title: "Monitorar escuta por bairro por 7 dias",
      description: "Acompanhar os relatos por bairro durante a janela de escuta sem expor contatos por padrão.",
    },
    {
      type: "material_explicativo",
      title: "Gerar síntese territorial após 7 dias",
      description: "Consolidar uma leitura pública da escuta territorial com base em pautas agregadas e consentidas.",
    },
  ];

  return {
    reportTitle: report.title,
    suggestedTitle: "Resposta pública às pautas mais recorrentes do Instagram",
    suggestedDescription: `Plano público e coletivo baseado nas pautas mais recorrentes do Instagram (${highlightLabel}).`,
    suggestedTopicId: reportTopics[0]?.topic_id,
    items: suggestions
  };
}
