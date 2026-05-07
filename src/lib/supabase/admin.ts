import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabaseSecretKey } from "@/lib/config";

let adminClient: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = getSupabaseSecretKey();

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase admin environment variables are missing.");
  }

  if (!adminClient) {
    adminClient = createClient<Database>(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  return adminClient;
}
