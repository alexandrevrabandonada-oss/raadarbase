import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { shouldUseMockData } from "@/lib/config";
import { interactions as mockInteractions } from "@/lib/mock-data";
import type { InteractionWithPost } from "@/lib/types";
import { handleSupabaseReadError } from "./utils";

export async function listInteractions(personId?: string): Promise<InteractionWithPost[]> {
  if (shouldUseMockData()) {
    return personId ? mockInteractions.filter((interaction) => interaction.personId === personId) : mockInteractions;
  }
  try {
    const supabase = getSupabaseAdminClient();
    let query = supabase.from("ig_interactions").select("*").order("occurred_at", { ascending: false });
    if (personId) query = query.eq("person_id", personId);
    const { data, error } = await query;
    if (error) throw error;
    const postIds = [
      ...new Set(
        (data ?? [])
          .map((item) => item.post_id)
          .filter((value): value is string => Boolean(value)),
      ),
    ];
    const { data: posts } = postIds.length
      ? await supabase.from("ig_posts").select("id, caption, shortcode").in("id", postIds)
      : { data: [] };
    const postsById = new Map((posts ?? []).map((post) => [post.id, post]));
    return (data ?? []).map((interaction) => ({
      id: interaction.id,
      personId: interaction.person_id,
      postId: interaction.post_id,
      type: interaction.type,
      occurredAt: interaction.occurred_at,
      text: interaction.text_content ?? "",
      theme: interaction.theme,
      post: interaction.post_id ? postsById.get(interaction.post_id) ?? null : null,
    }));
  } catch (error) {
    handleSupabaseReadError("listInteractions", error);
  }
}
