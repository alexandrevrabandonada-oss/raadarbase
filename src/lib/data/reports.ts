import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { shouldUseMockData } from "@/lib/config";
import type { TableRow } from "@/lib/supabase/database.types";
import { sanitizeReportSnapshot } from "@/lib/reports/safety";
import { suggestTopicsForText } from "@/lib/topics/rules";
import { mockReports, mockActionPlans, mockActionPlanItems, mockTopics } from "./e2e-mocks";

export type MobilizationReportRow = TableRow<"mobilization_reports">;
export type MobilizationReportTopicRow = TableRow<"mobilization_report_topics">;

type TopicCategoryRow = TableRow<"topic_categories">;
type IgPostRow = TableRow<"ig_posts">;
type IgInteractionRow = TableRow<"ig_interactions">;
type InteractionTopicTagRow = TableRow<"interaction_topic_tags">;
type PostTopicTagRow = TableRow<"post_topic_tags">;

type ReportTopicSummary = {
  topic_id: string;
  topic: TopicCategoryRow | null;
  interaction_count: number;
  post_count: number;
  people_count: number;
  source_breakdown: {
    manual: number;
    rule_suggestion: number;
    operator_confirmed: number;
  };
};

type ReportPostSummary = {
  post_id: string;
  shortcode: string | null;
  published_at: string | null;
  caption_excerpt: string | null;
  comment_count: number;
  topic_names: string[];
};

type RepresentativeComment = {
  text: string;
  occurredAt: string;
  postShortcode: string | null;
  topicNames: string[];
};

type PendingThemeItem = {
  interactionId: string;
  occurredAt: string;
  excerpt: string;
  suggestedTopicNames: string[];
};

type ReportSnapshot = {
  generatedAt: string;
  period: {
    start: string | null;
    end: string | null;
    source: "first_real_ingestion" | "generated_from_existing_report";
  };
  totals: {
    postsAnalyzed: number;
    interactionsAnalyzed: number;
    uniquePeople: number;
    themesDetected: number;
    confirmedThemes: number;
    pendingThemes: number;
  };
  topTopics: ReportTopicSummary[];
  topPosts: ReportPostSummary[];
  representativeComments: RepresentativeComment[];
  pendingThemes: PendingThemeItem[];
  publicRecommendations: string[];
};

function safeTextExcerpt(text: string | null | undefined, limit = 180) {
  if (!text) return null;
  const clean = text
    .replace(/\s+/g, " ")
    .replace(/\b\d{2}\s?\d{4,5}-?\d{4}\b/g, "[TELEFONE OCULTO]")
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, "[EMAIL OCULTO]")
    .trim();
  return clean.length > limit ? `${clean.slice(0, limit - 1)}…` : clean;
}

