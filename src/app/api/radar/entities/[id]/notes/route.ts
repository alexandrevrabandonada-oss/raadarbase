import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { canManageContacts } from "@/lib/authz/roles";
import { enforceHubRateLimit, hubApiError, UUID_PATTERN } from "@/lib/radar-hub/api";
import { addRadarEntityNote } from "@/lib/radar-hub/service";
import { requireInternalSession } from "@/lib/supabase/auth";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireInternalSession();
    if (!canManageContacts(session.internalUser.role)) return NextResponse.json({ error: "Observações exigem perfil admin ou operador." }, { status: 403 });
    const limited = enforceHubRateLimit(request, session.id, 30, 60_000); if (limited) return limited;
    const { id } = await params;
    if (!UUID_PATTERN.test(id)) return NextResponse.json({ error: "Entidade inválida." }, { status: 400 });
    const body: unknown = await request.json();
    const noteBody = body && typeof body === "object" && "body" in body && typeof body.body === "string" ? body.body : "";
    const note = await addRadarEntityNote(id, noteBody, { id: session.id, email: session.email });
    await writeAuditLog({ actorId: session.id, actorEmail: session.email, action: "radar_hub.note_created", entityType: "radar_entity_notes", entityId: String(note.id), summary: "Observação adicionada à entidade.", metadata: { radarEntityId: id } });
    return NextResponse.json(note, { status: 201 });
  } catch (error) { return hubApiError(error, "Falha ao registrar observação."); }
}
