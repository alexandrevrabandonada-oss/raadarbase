import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RuntimeAlert } from "@/components/runtime-alert";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import { getPilotDashboardData } from "@/lib/data/pilot-stats";
import { listPriorityPeople } from "@/lib/data/people-priority";
import { getOperationalAlertsAction } from "./actions";
import { DashboardClient } from "./dashboard-client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await requireInternalPageSession("/dashboard");

  let priorityPeople;
  let pilotStats;
  let operationalAlerts;

  try {
    [priorityPeople, pilotStats, operationalAlerts] = await Promise.all([
      listPriorityPeople(),
      getPilotDashboardData(),
      getOperationalAlertsAction(),
    ]);
  } catch (error) {
    return (
      <AppShell>
        <PageHeader title="Hoje no Radar" description="Painel interno de acompanhamento." />
        <RuntimeAlert
          title="Falha ao carregar dados operacionais"
          description={error instanceof Error ? error.message : "Não foi possível carregar a central de comando."}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Painel de Controle"
        title="Hoje no Radar"
        description="Leitura rápida das pessoas, vínculos e ações que precisam de atenção agora."
      />
      <DashboardClient 
        priorityPeople={priorityPeople}
        pilotStats={pilotStats}
        operationalAlerts={operationalAlerts}
      />
    </AppShell>
  );
}
