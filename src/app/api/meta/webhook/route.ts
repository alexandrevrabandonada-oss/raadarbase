/**
 * Meta Webhook Route Handler
 * 
 * GET: Verificação do webhook (hub.challenge)
 * POST: Recepção de eventos webhook
 * 
 * Regras:
 * - Validar assinatura em todo POST
 * - Nunca processar evento sem assinatura válida
 * - Nunca gerar DM automática
 * - Todo evento entra em quarentena primeiro
 */

import { NextRequest, NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { createIncident } from "@/lib/data/incidents";
import type { AuditAction } from "@/lib/types";
import type { Json } from "@/lib/supabase/database.types";
import {
  verifyWebhookToken,
  verifyMetaSignature,
  redactWebhookPayload,
  validateWebhookPayloadSize,
  extractWebhookInfo,
  sanitizeErrorMessage,
  isWebhookEnabled,
  isWebhookConfigured,
} from "@/lib/meta/webhook-security";
import { createWebhookEvent } from "@/lib/meta/webhook-processing";

export const dynamic = "force-dynamic";

/**
 * GET /api/meta/webhook
 * Verificação do webhook pelo Meta
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");
  
  // Verifica se é uma requisição de verificação válida
  if (mode !== "subscribe") {
    return NextResponse.json(
      { error: "Invalid mode. Expected 'subscribe'." },
      { status: 400 }
    );
  }
  
  if (!token) {
    // Registra tentativa sem token
    await writeAuditLog({
      actorId: null,
      actorEmail: null,
      action: "meta.webhook_verification_failed" as AuditAction,
      entityType: "meta_webhook_events",
      entityId: null,
      summary: "Tentativa de verificação webhook sem token",
      metadata: { mode, has_challenge: !!challenge } as Json,
    });
    
    return NextResponse.json(
      { error: "Missing verify_token" },
      { status: 403 }
    );
  }
  
  // Verifica o token
  const tokenValid = verifyWebhookToken(token);
  
  if (!tokenValid) {
    // Registra falha de verificação
    await writeAuditLog({
      actorId: null,
      actorEmail: null,
      action: "meta.webhook_verification_failed" as AuditAction,
      entityType: "meta_webhook_events",
      entityId: null,
      summary: "Falha na verificação do token do webhook",
      metadata: { mode } as Json,
    });
    
    return NextResponse.json(
      { error: "Invalid verify_token" },
      { status: 403 }
    );
  }
  
  // Token válido - retorna challenge
  await writeAuditLog({
    actorId: null,
    actorEmail: null,
    action: "meta.webhook_verified" as AuditAction,
    entityType: "meta_webhook_events",
    entityId: null,
    summary: "Webhook Meta verificado com sucesso",
    metadata: { mode } as Json,
  });
  
  // Retorna o challenge como texto puro (conforme esperado pelo Meta)
  return new NextResponse(challenge ?? "OK", {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}

/**
 * POST /api/meta/webhook
 * Recepção de eventos webhook
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // Verifica se webhook está habilitado
  if (!isWebhookEnabled()) {
    return NextResponse.json(
      { error: "Webhook disabled" },
      { status: 503 }
    );
  }
  
  // Verifica se está configurado
  if (!isWebhookConfigured()) {
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 503 }
    );
  }
  
  // Lê o raw body para verificação de assinatura
  const rawBody = await request.text();
  
  // Valida tamanho do payload
  const sizeValidation = validateWebhookPayloadSize(rawBody);
  if (!sizeValidation.valid) {
    const errorMessage = sizeValidation.error ?? "Payload muito grande";
    
    // Registra incidente
    await createIncident({
      kind: "meta.webhook_payload_too_large",
      severity: "warning",
      status: "open",
      title: "Payload webhook excede limite",
      description: sanitizeErrorMessage(errorMessage),
    });
    
    await writeAuditLog({
      actorId: null,
      actorEmail: null,
      action: "meta.webhook_rejected" as AuditAction,
      entityType: "meta_webhook_events",
      entityId: null,
      summary: "Payload rejeitado por tamanho",
      metadata: { error: errorMessage } as Json,
    });
    
    return NextResponse.json(
      { error: "Payload too large" },
      { status: 413 }
    );
  }
  
  // Valida assinatura
  const signatureHeader = request.headers.get("X-Hub-Signature-256");
  const signatureValid = verifyMetaSignature(rawBody, signatureHeader);
  
  // Parse do payload (mesmo que inválido, para logging)
  let payload: Record<string, unknown> = {};
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    // Payload inválido JSON
    if (signatureValid) {
      // Assinatura válida mas JSON inválido é incomum - registra
      await writeAuditLog({
        actorId: null,
        actorEmail: null,
        action: "meta.webhook_rejected" as AuditAction,
        entityType: "meta_webhook_events",
        entityId: null,
        summary: "Payload com assinatura válida mas JSON inválido",
        metadata: { raw_preview: rawBody.slice(0, 100) } as Json,
      });
    }
  }
  
  // Extrai informações do evento
  const { objectType, eventType, externalId } = extractWebhookInfo(payload);
  
  // Redige payload para persistência segura
  const redactedPayload = redactWebhookPayload(payload);
  
  if (!signatureValid) {
    // Cria registro do evento com falha
    try {
      await createWebhookEvent({
        externalEventId: externalId,
        objectType: objectType ?? "unknown",
        eventType,
        signatureValid: false,
        rawPayload: payload,
        redactedPayload,
        errorMessage: "Assinatura inválida",
      });
    } catch {
      // Falha ao criar registro - continua para registrar incidente
    }
    
    // Registra incidente de segurança
    await createIncident({
      kind: "meta.webhook_invalid_signature",
      severity: "critical",
      status: "open",
      title: "Assinatura inválida em webhook Meta",
      description: `Recebido webhook com assinatura inválida. Objeto: ${objectType ?? "desconhecido"}`,
    });
    
    await writeAuditLog({
      actorId: null,
      actorEmail: null,
      action: "meta.webhook_rejected" as AuditAction,
      entityType: "meta_webhook_events",
      entityId: null,
      summary: "Webhook rejeitado: assinatura inválida",
      metadata: { 
        external_id: externalId,
        object_type: objectType,
        event_type: eventType,
        has_signature: !!signatureHeader,
      } as Json,
    });
    
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 401 }
    );
  }
  
  // Assinatura válida - cria registro do evento
  let eventId: string;
  try {
    eventId = await createWebhookEvent({
      externalEventId: externalId,
      objectType: objectType ?? "instagram",
      eventType,
      signatureValid: true,
      rawPayload: payload,
      redactedPayload,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    
    await writeAuditLog({
      actorId: null,
      actorEmail: null,
      action: "meta.webhook_processing_failed" as AuditAction,
      entityType: "meta_webhook_events",
      entityId: externalId,
      summary: `Falha ao criar registro do evento: ${sanitizeErrorMessage(errorMessage)}`,
      metadata: { 
        object_type: objectType,
        event_type: eventType,
      } as Json,
    });
    
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
  
  // Determina status para logging
  const classification = payload.entry && Array.isArray(payload.entry) && payload.entry.length > 0
    ? "quarantined"
    : "ignored";
  
  // Registra recebimento bem-sucedido
  await writeAuditLog({
    actorId: null,
    actorEmail: null,
    action: classification === "quarantined" 
      ? "meta.webhook_quarantined" as AuditAction 
      : "meta.webhook_received" as AuditAction,
    entityType: "meta_webhook_events",
    entityId: eventId,
    summary: `Webhook ${classification}: ${eventType ?? "desconhecido"} em ${objectType ?? "desconhecido"}`,
    metadata: { 
      event_id: eventId,
      external_id: externalId,
      object_type: objectType,
      event_type: eventType,
    } as Json,
  });
  
  // Retorna 200 rapidamente (Meta espera resposta rápida)
  return NextResponse.json(
    { 
      success: true, 
      event_id: eventId,
      status: classification,
    },
    { status: 200 }
  );
}
