/**
 * Webhook Processing — Quarentena e processamento manual de eventos
 * 
 * Regras:
 * - Todo evento entra em quarentena primeiro
 * - Revisão humana obrigatória antes de processar
 * - Nenhum evento gera DM automática
 * - Nenhum evento cria contato sem consentimento
 * - Nenhum evento cria score político individual
 */

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { createIncident } from "@/lib/data/incidents";
import type { AuditAction } from "@/lib/types";
import type { Json } from "@/lib/supabase/database.types";
import {
  extractWebhookInfo,
  isAllowedEventType,
  isProhibitedEventType,
  isAllowedWebhookObject,
} from "./webhook-security";

// Tipos locais para as novas tabelas (ainda não geradas no database.types.ts)
type WebhookEventStatus = "received" | "verified" | "quarantined" | "ignored" | "processed" | "failed";

interface WebhookEventRow {
  id: string;
  external_event_id: string | null;
  object_type: string;
  event_type: string | null;
  status: WebhookEventStatus;
  signature_valid: boolean;
  received_at: string;
  processed_at: string | null;
  source: string;
  raw_payload: Record<string, unknown>;
  redacted_payload: Record<string, unknown>;
  error_message: string | null;
  metadata: Record<string, unknown>;
}

interface WebhookEventLinkRow {
  id: string;
  webhook_event_id: string;
  entity_type: "ig_post" | "ig_person" | "ig_interaction" | "meta_sync_run" | "incident" | "topic";
  entity_id: string;
  created_at: string;
}

/**
 * Classifica um evento webhook como permitido, proibido ou ignorado
 */
export function classifyWebhookEvent(payload: Record<string, unknown>): {
  allowed: boolean;
  reason: string;
  action: "process" | "ignore" | "quarantine";
} {
  const { objectType, eventType } = extractWebhookInfo(payload);
  
  // Verifica se o objeto é permitido
  if (!objectType || !isAllowedWebhookObject(objectType)) {
    return {
      allowed: false,
      reason: `Objeto não permitido: ${objectType ?? "desconhecido"}`,
      action: "ignore",
    };
  }
  
  // Verifica se é um tipo proibido
  if (isProhibitedEventType(eventType)) {
    return {
      allowed: false,
      reason: `Tipo de evento proibido: ${eventType ?? "desconhecido"}`,
      action: "ignore",
    };
  }
  
  // Verifica se é um tipo permitido
  if (isAllowedEventType(eventType)) {
    return {
      allowed: true,
      reason: `Evento permitido: ${eventType} em ${objectType}`,
      action: "quarantine",
    };
  }
  
  // Evento desconhecido vai para quarentena para análise
  return {
    allowed: false,
    reason: `Evento desconhecido: ${eventType ?? "desconhecido"} em ${objectType ?? "desconhecido"}`,
    action: "quarantine",
  };
}

/**
 * Cria um registro de evento webhook no banco
 */
export async function createWebhookEvent(payload: {
  externalEventId: string | null;
  objectType: string;
  eventType: string | null;
  signatureValid: boolean;
  rawPayload: Record<string, unknown>;
  redactedPayload: Record<string, unknown>;
  errorMessage?: string | null;
}): Promise<string> {
  const supabase = getSupabaseAdminClient();
  
  // Classifica o evento para definir status inicial
  const classification = classifyWebhookEvent(payload.rawPayload);
  
  let status: WebhookEventStatus = "received";
  
  if (!payload.signatureValid) {
    status = "failed";
  } else if (classification.action === "ignore") {
    status = "ignored";
  } else if (classification.action === "quarantine") {
    status = payload.signatureValid ? "quarantined" : "failed";
  } else {
    status = "verified";
  }
  
  const insertPayload = {
    external_event_id: payload.externalEventId,
    object_type: payload.objectType,
    event_type: payload.eventType,
    status,
    signature_valid: payload.signatureValid,
    raw_payload: payload.rawPayload as Json,
    redacted_payload: payload.redactedPayload as Json,
    error_message: payload.errorMessage ?? null,
    metadata: {
      classification_reason: classification.reason,
      classification_action: classification.action,
    } as Json,
  };
  
  const { data, error } = await supabase
    .from("meta_webhook_events")
    .insert(insertPayload)
    .select("id")
    .single();
  
  if (error) {
    throw new Error(`Falha ao criar webhook event: ${error.message}`);
  }
  
  return (data as { id: string }).id;
}

