import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/mock-data";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import { canManageIncidents } from "@/lib/authz/roles";
import {
  listOpenIncidents,
  deriveIncidentsFromSyncRuns,
} from "@/lib/data/incidents";
import { getStuckSyncRuns } from "@/lib/operation/stuck-runs";
import { getRepeatedFailureSummary } from "@/lib/operation/repeated-failures";
import { IncidentActions } from "./incident-actions";

export const dynamic = "force-dynamic";

function severityVariant(severity: string) {
  if (severity === "critical") return "destructive";
  if (severity === "warning") return "default";
  return "secondary";
}

export default async function IncidentesPage() {
  const session = await requireInternalPageSession("/operacao/incidentes");
  const canManage = canManageIncidents(session.internalUser.role);

  // Derive incidents from current signals before listing
  const [stuckRuns, repeatedFailures] = await Promise.all([
    getStuckSyncRuns().catch(() => []),
    getRepeatedFailureSummary().catch(() => ({ repeatedFailureKinds: [] })),
  ]);

  await deriveIncidentsFromSyncRuns(
    stuckRuns.map((r) => r.id),
    repeatedFailures.repeatedFailureKinds
  ).catch(() => {});

  const incidents = await listOpenIncidents();

  return (
    <AppShell>
      <PageHeader
        title="Incidentes Operacionais"
        description="Acompanhamento e resolução de falhas recorrentes ou runs presas."
      />

      <Card>
        <CardHeader>
          <CardTitle>Incidentes abertos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Severidade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incidents.map((incident) => (
                  <TableRow key={incident.id}>
                    <TableCell>
                      <Badge variant={severityVariant(incident.severity)}>
                        {incident.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{incident.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold">{incident.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {incident.description}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {incident.kind}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDateTime(incident.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <IncidentActions incident={incident} canManage={canManage} />
                    </TableCell>
                  </TableRow>
                ))}
                {incidents.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-8 text-center text-muted-foreground"
                    >
                      Nenhum incidente aberto no momento.
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
