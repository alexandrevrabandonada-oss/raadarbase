/**
 * Webhook Security Tests
 * 
 * Testes para:
 * - Verificação de token
 * - Validação de assinatura HMAC-SHA256
 * - Redação de payload
 * - Validação de tamanho
 * - Classificação de objetos e eventos
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import crypto from "crypto";

// Importa fixtures
import instagramCommentPublic from "./__fixtures__/webhooks/instagram-comment-public.json";
import instagramMentionPublic from "./__fixtures__/webhooks/instagram-mention-public.json";
import instagramDmProhibited from "./__fixtures__/webhooks/instagram-dm-prohibited.json";
import instagramFollowerProhibited from "./__fixtures__/webhooks/instagram-follower-prohibited.json";
import invalidObject from "./__fixtures__/webhooks/invalid-object.json";
import payloadWithPii from "./__fixtures__/webhooks/payload-with-pii.json";

// Tipos para as funções importadas dinamicamente
type WebhookSecurityModule = typeof import("./webhook-security");

describe("webhook-security", () => {
  const originalEnv = { ...process.env };
  let webhookSecurity: WebhookSecurityModule;

  beforeEach(async () => {
    // Restaura env antes de cada teste
    process.env = { ...originalEnv };
    // Importa o módulo fresco para cada teste
    webhookSecurity = await import("./webhook-security");
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.resetModules();
  });

  describe("verifyWebhookToken", () => {
    it("deve retornar true para token correto", async () => {
      process.env.META_WEBHOOK_VERIFY_TOKEN = "meu-token-secreto";
      vi.resetModules();
      const { verifyWebhookToken } = await import("./webhook-security");
      expect(verifyWebhookToken("meu-token-secreto")).toBe(true);
    });

    it("deve retornar false para token incorreto", async () => {
      process.env.META_WEBHOOK_VERIFY_TOKEN = "meu-token-secreto";
      vi.resetModules();
      const { verifyWebhookToken } = await import("./webhook-security");
      expect(verifyWebhookToken("token-errado")).toBe(false);
    });

    it("deve retornar false quando token não configurado", async () => {
      delete process.env.META_WEBHOOK_VERIFY_TOKEN;
      vi.resetModules();
      const { verifyWebhookToken } = await import("./webhook-security");
      expect(verifyWebhookToken("qualquer")).toBe(false);
    });

    it("deve usar comparação timing-safe", async () => {
      process.env.META_WEBHOOK_VERIFY_TOKEN = "token";
      vi.resetModules();
      const { verifyWebhookToken } = await import("./webhook-security");
      expect(verifyWebhookToken("tok")).toBe(false);
      expect(verifyWebhookToken("tokenextra")).toBe(false);
    });
  });

  describe("verifyMetaSignature", () => {
    it("deve retornar true para assinatura válida", async () => {
      process.env.META_APP_SECRET = "meu-app-secret";
      vi.resetModules();
      const { verifyMetaSignature } = await import("./webhook-security");
      
      const payload = '{"test": "data"}';
      const signature = crypto
        .createHmac("sha256", "meu-app-secret")
        .update(payload, "utf8")
        .digest("hex");
      
      expect(verifyMetaSignature(payload, `sha256=${signature}`)).toBe(true);
    });

    it("deve retornar false para assinatura inválida", async () => {
      process.env.META_APP_SECRET = "meu-app-secret";
      vi.resetModules();
      const { verifyMetaSignature } = await import("./webhook-security");
      expect(verifyMetaSignature('{"test": "data"}', "sha256=assinatura-invalida")).toBe(false);
    });

    it("deve retornar false quando secret não configurado", async () => {
      delete process.env.META_APP_SECRET;
      vi.resetModules();
      const { verifyMetaSignature } = await import("./webhook-security");
      expect(verifyMetaSignature('{"test": "data"}', "sha256=qualquer")).toBe(false);
    });

    it("deve retornar false para header mal formatado", async () => {
      process.env.META_APP_SECRET = "meu-app-secret";
      vi.resetModules();
      const { verifyMetaSignature } = await import("./webhook-security");
      expect(verifyMetaSignature('{"test": "data"}', null as unknown as string)).toBe(false);
      expect(verifyMetaSignature('{"test": "data"}', "invalido")).toBe(false);
    });
  });

  describe("redactWebhookPayload", () => {
    it("deve redigir access_token", () => {
      const { redactWebhookPayload } = webhookSecurity;
      const redacted = redactWebhookPayload(payloadWithPii as Record<string, unknown>);
      expect(redacted.access_token).toBe("[REDACTED]");
    });

    it("deve redigir verify_token", () => {
      const { redactWebhookPayload } = webhookSecurity;
      const redacted = redactWebhookPayload(payloadWithPii as Record<string, unknown>);
      expect(redacted.verify_token).toBe("[REDACTED]");
    });

    it("deve mascarar emails", () => {
      const { redactWebhookPayload } = webhookSecurity;
      const redacted = redactWebhookPayload(payloadWithPii as Record<string, unknown>);
      const entry = (redacted.entry as Array<Record<string, unknown>>)[0];
      const changes = (entry.changes as Array<Record<string, unknown>>)[0];
      const value = changes.value as Record<string, unknown>;
      const from = value.from as Record<string, unknown>;
      
      expect(from.email).toContain("@");
      expect(from.email).not.toBe("usuario@email.com");
    });

    it("deve mascarar telefones", () => {
      const { redactWebhookPayload } = webhookSecurity;
      const redacted = redactWebhookPayload(payloadWithPii as Record<string, unknown>);
      const entry = (redacted.entry as Array<Record<string, unknown>>)[0];
      const changes = (entry.changes as Array<Record<string, unknown>>)[0];
      const value = changes.value as Record<string, unknown>;
      const from = value.from as Record<string, unknown>;
      
      expect(from.phone).toContain("****");
    });

    it("deve preservar dados não sensíveis", () => {
      const { redactWebhookPayload } = webhookSecurity;
      const redacted = redactWebhookPayload(instagramCommentPublic as Record<string, unknown>);
      
      expect(redacted.object).toBe("instagram");
      const entry = (redacted.entry as Array<Record<string, unknown>>)[0];
      expect(entry.id).toBe("17841405710000000");
    });
  });

  describe("getWebhookEventId", () => {
    it("deve extrair id do campo id", () => {
      const { getWebhookEventId } = webhookSecurity;
      expect(getWebhookEventId({ id: "event-123" })).toBe("event-123");
    });

    it("deve extrair id de entry[0].id", () => {
      const { getWebhookEventId } = webhookSecurity;
      expect(getWebhookEventId({ entry: [{ id: "entry-123" }] })).toBe("entry-123");
    });

    it("deve extrair id de mensagem (DM) - prioriza entry.id se existir", () => {
      const { getWebhookEventId } = webhookSecurity;
      // O fixture de DM tem entry.id, então retorna entry.id ao invés de mid
      const id = getWebhookEventId(instagramDmProhibited as Record<string, unknown>);
      expect(id).toBeDefined();
    });

    it("deve extrair entry.id de comentário (quando entry.id existe)", () => {
      const { getWebhookEventId } = webhookSecurity;
      const id = getWebhookEventId(instagramCommentPublic as Record<string, unknown>);
      // A função prioriza entry[0].id quando existe
      expect(id).toBe("17841405710000000");
    });

    it("deve extrair comment_id quando não há entry.id", () => {
      const { getWebhookEventId } = webhookSecurity;
      const payloadWithoutEntryId = {
        object: "instagram",
        entry: [{
          time: 1714400000,
          changes: [{
            field: "comments",
            value: {
              comment_id: "17900000000000000",
              media_id: "17900000000000001"
            }
          }]
        }]
      };
      const id = getWebhookEventId(payloadWithoutEntryId);
      expect(id).toBe("17900000000000000");
    });

    it("deve retornar null quando não encontrar id", () => {
      const { getWebhookEventId } = webhookSecurity;
      expect(getWebhookEventId({})).toBeNull();
    });
  });

  describe("validateWebhookPayloadSize", () => {
    it("deve aceitar payload dentro do limite", async () => {
      process.env.META_WEBHOOK_MAX_PAYLOAD_BYTES = "262144";
      const { validateWebhookPayloadSize } = await import("./webhook-security");
      const payload = JSON.stringify({ test: "data" });
      const result = validateWebhookPayloadSize(payload);
      expect(result.valid).toBe(true);
    });

    it("deve rejeitar payload vazio", async () => {
      process.env.META_WEBHOOK_MAX_PAYLOAD_BYTES = "262144";
      const { validateWebhookPayloadSize } = await import("./webhook-security");
      const result = validateWebhookPayloadSize("");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("vazio");
    });

    it("deve rejeitar payload acima do limite", async () => {
      process.env.META_WEBHOOK_MAX_PAYLOAD_BYTES = "262144";
      const { validateWebhookPayloadSize } = await import("./webhook-security");
      const bigPayload = "x".repeat(300000);
      const result = validateWebhookPayloadSize(bigPayload);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("limite");
    });
  });

  describe("isAllowedWebhookObject", () => {
    it("deve aceitar instagram", () => {
      const { isAllowedWebhookObject } = webhookSecurity;
      expect(isAllowedWebhookObject("instagram")).toBe(true);
      expect(isAllowedWebhookObject("INSTAGRAM")).toBe(true);
    });

    it("deve rejeitar objetos não permitidos (facebook)", () => {
      const { isAllowedWebhookObject } = webhookSecurity;
      expect(isAllowedWebhookObject("facebook")).toBe(false);
    });

    it("deve rejeitar objeto inválido do fixture", () => {
      const { isAllowedWebhookObject } = webhookSecurity;
      expect(isAllowedWebhookObject((invalidObject as Record<string, unknown>).object as string)).toBe(false);
    });
  });

  describe("isProhibitedEventType", () => {
    it("deve identificar eventos proibidos", () => {
      const { isProhibitedEventType } = webhookSecurity;
      expect(isProhibitedEventType("direct_messages")).toBe(true);
      expect(isProhibitedEventType("messaging")).toBe(true);
      expect(isProhibitedEventType("message_reads")).toBe(true);
      expect(isProhibitedEventType("followers")).toBe(true);
      expect(isProhibitedEventType("user_profile_data")).toBe(true);
    });

    it("deve identificar DM como proibido", () => {
      const { isProhibitedEventType, extractWebhookInfo } = webhookSecurity;
      const info = extractWebhookInfo(instagramDmProhibited as Record<string, unknown>);
      expect(isProhibitedEventType(info.eventType)).toBe(true);
    });

    it("deve identificar followers como proibido", () => {
      const { isProhibitedEventType, extractWebhookInfo } = webhookSecurity;
      const info = extractWebhookInfo(instagramFollowerProhibited as Record<string, unknown>);
      expect(isProhibitedEventType(info.eventType)).toBe(true);
    });

    it("deve permitir comentários", () => {
      const { isProhibitedEventType } = webhookSecurity;
      expect(isProhibitedEventType("comments")).toBe(false);
    });

    it("deve permitir menções", () => {
      const { isProhibitedEventType } = webhookSecurity;
      expect(isProhibitedEventType("mentions")).toBe(false);
    });

    it("deve retornar false para null", () => {
      const { isProhibitedEventType } = webhookSecurity;
      expect(isProhibitedEventType(null as unknown as string)).toBe(false);
    });
  });

  describe("isAllowedEventType", () => {
    it("deve identificar eventos permitidos", () => {
      const { isAllowedEventType } = webhookSecurity;
      expect(isAllowedEventType("comments")).toBe(true);
      expect(isAllowedEventType("mentions")).toBe(true);
      expect(isAllowedEventType("media")).toBe(true);
    });

    it("deve identificar comentário como permitido", () => {
      const { isAllowedEventType, extractWebhookInfo } = webhookSecurity;
      const info = extractWebhookInfo(instagramCommentPublic as Record<string, unknown>);
      expect(isAllowedEventType(info.eventType)).toBe(true);
    });

    it("deve identificar menção como permitida", () => {
      const { isAllowedEventType, extractWebhookInfo } = webhookSecurity;
      const info = extractWebhookInfo(instagramMentionPublic as Record<string, unknown>);
      expect(isAllowedEventType(info.eventType)).toBe(true);
    });

    it("deve rejeitar DMs", () => {
      const { isAllowedEventType } = webhookSecurity;
      expect(isAllowedEventType("messaging")).toBe(false);
    });

    it("deve rejeitar seguidores", () => {
      const { isAllowedEventType } = webhookSecurity;
      expect(isAllowedEventType("followers")).toBe(false);
    });

    it("deve retornar false para null", () => {
      const { isAllowedEventType } = webhookSecurity;
      expect(isAllowedEventType(null as unknown as string)).toBe(false);
    });
  });

  describe("extractWebhookInfo", () => {
    it("deve extrair informações de comentário público", () => {
      const { extractWebhookInfo } = webhookSecurity;
      const info = extractWebhookInfo(instagramCommentPublic as Record<string, unknown>);
      expect(info.objectType).toBe("instagram");
      expect(info.eventType).toBe("comments");
      expect(info.externalId).toBe("17841405710000000");
    });

    it("deve extrair informações de menção pública", () => {
      const { extractWebhookInfo } = webhookSecurity;
      const info = extractWebhookInfo(instagramMentionPublic as Record<string, unknown>);
      expect(info.objectType).toBe("instagram");
      expect(info.eventType).toBe("mentions");
    });

    it("deve identificar DM como messaging", () => {
      const { extractWebhookInfo } = webhookSecurity;
      const info = extractWebhookInfo(instagramDmProhibited as Record<string, unknown>);
      expect(info.objectType).toBe("instagram");
      expect(info.eventType).toBe("messaging");
    });

    it("deve identificar followers", () => {
      const { extractWebhookInfo } = webhookSecurity;
      const info = extractWebhookInfo(instagramFollowerProhibited as Record<string, unknown>);
      expect(info.eventType).toBe("followers");
    });

    it("deve lidar com payload vazio", () => {
      const { extractWebhookInfo } = webhookSecurity;
      const info = extractWebhookInfo({});
      expect(info.objectType).toBeNull();
      expect(info.eventType).toBeNull();
      expect(info.externalId).toBeNull();
    });
  });

  describe("sanitizeErrorMessage", () => {
    it("deve redigir access_token na mensagem", () => {
      const { sanitizeErrorMessage } = webhookSecurity;
      const message = "Erro no token: access_token=secret123";
      expect(sanitizeErrorMessage(message)).toContain("[REDACTED]");
      expect(sanitizeErrorMessage(message)).not.toContain("secret123");
    });

    it("deve redigir app_secret na mensagem", () => {
      const { sanitizeErrorMessage } = webhookSecurity;
      const message = "app_secret=supersecreto erro";
      expect(sanitizeErrorMessage(message)).toContain("[REDACTED]");
    });

    it("deve redigir verify_token na mensagem", () => {
      const { sanitizeErrorMessage } = webhookSecurity;
      const message = "verify_token=mytoken error";
      expect(sanitizeErrorMessage(message)).toContain("[REDACTED]");
    });

    it("deve redigir Bearer token", () => {
      const { sanitizeErrorMessage } = webhookSecurity;
      const message = "Authorization: Bearer eyJhbGciOiJIUzI1NiIs";
      expect(sanitizeErrorMessage(message)).toContain("[REDACTED]");
    });

    it("deve redigir assinatura sha256", () => {
      const { sanitizeErrorMessage } = webhookSecurity;
      const message = "Signature: sha256=a1b2c3d4e5f6...";
      expect(sanitizeErrorMessage(message)).toContain("[SIGNATURE_REDACTED]");
    });

    it("deve retornar mensagem original se não houver segredos", () => {
      const { sanitizeErrorMessage } = webhookSecurity;
      const message = "Erro de conexão com o banco";
      expect(sanitizeErrorMessage(message)).toBe(message);
    });
  });

  describe("isWebhookEnabled", () => {
    it("deve retornar false quando não configurado", async () => {
      delete process.env.META_WEBHOOK_ENABLED;
      vi.resetModules();
      const { isWebhookEnabled } = await import("./webhook-security");
      expect(isWebhookEnabled()).toBe(false);
    });

    it("deve retornar true quando META_WEBHOOK_ENABLED=true", async () => {
      process.env.META_WEBHOOK_ENABLED = "true";
      vi.resetModules();
      const { isWebhookEnabled } = await import("./webhook-security");
      expect(isWebhookEnabled()).toBe(true);
    });

    it("deve retornar false quando META_WEBHOOK_ENABLED=false", async () => {
      process.env.META_WEBHOOK_ENABLED = "false";
      vi.resetModules();
      const { isWebhookEnabled } = await import("./webhook-security");
      expect(isWebhookEnabled()).toBe(false);
    });
  });

  describe("isWebhookConfigured", () => {
    it("deve retornar false quando não configurado", async () => {
      delete process.env.META_APP_SECRET;
      vi.resetModules();
      const { isWebhookConfigured } = await import("./webhook-security");
      expect(isWebhookConfigured()).toBe(false);
    });

    it("deve retornar false quando META_APP_SECRET vazio", async () => {
      process.env.META_APP_SECRET = "";
      vi.resetModules();
      const { isWebhookConfigured } = await import("./webhook-security");
      expect(isWebhookConfigured()).toBe(false);
    });

    it("deve retornar true quando META_APP_SECRET configurado", async () => {
      process.env.META_APP_SECRET = "meu-secret";
      vi.resetModules();
      const { isWebhookConfigured } = await import("./webhook-security");
      expect(isWebhookConfigured()).toBe(true);
    });
  });
});