/**
 * Processa um evento de webhook permitido
 * Este é um processo manual iniciado por operador humano
 */
export async function processAllowedWebhookEvent(
  eventId: string,
  actorId: string | null,
  actorEmail: string | null
): Promise<{ success: boolean; message: string; links?: WebhookEventLinkRow[] }> {
  const supabase = getSupabaseAdminClient();
  
  // Busca o evento
  const { data: eventData, error: fetchError } = await supabase
    .from("meta_webhook_events")
    .select("*")
    .eq("id", eventId)
    .single();
  
  if (fetchError || !eventData) {
    throw new Error(`Evento não encontrado: ${eventId}`);
  }
  
  const event = eventData as unknown as WebhookEventRow;
  
  // Validações de segurança
  if (!event.signature_valid) {
    await writeAuditLog({
      actorId,
      actorEmail,
      action: "meta.webhook_processing_failed" as AuditAction,
      entityType: "meta_webhook_events",
      entityId: eventId,
      summary: "Tentativa de processar evento com assinatura inválida",
      metadata: { event_id: eventId, reason: "invalid_signature" } as Json,
    });
    
    await createIncident({
      kind: "meta.webhook_processing_failed",
      severity: "critical",
      status: "open",
      title: "Tentativa indevida de processar evento inválido",
      description: `Evento ${eventId} com assinatura inválida teve tentativa de processamento.`,
      related_entity_type: "meta_webhook_events",
      related_entity_id: eventId,
    });
    
    return { success: false, message: "Não é possível processar evento com assinatura inválida" };
  }
  
  if (event.status === "processed") {
    return { success: false, message: "Evento já foi processado" };
  }
  
  if (event.status === "ignored") {
    return { success: false, message: "Evento está marcado como ignorado" };
  }
  
  // Re-classifica para garantir
  const classification = classifyWebhookEvent(event.raw_payload as Record<string, unknown>);
  
  if (classification.action === "ignore") {
    await ignoreWebhookEvent(eventId, actorId, actorEmail);
    return { success: false, message: `Evento ignorado: ${classification.reason}` };
  }
  
  const links: WebhookEventLinkRow[] = [];
  
  try {
    // Processa com base no tipo de evento
    const payload = event.raw_payload as Record<string, unknown>;
    
    if (event.event_type?.toLowerCase().includes("comments")) {
      const commentLinks = await processCommentEvent(payload, eventId);
      links.push(...commentLinks);
    } else if (event.event_type?.toLowerCase().includes("mentions")) {
      const mentionLinks = await processMentionEvent(payload, eventId);
      links.push(...mentionLinks);
    } else if (event.event_type?.toLowerCase().includes("media")) {
      const mediaLinks = await processMediaEvent(payload, eventId);
      links.push(...mediaLinks);
    }
    
    // Atualiza status do evento
    await supabase
      .from("meta_webhook_events")
      .update({
        status: "processed",
        processed_at: new Date().toISOString(),
      })
      .eq("id", eventId);
    
    // Registra audit log
    await writeAuditLog({
      actorId,
      actorEmail,
      action: "meta.webhook_processed" as AuditAction,
      entityType: "meta_webhook_events",
      entityId: eventId,
      summary: `Evento webhook processado: ${event.event_type ?? "desconhecido"}`,
      metadata: {
        event_id: eventId,
        event_type: event.event_type,
        object_type: event.object_type,
        links_created: links.length,
      } as Json,
    });
    
    return {
      success: true,
      message: `Evento processado com sucesso. ${links.length} entidade(s) vinculada(s).`,
      links,
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    
    await writeAuditLog({
      actorId,
      actorEmail,
      action: "meta.webhook_processing_failed" as AuditAction,
      entityType: "meta_webhook_events",
      entityId: eventId,
      summary: `Falha ao processar evento webhook: ${errorMessage}`,
      metadata: { event_id: eventId, error: errorMessage } as Json,
    });
    
    // Atualiza status para falha
    await supabase
      .from("meta_webhook_events")
      .update({
        status: "failed",
        error_message: errorMessage,
      })
      .eq("id", eventId);
    
    throw error;
  }
}

/**
 * Marca um evento como ignorado
 */
export async function ignoreWebhookEvent(
  eventId: string,
  actorId: string | null,
  actorEmail: string | null
): Promise<void> {
  const supabase = getSupabaseAdminClient();
  
  await supabase
    .from("meta_webhook_events")
    .update({
      status: "ignored",
      processed_at: new Date().toISOString(),
    })
    .eq("id", eventId);
  
  await writeAuditLog({
    actorId,
    actorEmail,
    action: "meta.webhook_ignored" as AuditAction,
    entityType: "meta_webhook_events",
    entityId: eventId,
    summary: "Evento webhook ignorado manualmente",
    metadata: { event_id: eventId } as Json,
  });
}

/**
 * Marca um evento como revisado (mas ainda em quarentena)
 */
export async function markWebhookEventReviewed(
  eventId: string,
  actorId: string | null,
  actorEmail: string | null,
  notes?: string
): Promise<void> {
  const supabase = getSupabaseAdminClient();
  
  const { data: eventData } = await supabase
    .from("meta_webhook_events")
    .select("metadata")
    .eq("id", eventId)
    .single();
  
  const currentMetadata = ((eventData as { metadata?: Record<string, unknown> })?.metadata ?? {}) as Record<string, unknown>;
  
  await supabase
    .from("meta_webhook_events")
    .update({
      metadata: {
        ...currentMetadata,
        reviewed_by: actorEmail,
        reviewed_at: new Date().toISOString(),
        review_notes: notes ?? null,
      } as Json,
    })
    .eq("id", eventId);
  
  await writeAuditLog({
    actorId,
    actorEmail,
    action: "meta.webhook_reviewed" as AuditAction,
    entityType: "meta_webhook_events",
    entityId: eventId,
    summary: notes ? `Evento revisado: ${notes}` : "Evento revisado",
    metadata: { event_id: eventId, notes } as Json,
  });
}

/**
 * Processa evento de comentário
 * Cria/atualiza ig_posts e ig_interactions
 */
async function processCommentEvent(
  payload: Record<string, unknown>,
  eventId: string
): Promise<WebhookEventLinkRow[]> {
  const supabase = getSupabaseAdminClient();
  const links: WebhookEventLinkRow[] = [];
  
  // Extrai dados do comentário do payload
  // Estrutura esperada: entry[].changes[].value
  const entries = payload.entry as Record<string, unknown>[] | undefined;
  if (!entries || !Array.isArray(entries)) return links;
  
  for (const entry of entries) {
    const changes = entry.changes as Record<string, unknown>[] | undefined;
    if (!changes || !Array.isArray(changes)) continue;
    
    for (const change of changes) {
      const value = change.value as Record<string, unknown> | undefined;
      if (!value) continue;
      
      const mediaId = value.media_id as string | undefined;
      const commentId = value.comment_id as string | undefined;
      const from = value.from as Record<string, unknown> | undefined;
      const username = from?.username as string | undefined;
      const text = value.text as string | undefined;
      
      if (!mediaId || !commentId) continue;
      
      // Cria ou atualiza post
      const { data: postData } = await supabase
        .from("ig_posts")
        .upsert({
          instagram_post_id: mediaId,
          caption: text ?? null,
          synced_at: new Date().toISOString(),
          raw: value as Json,
        }, { onConflict: "instagram_post_id" })
        .select("id")
        .single();
      
      const post = postData as { id: string } | null;
      
      if (post) {
        const { data: linkData } = await supabase
          .from("meta_webhook_event_links")
          .insert({
            webhook_event_id: eventId,
            entity_type: "ig_post",
            entity_id: post.id,
          })
          .select("*")
          .single();
        
        if (linkData) links.push(linkData as unknown as WebhookEventLinkRow);
      }
      
      // Cria ou atualiza pessoa (apenas username público)
      if (username) {
        const { data: personData } = await supabase
          .from("ig_people")
          .upsert({
            username,
            synced_at: new Date().toISOString(),
            raw: from as Json,
          }, { onConflict: "username" })
          .select("id")
          .single();
        
        const person = personData as { id: string } | null;
        
        if (person) {
          const { data: personLinkData } = await supabase
            .from("meta_webhook_event_links")
            .insert({
              webhook_event_id: eventId,
              entity_type: "ig_person",
              entity_id: person.id,
            })
            .select("*")
            .single();
          
          if (personLinkData) links.push(personLinkData as unknown as WebhookEventLinkRow);
          
          // Cria interação (comentário)
          if (post) {
            const { data: interactionData } = await supabase
              .from("ig_interactions")
              .upsert({
                person_id: person.id,
                post_id: post.id,
                instagram_interaction_id: commentId,
                type: "comentario",
                text_content: text ?? null,
                occurred_at: new Date().toISOString(),
                synced_at: new Date().toISOString(),
                raw: value as Json,
              }, { onConflict: "instagram_interaction_id" })
              .select("id")
              .single();
            
            const interaction = interactionData as { id: string } | null;
            
            if (interaction) {
              const { data: interactionLinkData } = await supabase
                .from("meta_webhook_event_links")
                .insert({
                  webhook_event_id: eventId,
                  entity_type: "ig_interaction",
                  entity_id: interaction.id,
                })
                .select("*")
                .single();
              
              if (interactionLinkData) links.push(interactionLinkData as unknown as WebhookEventLinkRow);
            }
          }
        }
      }
    }
  }
  
  return links;
}

/**
 * Processa evento de menção
 * Cria/atualiza ig_people e ig_interactions
 */
async function processMentionEvent(
  payload: Record<string, unknown>,
  eventId: string
): Promise<WebhookEventLinkRow[]> {
  const supabase = getSupabaseAdminClient();
  const links: WebhookEventLinkRow[] = [];
  
  // Extrai dados da menção do payload
  const entries = payload.entry as Record<string, unknown>[] | undefined;
  if (!entries || !Array.isArray(entries)) return links;
  
  for (const entry of entries) {
    const changes = entry.changes as Record<string, unknown>[] | undefined;
    if (!changes || !Array.isArray(changes)) continue;
    
    for (const change of changes) {
      const value = change.value as Record<string, unknown> | undefined;
      if (!value) continue;
      
      const from = value.from as Record<string, unknown> | undefined;
      const username = from?.username as string | undefined;
      const mediaId = value.media_id as string | undefined;
      const text = value.text as string | undefined;
      
      if (!username) continue;
      
      // Cria ou atualiza pessoa (apenas username público)
      const { data: personData } = await supabase
        .from("ig_people")
        .upsert({
          username,
          synced_at: new Date().toISOString(),
          raw: from as Json,
        }, { onConflict: "username" })
        .select("id")
        .single();
      
      const person = personData as { id: string } | null;
      
      if (person) {
        const { data: linkData } = await supabase
          .from("meta_webhook_event_links")
          .insert({
            webhook_event_id: eventId,
            entity_type: "ig_person",
            entity_id: person.id,
          })
          .select("*")
          .single();
        
        if (linkData) links.push(linkData as unknown as WebhookEventLinkRow);
        
        // Cria interação (menção)
        if (mediaId) {
          const { data: postData } = await supabase
            .from("ig_posts")
            .select("id")
            .eq("instagram_post_id", mediaId)
            .maybeSingle();
          
          const post = postData as { id: string } | null;
          
          const { data: interactionData } = await supabase
            .from("ig_interactions")
            .insert({
              person_id: person.id,
              post_id: post?.id ?? null,
              type: "mencao",
              text_content: text ?? null,
              occurred_at: new Date().toISOString(),
              synced_at: new Date().toISOString(),
              raw: value as Json,
            })
            .select("id")
            .single();
          
          const interaction = interactionData as { id: string } | null;
          
          if (interaction) {
            const { data: interactionLinkData } = await supabase
              .from("meta_webhook_event_links")
              .insert({
                webhook_event_id: eventId,
                entity_type: "ig_interaction",
                entity_id: interaction.id,
              })
              .select("*")
              .single();
            
            if (interactionLinkData) links.push(interactionLinkData as unknown as WebhookEventLinkRow);
          }
        }
      }
    }
  }
  
  return links;
}

/**
 * Processa evento de mídia (alterações em posts próprios)
 * Cria/atualiza ig_posts
 */
async function processMediaEvent(
  payload: Record<string, unknown>,
  eventId: string
): Promise<WebhookEventLinkRow[]> {
  const supabase = getSupabaseAdminClient();
  const links: WebhookEventLinkRow[] = [];
  
  const entries = payload.entry as Record<string, unknown>[] | undefined;
  if (!entries || !Array.isArray(entries)) return links;
  
  for (const entry of entries) {
    const changes = entry.changes as Record<string, unknown>[] | undefined;
    if (!changes || !Array.isArray(changes)) continue;
    
    for (const change of changes) {
      const value = change.value as Record<string, unknown> | undefined;
      if (!value) continue;
      
      const mediaId = value.media_id as string | undefined;
      const caption = value.caption as string | undefined;
      
      if (!mediaId) continue;
      
      // Atualiza post
      const { data: postData } = await supabase
        .from("ig_posts")
        .upsert({
          instagram_post_id: mediaId,
          caption: caption ?? null,
          synced_at: new Date().toISOString(),
          raw: value as Json,
        }, { onConflict: "instagram_post_id" })
        .select("id")
        .single();
      
      const post = postData as { id: string } | null;
      
      if (post) {
        const { data: linkData } = await supabase
          .from("meta_webhook_event_links")
          .insert({
            webhook_event_id: eventId,
            entity_type: "ig_post",
            entity_id: post.id,
          })
          .select("*")
          .single();
        
        if (linkData) links.push(linkData as unknown as WebhookEventLinkRow);
      }
    }
  }
  
  return links;
}

// ─── Queries para interface ─────────────────────────────────────────────────

/**
 * Lista eventos webhook com paginação
 */
export async function listWebhookEvents(options?: {
  status?: WebhookEventStatus;
  limit?: number;
  offset?: number;
}): Promise<WebhookEventRow[]> {
  const supabase = getSupabaseAdminClient();
  
  let query = supabase
    .from("meta_webhook_events")
    .select("*")
    .order("received_at", { ascending: false });
  
  if (options?.status) {
    query = query.eq("status", options.status);
  }
  
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  
  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit ?? 10) - 1);
  }
  
  const { data, error } = await query;
  
  if (error) throw new Error(`Falha ao listar eventos: ${error.message}`);
  return (data as unknown as WebhookEventRow[]) ?? [];
}

