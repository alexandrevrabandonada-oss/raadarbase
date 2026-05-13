import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RuntimeAlert } from "@/components/runtime-alert";
import { listPriorityPeople } from "@/lib/data/people-priority";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import { QueueClient } from "./queue-client";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Minha Jornada | Modo Operador",
  description: "Siga sua trilha de missões diárias com foco, clareza e registro ético.",
};

export const dynamic = "force-dynamic";

export default async function MinhaFilaPage() {
  const session = await requireInternalPageSession("/minha-fila");

  let priorityPeople;
  try {
    priorityPeople = await listPriorityPeople();
  } catch (error) {
    return (
      <AppShell>
        <PageHeader title="Minha Jornada" description="Trabalhe uma missão por vez, com ritmo claro." />
        <RuntimeAlert
          title="Erro ao carregar fila"
          description={error instanceof Error ? error.message : "Não foi possível carregar suas tarefas prioritárias."}
        />
      </AppShell>
    );
  }

  // Filtrar pela fila do operador logado
  const myQueue = (priorityPeople || []).filter(
    person => person.responsibleId === session.id
  );

  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const oldPendencies = myQueue.filter(person => 
    person.isPendingResponse && 
    person.contact?.last_contacted_at && 
    new Date(person.contact.last_contacted_at) < threeDaysAgo
  );

  const activeQueue = myQueue.filter(person => 
    !oldPendencies.some(op => op.id === person.id)
  );

  return (
    <AppShell>
      <PageHeader 
        compact
        eyebrow="Modo Operador"
        title="Minha Jornada" 
        description="Seu hub de jornada: uma missão por vez, com próximo passo claro e ritmo sustentável." 
      />
      
      <QueueClient 
        initialQueue={activeQueue} 
        oldPendencies={oldPendencies}
        operatorName={session.internalUser.full_name || session.email || "Operador"} 
      />
    </AppShell>
  );
}
