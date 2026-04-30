import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { shouldUseMockData } from "@/lib/config";
import type { TableRow } from "@/lib/supabase/database.types";
import { sanitizeReportSnapshot } from "@/lib/reports/safety";
import { mockReports, mockActionPlans, mockActionPlanItems, mockTopics } from "./e2e-mocks";

export type MobilizationReportRow = TableRow<"mobilization_reports">;
export type MobilizationReportTopicRow = TableRow<"mobilization_report_topics">;

export async function listMobilizationReports() {
  if (shouldUseMockData()) return mockReports;

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("mobilization_reports")
    .select("*")
    .order("created_at", { ascending: false });
  
  if (error) throw new Error(`Falha ao listar relatórios: ${error.message}`);
  return data ?? [];
}

export async function getMobilizationReport(id: string) {
  if (shouldUseMockData()) {
    const report = mockReports.find((item) => item.id === id);
    if (!report) return null;

    return {
      ...report,
      topics: [
        {
          id: "report-topic-mock-1",
          report_id: report.id,
          topic_id: mockTopics[1].id,
          interaction_count: 12,
          post_count: 3,
          people_count: 8,
          summary: "Transporte concentrou o maior volume de escuta coletiva.",
          created_at: report.created_at,
          topic: mockTopics[1],
        },
      ],
      action_plans: mockActionPlans.map((plan) => ({
        id: plan.id,
        title: plan.title,
        status: plan.status,
        items: mockActionPlanItems.filter((item) => item.action_plan_id === plan.id).map((item) => ({
          id: item.id,
          status: item.status,
          action_item_results: item.status === "done" ? { id: `result-${item.id}` } : null,
        })),
      })),
    };
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("mobilization_reports")
    .select(`
      *,
      topics:mobilization_report_topics(
        *,
        topic:topic_categories(*)
      ),
      action_plans(
        id,
        title,
        status,
        items:action_plan_items(id, status, action_item_results(id))
      )
    `)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Falha ao buscar relatório: ${error.message}`);
  return data;
}

export async function createMobilizationReportDraft(input: {
  title: string;
  description?: string;
  period_start?: string;
  period_end?: string;
  created_by: string;
  created_by_email: string;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  filters: any;
}) {
  if (shouldUseMockData()) {
    return {
      ...mockReports[0],
      id: `report-mock-${Date.now()}`,
      title: input.title,
      description: input.description ?? null,
      period_start: input.period_start ?? null,
      period_end: input.period_end ?? null,
      status: "draft" as const,
      created_by: input.created_by,
      created_by_email: input.created_by_email,
      filters: input.filters,
      generated_at: null,
    };
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("mobilization_reports")
    .insert({
      ...input,
      status: "draft",
    })
    .select()
    .single();

  if (error) throw new Error(`Falha ao criar rascunho: ${error.message}`);
  return data;
}

/**
 * Aggregates data and generates a snapshot for a report.
 */
export async function generateMobilizationReportSnapshotData(reportId: string) {
  if (shouldUseMockData()) return;

  const supabase = getSupabaseAdminClient();
  const report = await getMobilizationReport(reportId);
  if (!report) throw new Error("Relatório não encontrado.");

  // 1. Get filtered interactions/posts based on report filters
  // For this brick, we'll do a simplified aggregation
  // We'll count interactions per topic in the period
  
  const { data: tags, error: tagsError } = await supabase
    .from("interaction_topic_tags")
    .select(`
      topic_id,
      interaction:ig_interactions!inner(*)
    `)
    .gte("interaction.occurred_at", report.period_start || '1970-01-01')
    .lte("interaction.occurred_at", report.period_end || '9999-12-31');

  if (tagsError) throw new Error(`Falha na agregação: ${tagsError.message}`);

  const statsByTopic: Record<string, { interaction_count: number; people: Set<string> }> = {};
  
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  tags?.forEach((tag: any) => {
    if (!statsByTopic[tag.topic_id]) {
      statsByTopic[tag.topic_id] = { interaction_count: 0, people: new Set() };
    }
    statsByTopic[tag.topic_id].interaction_count++;
    statsByTopic[tag.topic_id].people.add(tag.interaction.person_id);
  });

  // 2. Save stats to mobilization_report_topics
  for (const [topicId, stats] of Object.entries(statsByTopic)) {
    await supabase.from("mobilization_report_topics").upsert({
      report_id: reportId,
      topic_id: topicId,
      interaction_count: stats.interaction_count,
      people_count: stats.people.size,
    });
  }

  // 3. Update report status and generated_at
  const snapshot = sanitizeReportSnapshot({
    generatedAt: new Date().toISOString(),
    totalInteractions: tags?.length || 0,
    topicRanking: Object.keys(statsByTopic).length,
    // Add representative comments (top 3 for simplicity)
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    representativeComments: tags?.slice(0, 5).map((t: any) => ({
      text: t.interaction.text_content,
      occurredAt: t.interaction.occurred_at
    })) || []
  });

  const { error: updateError } = await supabase
    .from("mobilization_reports")
    .update({
      status: "generated",
      generated_at: new Date().toISOString(),
      snapshot,
    })
    .eq("id", reportId);

  if (updateError) throw new Error(`Falha ao finalizar relatório: ${updateError.message}`);
}

export async function archiveMobilizationReport(id: string) {
  if (shouldUseMockData()) return;

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("mobilization_reports")
    .update({ status: "archived" })
    .eq("id", id);
  
  if (error) throw new Error(`Falha ao arquivar relatório: ${error.message}`);
}
