import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { InternalUserListItem } from "@/lib/types";

export async function listInternalUsers(): Promise<InternalUserListItem[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("internal_users")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((user) => ({
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    role: user.role,
    status: user.status,
    approvedAt: user.approved_at,
    approvedBy: user.approved_by,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  }));
}
