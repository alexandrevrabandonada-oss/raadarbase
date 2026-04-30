/**
 * Webhook Security — Validação de assinatura e redação de dados sensíveis
 * 
 * Regras:
 * - Nunca logar tokens ou secrets
 * - Sempre validar assinatura HMAC-SHA256
 * - Redigir dados sensíveis antes de persistir
 * - Rejeitar payloads sem assinatura válida
 */

import crypto from "crypto";

const WEBHOOK_VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN ?? "";
const APP_SECRET = process.env.META_APP_SECRET ?? "";
const MAX_PAYLOAD_BYTES = parseInt(process.env.META_WEBHOOK_MAX_PAYLOAD_BYTES ?? "262144", 10);
const ALLOWED_OBJECTS = (process.env.META_WEBHOOK_ALLOWED_OBJECTS ?? "instagram").split(",").map(s => s.trim());
const WEBHOOK_ENABLED = process.env.META_WEBHOOK_ENABLED === "true";

/**
 * Verifica se o webhook está configurado e habilitado
 */
export function isWebhookEnabled(): boolean {
  return WEBHOOK_ENABLED;
}

/**
 * Verifica se o webhook está configurado (tem segredo)
 */
export function isWebhookConfigured(): boolean {
  return Boolean(APP_SECRET) && APP_SECRET.length > 0;
}

/**
 * Verifica se o token de verificação está configurado
 */
export function isVerifyTokenConfigured(): boolean {
  return Boolean(WEBHOOK_VERIFY_TOKEN) && WEBHOOK_VERIFY_TOKEN.length > 0;
}

/**
 * Valida o token de verificação do webhook (GET /api/meta/webhook)
 */
export function verifyWebhookToken(receivedToken: string): boolean {
  if (!WEBHOOK_VERIFY_TOKEN) return false;
  
  // Timing-safe comparison para evitar timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(receivedToken),
      Buffer.from(WEBHOOK_VERIFY_TOKEN)
    );
  } catch {
    // Se os buffers tiverem tamanhos diferentes, timingSafeEqual lança erro
    return false;
  }
}

/**
 * Verifica a assinatura HMAC-SHA256 do webhook Meta
 * Formato do header: sha256=<hex_signature>
 */
export function verifyMetaSignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!APP_SECRET || APP_SECRET.length === 0) {
    return false;
  }
  
  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) {
    return false;
  }
  
  const expectedSignature = signatureHeader.replace("sha256=", "");
  
  const computedSignature = crypto
    .createHmac("sha256", APP_SECRET)
    .update(rawBody, "utf8")
    .digest("hex");
  
  // Timing-safe comparison
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(computedSignature)
    );
  } catch {
    return false;
  }
}

/**
 * Redige dados sensíveis do payload para exibição segura
 * Remove: access_token, email, telefone, CPF, e outros PII
 */
export function redactWebhookPayload(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== "object") {
    return {};
  }
  
  const redacted = JSON.parse(JSON.stringify(payload)) as Record<string, unknown>;
  
  function redactObject(obj: Record<string, unknown>): void {
    for (const key of Object.keys(obj)) {
      const lowerKey = key.toLowerCase();
      const value = obj[key];
      
      // Campos sensíveis que devem ser removidos completamente
      if (
        lowerKey.includes("access_token") ||
        lowerKey.includes("app_secret") ||
        lowerKey.includes("verify_token") ||
        lowerKey.includes("password") ||
        lowerKey.includes("secret") ||
        lowerKey.includes("authorization") ||
        lowerKey.includes("cookie") ||
        lowerKey.includes("session") ||
        lowerKey.includes("cpf") ||
        lowerKey.includes("cnpj") ||
        lowerKey.includes("ssn") ||
        lowerKey.includes("passport")
      ) {
        obj[key] = "[REDACTED]";
        continue;
      }
      
      // Campos de email
      if (
        lowerKey.includes("email") ||
        lowerKey.includes("mail")
      ) {
        if (typeof value === "string" && value.includes("@")) {
          obj[key] = value.replace(/[^@\s]/g, "*");
        } else {
          obj[key] = "[REDACTED]";
        }
        continue;
      }
      
      // Campos de telefone
      if (
        lowerKey.includes("phone") ||
        lowerKey.includes("telefone") ||
        lowerKey.includes("mobile") ||
        lowerKey.includes("whatsapp") ||
        lowerKey.includes("celular")
      ) {
        if (typeof value === "string" && value.length > 4) {
          obj[key] = "****" + value.slice(-4);
        } else {
          obj[key] = "[REDACTED]";
        }
        continue;
      }
      
      // Recursão para objetos aninhados
      if (typeof value === "object" && value !== null) {
        if (Array.isArray(value)) {
          for (let i = 0; i < value.length; i++) {
            if (typeof value[i] === "object" && value[i] !== null) {
              redactObject(value[i] as Record<string, unknown>);
            }
          }
        } else {
          redactObject(value as Record<string, unknown>);
        }
      }
    }
  }
  
  redactObject(redacted);
  return redacted;
}

/**
 * Extrai um ID único do evento para idempotência
 */
