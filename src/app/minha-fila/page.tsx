import type { Metadata } from "next";
import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RuntimeAlert } from "@/components/runtime-alert";
import { listPriorityPeople } from "@/lib/data/people-priority";
import { listMessageTemplates } from "@/lib/data/messages";
import { getOutreachGoalStats, type OutreachGoalStats } from "@/lib/data/outreach-goal";
import { isPriorityPersonAlreadySent } from "@/lib/outreach-status";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import { RapidQueueClient } from "./rapid-queue-client";

export const metadata: Metadata = {
  title: "Minha Fila | Radar de Base",
  description: "Envio individual manual com retorno automático à próxima pessoa.",
};

export const dynamic = "force-dynamic";

export default async function MinhaFilaPage() {
  await requireInternalPageSession("/minha-fila");
  let queue = null;
  let templates = null;
  let outreachGoal: OutreachGoalStats | null = null;
  let loadError: unknown = null;
  try {
    const [people, templateRows, goalStats] = await Promise.all([
      listPriorityPeople({ statuses: ["novo", "responder"], limit: 1000 }),
      listMessageTemplates(),
      getOutreachGoalStats(),
    ]);
    queue = people.filter((person) =>
      person.status !== "nao_abordar" &&
      !person.doNotContactReason &&
      !person.hasReferral &&
      !isPriorityPersonAlreadySent(person),
    );

    templates = templateRows ?? [];
    outreachGoal = goalStats;
  } catch (error) {
    loadError = error;
  }

  if (loadError || !queue || !templates || !outreachGoal) {
    return <AppShell><PageHeader compact title="Minha Fila" description="Envio individual manual." /><RuntimeAlert title="Não foi possível carregar a fila" description={loadError instanceof Error ? loadError.message : "Tente novamente."} /></AppShell>;
  }

  return <AppShell><PageHeader compact eyebrow="Modo operador" title="Minha Fila" description="Copie, envie manualmente no Instagram e volte. A fila avança sozinha." /><RapidQueueClient initialQueue={queue} templates={templates.filter((template) => template.active)} outreachGoal={outreachGoal} /></AppShell>;
}
