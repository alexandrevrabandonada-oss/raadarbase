import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { requireInternalSession } from "@/lib/supabase/auth";
import { enforceHubRateLimit, hubApiError } from "@/lib/radar-hub/api";
import { getRadarEntityDetail, listRadarEntities, listRadarRelationships, parseRadarEntityFilters } from "@/lib/radar-hub/data";
import { entityExportRows, evidenceExportRows, relationshipExportRows, rowsToCsv, rowsToExcelXml } from "@/lib/radar-hub/export";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await requireInternalSession();
    const limited = enforceHubRateLimit(request, session.id, 120, 60_000); if (limited) return limited;
    const filters = parseRadarEntityFilters(request.nextUrl.searchParams);
    const format = request.nextUrl.searchParams.get("format");
    const dataset = request.nextUrl.searchParams.get("dataset") ?? "entities";
    if (!format) return NextResponse.json(await listRadarEntities(filters));
    let rows;
    if (dataset === "relationships") rows = relationshipExportRows((await listRadarRelationships({ entityId: request.nextUrl.searchParams.get("entityId") ?? undefined, depth: 1 })).items);
    else if (dataset === "evidence") {
      const entityId = request.nextUrl.searchParams.get("entityId");
      if (!entityId) return NextResponse.json({ error: "entityId é obrigatório para exportar evidências." }, { status: 400 });
      rows = evidenceExportRows((await getRadarEntityDetail(entityId))?.evidence ?? []);
    } else rows = entityExportRows((await listRadarEntities({ ...filters, page: 1, pageSize: 100 })).items);
    await writeAuditLog({ actorId: session.id, actorEmail: session.email, action: "radar_hub.exported", entityType: `radar_${dataset}`, entityId: request.nextUrl.searchParams.get("entityId"), summary: `Exportação ${format} de ${dataset} gerada.`, metadata: { count: rows.length, dataset } });
    if (format === "json") return NextResponse.json({ exportedAt: new Date().toISOString(), dataset, rows }, { headers: { "Content-Disposition": `attachment; filename="radar-${dataset}.json"` } });
    const excel = format === "excel";
    return new NextResponse(excel ? rowsToExcelXml(rows, "Inteligencia") : rowsToCsv(rows), { headers: { "Content-Type": excel ? "application/vnd.ms-excel; charset=utf-8" : "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="radar-${dataset}.${excel ? "xls" : "csv"}"` } });
  } catch (error) { return hubApiError(error, "Falha ao consultar entidades do Radar."); }
}