function getTimestampValue(value: string | null | undefined) {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function pickMinimumTimestamp(values: Array<string | null | undefined>) {
  const candidates = values.filter((value): value is string => Boolean(getTimestampValue(value)));
  if (candidates.length === 0) return null;
  return candidates.sort((left, right) => (getTimestampValue(left)! - getTimestampValue(right)!))[0];
}

function pickMaximumTimestamp(values: Array<string | null | undefined>) {
  const candidates = values.filter((value): value is string => Boolean(getTimestampValue(value)));
  if (candidates.length === 0) return null;
  return candidates.sort((left, right) => (getTimestampValue(right)! - getTimestampValue(left)!))[0];
}

function formatRecommendation(topicNames: string[]) {
  const focus = topicNames[0];
  return focus
    ? `Responder comentário recorrente e devolver a pauta de ${focus} em linguagem pública.`
    : "Responder comentário recorrente com devolutiva pública.";
}

async function loadInstagramAnalysisSnapshot() {
  const supabase = getSupabaseAdminClient();

  const [postsResult, interactionsResult, peopleResult, topicsResult, interactionTagsResult, postTagsResult] = await Promise.all([
    supabase.from("ig_posts").select("id, shortcode, caption, published_at, synced_at, created_at, metrics, permalink, instagram_post_id"),
    supabase.from("ig_interactions").select("id, person_id, post_id, occurred_at, synced_at, created_at, text_content, type, theme, raw_payload"),
    supabase.from("ig_people").select("id, username, display_name, synced_at, created_at, updated_at"),
    supabase.from("topic_categories").select("id, slug, name, description, color, active, created_at, updated_at"),
    supabase.from("interaction_topic_tags").select("id, interaction_id, topic_id, source, created_at, interaction:ig_interactions(id, person_id, post_id, occurred_at, text_content, type), topic:topic_categories(id, slug, name, description, color, active, created_at, updated_at)"),
    supabase.from("post_topic_tags").select("id, post_id, topic_id, source, created_at, post:ig_posts(id, shortcode, caption, published_at), topic:topic_categories(id, slug, name, description, color, active, created_at, updated_at)"),
  ]);

  if (postsResult.error) throw new Error(`Falha ao ler posts reais: ${postsResult.error.message}`);
  if (interactionsResult.error) throw new Error(`Falha ao ler interações reais: ${interactionsResult.error.message}`);
  if (peopleResult.error) throw new Error(`Falha ao ler pessoas reais: ${peopleResult.error.message}`);
  if (topicsResult.error) throw new Error(`Falha ao ler temas reais: ${topicsResult.error.message}`);
  if (interactionTagsResult.error) throw new Error(`Falha ao ler tags de interações: ${interactionTagsResult.error.message}`);
  if (postTagsResult.error) throw new Error(`Falha ao ler tags de posts: ${postTagsResult.error.message}`);

  const posts = (postsResult.data ?? []) as IgPostRow[];
  const interactions = (interactionsResult.data ?? []) as IgInteractionRow[];
  const people = peopleResult.data ?? [];
  const topics = (topicsResult.data ?? []) as TopicCategoryRow[];
  const interactionTags = (interactionTagsResult.data ?? []) as Array<
    InteractionTopicTagRow & { topic: TopicCategoryRow | null; interaction: IgInteractionRow | null }
  >;
  const postTags = (postTagsResult.data ?? []) as Array<PostTopicTagRow & { topic: TopicCategoryRow | null; post: IgPostRow | null }>;

  const postsById = new Map(posts.map((post) => [post.id, post]));
  const topicsById = new Map(topics.map((topic) => [topic.id, topic]));
  const topicsBySlug = new Map(topics.map((topic) => [topic.slug, topic]));

  const topicStats = new Map<
    string,
    ReportTopicSummary & { peopleIds: Set<string> }
  >();

  for (const tag of interactionTags) {
    const topic = topicsById.get(tag.topic_id) ?? tag.topic ?? null;
    const current = topicStats.get(tag.topic_id) ?? {
      topic_id: tag.topic_id,
      topic,
      interaction_count: 0,
      post_count: 0,
      people_count: 0,
      source_breakdown: {
        manual: 0,
        rule_suggestion: 0,
        operator_confirmed: 0,
      },
      peopleIds: new Set<string>(),
    };

    current.topic = topic;
    current.interaction_count += 1;
    const sourceKey = tag.source as keyof typeof current.source_breakdown;
    if (sourceKey in current.source_breakdown) {
      current.source_breakdown[sourceKey] += 1;
    }
    if (tag.interaction?.person_id) current.peopleIds.add(tag.interaction.person_id);
    topicStats.set(tag.topic_id, current);
  }

  for (const tag of postTags) {
    const topic = topicsById.get(tag.topic_id) ?? tag.topic ?? null;
    const current = topicStats.get(tag.topic_id) ?? {
      topic_id: tag.topic_id,
      topic,
      interaction_count: 0,
      post_count: 0,
      people_count: 0,
      source_breakdown: {
        manual: 0,
        rule_suggestion: 0,
        operator_confirmed: 0,
      },
      peopleIds: new Set<string>(),
    };

    current.topic = topic;
    current.post_count += 1;
    const sourceKey = tag.source as keyof typeof current.source_breakdown;
    if (sourceKey in current.source_breakdown) {
      current.source_breakdown[sourceKey] += 1;
    }
    topicStats.set(tag.topic_id, current);
  }

  const interactionTagsByInteraction = new Map<string, Array<{ topic: TopicCategoryRow | null; source: InteractionTopicTagRow["source"] }>>();
  for (const tag of interactionTags) {
    const current = interactionTagsByInteraction.get(tag.interaction_id) ?? [];
    current.push({ topic: topicsById.get(tag.topic_id) ?? tag.topic ?? null, source: tag.source });
    interactionTagsByInteraction.set(tag.interaction_id, current);
  }

  const interactionTagsByPost = new Map<string, Array<{ topic: TopicCategoryRow | null; source: PostTopicTagRow["source"] }>>();
  for (const tag of postTags) {
    const current = interactionTagsByPost.get(tag.post_id) ?? [];
    current.push({ topic: topicsById.get(tag.topic_id) ?? tag.topic ?? null, source: tag.source });
    interactionTagsByPost.set(tag.post_id, current);
  }

  for (const interaction of interactions) {
    if (interactionTagsByInteraction.has(interaction.id) || !interaction.text_content) continue;

    for (const suggestion of suggestTopicsForText(interaction.text_content)) {
      const topic = topicsBySlug.get(suggestion.slug) ?? null;
      if (!topic) continue;

      const current = topicStats.get(topic.id) ?? {
        topic_id: topic.id,
        topic,
        interaction_count: 0,
        post_count: 0,
        people_count: 0,
        source_breakdown: {
          manual: 0,
          rule_suggestion: 0,
          operator_confirmed: 0,
        },
        peopleIds: new Set<string>(),
      };

      current.topic = topic;
      current.interaction_count += 1;
      current.source_breakdown.rule_suggestion += 1;
      if (interaction.person_id) current.peopleIds.add(interaction.person_id);
      topicStats.set(topic.id, current);
    }
  }

  const postCommentStats = new Map<string, { count: number; topics: Set<string> }>();
  for (const interaction of interactions) {
    if (!interaction.post_id) continue;
    const current = postCommentStats.get(interaction.post_id) ?? { count: 0, topics: new Set<string>() };
    current.count += 1;

    for (const tag of interactionTagsByInteraction.get(interaction.id) ?? []) {
      if (tag.topic?.name) current.topics.add(tag.topic.name);
    }

    for (const tag of interactionTagsByPost.get(interaction.post_id) ?? []) {
      if (tag.topic?.name) current.topics.add(tag.topic.name);
    }

    postCommentStats.set(interaction.post_id, current);
  }

  const topTopics = [...topicStats.values()]
    .map((topic) => ({
      topic_id: topic.topic_id,
      topic: topic.topic,
      interaction_count: topic.interaction_count,
      post_count: topic.post_count,
      people_count: topic.peopleIds.size,
      source_breakdown: topic.source_breakdown,
    }))
    .sort((left, right) => {
      if (right.interaction_count !== left.interaction_count) return right.interaction_count - left.interaction_count;
      if (right.post_count !== left.post_count) return right.post_count - left.post_count;
      return right.people_count - left.people_count;
    });

  const confirmedThemes = topTopics.filter((topic) => topic.source_breakdown.operator_confirmed > 0).length;

  const topPosts = [...postCommentStats.entries()]
    .map(([postId, summary]) => {
      const post = postsById.get(postId);
      return {
        post_id: postId,
        shortcode: post?.shortcode ?? null,
        published_at: post?.published_at ?? null,
        caption_excerpt: safeTextExcerpt(post?.caption, 140),
        comment_count: summary.count,
        topic_names: [...summary.topics],
      } satisfies ReportPostSummary;
    })
    .sort((left, right) => {
      if (right.comment_count !== left.comment_count) return right.comment_count - left.comment_count;
      return (getTimestampValue(right.published_at) ?? 0) - (getTimestampValue(left.published_at) ?? 0);
    })
    .slice(0, 5);

  const rankedInteractions = [...interactions]
    .filter((interaction) => Boolean(interaction.text_content))
    .sort((left, right) => {
      const rightCount = right.post_id ? postCommentStats.get(right.post_id)?.count ?? 0 : 0;
      const leftCount = left.post_id ? postCommentStats.get(left.post_id)?.count ?? 0 : 0;
      if (rightCount !== leftCount) return rightCount - leftCount;
      return (getTimestampValue(right.occurred_at) ?? 0) - (getTimestampValue(left.occurred_at) ?? 0);
    });

  const representativeComments: RepresentativeComment[] = rankedInteractions.slice(0, 6).map((interaction) => ({
    text: safeTextExcerpt(interaction.text_content, 180) ?? "",
    occurredAt: interaction.occurred_at,
    postShortcode: interaction.post_id ? postsById.get(interaction.post_id)?.shortcode ?? null : null,
    topicNames: [...(interactionTagsByInteraction.get(interaction.id) ?? [])].map((tag) => tag.topic?.name).filter((value): value is string => Boolean(value)),
  }));

  const pendingThemes = interactions
    .filter((interaction) => !interactionTagsByInteraction.has(interaction.id) && Boolean(interaction.text_content))
    .slice(0, 10)
    .map((interaction) => {
      const suggestedTopicNames = suggestTopicsForText(interaction.text_content ?? "")
        .map((suggestion) => topicsBySlug.get(suggestion.slug) ?? null)
        .filter((topic): topic is TopicCategoryRow => Boolean(topic))
        .map((topic) => topic.name);

      return {
        interactionId: interaction.id,
        occurredAt: interaction.occurred_at,
        excerpt: safeTextExcerpt(interaction.text_content, 180) ?? "",
        suggestedTopicNames,
      } satisfies PendingThemeItem;
    });

  const periodStart = pickMinimumTimestamp([
    ...posts.map((post) => post.synced_at ?? post.published_at ?? post.created_at),
    ...interactions.map((interaction) => interaction.synced_at ?? interaction.occurred_at ?? interaction.created_at),
    ...people.map((person) => person.synced_at ?? person.created_at ?? person.updated_at),
  ]);
  const periodEnd = pickMaximumTimestamp([
    ...posts.map((post) => post.synced_at ?? post.published_at ?? post.created_at),
    ...interactions.map((interaction) => interaction.synced_at ?? interaction.occurred_at ?? interaction.created_at),
    ...people.map((person) => person.synced_at ?? person.created_at ?? person.updated_at),
  ]);

  const snapshot: ReportSnapshot = sanitizeReportSnapshot({
    generatedAt: new Date().toISOString(),
    period: {
      start: periodStart,
      end: periodEnd,
      source: "first_real_ingestion",
    },
    totals: {
      postsAnalyzed: posts.length,
      interactionsAnalyzed: interactions.length,
      uniquePeople: people.length,
      themesDetected: topTopics.length,
      confirmedThemes,
      pendingThemes: pendingThemes.length,
    },
    topTopics,
    topPosts,
    representativeComments,
    pendingThemes,
    publicRecommendations: [
      formatRecommendation(topTopics.slice(0, 2).map((item) => item.topic?.name ?? item.topic_id)),
      "Fazer post explicativo com síntese coletiva do tema mais mobilizado.",
      "Organizar escuta pública de bairro ou plenária para aprofundar pontos recorrentes.",
      "Criar material educativo com linguagem simples e devolutiva pública.",
      "Levar a pauta consolidada para reunião interna e definir encaminhamentos públicos.",
    ],
  });

  return {
    posts,
    interactions,
    people,
    topics,
    topicStats: topTopics,
    topPosts,
    representativeComments,
    pendingThemes,
    periodStart,
    periodEnd,
    snapshot,
  };
}

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
  created_by: string | null;
  created_by_email: string | null;
  filters: Record<string, unknown>;
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
      title: input.title,
      description: input.description,
      period_start: input.period_start,
      period_end: input.period_end,
      created_by: input.created_by,
      created_by_email: input.created_by_email,
      filters: input.filters,
      status: "draft",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
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

  const analysis = await loadInstagramAnalysisSnapshot();

  for (const topic of analysis.topicStats) {
    if (!topic.topic) continue;
    await supabase.from("mobilization_report_topics").upsert({
      report_id: reportId,
      topic_id: topic.topic_id,
      interaction_count: topic.interaction_count,
      post_count: topic.post_count,
      people_count: topic.people_count,
      summary: `Tema mobilizado com ${topic.interaction_count} interações públicas.`,
    });
  }

  const { error: updateError } = await supabase
    .from("mobilization_reports")
    .update({
      status: "generated",
      generated_at: new Date().toISOString(),
      snapshot: analysis.snapshot,
    })
    .eq("id", reportId);

  if (updateError) throw new Error(`Falha ao finalizar relatório: ${updateError.message}`);

  return analysis.snapshot;
}

