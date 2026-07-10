import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { checkInfluenceRateLimit } from "@/lib/influence/rate-limit";
import { INFLUENCE_CATEGORIES, type InfluenceCategory, type InfluenceFilters } from "@/lib/influence/types";

export function getRequestIdentity(request: NextRequest, userId: string) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
  return `${userId}:${ip}`;
}

export function enforceRateLimit(request: NextRequest, userId: string, limit: number, windowMs: number) {
  const result = checkInfluenceRateLimit(getRequestIdentity(request, userId), limit, windowMs);
  if (result.allowed) return null;
  return NextResponse.json(
    { error: "Limite de requisições atingido. Tente novamente em instantes." },
    { status: 429, headers: { "Retry-After": String(Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000))) } },
  );
}

function numberParam(value: string | null) {
  if (value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

export function parseInfluenceFilters(params: URLSearchParams): InfluenceFilters {
  const categoria = params.get("categoria");
  const sort = params.get("sort");
  return {
    query: params.get("q") ?? undefined,
    categoria: categoria && INFLUENCE_CATEGORIES.includes(categoria as InfluenceCategory) ? categoria as InfluenceCategory : undefined,
    cidade: params.get("cidade") ?? undefined,
    estado: params.get("estado") ?? undefined,
    regiao: params.get("regiao") === "sul-fluminense" ? "sul-fluminense" : undefined,
    minScore: numberParam(params.get("minScore")), maxScore: numberParam(params.get("maxScore")),
    minSeguidores: numberParam(params.get("minSeguidores")), maxSeguidores: numberParam(params.get("maxSeguidores")),
    page: numberParam(params.get("page")), pageSize: numberParam(params.get("pageSize")),
    sort: sort === "seguidores" || sort === "nome" || sort === "atualizacao" ? sort : "score",
    direction: params.get("direction") === "asc" ? "asc" : "desc",
  };
}

export function apiError(error: unknown, fallback = "Falha ao processar a requisição.") {
  const message = error instanceof Error ? error.message : fallback;
  if (/não autenticado/i.test(message)) return NextResponse.json({ error: message }, { status: 401 });
  if (/Acesso negado|exige perfil|administrador/i.test(message)) return NextResponse.json({ error: message }, { status: 403 });
  if (/inválid|limite|excede|obrigatóri/i.test(message)) return NextResponse.json({ error: message }, { status: 400 });
  return NextResponse.json({ error: fallback }, { status: 500 });
}
