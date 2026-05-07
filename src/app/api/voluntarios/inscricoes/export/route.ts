import { NextRequest, NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import {
  assertVolunteerApplicationExportAllowed,
  buildVolunteerApplicationExportRows,
  listVolunteerApplicationsForExport,
} from "@/lib/data/volunteer-applications";
import { requireInternalSession } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await requireInternalSession();
    const includeContact = request.nextUrl.searchParams.get("include_contact") === "true";
    assertVolunteerApplicationExportAllowed(session.internalUser.role, includeContact);

    const items = await listVolunteerApplicationsForExport(session.internalUser.role, includeContact);
    const rows = buildVolunteerApplicationExportRows(items, { includeContact });

    await writeAuditLog({
      actorId: session.id,
      actorEmail: session.email,
      action: includeContact ? "volunteer_application.contact_exported" : "volunteer_application.exported",
      entityType: "campaign_volunteer_applications",
      entityId: null,
      summary: includeContact ? "Exportação de inscrições com contato consentido." : "Exportação segura de inscrições sem contato.",
      metadata: { includeContact, count: rows.length },
    });

    return NextResponse.json(rows);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha na exportação.";
    const status = /não autenticado/i.test(message) ? 401 : /exige perfil|acesso negado/i.test(message) ? 403 : 500;
    return NextResponse.json({ error: status === 500 ? "Falha na exportação." : message }, { status });
  }
}
