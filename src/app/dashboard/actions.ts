"use server";

import { countWebhookEventsByStatus, getStaleQuarantineEvents, getInvalidSignatureEvents } from "@/lib/meta/webhook-processing";
import { isWebhookEnabled, isWebhookConfigured } from "@/lib/meta/webhook-security";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { shouldUseMockData } from "@/lib/config";
import { requireRole } from "@/lib/authz/roles";

/**
 * Obtém estatísticas de webhooks para o dashboard
 */
export async function getWebhookStatsAction() {
  await requireRole(["admin", "operador", "comunicacao", "leitura"]);
  const [counts, staleEvents, invalidSignatureEvents] = await Promise.all([
    countWebhookEventsByStatus().catch(() => ({ received: 0, verified: 0, quarantined: 0, ignored: 0, processed: 0, failed: 0 })),
    getStaleQuarantineEvents().catch(() => []),
    getInvalidSignatureEvents().catch(() => []),
  ]);

  return {
    counts,
    staleCount: staleEvents.length,
    invalidSignatureCount: invalidSignatureEvents.length,
    webhookEnabled: isWebhookEnabled(),
    webhookConfigured: isWebhookConfigured(),
  };
}

/**
 * Obtém alertas operacionais para o dashboard
 */
export async function getOperationalAlertsAction() {
  await requireRole(["admin", "operador", "comunicacao", "leitura"]);
  if (shouldUseMockData()) {
    return {
      webhookQuarantineCount: 2,
      missingTemplates: ["Denúncia Urgente"],
    };
  }

  const supabase = getSupabaseAdminClient();
  const [webhookCounts, templates] = await Promise.all([
    countWebhookEventsByStatus().catch(() => ({ quarantined: 0 })),
    supabase.from("message_templates").select("id").eq("active", true),
  ]);

  return {
    webhookQuarantineCount: webhookCounts.quarantined || 0,
    missingTemplates: (templates.data?.length ?? 0) === 0 ? ["Nenhum template ativo"] : [],
  };
}
