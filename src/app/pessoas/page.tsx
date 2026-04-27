import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RuntimeAlert } from "@/components/runtime-alert";
import { listPeople } from "@/lib/data/people";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import { PeopleClient } from "./people-client";

export const dynamic = "force-dynamic";

export default async function PessoasPage() {
  await requireInternalPageSession("/pessoas");

  let people;
  try {
    people = await listPeople();
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
      <PageHeader
        title="Pessoas"
        description="Organize quem comentou, respondeu stories ou chamou atenção para alguma demanda. Sem pontuação política, sem perfil psicológico."
      />
      <PeopleClient people={people} />
    </AppShell>
  );
}
