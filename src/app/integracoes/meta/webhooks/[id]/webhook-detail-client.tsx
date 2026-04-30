"use client";

/**
 * Webhook Detail Client Component
 * 
 * Interface interativa para visualizar e gerenciar um evento webhook.
 * Permite processar, ignorar ou revisar o evento.
 */

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";
import {
  processWebhookEventAction,
  ignoreWebhookEventAction,
  markWebhookEventReviewedAction,
} from "../actions";

interface WebhookEvent {
  id: string;
  external_event_id: string | null;
  object_type: string;
  event_type: string | null;
  status: "received" | "verified" | "quarantined" | "ignored" | "processed" | "failed";
  signature_valid: boolean;
  received_at: string;
  processed_at: string | null;
  source: string;
  redacted_payload: Record<string, unknown>;
  error_message: string | null;
  metadata: Record<string, unknown>;
}

interface WebhookLink {
  id: string;
  entity_type: string;
  entity_id: string;
  created_at: string;
}

interface WebhookDetailClientProps {
  event: WebhookEvent;
  links: WebhookLink[];
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

export function WebhookDetailClient({ event, links }: WebhookDetailClientProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isIgnoring, setIsIgnoring] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canProcess = event.status === "quarantined" || event.status === "verified";
  const canIgnore = event.status !== "processed" && event.status !== "ignored";
  const canReview = event.status === "quarantined";

  async function handleProcess() {
    setIsProcessing(true);
    setError(null);
    
    try {
      const result = await processWebhookEventAction(event.id);
      setSuccess(result.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao processar evento");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleIgnore() {
    setIsIgnoring(true);
    setError(null);
    
    try {
      await ignoreWebhookEventAction(event.id);
      setSuccess("Evento ignorado com sucesso");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao ignorar evento");
    } finally {
      setIsIgnoring(false);
    }
  }

  async function handleReview() {
    setError(null);
    
    try {
      await markWebhookEventReviewedAction(event.id, reviewNotes);
      setSuccess("Evento marcado como revisado");
      setShowReviewDialog(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao revisar evento");
    }
  }

  return (
    <div className="space-y-6">
      {/* Navegação */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/integracoes/meta" className="hover:underline">
          Integração Meta
        </Link>
        <span>/</span>
        <Link href="/integracoes/meta/webhooks" className="hover:underline">
          Webhooks
        </Link>
        <span>/</span>
        <span>Detalhes</span>
      </div>

      {/* Alertas */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Informações principais */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Evento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge className={statusColors[event.status]}>
                {statusLabels[event.status]}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tipo de Evento</p>
              <p className="font-medium">{event.event_type ?? "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Objeto</p>
              <p className="font-medium">{event.object_type}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fonte</p>
              <p className="font-medium">{event.source}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Recebido em</p>
              <p className="font-medium">{formatDate(event.received_at)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Processado em</p>
              <p className="font-medium">
                {event.processed_at ? formatDate(event.processed_at) : "-"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Assinatura</p>
              <p className={event.signature_valid ? "text-green-600" : "text-red-600"}>
                {event.signature_valid ? "Válida" : "Inválida"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">ID Externo</p>
              <p className="font-medium">{event.external_event_id ?? "-"}</p>
            </div>
          </div>

          {event.error_message && (
            <div>
              <p className="text-sm text-muted-foreground">Erro</p>
              <p className="text-red-600">{event.error_message}</p>
            </div>
          )}

          {/* Ações */}
          <div className="flex gap-2 pt-4">
            {canProcess && (
              <Button
                onClick={handleProcess}
                disabled={isProcessing}
              >
                {isProcessing ? "Processando..." : "Processar Evento"}
              </Button>
            )}
            
            {canReview && (
              <Button
                variant="outline"
                onClick={() => setShowReviewDialog(true)}
              >
                Marcar como Revisado
              </Button>
            )}
            
            {canIgnore && (
              <Button
                variant="outline"
                onClick={handleIgnore}
                disabled={isIgnoring}
              >
                {isIgnoring ? "Ignorando..." : "Ignorar Evento"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payload Redigido */}
      <Card>
        <CardHeader>
          <CardTitle>Payload (Dados Redigidos)</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-96 text-sm">
            {JSON.stringify(event.redacted_payload, null, 2)}
          </pre>
          <p className="text-xs text-muted-foreground mt-2">
            * Dados sensíveis como tokens, emails e telefones são removidos automaticamente.
          </p>
        </CardContent>
      </Card>

      {/* Links */}
      {links.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Entidades Vinculadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {links.map((link) => (
                <div key={link.id} className="flex items-center gap-4 p-2 bg-gray-50 rounded">
                  <Badge variant="outline">{link.entity_type}</Badge>
                  <code className="text-sm">{link.entity_id}</code>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(link.created_at)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Governança */}
      <Alert>
        <AlertDescription>
          <strong>Governança:</strong> Este evento foi recebido em quarentena para revisão humana. 
          O sistema não gera DM automática, não cria contatos sem consentimento e não atribui 
          scores políticos individuais. Todo processamento é auditável.
        </AlertDescription>
      </Alert>

      {/* Dialog de Revisão */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revisar Evento</DialogTitle>
            <DialogDescription>
              Adicione notas sobre a revisão deste evento. O evento permanecerá em quarentena.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Notas da revisão..."
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleReview}>Marcar como Revisado</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