/**
 * Busca um evento webhook pelo ID
 */
export async function getWebhookEvent(eventId: string): Promise<WebhookEventRow | null> {
  const supabase = getSupabaseAdminClient();
  
  const { data, error } = await supabase
    .from("meta_webhook_events")
    .select("*")
    .eq("id", eventId)
    .maybeSingle();
  
  if (error) throw new Error(`Falha ao buscar evento: ${error.message}`);
  return data as unknown as WebhookEventRow | null;
}

/**
 * Busca links de um evento webhook
 */
export async function getWebhookEventLinks(eventId: string): Promise<WebhookEventLinkRow[]> {
  const supabase = getSupabaseAdminClient();
  
  const { data, error } = await supabase
    .from("meta_webhook_event_links")
    .select("*")
    .eq("webhook_event_id", eventId);
  
  if (error) throw new Error(`Falha ao buscar links: ${error.message}`);
  return (data as unknown as WebhookEventLinkRow[]) ?? [];
}

/**
 * Conta eventos por status
 */
export async function countWebhookEventsByStatus(): Promise<Record<WebhookEventStatus, number>> {
  const supabase = getSupabaseAdminClient();
  
  const { data, error } = await supabase
    .from("meta_webhook_events")
    .select("status");
  
  if (error) return { received: 0, verified: 0, quarantined: 0, ignored: 0, processed: 0, failed: 0 };
  
  const counts: Record<string, number> = { 
    received: 0, 
    verified: 0, 
    quarantined: 0, 
    ignored: 0, 
    processed: 0, 
    failed: 0 
  };
  
  for (const row of (data as { status: string }[] ?? [])) {
    counts[row.status] = (counts[row.status] ?? 0) + 1;
  }
  
  return counts as Record<WebhookEventStatus, number>;
}

/**
 * Busca eventos em quarentena antigos (mais de 72h)
 */
export async function getStaleQuarantineEvents(): Promise<WebhookEventRow[]> {
  const supabase = getSupabaseAdminClient();
  
  const cutoffDate = new Date();
  cutoffDate.setHours(cutoffDate.getHours() - 72);
  
  const { data, error } = await supabase
    .from("meta_webhook_events")
    .select("*")
    .eq("status", "quarantined")
    .lt("received_at", cutoffDate.toISOString());
  
  if (error) throw new Error(`Falha ao buscar eventos antigos: ${error.message}`);
  return (data as unknown as WebhookEventRow[]) ?? [];
}

/**
 * Busca eventos com falha de assinatura
 */
export async function getInvalidSignatureEvents(): Promise<WebhookEventRow[]> {
  const supabase = getSupabaseAdminClient();
  
  const { data, error } = await supabase
    .from("meta_webhook_events")
    .select("*")
    .eq("signature_valid", false)
    .order("received_at", { ascending: false })
    .limit(50);
  
  if (error) throw new Error(`Falha ao buscar eventos inválidos: ${error.message}`);
  return (data as unknown as WebhookEventRow[]) ?? [];
}
