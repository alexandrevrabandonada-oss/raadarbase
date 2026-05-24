import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RuntimeAlert } from "@/components/runtime-alert";
import { listPriorityPeople } from "@/lib/data/people-priority";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import { PeopleClient } from "./people-client";

export const dynamic = "force-dynamic";

export default async function PessoasPage() {
  const session = await requireInternalPageSession("/pessoas");

  let people;
  let operators;
  try {
    [people, operators] = await Promise.all([
      listPriorityPeople(),
      import("../abordagem/team-actions").then(m => m.getActiveOperators())
    ]);
  } catch (error) {
    return (
      <AppShell>
        <PageHeader title="Pessoas Prioritárias" description="As interações mais recentes da sua base." />
        <RuntimeAlert
          title="Falha ao carregar pessoas"
          description={error instanceof Error ? error.message : "Nao foi possivel carregar as pessoas."}
        />
      </AppShell>
    );
  }
  
  return (
    <AppShell>
      <PageHeader
        compact
        eyebrow="Mapa de Missões"
        title="Pessoas"
        description="Missões ativas da base, organizadas por urgência, dono e próximo passo."
      />
      <PeopleClient
        priorityPeople={people}
        operators={operators}
        currentOperatorId={session.internalUser.id}
        currentOperatorName={session.internalUser.full_name}
      />
    </AppShell>
  );
}
