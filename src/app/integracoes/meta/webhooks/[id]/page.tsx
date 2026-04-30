/**
 * Webhook Event Detail Page
 * 
 * Mostra detalhes de um evento webhook específico,
 * permite revisar, processar ou ignorar o evento.
 */

import { notFound } from "next/navigation";
import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import { getWebhookEventAction } from "../actions";
import { WebhookDetailClient } from "./webhook-detail-client";

export const dynamic = "force-dynamic";

interface WebhookDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function WebhookDetailPage({ params }: WebhookDetailPageProps) {
  await requireInternalPageSession("/integracoes/meta/webhooks");
  
  const { id } = await params;

  const { event, links } = await getWebhookEventAction(id).catch(() => ({
    event: null,
    links: [],
  }));

  if (!event) {
    notFound();
  }

  return (
    <AppShell>
      <PageHeader
        title="Detalhes do Evento Webhook"
        description={`Evento ${event.id.slice(0, 8)}... - ${event.object_type}`}
      />
      <WebhookDetailClient
        event={event}
        links={links}
      />
    </AppShell>
  );
}
