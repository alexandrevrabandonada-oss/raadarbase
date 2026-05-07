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
  listIncidents,
  deriveIncidentsFromSyncRuns,
} from "@/lib/data/incidents";
import { getStuckSyncRuns } from "@/lib/operation/stuck-runs";
import { getRepeatedFailureSummary } from "@/lib/operation/repeated-failures";
import { IncidentActions } from "./incident-actions";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function getParam(params: SearchParams, key: string, fallback: string) {
  const raw = params[key];
  if (Array.isArray(raw)) return raw[0] ?? fallback;
  return raw ?? fallback;
}

function severityVariant(severity: string) {
  if (severity === "critical") return "destructive";
  if (severity === "warning") return "default";
  return "secondary";
}

export default async function IncidentesPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams> | SearchParams;
}) {
  const session = await requireInternalPageSession("/operacao/incidentes");
  const canManage = canManageIncidents(session.internalUser.role);
  const params = searchParams ? await Promise.resolve(searchParams) : {};
  const sourceFilter = getParam(params, "source", "all");
  const severityFilter = getParam(params, "severity", "all");
  const statusFilter = getParam(params, "status", "active");

  // Derive incidents from current signals before listing
  const [stuckRuns, repeatedFailures] = await Promise.all([
    getStuckSyncRuns().catch(() => []),
    getRepeatedFailureSummary().catch(() => ({ repeatedFailureKinds: [] })),
  ]);

  await deriveIncidentsFromSyncRuns(
    stuckRuns.map((r) => r.id),
    repeatedFailures.repeatedFailureKinds
  ).catch(() => {});

  const incidents = await listIncidents({
    source: sourceFilter === "webhook" ? "webhook" : "all",
    severity:
      severityFilter === "critical" || severityFilter === "warning" || severityFilter === "info"
        ? severityFilter
        : "all",
    status:
      statusFilter === "open" || statusFilter === "acknowledged" || statusFilter === "resolved" || statusFilter === "all"
        ? statusFilter
        : "active",
  });

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
          <form className="mb-4 grid gap-2 md:grid-cols-4" method="get">
            <select className="rounded-md border px-3 py-2" name="source" defaultValue={sourceFilter}>
              <option value="all">Fonte: todas</option>
              <option value="webhook">Fonte: webhook</option>
            </select>
            <select className="rounded-md border px-3 py-2" name="severity" defaultValue={severityFilter}>
              <option value="all">Severidade: todas</option>
              <option value="critical">critical</option>
              <option value="warning">warning</option>
              <option value="info">info</option>
            </select>
            <select className="rounded-md border px-3 py-2" name="status" defaultValue={statusFilter}>
              <option value="active">Status: ativos</option>
              <option value="open">open</option>
              <option value="acknowledged">acknowledged</option>
              <option value="resolved">resolved</option>
              <option value="all">todos</option>
            </select>
            <button className="rounded-md border px-3 py-2 text-sm font-medium" type="submit">
              Aplicar filtros
            </button>
          </form>
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fonte</TableHead>
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
                      {incident.kind.toLowerCase().includes("meta.webhook") || incident.related_entity_type === "meta_webhook_events"
                        ? "webhook"
                        : "geral"}
                    </TableCell>
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
                      colSpan={7}
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
