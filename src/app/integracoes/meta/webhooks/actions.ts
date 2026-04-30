"use server";

/**
 * Webhook Actions — Server Actions para processamento manual de eventos
 * 
 * Regras:
 * - Apenas admin e operador podem processar/ignorar
 * - comunicacao pode visualizar
 * - Toda ação gera audit_log
 * - Erros são redigidos
 */

import { revalidatePath } from "next/cache";
import { requireRole, getCurrentInternalUser } from "@/lib/authz/roles";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { createIncident } from "@/lib/data/incidents";
import {
  processAllowedWebhookEvent,
  ignoreWebhookEvent,
  markWebhookEventReviewed,
  listWebhookEvents,
  getWebhookEvent,
  getWebhookEventLinks,
  countWebhookEventsByStatus,
  getStaleQuarantineEvents,
  getInvalidSignatureEvents,
} from "@/lib/meta/webhook-processing";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { decideStagingWebhookGoNoGo } from "@/lib/meta/staging-webhook-validation";
import type { AuditAction } from "@/lib/types";
import type { Json } from "@/lib/supabase/database.types";

/**
 * Processa um evento webhook permitido
 * Permissão: admin, operador
 */
export async function processWebhookEventAction(eventId: string) {
  const user = await getCurrentInternalUser();
  
  // Verifica permissão
  if (!user || !["admin", "operador"].includes(user.role)) {
    await writeAuditLog({
      actorId: user?.id ?? null,
      actorEmail: user?.email ?? null,
      action: "authz.access_denied" as AuditAction,
      entityType: "meta_webhook_events",
      entityId: eventId,
      summary: `Tentativa não autorizada de processar webhook: ${user?.email ?? "anônimo"}`,
      metadata: { 
        required_role: "admin|operador",
        actual_role: user?.role ?? null,
      } as Json,
    });
    
    await createIncident({
      kind: "meta.webhook_processing_failed",
      severity: "warning",
      status: "open",
      title: "Tentativa de acesso não autorizado a webhook",
      description: `Usuário ${user?.email ?? "anônimo"} tentou processar evento ${eventId} sem permissão.`,
      related_entity_type: "meta_webhook_events",
      related_entity_id: eventId,
    });
    
    throw new Error("Permissão negada. Apenas admin e operador podem processar eventos.");
  }
  
  try {
    const result = await processAllowedWebhookEvent(
      eventId,
      user.id,
      user.email
    );
    
    revalidatePath("/integracoes/meta/webhooks");
    revalidatePath(`/integracoes/meta/webhooks/${eventId}`);
    
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    
    // Redige possíveis segredos na mensagem de erro
    const sanitizedError = errorMessage
      .replace(/token[=:]\s*[^\s&]+/gi, "token=[REDACTED]")
      .replace(/secret[=:]\s*[^\s&]+/gi, "secret=[REDACTED]");
    
    throw new Error(`Falha ao processar evento: ${sanitizedError}`);
  }
}

/**
 * Ignora um evento webhook
 * Permissão: admin, operador
 */
export async function ignoreWebhookEventAction(eventId: string) {
  const user = await getCurrentInternalUser();
  
  // Verifica permissão
  if (!user || !["admin", "operador"].includes(user.role)) {
    await writeAuditLog({
      actorId: user?.id ?? null,
      actorEmail: user?.email ?? null,
      action: "authz.access_denied" as AuditAction,
      entityType: "meta_webhook_events",
      entityId: eventId,
      summary: `Tentativa não autorizada de ignorar webhook: ${user?.email ?? "anônimo"}`,
      metadata: { 
        required_role: "admin|operador",
        actual_role: user?.role ?? null,
      } as Json,
    });
    
    throw new Error("Permissão negada. Apenas admin e operador podem ignorar eventos.");
  }
  
  await ignoreWebhookEvent(eventId, user.id, user.email);
  
  revalidatePath("/integracoes/meta/webhooks");
  revalidatePath(`/integracoes/meta/webhooks/${eventId}`);
  
  return { success: true };
}

/**
 * Marca um evento como revisado
 * Permissão: admin, operador
 */
export async function markWebhookEventReviewedAction(eventId: string, notes?: string) {
  const user = await getCurrentInternalUser();
  
  // Verifica permissão
  if (!user || !["admin", "operador"].includes(user.role)) {
    await writeAuditLog({
      actorId: user?.id ?? null,
      actorEmail: user?.email ?? null,
      action: "authz.access_denied" as AuditAction,
      entityType: "meta_webhook_events",
      entityId: eventId,
      summary: `Tentativa não autorizada de revisar webhook: ${user?.email ?? "anônimo"}`,
      metadata: { 
        required_role: "admin|operador",
        actual_role: user?.role ?? null,
      } as Json,
    });
    
    throw new Error("Permissão negada. Apenas admin e operador podem revisar eventos.");
  }
  
  await markWebhookEventReviewed(eventId, user.id, user.email, notes);
  
  revalidatePath("/integracoes/meta/webhooks");
  revalidatePath(`/integracoes/meta/webhooks/${eventId}`);
  
  return { success: true };
}

