import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { E2E_BYPASS_AUTH_ACTIVE } from "@/lib/config";

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
  if (E2E_BYPASS_AUTH_ACTIVE) {
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

  if (isProtected && !data.user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (request.nextUrl.pathname === "/login" && data.user) {
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
