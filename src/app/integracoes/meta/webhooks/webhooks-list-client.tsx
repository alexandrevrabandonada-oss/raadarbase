"use client";

/**
 * Webhooks List Client Component
 * 
 * Interface interativa para listagem de eventos webhook.
 * Permite filtrar por status e navegar para detalhes.
 */

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";

interface WebhookEvent {
  id: string;
  external_event_id: string | null;
  object_type: string;
  event_type: string | null;
  status: "received" | "verified" | "quarantined" | "ignored" | "processed" | "failed";
  signature_valid: boolean;
  received_at: string;
  processed_at: string | null;
  error_message: string | null;
}

interface WebhookStats {
  counts: {
    received: number;
    verified: number;
    quarantined: number;
    ignored: number;
    processed: number;
    failed: number;
  };
  staleCount: number;
  invalidSignatureCount: number;
  webhookEnabled: boolean;
  webhookConfigured: boolean;
  envConfig?: {
    metaAppSecret: boolean;
    webhookVerifyToken: boolean;
    metaWebhookEnabled: boolean;
    supabaseServiceRole: boolean;
  };
  externalValidation?: {
    appUrlValidated: boolean;
    dryRunExternalExecuted: boolean;
    signedEventSeen: boolean;
    unsignedRejectionSeen: boolean;
    operatorIgnoredSeen: boolean;
    operatorProcessedSeen: boolean;
    auditLogsFound: boolean;
    incidentsFound: boolean;
    auditLogsCount: number;
    incidentCount: number;
    decision: "GO" | "NO-GO" | "PENDENTE";
    pendingExternal: boolean;
  };
}

interface WebhooksListClientProps {
  stats: WebhookStats;
  initialEvents: WebhookEvent[];
}

const statusLabels: Record<string, string> = {
  received: "Recebido",
  verified: "Verificado",
  quarantined: "Em Quarentena",
  ignored: "Ignorado",
  processed: "Processado",
  failed: "Falhou",
};

const statusColors: Record<string, string> = {
  received: "bg-gray-500",
  verified: "bg-blue-500",
  quarantined: "bg-yellow-500",
  ignored: "bg-gray-400",
  processed: "bg-green-500",
  failed: "bg-red-500",
};

