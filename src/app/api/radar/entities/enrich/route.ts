import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { canRunMetaSync } from "@/lib/authz/roles";
import { requireInternalSession } from "@/lib/supabase/auth";
import { enforceHubRateLimit, hubApiError, UUID_PATTERN } from "@/lib/radar-hub/api";
import { createEnrichmentJob } from "@/lib/radar-hub/service";

export async function POST(request: NextRequest) {
  try {
    const session = await requireInternalSession(); if (!canRunMetaSync(session.internalUser.role)) return NextResponse.json({ error: "Enriquecimento exige perfil admin ou operador." }, { status: 403 });
    const limited = enforceHubRateLimit(request, session.id, 12, 60_000); if (limited) return limited;
    const body: unknown = await request.json(); if (!body || typeof body !== "object") return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
    const value = body as { entityIds?: unknown; sourceTypes?: unknown; mode?: unknown; processNow?: unknown };
    const entityIds = Array.isArray(value.entityIds) ? value.entityIds.filter((id): id is string => typeof id === "string" && UUID_PATTERN.test(id)) : [];
    const sourceTypes = Array.isArray(value.sourceTypes) ? value.sourceTypes.filter((source): source is string => typeof source === "string") : [];
    const mode = value.mode === "configured" || value.mode === "manual_review" ? value.mode : "safe";
    const job = await createEnrichmentJob({ entityIds, sourceTypes, mode, processNow: value.processNow === true }, { id: session.id, email: session.email });
    await writeAuditLog({ actorId: session.id, actorEmail: session.email, action: value.processNow === true ? "radar_hub.enrichment_processed" : "radar_hub.enrichment_queued", entityType: "radar_enrichment_jobs", entityId: job.id, summary: `Enriquecimento ${mode} ${value.processNow === true ? "processado" : "agendado"}.`, metadata: { entityCount: entityIds.length, sourceTypes, mode } });
    return NextResponse.json(job, { status: value.processNow === true ? 200 : 202 });
  } catch (error) { return hubApiError(error, "Falha ao criar enriquecimento."); }
}

