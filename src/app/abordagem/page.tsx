import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RuntimeAlert } from "@/components/runtime-alert";
import { listOutreachTasks } from "@/lib/data/outreach";
import { KanbanClient } from "./kanban-client";

export const dynamic = "force-dynamic";

export default async function AbordagemPage() {
  let outreachTasks;
  try {
    outreachTasks = await listOutreachTasks();
  } catch (error) {
    return (
      <AppShell>
        <PageHeader title="Abordagem" description="Fluxo manual de resposta, convite e consentimento." />
        <RuntimeAlert
          title="Falha ao carregar abordagem"
          description={error instanceof Error ? error.message : "Nao foi possivel carregar o quadro de abordagem."}
        />
      </AppShell>
    );
  }
  return (
    <AppShell>
      <PageHeader
        title="Abordagem"
        description="Acompanhe o trabalho manual de resposta, convite e consentimento. Cada contato precisa de contexto e respeito ao pedido da pessoa."
      />
      <KanbanClient initialTasks={outreachTasks} />
    </AppShell>
  );
}
