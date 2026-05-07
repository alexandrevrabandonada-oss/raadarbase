import Link from "next/link";
import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import { listMobilizationReports } from "@/lib/data/reports";
import { formatDateTime } from "@/lib/mock-data";
import { FileText, Plus } from "lucide-react";

type FeaturedReportSnapshot = {
  totals?: {
    postsAnalyzed?: number;
    interactionsAnalyzed?: number;
    uniquePeople?: number;
    themesDetected?: number;
    pendingThemes?: number;
  };
  topTopics?: Array<Record<string, unknown>>;
};

export const dynamic = "force-dynamic";

export default async function RelatoriosPage() {
  await requireInternalPageSession("/relatorios");

  const reports = await listMobilizationReports();
  const generatedReports = reports.filter((report) => report.status === "generated");
  const firstRealReport = generatedReports
    .slice()
    .sort((left, right) => (left.created_at < right.created_at ? -1 : left.created_at > right.created_at ? 1 : 0))[0] ?? null;
  const firstSnapshot = (firstRealReport?.snapshot as FeaturedReportSnapshot) ?? null;
  const firstMetrics = firstSnapshot?.totals ?? {
    postsAnalyzed: 0,
    interactionsAnalyzed: 0,
    uniquePeople: 0,
    themesDetected: firstSnapshot?.topTopics?.length ?? 0,
    pendingThemes: 0,
  };

  return (
    <AppShell>
      <PageHeader
        title="Relatórios de Mobilização"
        description="Análise consolidada de pautas e demandas públicas. Foco no volume de mobilização e escuta coletiva."
      />

      <div className="mb-6 flex justify-between items-center">
        <div className="text-sm text-muted-foreground italic">
          Relatórios descrevem pautas, não perfis individuais.
        </div>
        <Button nativeButton={false} render={<Link href="/relatorios/novo" />}>
          <Plus className="mr-2 h-4 w-4" /> Novo Relatório
        </Button>
      </div>
      <div className="mb-6 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="space-y-3 pt-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">Primeiro relatório real do Instagram</p>
                <h2 className="mt-1 text-2xl font-black">{firstRealReport ? firstRealReport.title : "Ainda não gerado"}</h2>
              </div>
              <Badge variant={firstRealReport ? "default" : "outline"}>{firstRealReport ? "gerado" : "pendente"}</Badge>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <div className="rounded-md border bg-background p-3">
                <p className="text-xs uppercase text-muted-foreground">Posts analisados</p>
                <p className="text-xl font-black">{firstMetrics.postsAnalyzed ?? 0}</p>
              </div>
              <div className="rounded-md border bg-background p-3">
                <p className="text-xs uppercase text-muted-foreground">Interações</p>
                <p className="text-xl font-black">{firstMetrics.interactionsAnalyzed ?? 0}</p>
              </div>
              <div className="rounded-md border bg-background p-3">
                <p className="text-xs uppercase text-muted-foreground">Pessoas únicas</p>
                <p className="text-xl font-black">{firstMetrics.uniquePeople ?? 0}</p>
              </div>
              <div className="rounded-md border bg-background p-3">
                <p className="text-xs uppercase text-muted-foreground">Temas detectados</p>
                <p className="text-xl font-black">{firstMetrics.themesDetected ?? 0}</p>
              </div>
              <div className="rounded-md border bg-background p-3">
                <p className="text-xs uppercase text-muted-foreground">Pendências</p>
                <p className="text-xl font-black">{firstMetrics.pendingThemes ?? 0}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {firstRealReport ? (
                <>
                  <Button nativeButton={false} render={<Link href={`/relatorios/${firstRealReport.id}`} />}>Abrir relatório</Button>
                  <Button variant="outline" nativeButton={false} render={<Link href={`/acoes/novo?reportId=${firstRealReport.id}`} />}>Criar plano público</Button>
                </>
              ) : (
                <Button nativeButton={false} render={<Link href="/relatorios/novo" />}>Gerar primeiro relatório</Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground italic">
              Relatórios descrevem pautas, não perfis individuais.
            </div>
            <div className="mt-4 flex justify-end">
              <Button nativeButton={false} render={<Link href="/relatorios/novo" />}>
                <Plus className="mr-2 h-4 w-4" /> Novo Relatório
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Gerado em</TableHead>
                <TableHead>Criado por</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-semibold">
                    <Link href={`/relatorios/${report.id}`} className="flex items-center hover:underline">
                      <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                      {report.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        report.status === 'generated' ? 'default' : 
                        report.status === 'archived' ? 'secondary' : 'outline'
                      }
                    >
                      {report.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    {report.period_start} a {report.period_end}
                  </TableCell>
                  <TableCell className="text-xs">
                    {report.generated_at ? formatDateTime(report.generated_at) : "-"}
                  </TableCell>
                  <TableCell className="text-xs">
                    {report.created_by_email}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={`/relatorios/${report.id}`} />}>
                      Ver
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                    Nenhum relatório criado ainda.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppShell>
  );
}
