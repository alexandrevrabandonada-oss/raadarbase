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

export const dynamic = "force-dynamic";

export default async function RelatoriosPage() {
  await requireInternalPageSession("/relatorios");

  const reports = await listMobilizationReports();

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
