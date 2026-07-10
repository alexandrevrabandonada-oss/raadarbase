import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { checkInfluenceRateLimit } from "@/lib/influence/rate-limit";

export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function enforceHubRateLimit(request: NextRequest, userId: string, limit: number, windowMs: number) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
  const result = checkInfluenceRateLimit(`hub:${userId}:${ip}:${request.nextUrl.pathname}`, limit, windowMs);
  if (result.allowed) return null;
  return NextResponse.json({ error: "Limite de requisições atingido." }, { status: 429, headers: { "Retry-After": String(Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000))) } });
}

export function hubApiError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : fallback;
  if (/não autenticado/i.test(message)) return NextResponse.json({ error: message }, { status: 401 });
  if (/Acesso negado|exige perfil|administrador|operador/i.test(message)) return NextResponse.json({ error: message }, { status: 403 });
  if (/inválid|obrigatóri|selecione|não são aceitos|não configurado|allowlist|vazia|vazio|exige confiança/i.test(message)) return NextResponse.json({ error: message }, { status: 400 });
  return NextResponse.json({ error: fallback }, { status: 500 });
}

