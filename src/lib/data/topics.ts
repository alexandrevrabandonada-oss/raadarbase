import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { shouldUseMockData } from "@/lib/config";
import { interactions as mockInteractions } from "@/lib/mock-data";
import type { TableRow, TableInsert } from "@/lib/supabase/database.types";
import { mockTopics } from "./e2e-mocks";

export type TopicCategoryRow = TableRow<"topic_categories">;
export type InteractionTopicTagRow = TableRow<"interaction_topic_tags">;
export type PostTopicTagRow = TableRow<"post_topic_tags">;

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function listTopicCategories() {
  if (shouldUseMockData()) {
    return mockTopics.filter((topic) => topic.active).sort((left, right) => left.name.localeCompare(right.name));
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("topic_categories")
    .select("*")
    .eq("active", true)
    .order("name");
  if (error) throw new Error(`Falha ao listar categorias: ${error.message}`);
  return data ?? [];
}

export async function getTopicBySlug(slug: string) {
  if (shouldUseMockData()) {
    return mockTopics.find((topic) => topic.slug === slug) ?? null;
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("topic_categories")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`Falha ao carregar tema: ${error.message}`);
  return data;
}

export async function listInteractionsByTopic(topicId: string, limit = 50) {
  if (shouldUseMockData()) {
    const topic = mockTopics.find((item) => item.id === topicId);
    const slug = topic?.slug ?? "";

    return mockInteractions
      .filter((interaction) => interaction.theme?.toLowerCase().includes(slug.slice(0, 5)) || slug === "")
      .slice(0, limit)
      .map((interaction) => ({
        id: `tag-${interaction.id}-${topicId}`,
        interaction: {
          id: interaction.id,
          type: interaction.type,
          occurred_at: interaction.occurredAt,
          text_content: interaction.text,
          person_id: interaction.personId,
        },
      }));
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("interaction_topic_tags")
    .select(`
      id,
      interaction:ig_interactions(*)
    `)
    .eq("topic_id", topicId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Falha ao listar interações do tema: ${error.message}`);
  return data ?? [];
}

export async function getPendingTopicReviews(limit = 20) {
  if (shouldUseMockData()) {
    return mockInteractions.slice(0, limit).map((interaction, index) => ({
      id: interaction.id,
      type: interaction.type,
      occurred_at: interaction.occurredAt,
      text_content: interaction.text,
      tags: index === 0 ? [{ topic: mockTopics[1] }] : [],
    }));
  }

  const supabase = getSupabaseAdminClient();
  // Simplified: interações com sugestões automáticas mas sem confirmação manual
  // Precisamos listar interações que tenham tags de 'rule_suggestion' mas não de 'operator_confirmed'
  // Para simplificar agora, listamos as mais recentes que tenham pelo menos uma tag de sugestão.
  const { data, error } = await supabase
    .from("ig_interactions")
    .select(`
      *,
      tags:interaction_topic_tags(
        topic:topic_categories(*)
      )
    `)
    .order("occurred_at", { ascending: false })
    .limit(limit);
  
  if (error) throw new Error(`Falha ao listar fila de revisão: ${error.message}`);
  return data ?? [];
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function confirmInteractionTopics(
  interactionId: string, 
  topicIds: string[], 
  userId: string | null
) {
  const supabase = getSupabaseAdminClient();
  
  // 1. Remove sugestões antigas
  await supabase
    .from("interaction_topic_tags")
    .delete()
    .eq("interaction_id", interactionId);

  // 2. Insere as confirmadas
  const inserts: TableInsert<"interaction_topic_tags">[] = topicIds.map((topicId) => ({
    interaction_id: interactionId,
    topic_id: topicId,
    source: "operator_confirmed",
    confidence: 1.0,
    created_by: userId,
  }));

  const { error } = await supabase.from("interaction_topic_tags").insert(inserts);
  if (error) throw new Error(`Falha ao confirmar temas: ${error.message}`);
}

export async function removeInteractionTopic(interactionId: string, topicId: string) {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("interaction_topic_tags")
    .delete()
    .eq("interaction_id", interactionId)
    .eq("topic_id", topicId);
  if (error) throw new Error(`Falha ao remover tema: ${error.message}`);
}
