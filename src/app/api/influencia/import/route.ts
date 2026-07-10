import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { canManageContacts } from "@/lib/authz/roles";
import { shouldUseMockData } from "@/lib/config";
import { apiError, enforceRateLimit } from "@/lib/influence/api-helpers";
import { importInfluenceProfiles, parseImportContent } from "@/lib/influence/import";
import { requireInternalSession } from "@/lib/supabase/auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const session = await requireInternalSession();
    if (!canManageContacts(session.internalUser.role)) return NextResponse.json({ error: "Importação exige perfil admin ou operador." }, { status: 403 });
    const limited = enforceRateLimit(request, session.id, 10, 60_000);
    if (limited) return limited;
    const contentType = request.headers.get("content-type") ?? "";
    let content: string;
    let format: "csv" | "json";
    let filename: string | null = null;
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");
      if (!(file instanceof File)) return NextResponse.json({ error: "Arquivo é obrigatório." }, { status: 400 });
      filename = file.name;
      format = (String(form.get("format") ?? file.name.split(".").pop()).toLowerCase() === "json" ? "json" : "csv");
      content = await file.text();
    } else {
      const body: unknown = await request.json();
      if (!body || typeof body !== "object") return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
      const value = body as { content?: unknown; format?: unknown; filename?: unknown };
      if (typeof value.content !== "string") return NextResponse.json({ error: "Conteúdo é obrigatório." }, { status: 400 });
      content = value.content;
      format = value.format === "json" ? "json" : "csv";
      filename = typeof value.filename === "string" ? value.filename : null;
    }
    if (shouldUseMockData()) {
      const rows = parseImportContent(content, format);
      return NextResponse.json({ importId: "mock-import", totalRows: rows.length, inserted: rows.length, updated: 0, duplicates: 0, rejected: 0, errors: [] }, { status: 201 });
    }
    const result = await importInfluenceProfiles(content, format, { id: session.id, email: session.email }, filename);
    await writeAuditLog({ actorId: session.id, actorEmail: session.email, action: "influence.imported", entityType: "instagram_imports", entityId: result.importId, summary: `Importação legítima concluída com ${result.inserted} inclusões e ${result.updated} atualizações.`, metadata: result });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return apiError(error, "Falha ao importar perfis de influência.");
  }
}

