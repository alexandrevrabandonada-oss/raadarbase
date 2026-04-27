import { notFound } from "next/navigation";
import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RuntimeAlert } from "@/components/runtime-alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/mock-data";
import { getPersonById } from "@/lib/data/people";
import { listInteractions } from "@/lib/data/interactions";
import { getLatestAuditLogForEntity } from "@/lib/data/audit";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import { PersonActions } from "./person-actions";

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
  let latestOutreach;
  try {
    [timeline, latestOutreach] = await Promise.all([
      listInteractions(person.id),
      getLatestAuditLogForEntity("ig_people", person.id),
    ]);
  } catch (error) {
    return (
      <AppShell>
        <PageHeader title={`@${person.username}`} description="Historico de abordagem e consentimento." />
        <RuntimeAlert
          title="Falha ao carregar historico"
          description={error instanceof Error ? error.message : "Nao foi possivel carregar o historico."}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title={`@${person.username}`}
        description={`Última interação em ${formatDateTime(person.lastInteractionAt ?? "")}. Use esta página para registrar histórico manual, notas e consentimento.`}
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Timeline de interações</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {timeline.map((item) => (
              <article key={item.id} className="rounded-md border bg-background p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-bold">{item.type.replace("_", " ")}</p>
                  <p className="text-sm text-muted-foreground">{formatDateTime(item.occurredAt)}</p>
                </div>
                <p className="mt-2 text-sm">{item.text}</p>
                {item.post?.caption ? (
                  <p className="mt-2 rounded-md bg-muted px-3 py-2 text-xs font-medium text-muted-foreground">
                    Post de origem: {item.post.caption}
                  </p>
                ) : null}
              </article>
            ))}
          </CardContent>
        </Card>
        <PersonActions person={person} latestOutreach={latestOutreach?.summary ?? null} />
      </div>
    </AppShell>
  );
}
