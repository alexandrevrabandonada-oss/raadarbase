import { getSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import {
  E2E_BYPASS_AUTH_ACTIVE,
  E2E_BYPASS_AUTH_OPTOUT_COOKIE,
  E2E_BYPASS_AUTH_OPTOUT_HEADER,
} from "@/lib/config";
import { isInternalUserActive, type InternalUserProfile } from "@/lib/supabase/internal-users";

export type InternalSession = {
  id: string;
  email: string | null;
  internalUser: InternalUserProfile;
};

export async function getInternalSession() {
  const requestHeaders = await headers();
  const cookieStore = await cookies();
  const e2eBypassOptedOut =
    requestHeaders.get(E2E_BYPASS_AUTH_OPTOUT_HEADER) === "off" ||
    cookieStore.get(E2E_BYPASS_AUTH_OPTOUT_COOKIE)?.value === "true";

  if (E2E_BYPASS_AUTH_ACTIVE && !e2eBypassOptedOut) {
    return {
      id: "e2e-internal-user",
      email: "e2e@radardebase.local",
      internalUser: {
        id: "e2e-internal-user",
        email: "e2e@radardebase.local",
        full_name: "E2E User",
        role: "admin",
        status: "active",
        approved_at: new Date(0).toISOString(),
        approved_by: null,
        created_at: new Date(0).toISOString(),
        updated_at: new Date(0).toISOString(),
      },
    };
  }
  try {
    const supabase = await getSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) return null;

    const { data: internalUser, error } = await supabase
      .from("internal_users")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error || !internalUser || !isInternalUserActive(internalUser.status)) {
      return null;
    }

    return {
      id: user.id,
      email: user.email ?? null,
      internalUser,
    };
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

export async function requireInternalPageSession(nextPath: string) {
  const user = await getInternalSession();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }
  return user;
}

export async function requireAdminSession() {
  const user = await requireInternalSession();
  if (user.internalUser.role !== "admin") {
    throw new Error("Apenas administradores internos podem executar esta ação.");
  }
  return user;
}
