import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  E2E_BYPASS_AUTH_ACTIVE,
  E2E_BYPASS_AUTH_OPTOUT_COOKIE,
  E2E_BYPASS_AUTH_OPTOUT_HEADER,
} from "@/lib/config";
import { isInternalUserActive, type InternalAccessReason } from "@/lib/supabase/internal-users";

// Single source of truth for protected routes
const PROTECTED_ROUTE_PREFIXES = [
  "dashboard",
  "pessoas",
  "abordagem",
  "mensagens",
  "integracoes",
  "operacao",
  "configuracoes",
  "acoes",
  "campo",
  "escuta/bairro/admin",
  "execucao",
  "governanca",
  "memoria",
  "minha-fila",
  "posts",
  "radar",
  "recibo/escuta/distribuicao",
  "relatorios",
  "ritmo",
  "temas",
  "voluntarios",
] as const;

const protectedPaths = PROTECTED_ROUTE_PREFIXES.map((p) => `/${p}`);

export async function middleware(request: NextRequest) {
  const e2eBypassOptedOut =
    request.headers.get(E2E_BYPASS_AUTH_OPTOUT_HEADER) === "off" ||
    request.cookies.get(E2E_BYPASS_AUTH_OPTOUT_COOKIE)?.value === "true";

  if (E2E_BYPASS_AUTH_ACTIVE && !e2eBypassOptedOut) {
    return NextResponse.next();
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    if (request.nextUrl.pathname === "/login") return NextResponse.next();
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    return NextResponse.redirect(redirectUrl);
  }

  const response = NextResponse.next({ request });
  const supabase = createServerClient(url, anonKey, {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => response.cookies.set(name, value));
        },
      },
    },
  );

  const { data } = await supabase.auth.getUser();
  const isProtected = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path));

  let internalStatus: string | null = null;
  let accessReason: InternalAccessReason | null = null;

  if (data.user) {
    const { data: internalUser, error } = await supabase
      .from("internal_users")
      .select("status")
      .eq("id", data.user.id)
      .maybeSingle();

    if (error) {
      accessReason = "setup";
    } else if (!internalUser) {
      accessReason = "missing-profile";
    } else {
      internalStatus = internalUser.status;
      if (!isInternalUserActive(internalStatus as "pending" | "active" | "disabled")) {
        accessReason = internalStatus as InternalAccessReason;
      }
    }
  }

  if (isProtected && (!data.user || accessReason)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    if (accessReason) {
      loginUrl.searchParams.set("reason", accessReason);
    }
    return NextResponse.redirect(loginUrl);
  }

  if (request.nextUrl.pathname === "/login" && data.user && isInternalUserActive(internalStatus as "pending" | "active" | "disabled")) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    return NextResponse.redirect(dashboardUrl);
  }

  return response;
}

export const config = {
  matcher: [
    ...PROTECTED_ROUTE_PREFIXES.map((p) => `/${p}/:path*`),
    "/login",
  ],
};
