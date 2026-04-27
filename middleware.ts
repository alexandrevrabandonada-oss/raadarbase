import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  E2E_BYPASS_AUTH_ACTIVE,
  E2E_BYPASS_AUTH_OPTOUT_COOKIE,
  E2E_BYPASS_AUTH_OPTOUT_HEADER,
} from "@/lib/config";
import { isInternalUserActive } from "@/lib/supabase/internal-users";

const protectedPaths = [
  "/dashboard",
  "/pessoas",
  "/abordagem",
  "/mensagens",
  "/integracoes",
  "/operacao",
  "/configuracoes",
];

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

  let internalStatus: "pending" | "active" | "disabled" | null = null;
  let accessReason: "pending" | "disabled" | "missing-profile" | "setup" | null = null;

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
      if (!isInternalUserActive(internalStatus)) {
        accessReason = internalStatus;
      }
    }
  }

  if (isProtected && !data.user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isProtected && accessReason) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    loginUrl.searchParams.set("reason", accessReason);
    return NextResponse.redirect(loginUrl);
  }

  if (request.nextUrl.pathname === "/login" && data.user && isInternalUserActive(internalStatus)) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    return NextResponse.redirect(dashboardUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/pessoas/:path*",
    "/abordagem/:path*",
    "/mensagens/:path*",
    "/integracoes/:path*",
    "/operacao/:path*",
    "/configuracoes/:path*",
    "/login",
  ],
};
