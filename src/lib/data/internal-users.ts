import { shouldUseMockData } from "@/lib/config";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { InternalUserListItem } from "@/lib/types";

export const mockInternalUsers: InternalUserListItem[] = [
  {
    id: "e2e-internal-user",
    email: "e2e@radardebase.local",
    fullName: "E2E User",
    role: "admin",
    status: "active",
    approvedAt: new Date(0).toISOString(),
    approvedBy: null,
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
  },
  {
    id: "pending-mock-user",
    email: "pendente@radardebase.local",
    fullName: "Pessoa Pendente",
    role: "operator",
    status: "pending",
    approvedAt: null,
    approvedBy: null,
    createdAt: new Date("2026-01-01T12:00:00.000Z").toISOString(),
    updatedAt: new Date("2026-01-01T12:00:00.000Z").toISOString(),
  },
];

export async function listInternalUsers(): Promise<InternalUserListItem[]> {
  if (shouldUseMockData()) return mockInternalUsers;
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
