import Link from "next/link";
import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RuntimeAlert } from "@/components/runtime-alert";
import { listPriorityPeople } from "@/lib/data/people-priority";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import { PeopleClient } from "./people-client";

export const dynamic = "force-dynamic";

export default async function PessoasPage() {
  await requireInternalPageSession("/pessoas");

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
        <PageHeader title="Pessoas" description="Base interna de interacoes e consentimento." />
        <RuntimeAlert
          title="Falha ao carregar pessoas"
          description={error instanceof Error ? error.message : "Nao foi possivel carregar as pessoas."}
        />
      </AppShell>
    );
  }
  return (
    <AppShell>
      <div className="flex justify-between items-center mb-6">
        <PageHeader
          title="Rotina do Dia"
          description="Acompanhe as pessoas que interagiram recentemente. Nosso objetivo é transformar comentários em conversas humanas e encaminhamentos reais."
        />
        <div className="mt-4 md:mt-0">
          <Link href="/pessoas/importar" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2">
            Importar Pessoas
          </Link>
        </div>
      </div>
      <PeopleClient people={people} priorityPeople={people} operators={operators} />
    </AppShell>
  );
}
