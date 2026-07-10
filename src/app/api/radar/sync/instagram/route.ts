import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { canRunMetaSync } from "@/lib/authz/roles";
import { enforceHubRateLimit, hubApiError } from "@/lib/radar-hub/api";
import { syncInstagramProfilesToRadarEntities } from "@/lib/radar-hub/service";
import { requireInternalSession } from "@/lib/supabase/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await requireInternalSession();
    if (!canRunMetaSync(session.internalUser.role)) return NextResponse.json({ error: "Sincronização exige perfil admin ou operador." }, { status: 403 });
    const limited = enforceHubRateLimit(request, session.id, 5, 60_000); if (limited) return limited;
    const result = await syncInstagramProfilesToRadarEntities({ id: session.id, email: session.email });
    await writeAuditLog({ actorId: session.id, actorEmail: session.email, action: "radar_hub.instagram_synced", entityType: "radar_enrichment_jobs", entityId: result.jobId, summary: `${result.total} perfis do Radar de Influência sincronizados.`, metadata: result });
    return NextResponse.json(result);
  } catch (error) { return hubApiError(error, "Falha ao sincronizar o Radar de Influência."); }
}
