import Link from "next/link";
import { redirect } from "next/navigation";
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
import { formatDateTime } from "@/lib/mock-data";
import { countRecentMetaErrors, listMetaSyncRuns } from "@/lib/data/operation";
import { getStuckSyncRuns } from "@/lib/operation/stuck-runs";
import { getInternalSession } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

function statusVariant(status: string) {
  if (status === "success") return "secondary";
  if (status === "error") return "destructive";
  return "outline";
}

export default async function OperacaoPage() {
  const user = await getInternalSession();
  if (!user) redirect("/login?next=/operacao");

  let runs;
  let stuckRuns;
  let recentErrorCount;
  try {
    [runs, stuckRuns, recentErrorCount] = await Promise.all([
      listMetaSyncRuns(),
      getStuckSyncRuns(),
      countRecentMetaErrors(24),
    ]);
  } catch (error) {
    return (
      <AppShell>
        <PageHeader title="Operação" description="Observabilidade das sincronizações e rotinas internas." />
        <RuntimeAlert
          title="Falha ao carregar operação"
          description={error instanceof Error ? error.message : "Não foi possível carregar sincronizações."}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title="Operação"
        description="Acompanhe sincronizações Meta, contagens, erros redigidos e quem executou cada rotina."
      />
      <Card className="mb-6 border-yellow-500/40 bg-yellow-50">
        <CardHeader>
          <CardTitle>Atenção operacional</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-2xl font-black">{stuckRuns.length} runs presas</p>
            <p className="text-sm text-muted-foreground">
              {stuckRuns[0]
                ? `Última run presa: ${stuckRuns[0].kind} iniciada em ${formatDateTime(stuckRuns[0].started_at)}`
                : "Nenhuma sincronização presa no momento."}
            </p>
            {recentErrorCount > 1 ? (
              <p className="mt-1 text-sm font-semibold text-red-800">
                Erro recorrente nas últimas 24h: {recentErrorCount} falhas registradas.
              </p>
            ) : null}
          </div>
          {stuckRuns[0] ? (
            <Button variant="outline" render={<Link href={`/operacao/sync/${stuckRuns[0].id}`} />}>
              Ver detalhes
            </Button>
          ) : null}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Últimas sincronizações Meta</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Início</TableHead>
                  <TableHead>Fim</TableHead>
                  <TableHead>Inseridos</TableHead>
                  <TableHead>Atualizados</TableHead>
                  <TableHead>Ignorados</TableHead>
                  <TableHead>Ator</TableHead>
                  <TableHead className="text-right">Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell className="font-semibold">{run.kind}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(run.status)}>{run.status}</Badge>
                    </TableCell>
                    <TableCell>{formatDateTime(run.started_at)}</TableCell>
                    <TableCell>{run.finished_at ? formatDateTime(run.finished_at) : "Em andamento"}</TableCell>
                    <TableCell>{run.inserted_count}</TableCell>
                    <TableCell>{run.updated_count}</TableCell>
                    <TableCell>{run.skipped_count}</TableCell>
                    <TableCell className="max-w-52 truncate">{run.actor_email ?? "Sem ator"}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" render={<Link href={`/operacao/sync/${run.id}`} />}>
                        Abrir
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {runs.length === 0 ? (
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
    </AppShell>
  );
}