/**
 * Lista eventos webhook
 * Permissão: qualquer usuário interno autenticado
 */
export async function listWebhookEventsAction(options?: {
  status?: "received" | "verified" | "quarantined" | "ignored" | "processed" | "failed";
  limit?: number;
  offset?: number;
}) {
  await requireRole(["admin", "operador", "comunicacao", "leitura"]);
  
  return listWebhookEvents(options);
}

/**
 * Busca um evento webhook pelo ID
 * Permissão: qualquer usuário interno autenticado
 */
export async function getWebhookEventAction(eventId: string) {
  await requireRole(["admin", "operador", "comunicacao", "leitura"]);
  
  const event = await getWebhookEvent(eventId);
  const links = await getWebhookEventLinks(eventId);
  
  return { event, links };
}

/**
 * Obtém estatísticas de eventos webhook
 * Permissão: qualquer usuário interno autenticado
 */
export async function getWebhookStatsAction() {
  await requireRole(["admin", "operador", "comunicacao", "leitura"]);

  const supabase = getSupabaseAdminClient();
  
  const [counts, staleEvents, invalidSignatureEvents, auditsCountRes, incidentsCountRes] = await Promise.all([
    countWebhookEventsByStatus(),
    getStaleQuarantineEvents(),
    getInvalidSignatureEvents(),
    supabase
      .from("audit_logs")
      .select("id", { count: "exact", head: true })
      .or("action.ilike.meta.webhook%,entity_type.eq.meta_webhook_events"),
    supabase
      .from("operational_incidents")
      .select("id", { count: "exact", head: true })
      .or("kind.ilike.%meta.webhook%,related_entity_type.eq.meta_webhook_events"),
  ]);

  const auditLogsCount = auditsCountRes.count ?? 0;
  const incidentCount = incidentsCountRes.count ?? 0;
  const appUrlValidated = Boolean(process.env.APP_URL);
  const signedEventSeen = counts.verified + counts.quarantined + counts.processed > 0;
  const unsignedRejectionSeen = invalidSignatureEvents.length > 0;
  const operatorIgnoredSeen = counts.ignored > 0;
  const operatorProcessedSeen = counts.processed > 0;
  const dryRunExternalExecuted =
    appUrlValidated &&
    (counts.verified + counts.quarantined + counts.ignored + counts.processed + counts.failed > 0 ||
      invalidSignatureEvents.length > 0);

  const goNoGo = decideStagingWebhookGoNoGo({
    appUrlConfigured: appUrlValidated,
    healthOk: true,
    healthSecretsSafe: true,
    dryRunExecuted: dryRunExternalExecuted,
    signedEventSeen,
    unsignedRejectionSeen,
    operatorIgnoredSeen,
    operatorProcessedSeen,
    auditLogsFound: auditLogsCount > 0,
    incidentsFound: incidentCount > 0,
    noDmAutomation: true,
    noAutoContactCreation: true,
    noPoliticalScore: true,
  });
  
  return {
    counts,
    staleCount: staleEvents.length,
    invalidSignatureCount: invalidSignatureEvents.length,
    webhookEnabled: process.env.META_WEBHOOK_ENABLED === "true",
    webhookConfigured: Boolean(process.env.META_APP_SECRET),
    envConfig: {
      metaAppSecret: Boolean(process.env.META_APP_SECRET),
      webhookVerifyToken: Boolean(process.env.META_WEBHOOK_VERIFY_TOKEN),
      metaWebhookEnabled: process.env.META_WEBHOOK_ENABLED === "true",
      supabaseServiceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    },
    externalValidation: {
      appUrlValidated,
      dryRunExternalExecuted,
      signedEventSeen,
      unsignedRejectionSeen,
      operatorIgnoredSeen,
      operatorProcessedSeen,
      auditLogsFound: auditLogsCount > 0,
      incidentsFound: incidentCount > 0,
      auditLogsCount,
      incidentCount,
      decision:
        goNoGo === "GO_STAGING"
          ? ("GO" as const)
          : goNoGo === "NO_GO_STAGING"
            ? ("NO-GO" as const)
            : ("PENDENTE" as const),
      pendingExternal: goNoGo === "PENDING_EXTERNAL_VALIDATION",
    },
  };
}
