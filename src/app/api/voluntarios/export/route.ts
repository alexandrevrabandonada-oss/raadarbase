import { NextRequest, NextResponse } from "next/server";
import { requireInternalSession } from "@/lib/supabase/auth";
import { buildVolunteerExportRows, assertVolunteerExportAllowed, listVolunteersForExport } from "@/lib/data/volunteers";
import { writeAuditLog } from "@/lib/audit/write-audit-log";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await requireInternalSession();
    const includeContact = request.nextUrl.searchParams.get("include_contact") === "true";

    assertVolunteerExportAllowed(session.internalUser.role, includeContact);

    const exportItems = await listVolunteersForExport({ includeContact });
    const rows = buildVolunteerExportRows(exportItems, { includeContact });

    await writeAuditLog({
      actorId: session.id,
      actorEmail: session.email,
      action: includeContact ? "volunteer.contact_exported" : "volunteer.exported",
      entityType: "campaign_volunteers",
      entityId: null,
      summary: includeContact ? "Exportação de voluntários com contato consentido." : "Exportação segura de voluntários sem contato.",
      metadata: { includeContact, count: rows.length },
    });

    return NextResponse.json(rows);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha na exportação.";
    const status = /não autenticado/i.test(message) ? 401 : /exige perfil|acesso negado/i.test(message) ? 403 : 500;
    return NextResponse.json({ error: status === 500 ? "Falha na exportação." : message }, { status });
  }
}
