import Link from "next/link";
import { notFound } from "next/navigation";
import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RuntimeAlert } from "@/components/runtime-alert";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/lib/mock-data";
import {
  getEvidenceDelta,
  getMetaReconciliationEvidence,
  getMetaReconciliationEvidenceHistory,
  listAuditLogsForMetaReconciliationEvidence,
} from "@/lib/data/meta-reconciliation-evidence";
import { requireInternalPageSession } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

function statusVariant(status: string) {
  if (status === "ok") return "secondary";
  if (status === "blocked") return "destructive";
  return "outline";
}

function shortHash(hash: string) {
  return hash.length > 16 ? `${hash.slice(0, 16)}…` : hash;
}

export default async function MetaReconciliationEvidencePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireInternalPageSession(`/operacao/meta-reconciliacao/evidencias/${id}`);

  let evidence;
  let previousEvidence = null;
  let auditLogs;
  try {
    [evidence, auditLogs] = await Promise.all([
      getMetaReconciliationEvidence(id),
      listAuditLogsForMetaReconciliationEvidence(id),
    ]);

    if (evidence) {
      const history = await getMetaReconciliationEvidenceHistory(200);
      const index = history.findIndex((item) => item.id === id);
      previousEvidence = index >= 0 ? history[index + 1] ?? null : null;
    }
  } catch (error) {
    return (
      <AppShell>
        <PageHeader title="Detalhe da evidência" description="Registro operacional agregado da reconciliação Meta." />
        <RuntimeAlert
          title="Falha ao carregar evidência"
          description={error instanceof Error ? error.message : "Não foi possível carregar a evidência operacional."}
        />
      </AppShell>
    );
  }

  if (!evidence) notFound();

  const delta = getEvidenceDelta(previousEvidence, evidence);

  return (
    <AppShell>
      <PageHeader title="Detalhe da evidência operacional" description={evidence.id} />

      <div className="mb-6 flex flex-wrap gap-2">
        <Button variant="outline" nativeButton={false} render={<Link href="/operacao/meta-reconciliacao" />}>
          Voltar para histórico
        </Button>
        <Button variant="outline" nativeButton={false} render={<Link href={`/api/meta/reconciliation/evidence/${evidence.id}/export?format=markdown`} />}>
          Exportar Markdown
        </Button>
        <Button variant="outline" nativeButton={false} render={<Link href={`/api/meta/reconciliation/evidence/${evidence.id}/export?format=html`} />}>
          Exportar HTML
        </Button>
      </div>

      <Alert className="mb-6 border-slate-300/60 bg-slate-50/70">
        <AlertTitle>Guardrail operacional</AlertTitle>
        <AlertDescription>
          Esta página mostra apenas agregados, hash e logs administrativos associados. Não expõe payload bruto, tokens ou dados pessoais.
        </AlertDescription>
      </Alert>

      <section className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <Card>
          <CardHeader>
            <CardTitle>Agregados</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Info label="Data/hora" value={formatDateTime(evidence.generated_at)} />
            <Info label="Status" value={<Badge variant={statusVariant(evidence.status)}>{evidence.status}</Badge>} />
            <Info label="Hash do relatório" value={<span className="break-all font-mono text-xs">{evidence.report_hash}</span>} />
            <Info label="Hash curto" value={shortHash(evidence.report_hash)} />
            <Info label="Posts" value={String(evidence.posts_count)} />
            <Info label="Interações" value={String(evidence.interactions_count)} />
            <Info label="Pessoas" value={String(evidence.people_count)} />
            <Info label="meta_sync_runs" value={String(evidence.meta_sync_runs_count)} />
            <Info label="audit_logs Meta" value={String(evidence.meta_audit_logs_count)} />
            <Info label="Runs iniciadas" value={String(evidence.started_runs_count)} />
            <Info label="Runs presas" value={String(evidence.stuck_runs_count)} />
            <div className="sm:col-span-2">
              <Info label="Status da última sync" value={evidence.latest_meta_sync_status ?? "-"} />
            </div>
            <div className="sm:col-span-2">
              <Info label="Notas operacionais" value={evidence.notes ?? "Sem notas operacionais."} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Comparação com a evidência anterior</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {delta ? (
              <>
                <DeltaRow label="Posts" value={delta.posts_count} />
                <DeltaRow label="Interações" value={delta.interactions_count} />
                <DeltaRow label="Pessoas" value={delta.people_count} />
                <DeltaRow label="Runs" value={delta.meta_sync_runs_count} />
                <DeltaRow label="Audit logs" value={delta.meta_audit_logs_count} />
                <DeltaRow label="Runs iniciadas" value={delta.started_runs_count} />
                <DeltaRow label="Runs presas" value={delta.stuck_runs_count} />
                <p className="text-muted-foreground">Status anterior: {previousEvidence?.status ?? "-"}</p>
              </>
            ) : (
              <p className="text-muted-foreground">Não há evidência anterior para comparação.</p>
            )}
          </CardContent>
        </Card>
      </section>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Audit logs relacionados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/hora</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Resumo</TableHead>
                  <TableHead>Ator</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{formatDateTime(log.created_at)}</TableCell>
                    <TableCell className="font-semibold">{log.action}</TableCell>
                    <TableCell className="max-w-[28rem] truncate">{log.summary}</TableCell>
                    <TableCell className="max-w-48 truncate">{log.actor_email ?? "Sistema"}</TableCell>
                  </TableRow>
                ))}
                {auditLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                      Nenhum audit_log relacionado encontrado.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md border bg-background p-3">
      <p className="text-sm font-semibold text-muted-foreground">{label}</p>
      <div className="mt-1 break-words text-sm font-bold">{value}</div>
    </div>
  );
}

function DeltaRow({ label, value }: { label: string; value: number }) {
  const formatted = value > 0 ? `+${value}` : String(value);
  return (
    <p>
      <span className="font-semibold">{label}:</span> {formatted}
    </p>
  );
}