import { getSupabaseServerClient } from "@/lib/supabase/server";
import { E2E_BYPASS_AUTH_ACTIVE } from "@/lib/config";

export async function getInternalSession() {
  if (E2E_BYPASS_AUTH_ACTIVE) {
    return {
      id: "e2e-internal-user",
      email: "e2e@radardebase.local",
    };
  }
  try {
    const supabase = await getSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    return data.user ?? null;
  } catch {
    return null;
  }
}

export async function requireInternalSession() {
  const user = await getInternalSession();
  if (!user) {
    throw new Error("Usuário interno não autenticado.");
  }
  return user;
}
