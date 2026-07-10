import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { canRunMetaSync } from "@/lib/authz/roles";
import { shouldUseMockData } from "@/lib/config";
import { apiError, enforceRateLimit } from "@/lib/influence/api-helpers";
import { createAllowedHttpUpdateProvider, enqueueStaleProfileUpdates, processInfluenceUpdateJob } from "@/lib/influence/queue";
import { requireInternalSession } from "@/lib/supabase/auth";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const session = await requireInternalSession();
    if (!canRunMetaSync(session.internalUser.role)) return NextResponse.json({ error: "Atualização exige perfil admin ou operador." }, { status: 403 });
    const limited = enforceRateLimit(request, session.id, 12, 60_000);
    if (limited) return limited;
    const body: unknown = await request.json().catch(() => ({}));
    const input = body && typeof body === "object" ? body as { staleDays?: number; limit?: number; concurrency?: number; processNow?: boolean; jobId?: string } : {};
    if (shouldUseMockData()) return NextResponse.json({ id: "mock-update-job", status: "queued", total_items: 8 }, { status: 202 });
    if (input.processNow && input.jobId) {
      const endpoint = process.env.INFLUENCE_PROFILE_UPDATE_ENDPOINT;
      if (!endpoint) return NextResponse.json({ error: "Fonte de atualização permitida não configurada." }, { status: 409 });
      const job = await processInfluenceUpdateJob(input.jobId, createAllowedHttpUpdateProvider(endpoint, process.env.INFLUENCE_PROFILE_UPDATE_KEY));
      await writeAuditLog({ actorId: session.id, actorEmail: session.email, action: "influence.update_processed", entityType: "instagram_update_jobs", entityId: job.id, summary: `Lote incremental processado com status ${job.status}.`, metadata: { completed: job.completed_items, failed: job.failed_items } });
      return NextResponse.json(job);
    }
    const job = await enqueueStaleProfileUpdates(input, { id: session.id, email: session.email });
    await writeAuditLog({ actorId: session.id, actorEmail: session.email, action: "influence.update_queued", entityType: "instagram_update_jobs", entityId: job.id, summary: `${job.total_items} perfis desatualizados adicionados à fila incremental.`, metadata: { staleBefore: job.stale_before, concurrency: job.concurrency } });
    return NextResponse.json(job, { status: 202 });
  } catch (error) {
    return apiError(error, "Falha ao agendar atualização incremental.");
  }
}

