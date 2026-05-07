import { NextResponse } from "next/server";
import { requireInternalSession } from "@/lib/supabase/auth";
import { requireRole } from "@/lib/authz/roles";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { getNeighborhoodListenExportRows, renderNeighborhoodListenExportCsv } from "@/lib/data/neighborhood-listening";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await requireInternalSession();
    await requireRole(["admin", "operador"]);

    const rows = await getNeighborhoodListenExportRows();
    await writeAuditLog({
      actorId: session.id,
      actorEmail: session.email,
      action: "neighborhood_listen.exported",
      entityType: "bairro_escuta_submissions",
      entityId: null,
      summary: `Exportação agregada da escuta territorial gerada com ${rows.length} linhas.`,
      metadata: { count: rows.length },
    });

    return new NextResponse(renderNeighborhoodListenExportCsv(rows), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="escuta-bairro-agregada.csv"',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao exportar escuta." }, { status: 500 });
  }
}
