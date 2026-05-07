import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabasePublishableKey } from "@/lib/config";

export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = getSupabasePublishableKey();

  if (!url || !anonKey) {
    throw new Error("Supabase client environment variables are missing.");
  }

  return createBrowserClient<Database>(url, anonKey);
}