export function getWebhookEventId(payload: Record<string, unknown>): string | null {
  // Tenta extrair de vários campos possíveis
  if (payload.id && typeof payload.id === "string") {
    return payload.id;
  }
  
  if (payload.entry && Array.isArray(payload.entry) && payload.entry.length > 0) {
    const entry = payload.entry[0] as Record<string, unknown>;
    if (entry.id && typeof entry.id === "string") {
      return entry.id;
    }
    
    if (entry.messaging && Array.isArray(entry.messaging) && entry.messaging.length > 0) {
      const messaging = entry.messaging[0] as Record<string, unknown>;
      if (messaging.message && typeof messaging.message === "object") {
        const message = messaging.message as Record<string, unknown>;
        if (message.mid && typeof message.mid === "string") {
          return message.mid;
        }
      }
    }
    
    if (entry.changes && Array.isArray(entry.changes) && entry.changes.length > 0) {
      const change = entry.changes[0] as Record<string, unknown>;
      if (change.value && typeof change.value === "object") {
        const value = change.value as Record<string, unknown>;
        if (value.comment_id && typeof value.comment_id === "string") {
          return value.comment_id as string;
        }
        if (value.media_id && typeof value.media_id === "string") {
          return value.media_id as string;
        }
      }
    }
  }
  
  return null;
}

/**
 * Valida o tamanho do payload para evitar ataques de DoS
 */
export function validateWebhookPayloadSize(rawBody: string): { valid: boolean; error?: string } {
  const byteLength = Buffer.byteLength(rawBody, "utf8");
  
  if (byteLength > MAX_PAYLOAD_BYTES) {
    return {
      valid: false,
      error: `Payload excede limite de ${MAX_PAYLOAD_BYTES} bytes (recebido: ${byteLength})`
    };
  }
  
  if (byteLength === 0) {
    return {
      valid: false,
      error: "Payload vazio"
    };
  }
  
  return { valid: true };
}

/**
 * Verifica se o tipo de objeto é permitido
 */
export function isAllowedWebhookObject(objectType: string): boolean {
  return ALLOWED_OBJECTS.includes(objectType.toLowerCase());
}

/**
 * Lista de tipos de eventos proibidos (nunca serão processados)
 */
const PROHIBITED_EVENT_TYPES = [
  "direct_messages",      // DM automática é proibida
  "messaging",          // Mensagens privadas
  "message_reads",      // Leitura de mensagens
  "message_deliveries", // Entrega de mensagens
  "followers",          // Coleta de seguidores em massa
  "user_profile_data",  // Dados de perfil detalhados
  "live_videos",        // Lives
  "stories",            // Stories de terceiros (dados pessoais)
];

/**
 * Verifica se o tipo de evento é proibido
 */
export function isProhibitedEventType(eventType: string | null): boolean {
  if (!eventType) return false;
  const normalized = eventType.toLowerCase();
  return PROHIBITED_EVENT_TYPES.some(prohibited => normalized.includes(prohibited));
}

/**
 * Lista de tipos de eventos permitidos (sujeitos a quarentena)
 */
const ALLOWED_EVENT_TYPES = [
  "mentions",           // Menções públicas
  "comments",           // Comentários em mídia própria
  "media",              // Alterações em mídia própria
];

/**
 * Verifica se o tipo de evento é permitido para processamento
 */
export function isAllowedEventType(eventType: string | null): boolean {
  if (!eventType) return false;
  const normalized = eventType.toLowerCase();
  return ALLOWED_EVENT_TYPES.some(allowed => normalized.includes(allowed));
}

/**
 * Extrai informações básicas do payload webhook
 */
export function extractWebhookInfo(payload: Record<string, unknown>): {
  objectType: string | null;
  eventType: string | null;
  externalId: string | null;
} {
  const objectType = typeof payload.object === "string" ? payload.object : null;
  
  let eventType: string | null = null;
  
  if (payload.entry && Array.isArray(payload.entry) && payload.entry.length > 0) {
    const entry = payload.entry[0] as Record<string, unknown>;
    
    if (entry.changes && Array.isArray(entry.changes) && entry.changes.length > 0) {
      const change = entry.changes[0] as Record<string, unknown>;
      if (typeof change.field === "string") {
        eventType = change.field;
      }
    }
    
    if (entry.messaging && Array.isArray(entry.messaging) && entry.messaging.length > 0) {
      eventType = "messaging";
    }
  }
  
  return {
    objectType,
    eventType,
    externalId: getWebhookEventId(payload),
  };
}

/**
 * Sanitiza mensagens de erro para não vazar segredos
 */
export function sanitizeErrorMessage(message: string): string {
  if (!message) return message;
  
  // Remove tokens e secrets que possam ter vazado
  return message
    .replace(/access_token[=:]\s*[^\s&]+/gi, "access_token=[REDACTED]")
    .replace(/app_secret[=:]\s*[^\s&]+/gi, "app_secret=[REDACTED]")
    .replace(/verify_token[=:]\s*[^\s&]+/gi, "verify_token=[REDACTED]")
    .replace(/Bearer\s+[^\s]+/gi, "Bearer [REDACTED]")
    .replace(/sha256=[a-f0-9]+/gi, "sha256=[SIGNATURE_REDACTED]");
}