export async function createFirstRealInstagramReport() {
  if (shouldUseMockData()) {
    const report = mockReports.find((item) => item.status === "generated") ?? mockReports[0];
    return { reportId: report.id, reportTitle: report.title };
  }

  const analysis = await loadInstagramAnalysisSnapshot();
  if (analysis.posts.length === 0 && analysis.interactions.length === 0) {
    throw new Error("Nenhum dado real sincronizado foi encontrado para gerar o relatório.");
  }

  const supabase = getSupabaseAdminClient();
  const existing = await supabase
    .from("mobilization_reports")
    .select("id, status")
    .eq("title", "Primeiro relatório real do Instagram")
    .order("created_at", { ascending: true })
    .maybeSingle();

  if (existing.error) throw new Error(`Falha ao verificar relatório existente: ${existing.error.message}`);

  let reportId = existing.data?.id;

  if (!reportId) {
    const draft = await createMobilizationReportDraft({
      title: "Primeiro relatório real do Instagram",
      description: "Relatório real de pauta construído a partir de posts, comentários e temas públicos sincronizados do Instagram.",
      period_start: analysis.periodStart ?? undefined,
      period_end: analysis.periodEnd ?? undefined,
      created_by: null,
      created_by_email: null,
      filters: {
        scope: "first_real_ingestion",
        confirmedOnly: false,
        dataSources: ["ig_posts", "ig_interactions", "ig_people", "topic_categories", "interaction_topic_tags", "post_topic_tags"],
      },
    });
    reportId = draft.id;
  }

  await generateMobilizationReportSnapshotData(reportId);
  return { reportId, reportTitle: "Primeiro relatório real do Instagram" };
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

export async function getFieldEngagementReport() {
  if (shouldUseMockData()) {
    return {
      topInterestedEvents: [],
      topAttendedEvents: [],
      topTopics: []
    };
  }

  const supabase = getSupabaseAdminClient();
  
  // 1. Buscar métricas de todos os eventos
  const { data: events, error: eventsError } = await supabase
    .from("field_agenda_events")
    .select("id, title, topic_slug, neighborhood");
  
  if (eventsError) throw eventsError;

  const eventMetrics = await Promise.all(
    events.map(async (event) => {
      const { data: referrals, error: refError } = await supabase
        .from("ig_person_referrals")
        .select("status")
        .eq("target_type", "evento_campo")
        .eq("target_id", event.id);
      
      if (refError) throw refError;

      const totalInvited = referrals.length;
      const confirmed = referrals.filter(r => r.status === 'confirmou').length;
      const attended = referrals.filter(r => r.status === 'compareceu' || r.status === 'ajudou').length;

      return {
        id: event.id,
        title: event.title,
        topicSlug: event.topic_slug,
        neighborhood: event.neighborhood,
        totalInvited,
        confirmed,
        attended
      };
    })
  );

  // 2. Ordenar por interessados
  const topInterestedEvents = [...eventMetrics]
    .sort((a, b) => b.totalInvited - a.totalInvited)
    .slice(0, 5);

  // 3. Ordenar por presença real
  const topAttendedEvents = [...eventMetrics]
    .sort((a, b) => b.attended - a.attended)
    .slice(0, 5);

  // 4. Agrupar por tema
  const topicStats = new Map<string, { invited: number, attended: number, eventCount: number }>();
  eventMetrics.forEach(m => {
    if (!m.topicSlug) return;
    const current = topicStats.get(m.topicSlug) || { invited: 0, attended: 0, eventCount: 0 };
    current.invited += m.totalInvited;
    current.attended += m.attended;
    current.eventCount += 1;
    topicStats.set(m.topicSlug, current);
  });

  const topTopics = Array.from(topicStats.entries())
    .map(([slug, stats]) => ({
      slug,
      ...stats
    }))
    .sort((a, b) => b.attended - a.attended);

  return {
    topInterestedEvents,
    topAttendedEvents,
    topTopics
  };
}
