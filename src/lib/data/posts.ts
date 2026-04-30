import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { shouldUseMockData } from "@/lib/config";
import { posts as mockPosts } from "@/lib/mock-data";
import type { IgPost } from "@/lib/types";
import { handleSupabaseReadError } from "./utils";

export async function listPosts(): Promise<IgPost[]> {
  if (shouldUseMockData()) return mockPosts;
  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase.from("ig_posts").select("*").order("published_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((post) => {
      const metrics = typeof post.metrics === "object" && post.metrics ? post.metrics as Record<string, unknown> : {};
      return {
        id: post.id,
        shortcode: post.shortcode ?? "",
        permalink: post.permalink ?? null,
        caption: post.caption || "",
        publishedAt: post.published_at ?? post.created_at,
        interactions: Number(metrics.like_count ?? 0) + Number(metrics.comments_count ?? 0),
        comments: Number(metrics.comments_count ?? 0),
        mobilizationScore: Number(metrics.mobilization_score ?? 0),
        topic: String(metrics.topic_category || "Geral"),
      };
    });
  } catch (error) {
    handleSupabaseReadError("listPosts", error);
  }
}
