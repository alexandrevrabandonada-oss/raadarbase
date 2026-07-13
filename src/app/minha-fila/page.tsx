import type { Metadata } from "next";
import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RuntimeAlert } from "@/components/runtime-alert";
import { listPriorityPeople } from "@/lib/data/people-priority";
import { listMessageTemplates } from "@/lib/data/messages";
import { isPriorityPersonAlreadySent } from "@/lib/outreach-status";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import { shouldUseMockData } from "@/lib/config";
import { RapidQueueClient } from "./rapid-queue-client";

export const metadata: Metadata = {
  title: "Minha Fila | Radar de Base",
  description: "Envio individual manual com retorno automático à próxima pessoa.",
};

export const dynamic = "force-dynamic";

export default async function MinhaFilaPage() {
  const session = await requireInternalPageSession("/minha-fila");
  let queue = null;
  let templates = null;
  let loadError: unknown = null;
  try {
    const [people, templateRows] = await Promise.all([
      shouldUseMockData()
        ? listPriorityPeople()
        : listPriorityPeople({ responsibleId: session.internalUser.id, limit: 1000 }),
      listMessageTemplates(),
    ]);
    queue = people.filter((person) =>
      person.status !== "nao_abordar" &&
      !person.doNotContactReason &&
      !person.hasReferral &&
      !isPriorityPersonAlreadySent(person),
    );

    templates = templateRows ?? [];
  } catch (error) {
    loadError = error;
  }

  if (loadError || !queue || !templates) {
    return <AppShell><PageHeader compact title="Minha Fila" description="Envio individual manual." /><RuntimeAlert title="Não foi possível carregar a fila" description={loadError instanceof Error ? loadError.message : "Tente novamente."} /></AppShell>;
  }

  return <AppShell><PageHeader compact eyebrow="Modo operador" title="Minha Fila" description="Copie, envie manualmente no Instagram e volte. A fila avança sozinha." /><RapidQueueClient initialQueue={queue} templates={templates.filter((template) => template.active)} /></AppShell>;
}
