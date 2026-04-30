/**
 * Webhooks List Page
 * 
 * Lista todos os eventos webhook recebidos com filtros por status.
 * Mostra eventos em quarentena, processados, falhos, etc.
 */

import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import { getWebhookStatsAction, listWebhookEventsAction } from "./actions";
import { WebhooksListClient } from "./webhooks-list-client";

export const dynamic = "force-dynamic";

export default async function WebhooksPage() {
  await requireInternalPageSession("/integracoes/meta/webhooks");

  const [stats, recentEvents] = await Promise.all([
    getWebhookStatsAction().catch(() => ({
      counts: { received: 0, verified: 0, quarantined: 0, ignored: 0, processed: 0, failed: 0 },
      staleCount: 0,
      invalidSignatureCount: 0,
      webhookEnabled: false,
      webhookConfigured: false,
    })),
    listWebhookEventsAction({ limit: 50 }).catch(() => []),
  ]);

  return (
    <AppShell>
      <PageHeader
        title="Webhooks Meta"
        description="Recepcao passiva e segura de eventos Meta/Instagram com quarentena, revisao humana, validacao externa e decisao go/no-go de staging."
      />
      <WebhooksListClient
        stats={stats}
        initialEvents={recentEvents}
      />
    </AppShell>
  );
}
