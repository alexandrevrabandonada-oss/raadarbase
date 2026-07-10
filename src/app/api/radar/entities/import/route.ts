import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { canManageContacts } from "@/lib/authz/roles";
import { requireInternalSession } from "@/lib/supabase/auth";
import { enforceHubRateLimit, hubApiError } from "@/lib/radar-hub/api";
import { importRadarEntities } from "@/lib/radar-hub/service";

export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  try {
    const session = await requireInternalSession();
    if (!canManageContacts(session.internalUser.role)) return NextResponse.json({ error: "Importação exige perfil admin ou operador." }, { status: 403 });
    const limited = enforceHubRateLimit(request, session.id, 10, 60_000); if (limited) return limited;
    const contentType = request.headers.get("content-type") ?? "";
    let input: unknown; let format: "csv" | "json" | "manual"; let filename: string | null = null;
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData(); const file = form.get("file");
      if (!(file instanceof File)) return NextResponse.json({ error: "Arquivo obrigatório." }, { status: 400 });
      filename = file.name; format = file.name.toLowerCase().endsWith(".json") ? "json" : "csv"; input = await file.text();
    } else {
      const body: unknown = await request.json(); if (!body || typeof body !== "object") return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
      const value = body as { format?: unknown; content?: unknown; records?: unknown; filename?: unknown };
      format = value.format === "csv" ? "csv" : value.format === "json" ? "json" : "manual";
      input = format === "manual" ? value.records : value.content; filename = typeof value.filename === "string" ? value.filename : null;
    }
    const result = await importRadarEntities(input, format, { id: session.id, email: session.email }, filename);
    await writeAuditLog({ actorId: session.id, actorEmail: session.email, action: "radar_hub.imported", entityType: "radar_enrichment_jobs", entityId: result.jobId, summary: `${result.inserted} entidades criadas, ${result.updated} atualizadas e ${result.mergeSuggestions} sugestões de merge.`, metadata: result });
    return NextResponse.json(result, { status: 201 });
  } catch (error) { return hubApiError(error, "Falha ao importar entidades."); }
}

