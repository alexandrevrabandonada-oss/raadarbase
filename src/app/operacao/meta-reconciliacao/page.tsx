import Link from "next/link";
import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RuntimeAlert } from "@/components/runtime-alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getMetaReconciliationSummary } from "@/lib/data/meta-reconciliation";
import {
  compareLatestEvidenceSnapshots,
  countMetaReconciliationEvidence,
  getEvidenceDelta,
  getMetaReconciliationEvidenceHistory,
  type MetaReconciliationEvidenceDelta,
  type MetaReconciliationEvidenceRow,
} from "@/lib/data/meta-reconciliation-evidence";
import { formatDateTime } from "@/lib/mock-data";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import { canRunMetaSync } from "@/lib/authz/roles";
import { generateMetaReconciliationEvidenceAction } from "./actions";

export const dynamic = "force-dynamic";

function statusVariant(status: string) {
  if (status === "success") return "secondary";
  if (status === "error") return "destructive";
  return "outline";
}

function formatDuration(startedAt: string, finishedAt: string | null) {
  if (!finishedAt) return "Em andamento";
  const started = Date.parse(startedAt);
  const finished = Date.parse(finishedAt);
  if (!Number.isFinite(started) || !Number.isFinite(finished) || finished < started) return "-";
  const seconds = Math.round((finished - started) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}m ${rest}s`;
}

function errorPreview(message: string | null) {
  if (!message) return "-";
  return message.length > 120 ? `${message.slice(0, 117)}...` : message;
}

function evidenceStatusVariant(status: string) {
  if (status === "ok") return "secondary";
  if (status === "blocked") return "destructive";
  return "outline";
}

function shortHash(hash: string) {
  return hash.length > 14 ? `${hash.slice(0, 14)}…` : hash;
}

function formatDelta(delta: MetaReconciliationEvidenceDelta | null) {
  if (!delta) return "—";
  const parts = [
    `+${delta.posts_count} posts`,
    `+${delta.interactions_count} interações`,
    `+${delta.people_count} pessoas`,
    `+${delta.meta_sync_runs_count} runs`,
  ];
  return parts.join(" | ");
}

export default async function MetaReconciliationPage() {
  const session = await requireInternalPageSession("/operacao/meta-reconciliacao");

  let summary;
  let evidenceHistory;
  let evidenceCount = 0;
  let latestEvidence: MetaReconciliationEvidenceRow | null = null;
  let previousEvidence: MetaReconciliationEvidenceRow | null = null;
  let latestDelta: MetaReconciliationEvidenceDelta | null = null;
  try {
    [summary, evidenceHistory, evidenceCount] = await Promise.all([
      getMetaReconciliationSummary(),
      getMetaReconciliationEvidenceHistory(10),
      countMetaReconciliationEvidence(),
    ]);
    ({ latest: latestEvidence, previous: previousEvidence, delta: latestDelta } = await compareLatestEvidenceSnapshots());
  } catch (error) {
    return (
      <AppShell>
        <PageHeader title="Reconciliação Meta" description="Diagnóstico seguro das contagens Meta." />
        <RuntimeAlert
          title="Falha ao carregar reconciliação"
          description={error instanceof Error ? error.message : "Não foi possível carregar a reconciliação Meta."}
        />
      </AppShell>
    );
  }

  const counts = [
    ["Posts no banco", summary.sourceOfTruth.posts],
    ["Interações/comentários no banco", summary.sourceOfTruth.interactions],
    ["Pessoas no banco", summary.sourceOfTruth.people],
    ["meta_sync_runs", summary.sourceOfTruth.syncRuns],
    ["audit_logs Meta", summary.sourceOfTruth.auditLogs],
  ];

  return (
    <AppShell>
      <PageHeader
        title="Reconciliação Meta"
        description="Compare o dashboard com a fonte da verdade no Supabase e registre evidência operacional agregada, sem expor tokens, payload bruto ou dados pessoais."
      />

      <div className="mb-6">
        <Button variant="outline" nativeButton={false} render={<Link href="/operacao" />}>
          Voltar para Operação
        </Button>
      </div>

      {canRunMetaSync(session.internalUser.role) ? (
        <Card className="mb-6 border-slate-300/60 bg-slate-50/70">
          <CardHeader>
            <CardTitle>Captura de evidência operacional</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Registra somente agregados, status das runs e hash do relatório. Não inclui payload bruto, comentários, usernames, tokens ou dados pessoais.
              </p>
              <p className="mt-2 text-sm font-semibold">{evidenceCount} evidência(s) operacional(is) registrada(s).</p>
            </div>
            <form action={generateMetaReconciliationEvidenceAction}>
              <Button type="submit">Gerar evidência operacional</Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {counts.map(([label, value]) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-black">{Number(value).toLocaleString("pt-BR")}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card className="mt-6 border-slate-300/60 bg-slate-50/70">
        <CardHeader>
          <CardTitle>Última evidência registrada</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-semibold">
              {latestEvidence ? formatDateTime(latestEvidence.generated_at) : "Sem evidência registrada"}
            </p>
            <p className="text-muted-foreground">
              Status: {latestEvidence?.status ?? "-"} | Hash: {latestEvidence ? shortHash(latestEvidence.report_hash) : "-"}
            </p>
            <p className="text-muted-foreground">
              {previousEvidence
                ? `Comparada com a anterior em ${formatDateTime(previousEvidence.generated_at)}`
                : "Sem evidência anterior para comparação."}
            </p>
          </div>
          <div className="max-w-xl text-muted-foreground">
            <p>{formatDelta(latestDelta)}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Histórico de evidências</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/hora</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Hash curto</TableHead>
                  <TableHead>Posts</TableHead>
                  <TableHead>Interações</TableHead>
                  <TableHead>Pessoas</TableHead>
                  <TableHead>Runs presas</TableHead>
                  <TableHead>Diferença</TableHead>
                  <TableHead>Exportar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {evidenceHistory.map((item, index) => {
                  const previous = evidenceHistory[index + 1] ?? null;
                  const delta = getEvidenceDelta(previous, item);
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Link className="underline underline-offset-4" href={`/operacao/meta-reconciliacao/evidencias/${item.id}`}>
                          {formatDateTime(item.generated_at)}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant={evidenceStatusVariant(item.status)}>{item.status}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{shortHash(item.report_hash)}</TableCell>
                      <TableCell>{item.posts_count}</TableCell>
                      <TableCell>{item.interactions_count}</TableCell>
                      <TableCell>{item.people_count}</TableCell>
                      <TableCell>{item.stuck_runs_count}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDelta(delta)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            nativeButton={false}
                            render={<Link href={`/api/meta/reconciliation/evidence/${item.id}/export?format=markdown`} />}
                          >
                            MD
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            nativeButton={false}
                            render={<Link href={`/api/meta/reconciliation/evidence/${item.id}/export?format=html`} />}
                          >
                            HTML
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {evidenceHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                      Nenhuma evidência operacional registrada.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Últimas sincronizações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Inseridos</TableHead>
                  <TableHead>Atualizados</TableHead>
                  <TableHead>Ignorados</TableHead>
                  <TableHead>Início</TableHead>
                  <TableHead>Fim</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Erro redigido</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.latestRuns.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell className="font-semibold">{run.kind}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(run.status)}>{run.status}</Badge>
                    </TableCell>
                    <TableCell>{run.inserted_count}</TableCell>
                    <TableCell>{run.updated_count}</TableCell>
                    <TableCell>{run.skipped_count}</TableCell>
                    <TableCell>{formatDateTime(run.started_at)}</TableCell>
                    <TableCell>{run.finished_at ? formatDateTime(run.finished_at) : "Em andamento"}</TableCell>
                    <TableCell>{formatDuration(run.started_at, run.finished_at)}</TableCell>
                    <TableCell className="max-w-72 truncate">{errorPreview(run.error_message)}</TableCell>
                  </TableRow>
                ))}
                {summary.latestRuns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                      Nenhuma sincronização registrada.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Runs presas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-3xl font-black">{summary.stuckRuns.length}</p>
            {summary.stuckRuns.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma run iniciada sem finalização acima do limite operacional.</p>
            ) : (
              <div className="space-y-3">
                {summary.stuckRuns.map((run) => (
                  <div key={run.id} className="flex flex-col justify-between gap-3 rounded-md border p-3 sm:flex-row sm:items-center">
                    <div>
                      <p className="font-semibold">{run.kind}</p>
                      <p className="text-sm text-muted-foreground">Iniciada em {formatDateTime(run.started_at)}</p>
                    </div>
                    <Button size="sm" variant="outline" nativeButton={false} render={<Link href={`/operacao/sync/${run.id}`} />}>
                      Ver detalhe
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Possíveis divergências</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.divergences.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma divergência entre dashboard e fonte da verdade foi detectada.</p>
            ) : (
              summary.divergences.map((item) => (
                <div key={item.label} className="rounded-md border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">{item.label}</p>
                    <Badge variant={item.severity === "warning" ? "destructive" : "outline"}>{item.severity}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Dashboard mostra {String(item.dashboard ?? "-")}; banco mostra {String(item.sourceOfTruth ?? "-")}.
                  </p>
                </div>
              ))
            )}
            {summary.startedRuns.length > 0 && summary.latestFinalizedRun ? (
              <p className="text-sm text-muted-foreground">
                Há run iniciada sem finalização. Compare com a última run finalizada: {summary.latestFinalizedRun.kind} em{" "}
                {formatDateTime(summary.latestFinalizedRun.finished_at ?? summary.latestFinalizedRun.started_at)}.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </section>
    </AppShell>
  );
}
