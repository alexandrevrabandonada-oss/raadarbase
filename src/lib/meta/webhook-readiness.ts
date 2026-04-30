/**
 * Webhook Readiness — funções conceituais/placeholder.
 * NÃO há endpoint público de webhook. Este módulo apenas documenta
 * o que seria necessário para implementação futura.
 *
 * PROIBIDO: Não criar rota /api/webhooks/meta nem similar.
 */

export type WebhookRequirement = {
  id: string;
  description: string;
  status: "pending" | "partial" | "ready";
};

export type WebhookEvent = {
  name: string;
  allowed: boolean;
  reason: string;
};

/**
 * Descreve os requisitos técnicos e operacionais para implementação futura.
 */
export function describeWebhookRequirements(): WebhookRequirement[] {
  return [
    {
      id: "signature_validation",
      description: "Validar assinatura HMAC-SHA256 do X-Hub-Signature-256 em toda requisição",
      status: "pending",
    },
    {
      id: "deduplication",
      description: "Armazenar IDs de eventos processados para evitar reprocessamento (idempotência)",
      status: "pending",
    },
    {
      id: "audit_log",
      description: "Todo evento recebido deve gerar entrada em audit_logs antes de qualquer mutação",
      status: "ready",
    },
    {
      id: "do_not_contact",
      description: "Verificar flag nao_abordar antes de qualquer ação derivada de evento webhook",
      status: "ready",
    },
    {
      id: "no_auto_dm",
      description: "Nenhum evento webhook pode disparar DM automática — apenas registro de dados",
      status: "ready",
    },
    {
      id: "rate_limit",
      description: "Implementar rate limiting na rota de webhook para evitar flood",
      status: "pending",
    },
    {
      id: "retry_queue",
      description: "Implementar fila de reprocessamento para falhas transitórias",
      status: "pending",
    },
    {
      id: "meta_app_review",
      description: "Aprovação do aplicativo Meta para receber webhooks de produção",
      status: "pending",
    },
    {
      id: "role_guards",
      description: "Apenas admin/operador podem configurar ou visualizar webhooks",
      status: "ready",
    },
    {
      id: "incident_on_failure",
      description: "Falha ao processar webhook deve gerar operational_incident",
      status: "ready",
    },
  ];
}

/**
 * Eventos Meta que poderiam ser aceitos futuramente (somente leitura/registro).
 */
export function listAllowedFutureWebhookEvents(): WebhookEvent[] {
  return [
    {
      name: "comments",
      allowed: true,
      reason: "Registrar comentários em ig_interactions para análise manual posterior",
    },
    {
      name: "mentions",
      allowed: true,
      reason: "Registrar menções para identificar novos contatos potenciais",
    },
    {
      name: "story_insights",
      allowed: true,
      reason: "Métricas agregadas de story sem identificação individual",
    },
  ];
}

/**
 * Eventos Meta que NÃO serão aceitos em nenhuma circunstância.
 */
export function listDisallowedWebhookEvents(): WebhookEvent[] {
  return [
    {
      name: "direct_messages",
      allowed: false,
      reason: "DM automática é proibida pela política do projeto. Toda DM deve ser manual e consentida.",
    },
    {
      name: "follower_list",
      allowed: false,
      reason: "Coleta de seguidores em massa viola LGPD e política operacional.",
    },
    {
      name: "user_profile_data",
      allowed: false,
      reason: "Dados de perfil detalhados não podem ser coletados via webhook sem consentimento explícito.",
    },
    {
      name: "live_video",
      allowed: false,
      reason: "Fora do escopo operacional do Radar de Base.",
    },
  ];
}
