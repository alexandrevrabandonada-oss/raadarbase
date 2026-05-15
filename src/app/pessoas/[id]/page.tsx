import { notFound } from "next/navigation";
import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RuntimeAlert } from "@/components/runtime-alert";
import { getPersonById } from "@/lib/data/people";
import { listInteractions } from "@/lib/data/interactions";
import { listAuditLogsForEntity } from "@/lib/data/audit";
import { listOutreachTasksForPerson } from "@/lib/data/outreach";
import { listMessageTemplates } from "@/lib/data/messages";
import { listFieldAgendaEvents } from "@/lib/data/field-agenda";
import { listPersonReferralsForPerson } from "@/lib/data/referrals";
import { buildPersonOperationalProfile } from "@/lib/data/person-profile";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import { PersonActions } from "./person-actions";
import { RadarPageHeader } from "@/components/radar/radar-page-header";
import { OperationalAlert } from "@/components/radar/operational-alert";


export const dynamic = "force-dynamic";

export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireInternalPageSession(`/pessoas/${id}`);

  let person;
  try {
    person = await getPersonById(id);
  } catch (error) {
    return (
      <AppShell>
        <PageHeader title="Pessoa" description="Historico de abordagem e consentimento." />
        <RuntimeAlert
          title="Falha ao carregar pessoa"
          description={error instanceof Error ? error.message : "Nao foi possivel carregar a pessoa."}
        />
      </AppShell>
    );
  }

  if (!person) {
    notFound();
  }

  let timeline;
  let tasks;
  let templates;
  let auditLogs;
  let events;
  let referrals;
  try {
    [timeline, tasks, templates, auditLogs, events, referrals] = await Promise.all([
      listInteractions(person.id),
      listOutreachTasksForPerson(person.id),
      listMessageTemplates(),
      listAuditLogsForEntity("ig_people", person.id),
      listFieldAgendaEvents({ status: "planned" }),
      listPersonReferralsForPerson(person.id),
    ]);
  } catch (error) {
    return (
      <AppShell>
        <RadarPageHeader title="Pessoa" description="Historico de abordagem e consentimento." />
        <div className="p-8">
          <OperationalAlert
            type="webhook_quarentena" // Proxy for error/info
            message={error instanceof Error ? error.message : "Nao foi possivel carregar o historico."}
          />
        </div>
      </AppShell>

    );
  }

  return (
    <AppShell>
      <RadarPageHeader
        eyebrow="Ficha de Vínculo"
        title={person.displayName ? `${person.displayName} (@${person.username})` : `@${person.username}`}
        description="Revise o histórico, mande a DM manual e registre o encaminhamento se houver interesse."
        compact
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <PersonActions
          person={person}
          profile={buildPersonOperationalProfile(person, timeline, tasks, templates, auditLogs)}
          availableEvents={events}
          referrals={referrals}
        />
      </div>
    </AppShell>
  );
}
