import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RuntimeAlert } from "@/components/runtime-alert";
import { listMessageTemplates } from "@/lib/data/messages";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import { MessagesClient } from "./messages-client";

export const dynamic = "force-dynamic";

export default async function MensagensPage() {
  await requireInternalPageSession("/mensagens");

  let messageTemplates;
  try {
    messageTemplates = await listMessageTemplates();
  } catch (error) {
    return (
      <AppShell>
        <PageHeader title="Mensagens-base" description="Modelos manuais para responder e convidar." />
        <RuntimeAlert
          title="Falha ao carregar mensagens"
          description={error instanceof Error ? error.message : "Nao foi possivel carregar os modelos."}
        />
      </AppShell>
    );
  }
  return (
    <AppShell>
      <PageHeader
        title="Mensagens-base"
        description="Modelos para copiar e colar manualmente no Instagram, com variáveis simples e contexto comunitário."
      />
      <MessagesClient initialTemplates={messageTemplates} />
    </AppShell>
  );
}
