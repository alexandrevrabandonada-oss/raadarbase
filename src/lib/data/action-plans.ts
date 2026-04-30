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

  const suggestions: { type: TableInsert<"action_plan_items">["type"]; title: string; description: string }[] = [];

  // Analisa os tópicos do relatório
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  report.topics?.forEach((rt: any) => {
    const topicName = rt.topic.name.toLowerCase();
    
    if (topicName.includes("saúde")) {
      suggestions.push({
        type: "post_publico",
        title: `Explicar demandas de saúde: ${rt.topic.name}`,
        description: "Post informativo sintetizando o que foi ouvido da comunidade sobre este tema."
      });
      suggestions.push({
        type: "escuta_bairro",
        title: `Roda de escuta sobre saúde em ${rt.topic.name}`,
        description: "Organizar encontro presencial para aprofundar as demandas levantadas no relatório."
      });
    } else if (topicName.includes("transporte")) {
      suggestions.push({
        type: "carrossel",
        title: `Mapeamento do transporte: ${rt.topic.name}`,
        description: "Visualizar as principais reclamações de horários e linhas citadas."
      });
      suggestions.push({
        type: "resposta_publica",
        title: `Síntese de demandas de transporte`,
        description: "Publicar nota pública com os dados consolidados de mobilização sobre transporte."
      });
    } else if (topicName.includes("poluição") || topicName.includes("csn") || topicName.includes("ambiente")) {
      suggestions.push({
        type: "video_curto",
        title: `Impacto da poluição: ${rt.topic.name}`,
        description: "Vídeo explicando tecnicamente e politicamente o impacto do pó preto e poluição local."
      });
      suggestions.push({
        type: "encaminhamento",
        title: `Protocolar demandas ambientais`,
        description: "Encaminhar síntese do relatório para órgãos de fiscalização ambiental."
      });
    } else {
      // Sugestão genérica
      suggestions.push({
        type: "material_explicativo",
        title: `Informativo sobre ${rt.topic.name}`,
        description: "Criar material didático sobre a pauta mais mobilizada no período."
      });
    }
  });

  return {
    reportTitle: report.title,
    suggestedTopicId: report.topics?.[0]?.topic_id,
    items: suggestions
  };
}
