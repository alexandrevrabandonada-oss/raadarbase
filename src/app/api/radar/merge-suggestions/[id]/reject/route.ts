import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { canManageContacts } from "@/lib/authz/roles";
import { enforceHubRateLimit, hubApiError, UUID_PATTERN } from "@/lib/radar-hub/api";
import { reviewMergeSuggestion } from "@/lib/radar-hub/service";
import { requireInternalSession } from "@/lib/supabase/auth";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireInternalSession();
    if (!canManageContacts(session.internalUser.role)) return NextResponse.json({ error: "Revisão de identidade exige perfil admin ou operador." }, { status: 403 });
    const limited = enforceHubRateLimit(request, session.id, 30, 60_000); if (limited) return limited;
    const { id } = await context.params;
    if (!UUID_PATTERN.test(id)) return NextResponse.json({ error: "Sugestão inválida." }, { status: 400 });
    const result = await reviewMergeSuggestion(id, "rejected", { id: session.id, email: session.email });
    await writeAuditLog({ actorId: session.id, actorEmail: session.email, action: "radar_hub.merge_rejected", entityType: "radar_merge_suggestions", entityId: id, summary: "Equivalência rejeitada por revisão humana.", metadata: result });
    return NextResponse.json(result);
  } catch (error) { return hubApiError(error, "Falha ao rejeitar sugestão."); }
}
