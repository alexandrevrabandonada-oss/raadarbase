import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RuntimeAlert } from "@/components/runtime-alert";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/mock-data";
import { getMetaSyncRunById, listAuditLogsForSync, listRetriesForSync } from "@/lib/data/operation";
import { isSyncRunStuck } from "@/lib/operation/stuck-runs";
import { getInternalSession } from "@/lib/supabase/auth";
import { SyncActionsClient } from "./sync-actions-client";

export const dynamic = "force-dynamic";

export default async function SyncDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getInternalSession();
  if (!user) redirect(`/login?next=/operacao/sync/${id}`);

  let run;
  let auditLogs;
  let retries;
  try {
    [run, auditLogs, retries] = await Promise.all([
      getMetaSyncRunById(id),
      listAuditLogsForSync(id),
      listRetriesForSync(id),
    ]);
  } catch (error) {
    return (
      <AppShell>
        <PageHeader title="Detalhe da sincronização" description="Registro operacional da rotina Meta." />
        <RuntimeAlert
          title="Falha ao carregar sincronização"
          description={error instanceof Error ? error.message : "Não foi possível carregar o detalhe."}
        />
      </AppShell>
    );
  }

  if (!run) notFound();
  const stuck = isSyncRunStuck(run);
  const metadata = run.metadata && typeof run.metadata === "object" && !Array.isArray(run.metadata) ? run.metadata : {};
  const retryOf = "retry_of" in metadata && typeof metadata.retry_of === "string" ? metadata.retry_of : null;

  return (
    <AppShell>
      <PageHeader title="Detalhe da sincronização" description={run.id} />
      {stuck ? (
        <Alert className="mb-6 border-yellow-500/50 bg-yellow-50">
          <AlertTitle>Sincronização presa</AlertTitle>
          <AlertDescription>
            Esta run está em andamento há mais de 15 minutos e ainda não possui `finished_at`.
          </AlertDescription>
        </Alert>
      ) : null}
      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <Card>
          <CardHeader>
            <CardTitle>Execução</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Info label="Tipo" value={run.kind} />
            <Info label="Status" value={<Badge>{run.status}</Badge>} />
            <Info label="Início" value={formatDateTime(run.started_at)} />
            <Info label="Fim" value={run.finished_at ? formatDateTime(run.finished_at) : "Em andamento"} />
            <Info label="Ator interno" value={run.actor_email ?? "Sem ator"} />
            <Info label="Inseridos" value={String(run.inserted_count)} />
            <Info label="Atualizados" value={String(run.updated_count)} />
            <Info label="Ignorados" value={String(run.skipped_count)} />
            <div className="sm:col-span-2">
              <Info label="Último erro redigido" value={run.error_message ?? "Sem erro"} />
            </div>
            {retryOf ? (
              <div className="sm:col-span-2">
                <Info
                  label="Run original"
                  value={<Link className="underline" href={`/operacao/sync/${retryOf}`}>{retryOf}</Link>}
                />
              </div>
            ) : null}
            <div className="sm:col-span-2">
              <SyncActionsClient runId={run.id} canMarkFailed={run.status === "started"} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="max-h-96 overflow-auto rounded-md bg-zinc-950 p-4 text-xs text-zinc-50">
              {JSON.stringify(run.metadata, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Histórico de reprocessamentos</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {retries.map((retry) => (
            <div key={retry.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-background p-3">
              <div>
                <p className="font-semibold">{retry.kind}</p>
                <p className="text-sm text-muted-foreground">{retry.status} em {formatDateTime(retry.started_at)}</p>
              </div>
              <Button variant="outline" size="sm" nativeButton={false} render={<Link href={`/operacao/sync/${retry.id}`} />}>
                Abrir retry
              </Button>
            </div>
          ))}
          {retries.length === 0 ? (
            <p className="rounded-md border bg-background p-4 text-sm text-muted-foreground">
              Nenhum reprocessamento relacionado.
            </p>
          ) : null}
        </CardContent>
      </Card>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Audit logs relacionados</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {auditLogs.map((log) => (
            <div key={log.id} className="rounded-md border bg-background p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">{log.action}</p>
                <p className="text-sm text-muted-foreground">{formatDateTime(log.created_at)}</p>
              </div>
              <p className="mt-1 text-sm">{log.summary}</p>
              <p className="mt-1 text-xs text-muted-foreground">{log.actor_email ?? "Sem ator"}</p>
            </div>
          ))}
          {auditLogs.length === 0 ? (
            <p className="rounded-md border bg-background p-4 text-sm text-muted-foreground">
              Nenhum audit_log relacionado encontrado.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md border bg-background p-3">
      <p className="text-sm font-semibold text-muted-foreground">{label}</p>
      <div className="mt-1 break-all text-sm font-bold">{value}</div>
    </div>
  );
}
