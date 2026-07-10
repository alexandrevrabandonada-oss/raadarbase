import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { canManageContacts } from "@/lib/authz/roles";
import { enforceHubRateLimit, hubApiError, UUID_PATTERN } from "@/lib/radar-hub/api";
import { listRadarRelationships } from "@/lib/radar-hub/data";
import { createRadarRelationship } from "@/lib/radar-hub/service";
import { RADAR_RELATIONSHIP_PREDICATES, type RadarRelationshipPredicate } from "@/lib/radar-hub/types";
import { requireInternalSession } from "@/lib/supabase/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await requireInternalSession();
    const limited = enforceHubRateLimit(request, session.id, 120, 60_000);
    if (limited) return limited;
    const params = request.nextUrl.searchParams;
    const entityId = params.get("entityId") ?? undefined;
    if (entityId && !UUID_PATTERN.test(entityId)) return NextResponse.json({ error: "Entidade inválida." }, { status: 400 });
    const depth = Number(params.get("depth") ?? 1);
    const result = await listRadarRelationships({
      entityId,
      predicate: params.get("predicate") ?? undefined,
      category: params.get("category") ?? undefined,
      city: params.get("city") ?? undefined,
      depth: Number.isFinite(depth) ? depth : 1,
    });
    return NextResponse.json(result);
  } catch (error) {
    return hubApiError(error, "Falha ao consultar relações.");
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireInternalSession();
    if (!canManageContacts(session.internalUser.role)) return NextResponse.json({ error: "Criação de relações exige perfil admin ou operador." }, { status: 403 });
    const limited = enforceHubRateLimit(request, session.id, 30, 60_000);
    if (limited) return limited;
    const body: unknown = await request.json();
    if (!body || typeof body !== "object") return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
    const value = body as Record<string, unknown>;
    if (typeof value.subjectEntityId !== "string" || !UUID_PATTERN.test(value.subjectEntityId) || typeof value.objectEntityId !== "string" || !UUID_PATTERN.test(value.objectEntityId)) {
      return NextResponse.json({ error: "Entidades inválidas." }, { status: 400 });
    }
    if (typeof value.predicate !== "string" || !RADAR_RELATIONSHIP_PREDICATES.includes(value.predicate as RadarRelationshipPredicate)) return NextResponse.json({ error: "Relação inválida." }, { status: 400 });
    const confidence = Number(value.confidence);
    if (!Number.isFinite(confidence)) return NextResponse.json({ error: "Confiança inválida." }, { status: 400 });
    const relationship = await createRadarRelationship({
      subjectEntityId: value.subjectEntityId,
      objectEntityId: value.objectEntityId,
      predicate: value.predicate as RadarRelationshipPredicate,
      label: typeof value.label === "string" ? value.label : null,
      confidence,
      evidenceId: typeof value.evidenceId === "string" && UUID_PATTERN.test(value.evidenceId) ? value.evidenceId : null,
    });
    await writeAuditLog({ actorId: session.id, actorEmail: session.email, action: "radar_hub.relationship_created", entityType: "radar_entity_relationships", entityId: relationship.id, summary: `Relação ${value.predicate} criada.`, metadata: relationship });
    return NextResponse.json(relationship, { status: 201 });
  } catch (error) {
    return hubApiError(error, "Falha ao criar relação.");
  }
}
