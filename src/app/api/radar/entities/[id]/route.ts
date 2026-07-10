import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireInternalSession } from "@/lib/supabase/auth";
import { enforceHubRateLimit, hubApiError, UUID_PATTERN } from "@/lib/radar-hub/api";
import { getRadarEntityDetail } from "@/lib/radar-hub/data";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireInternalSession(); const limited = enforceHubRateLimit(request, session.id, 180, 60_000); if (limited) return limited;
    const { id } = await params; if (!UUID_PATTERN.test(id)) return NextResponse.json({ error: "ID inválido." }, { status: 400 });
    const detail = await getRadarEntityDetail(id); return detail ? NextResponse.json(detail) : NextResponse.json({ error: "Entidade não encontrada." }, { status: 404 });
  } catch (error) { return hubApiError(error, "Falha ao consultar entidade."); }
}

