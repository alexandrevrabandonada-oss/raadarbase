import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RuntimeAlert } from "@/components/runtime-alert";
import { getOutreachGoalStats } from "@/lib/data/outreach-goal";
import { listPriorityPeople } from "@/lib/data/people-priority";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import { PeopleClient } from "./people-client";
import { listMessageTemplates } from "@/lib/data/messages";

export const dynamic = "force-dynamic";

export default async function PessoasPage() {
  const session = await requireInternalPageSession("/pessoas");

  let people;
  let operators;
  let outreachGoal;
  let templates = [];
  try {
    const [mainPeople, sentPeople, activeOperators, goalStats, templatesRes] = await Promise.all([
      listPriorityPeople({ statuses: ["novo", "responder"], limit: 1000 }),
      listPriorityPeople({ statuses: ["abordado", "respondeu", "contato_confirmado"], limit: 300 }),
      import("../abordagem/team-actions").then(m => m.getActiveOperators()),
      getOutreachGoalStats(),
      listMessageTemplates(),
    ]);
    const seen = new Set<string>();
    people = [...mainPeople, ...sentPeople].filter((person) => {
      if (seen.has(person.id)) return false;
      seen.add(person.id);
      return true;
    });
    operators = activeOperators;
    outreachGoal = goalStats;
    templates = (templatesRes || []).filter((t) => t.active);
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
        outreachGoal={outreachGoal}
        currentOperatorId={session.internalUser.id}
        templates={templates}
      />
    </AppShell>
  );
}