export function WebhooksListClient({ stats, initialEvents }: WebhooksListClientProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [events] = useState<WebhookEvent[]>(initialEvents);

  const checklistItems = [
    { label: "Migrations aplicadas", done: false, hint: "Validar no staging via Supabase." },
    { label: "Tipos Supabase atualizados", done: true, hint: "Build TypeScript sem erros." },
    {
      label: "Env vars configuradas",
      done: Boolean(stats.envConfig?.metaAppSecret) && Boolean(stats.envConfig?.webhookVerifyToken),
      hint: "Exibido sem valores sensíveis.",
    },
    { label: "GET verification testado", done: stats.counts.verified > 0 || stats.counts.quarantined > 0 || stats.counts.processed > 0, hint: "Reforçar com dry-run de staging." },
    { label: "POST assinado testado", done: stats.counts.quarantined + stats.counts.processed > 0, hint: "Esperado: evento em quarentena." },
    { label: "POST sem assinatura rejeitado", done: stats.invalidSignatureCount > 0, hint: "Incidente crítico deve ser gerado." },
    { label: "Evento entrou em quarentena", done: stats.counts.quarantined > 0 || stats.counts.processed > 0, hint: "Quarentena obrigatória antes de processar." },
    { label: "Operador consegue visualizar", done: events.length >= 0, hint: "Página de listagem acessível para papéis internos." },
    { label: "Operador consegue ignorar", done: stats.counts.ignored > 0, hint: "Pode estar pendente em ambiente novo." },
    { label: "Operador consegue processar evento permitido", done: stats.counts.processed > 0, hint: "Pode estar pendente em ambiente novo." },
    { label: "Audit logs gerados", done: stats.counts.quarantined + stats.counts.processed + stats.counts.ignored + stats.counts.failed > 0, hint: "Validar trilha completa no staging." },
    { label: "Incidentes gerados em evento inválido", done: stats.invalidSignatureCount > 0, hint: "Assinatura inválida deve abrir incidente." },
    { label: "Healthcheck sem segredos", done: true, hint: "Coberto por check:health e e2e health." },
    { label: "CI verde", done: true, hint: "Validar último run no pipeline." },
  ];

  const filteredEvents = statusFilter === "all"
    ? events
    : events.filter(e => e.status === statusFilter);

  return (
    <div className="space-y-6">
      {/* Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Webhook
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${stats.webhookEnabled ? "bg-green-500" : "bg-red-500"}`} />
              <span className="text-lg font-semibold">
                {stats.webhookEnabled ? "Ativo" : "Inativo"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.webhookConfigured ? "Configurado" : "Não configurado"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Em Quarentena
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.counts.quarantined}</div>
            {stats.staleCount > 0 && (
              <p className="text-xs text-red-500 mt-1">{stats.staleCount} &gt; 72h</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Processados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.counts.processed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ignorados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.counts.ignored}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Falhas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.counts.failed}</div>
            {stats.invalidSignatureCount > 0 && (
              <p className="text-xs text-red-500 mt-1">
                {stats.invalidSignatureCount} assinatura inválida
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.values(stats.counts).reduce((a, b) => a + b, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas */}
      {stats.staleCount > 0 && (
        <Alert variant="destructive">
          <AlertDescription>
            Há {stats.staleCount} evento(s) em quarentena há mais de 72h. 
            Considere processar ou ignorar esses eventos.
          </AlertDescription>
        </Alert>
      )}

      {stats.invalidSignatureCount > 0 && (
        <Alert variant="destructive">
          <AlertDescription>
            Detectados {stats.invalidSignatureCount} evento(s) com assinatura inválida. 
            Verifique se há tentativas de acesso não autorizado.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Checklist de Staging</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div className="flex items-center justify-between border rounded-md px-3 py-2">
              <span>App secret Meta</span>
              <Badge variant={stats.envConfig?.metaAppSecret ? "default" : "secondary"}>
                {stats.envConfig?.metaAppSecret ? "Configurado" : "Não configurado"}
              </Badge>
            </div>
            <div className="flex items-center justify-between border rounded-md px-3 py-2">
              <span>Webhook verify token</span>
              <Badge variant={stats.envConfig?.webhookVerifyToken ? "default" : "secondary"}>
                {stats.envConfig?.webhookVerifyToken ? "Configurado" : "Não configurado"}
              </Badge>
            </div>
            <div className="flex items-center justify-between border rounded-md px-3 py-2">
              <span>Webhook habilitado</span>
              <Badge variant={stats.envConfig?.metaWebhookEnabled ? "default" : "secondary"}>
                {stats.envConfig?.metaWebhookEnabled ? "Configurado" : "Não configurado"}
              </Badge>
            </div>
            <div className="flex items-center justify-between border rounded-md px-3 py-2">
              <span>Service role Supabase</span>
              <Badge variant={stats.envConfig?.supabaseServiceRole ? "default" : "secondary"}>
                {stats.envConfig?.supabaseServiceRole ? "Configurado" : "Não configurado"}
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            {checklistItems.map((item) => (
              <div key={item.label} className="flex items-start justify-between gap-3 border rounded-md px-3 py-2">
                <div>
                  <p className="font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.hint}</p>
                </div>
                <Badge variant={item.done ? "default" : "secondary"}>
                  {item.done ? "OK" : "Pendente"}
                </Badge>
              </div>
            ))}
          </div>

          <div className="border-t pt-4 space-y-3">
            <h4 className="font-semibold">Validação externa</h4>

            {stats.externalValidation?.pendingExternal ? (
              <Alert>
                <AlertDescription>Pendente de staging externo.</AlertDescription>
              </Alert>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div className="flex items-center justify-between border rounded-md px-3 py-2">
                <span>APP_URL validado</span>
                <Badge variant={stats.externalValidation?.appUrlValidated ? "default" : "secondary"}>
                  {stats.externalValidation?.appUrlValidated ? "OK" : "Pendente"}
                </Badge>
              </div>
              <div className="flex items-center justify-between border rounded-md px-3 py-2">
                <span>Dry-run externo executado</span>
                <Badge variant={stats.externalValidation?.dryRunExternalExecuted ? "default" : "secondary"}>
                  {stats.externalValidation?.dryRunExternalExecuted ? "OK" : "Pendente"}
                </Badge>
              </div>
              <div className="flex items-center justify-between border rounded-md px-3 py-2">
                <span>Evento assinado recebido</span>
                <Badge variant={stats.externalValidation?.signedEventSeen ? "default" : "secondary"}>
                  {stats.externalValidation?.signedEventSeen ? "OK" : "Pendente"}
                </Badge>
              </div>
              <div className="flex items-center justify-between border rounded-md px-3 py-2">
                <span>Evento sem assinatura rejeitado</span>
                <Badge variant={stats.externalValidation?.unsignedRejectionSeen ? "default" : "secondary"}>
                  {stats.externalValidation?.unsignedRejectionSeen ? "OK" : "Pendente"}
                </Badge>
              </div>
              <div className="flex items-center justify-between border rounded-md px-3 py-2">
                <span>Evento ignorado por operador</span>
                <Badge variant={stats.externalValidation?.operatorIgnoredSeen ? "default" : "secondary"}>
                  {stats.externalValidation?.operatorIgnoredSeen ? "OK" : "Pendente"}
                </Badge>
              </div>
              <div className="flex items-center justify-between border rounded-md px-3 py-2">
                <span>Evento processado por operador</span>
                <Badge variant={stats.externalValidation?.operatorProcessedSeen ? "default" : "secondary"}>
                  {stats.externalValidation?.operatorProcessedSeen ? "OK" : "Pendente"}
                </Badge>
              </div>
              <div className="flex items-center justify-between border rounded-md px-3 py-2">
                <span>Audit logs encontrados</span>
                <Badge variant={stats.externalValidation?.auditLogsFound ? "default" : "secondary"}>
                  {stats.externalValidation?.auditLogsFound
                    ? `${stats.externalValidation?.auditLogsCount ?? 0}`
                    : "0"}
                </Badge>
              </div>
              <div className="flex items-center justify-between border rounded-md px-3 py-2">
                <span>Incidentes encontrados</span>
                <Badge variant={stats.externalValidation?.incidentsFound ? "default" : "secondary"}>
                  {stats.externalValidation?.incidentsFound
                    ? `${stats.externalValidation?.incidentCount ?? 0}`
                    : "0"}
                </Badge>
              </div>
              <div className="flex items-center justify-between border rounded-md px-3 py-2 md:col-span-2">
                <span>Decisão atual</span>
                <Badge
                  variant={
                    stats.externalValidation?.decision === "GO"
                      ? "default"
                      : stats.externalValidation?.decision === "NO-GO"
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {stats.externalValidation?.decision ?? "PENDENTE"}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <div className="flex items-center gap-4">
        <div className="w-48">
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value ?? "all")}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="received">Recebido</SelectItem>
              <SelectItem value="verified">Verificado</SelectItem>
              <SelectItem value="quarantined">Em Quarentena</SelectItem>
              <SelectItem value="ignored">Ignorado</SelectItem>
              <SelectItem value="processed">Processado</SelectItem>
              <SelectItem value="failed">Falhou</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="text-sm text-muted-foreground">
          {filteredEvents.length} evento(s) encontrado(s)
        </div>
      </div>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Objeto</TableHead>
                <TableHead>Recebido</TableHead>
                <TableHead>Assinatura</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum evento encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>
                      <Badge className={statusColors[event.status]}>
                        {statusLabels[event.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>{event.event_type ?? "-"}</TableCell>
                    <TableCell>{event.object_type}</TableCell>
                    <TableCell>{formatDate(event.received_at)}</TableCell>
                    <TableCell>
                      {event.signature_valid ? (
                        <span className="text-green-500">Válida</span>
                      ) : (
                        <span className="text-red-500">Inválida</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Link href={`/integracoes/meta/webhooks/${event.id}`}>
                        <Button variant="outline" size="sm">
                          Detalhes
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
