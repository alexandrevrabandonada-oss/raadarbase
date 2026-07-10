import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { apiError, enforceRateLimit } from "@/lib/influence/api-helpers";
import { getInfluenceProfile } from "@/lib/influence/data";
import { requireInternalSession } from "@/lib/supabase/auth";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireInternalSession();
    const limited = enforceRateLimit(request, session.id, 180, 60_000);
    if (limited) return limited;
    const { id } = await params;
    if (!UUID.test(id)) return NextResponse.json({ error: "ID de perfil inválido." }, { status: 400 });
    const result = await getInfluenceProfile(id);
    return result ? NextResponse.json(result) : NextResponse.json({ error: "Perfil não encontrado." }, { status: 404 });
  } catch (error) {
    return apiError(error, "Falha ao consultar o perfil de influência.");
  }
}

