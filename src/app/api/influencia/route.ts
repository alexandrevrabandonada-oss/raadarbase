import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { requireInternalSession } from "@/lib/supabase/auth";
import { apiError, enforceRateLimit, parseInfluenceFilters } from "@/lib/influence/api-helpers";
import { listInfluenceProfiles } from "@/lib/influence/data";
import { profilesToCsv, profilesToExcelXml } from "@/lib/influence/export";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await requireInternalSession();
    const limited = enforceRateLimit(request, session.id, 120, 60_000);
    if (limited) return limited;
    const format = request.nextUrl.searchParams.get("format");
    const filters = parseInfluenceFilters(request.nextUrl.searchParams);
    if (format === "csv" || format === "excel" || format === "json") {
      const data = await listInfluenceProfiles({ ...filters, page: 1, pageSize: 100 });
      await writeAuditLog({ actorId: session.id, actorEmail: session.email, action: "influence.exported", entityType: "instagram_profiles", entityId: null, summary: `Exportação ${format} do Radar de Influência gerada.`, metadata: { count: data.items.length, filters } });
      if (format === "json") return NextResponse.json({ exportedAt: new Date().toISOString(), total: data.total, profiles: data.items }, { headers: { "Content-Disposition": 'attachment; filename="radar-influencia.json"' } });
      const isExcel = format === "excel";
      return new NextResponse(isExcel ? profilesToExcelXml(data.items) : profilesToCsv(data.items), {
        headers: {
          "Content-Type": isExcel ? "application/vnd.ms-excel; charset=utf-8" : "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="radar-influencia.${isExcel ? "xls" : "csv"}"`,
          "X-Export-Scope": "current-page-max-100",
        },
      });
    }
    return NextResponse.json(await listInfluenceProfiles(filters));
  } catch (error) {
    return apiError(error, "Falha ao consultar perfis de influência.");
  }
}

