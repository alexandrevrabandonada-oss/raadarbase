import { shouldUseMockData } from "@/lib/config";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getActiveTerritorialListeningWindow } from "@/lib/data/territorial-listening-monitoring";

// ─── Types ────────────────────────────────────────────────────────────────────

export type QuietNeighborhood = {
  bairro: string;
  reportCount: number;
};

export type LowFormTopic = {
  topic: string;
  postCount: number;
  commentCount: number;
  formCount: number;
  engagementToFormRatio: number;
};

export type HighEngagementLowConversionPost = {
  id: string;
  shortcode: string;
  captionExcerpt: string | null;
  interactions: number;
  mobilizationScore: number;
  publishedAt: string | null;
  topic: string;
};

export type AbsentNeighborhood = {
  bairro: string;
  totalHistoricReports: number;
  lastSeenAt: string | null;
};

export type SilenceRadarData = {
  quietNeighborhoods: QuietNeighborhood[];
  lowFormTopics: LowFormTopic[];
  highEngagementPosts: HighEngagementLowConversionPost[];
  absentNeighborhoods: AbsentNeighborhood[];
  activeWindowId: string | null;
  activeWindowActionPlanId: string | null;
  activeWindowStartsAt: string | null;
  totalSubmissions: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safeExcerpt(text: string | null | undefined, limit = 100): string | null {
  if (!text) return null;
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > limit ? `${clean.slice(0, limit - 1)}…` : clean;
}

// ─── Main function ────────────────────────────────────────────────────────────

export async function getSilenceRadarData(): Promise<SilenceRadarData> {
  if (shouldUseMockData()) {
    return {
      quietNeighborhoods: [],
      lowFormTopics: [],
      highEngagementPosts: [],
      absentNeighborhoods: [],
      activeWindowId: null,
      activeWindowActionPlanId: null,
      activeWindowStartsAt: null,
      totalSubmissions: 0,
    };
  }

  const supabase = getSupabaseAdminClient();

  // Fetch active window info
  const activeWindow = await getActiveTerritorialListeningWindow();
  const activeWindowId = activeWindow?.id ?? null;
  const activeWindowActionPlanId = activeWindow?.actionPlanId ?? null;
  const activeWindowStartsAt = activeWindow?.startsAt ?? null;

  // ── Submissions all-time ─────────────────────────────────────────────────
  const { data: allSubmissions, error: subError } = await supabase
    .from("bairro_escuta_submissions")
    .select("id,bairro,pauta,created_at,source_report_id")
    .order("created_at", { ascending: false });

  if (subError) throw new Error(`Falha ao carregar relatos: ${subError.message}`);
  const submissions = allSubmissions ?? [];
  const totalSubmissions = submissions.length;

  // ── Submissions in active window ─────────────────────────────────────────
  const windowSubmissions = activeWindowStartsAt
    ? submissions.filter((s) => s.created_at >= activeWindowStartsAt)
    : submissions;

  // ── Card 1: Quiet neighborhoods (low report count) ───────────────────────
  const bairroCounts = new Map<string, number>();
  for (const row of windowSubmissions) {
    const b = (row.bairro ?? "").trim();
    if (!b) continue;
    bairroCounts.set(b, (bairroCounts.get(b) ?? 0) + 1);
  }

  const quietNeighborhoods: QuietNeighborhood[] = Array.from(bairroCounts.entries())
    .filter(([, count]) => count < 3)
    .map(([bairro, reportCount]) => ({ bairro, reportCount }))
    .sort((a, b) => a.reportCount - b.reportCount)
    .slice(0, 10);

  // ── Card 2: Topics with high comments but low form submissions ────────────
  const { data: postsRaw, error: postsError } = await supabase
    .from("ig_posts")
    .select("id,metrics")
    .order("published_at", { ascending: false });

  if (postsError) throw new Error(`Falha ao carregar posts: ${postsError.message}`);
  const posts = postsRaw ?? [];

  type TopicAccumulator = { postCount: number; commentCount: number };
  const topicPostMap = new Map<string, TopicAccumulator>();

  for (const post of posts) {
    const metrics = post.metrics && typeof post.metrics === "object" && !Array.isArray(post.metrics)
      ? (post.metrics as Record<string, unknown>)
      : {};
    const topic = String(metrics.topic_category ?? "Geral").trim() || "Geral";
    const comments = Number(metrics.comments_count ?? 0);
    const existing = topicPostMap.get(topic);
    if (existing) {
      existing.postCount += 1;
      existing.commentCount += comments;
    } else {
      topicPostMap.set(topic, { postCount: 1, commentCount: comments });
    }
  }

  const formByTopic = new Map<string, number>();
  for (const row of submissions) {
    const p = (row.pauta ?? "").trim();
    if (!p) continue;
    formByTopic.set(p, (formByTopic.get(p) ?? 0) + 1);
  }

  const lowFormTopics: LowFormTopic[] = [];
  for (const [topic, { postCount, commentCount }] of topicPostMap) {
    if (commentCount === 0) continue;
    const formCount = formByTopic.get(topic) ?? 0;
    const engagementToFormRatio = commentCount / (formCount + 1);
    if (engagementToFormRatio >= 2) {
      lowFormTopics.push({ topic, postCount, commentCount, formCount, engagementToFormRatio });
    }
  }
  lowFormTopics.sort((a, b) => b.engagementToFormRatio - a.engagementToFormRatio);
  const topLowFormTopics = lowFormTopics.slice(0, 8);

  // ── Card 3: High engagement + low mobilization score ─────────────────────
  const { data: allPosts, error: allPostsError } = await supabase
    .from("ig_posts")
    .select("id,shortcode,caption,published_at,metrics")
    .order("published_at", { ascending: false });

  if (allPostsError) throw new Error(`Falha ao carregar posts detalhados: ${allPostsError.message}`);

  const highEngagementPosts: HighEngagementLowConversionPost[] = (allPosts ?? [])
    .map((post) => {
      const metrics = post.metrics && typeof post.metrics === "object" && !Array.isArray(post.metrics)
        ? (post.metrics as Record<string, unknown>)
        : {};
      const likeCount = Number(metrics.like_count ?? 0);
      const commentsCount = Number(metrics.comments_count ?? 0);
      const interactions = likeCount + commentsCount;
      const mobilizationScore = Number(metrics.mobilization_score ?? 0);
      const topic = String(metrics.topic_category ?? "Geral").trim() || "Geral";
      return {
        id: post.id,
        shortcode: post.shortcode ?? "",
        captionExcerpt: safeExcerpt(post.caption),
        interactions,
        mobilizationScore,
        publishedAt: post.published_at ?? null,
        topic,
      };
    })
    .filter((p) => p.interactions >= 5 && p.mobilizationScore === 0)
    .sort((a, b) => b.interactions - a.interactions)
    .slice(0, 8);

  // ── Card 4: Absent neighborhoods (known historically, absent from window) ─
  const historicBairros = new Map<string, { count: number; lastSeenAt: string | null }>();
  for (const row of submissions) {
    const b = (row.bairro ?? "").trim();
    if (!b) continue;
    const existing = historicBairros.get(b);
    if (!existing) {
      historicBairros.set(b, { count: 1, lastSeenAt: row.created_at ?? null });
    } else {
      existing.count += 1;
    }
  }

  const windowBairros = new Set(windowSubmissions.map((s) => (s.bairro ?? "").trim()).filter(Boolean));

  const absentNeighborhoods: AbsentNeighborhood[] = [];
  for (const [bairro, { count, lastSeenAt }] of historicBairros) {
    if (!windowBairros.has(bairro) && count >= 1) {
      absentNeighborhoods.push({ bairro, totalHistoricReports: count, lastSeenAt });
    }
  }
  absentNeighborhoods.sort((a, b) => b.totalHistoricReports - a.totalHistoricReports);
  const topAbsent = absentNeighborhoods.slice(0, 10);

  return {
    quietNeighborhoods,
    lowFormTopics: topLowFormTopics,
    highEngagementPosts,
    absentNeighborhoods: topAbsent,
    activeWindowId,
    activeWindowActionPlanId,
    activeWindowStartsAt,
    totalSubmissions,
  };
}
