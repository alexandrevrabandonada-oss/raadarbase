import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RuntimeAlert } from "@/components/runtime-alert";
import { listPriorityPeople } from "@/lib/data/people-priority";
import { listOutreachTasks } from "@/lib/data/outreach";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import { KanbanClient } from "./kanban-client";

export const dynamic = "force-dynamic";

export default async function AbordagemPage() {
  await requireInternalPageSession("/abordagem");

  let outreachTasks;
  let priorityPeople;
  let operators;
  try {
    [outreachTasks, priorityPeople, operators] = await Promise.all([
      listOutreachTasks(), 
      listPriorityPeople(),
      import("./team-actions").then(m => m.getActiveOperators())
    ]);
  } catch (error) {
    return (
      <AppShell>
        <PageHeader title="Quadro de Vínculos" description="Gerencie interações prioritárias e fluxos de atendimento." />
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
        compact
        eyebrow="Jornada Operacional"
        title="Mural de Missões"
        description="Acompanhe cada vínculo como missão cooperativa: preparar, conversar, registrar, encaminhar e concluir."
      />
      <KanbanClient 
        initialTasks={outreachTasks} 
        priorityPeople={priorityPeople} 
        operators={operators}
      />
    </AppShell>
  );
}
