"use server";

/**
 * Dashboard Actions — Server Actions para métricas do dashboard
 */

import { countWebhookEventsByStatus, getStaleQuarantineEvents, getInvalidSignatureEvents } from "@/lib/meta/webhook-processing";
import { isWebhookEnabled, isWebhookConfigured } from "@/lib/meta/webhook-security";

/**
 * Obtém estatísticas de webhooks para o dashboard
 */
export async function getWebhookStatsAction() {
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
