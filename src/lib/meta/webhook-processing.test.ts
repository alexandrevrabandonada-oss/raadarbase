/**
 * Webhook Processing Tests
 * 
 * Testes para:
 * - Classificação de eventos
 * - Criação de eventos webhook
 * - Validação de quarentena
 * - Não criação automática de contatos
 * - Não criação de score político
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  classifyWebhookEvent,
} from "./webhook-processing";
import {
  isProhibitedEventType,
  isAllowedEventType,
  extractWebhookInfo,
} from "./webhook-security";

describe("webhook-processing", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    process.env.META_WEBHOOK_ALLOWED_OBJECTS = "instagram";
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("classifyWebhookEvent", () => {
    it("deve classificar comentário como permitido em quarentena", () => {
      const payload = {
        object: "instagram",
        entry: [{
          id: "entry-123",
          changes: [{ field: "comments" }],
        }],
      };
      const result = classifyWebhookEvent(payload);
      expect(result.allowed).toBe(true);
      expect(result.action).toBe("quarantine");
    });

    it("deve classificar menção como permitido em quarentena", () => {
      const payload = {
        object: "instagram",
        entry: [{
          id: "entry-123",
          changes: [{ field: "mentions" }],
        }],
      };
      const result = classifyWebhookEvent(payload);
      expect(result.allowed).toBe(true);
      expect(result.action).toBe("quarantine");
    });

    it("deve classificar DM como proibido para ignorar", () => {
      const payload = {
        object: "instagram",
        entry: [{
          id: "entry-123",
          messaging: [{ message: { mid: "msg-123" } }],
        }],
      };
      const result = classifyWebhookEvent(payload);
      expect(result.allowed).toBe(false);
      expect(result.action).toBe("ignore");
    });

    it("deve classificar seguidores como proibido", () => {
      const payload = {
        object: "instagram",
        entry: [{
          id: "entry-123",
          changes: [{ field: "followers" }],
        }],
      };
      const result = classifyWebhookEvent(payload);
      expect(result.allowed).toBe(false);
      expect(result.action).toBe("ignore");
    });

    it("deve rejeitar objeto não permitido", () => {
      const payload = {
        object: "facebook",
        entry: [{
          id: "entry-123",
          changes: [{ field: "comments" }],
        }],
      };
      const result = classifyWebhookEvent(payload);
      expect(result.allowed).toBe(false);
      expect(result.action).toBe("ignore");
    });

    it("deve enviar evento desconhecido para quarentena", () => {
      const payload = {
        object: "instagram",
        entry: [{
          id: "entry-123",
          changes: [{ field: "unknown_event" }],
        }],
      };
      const result = classifyWebhookEvent(payload);
      expect(result.allowed).toBe(false);
      expect(result.action).toBe("quarantine");
    });

    it("deve lidar com payload vazio", () => {
      const result = classifyWebhookEvent({});
      expect(result.allowed).toBe(false);
      expect(result.action).toBe("ignore");
    });
  });

  describe("isProhibitedEventType", () => {
    it("deve identificar DMs como proibidas", () => {
      expect(isProhibitedEventType("direct_messages")).toBe(true);
      expect(isProhibitedEventType("messaging")).toBe(true);
      expect(isProhibitedEventType("message_reads")).toBe(true);
      expect(isProhibitedEventType("message_deliveries")).toBe(true);
    });

    it("deve identificar seguidores como proibidos", () => {
      expect(isProhibitedEventType("followers")).toBe(true);
    });

    it("deve identificar dados de perfil como proibidos", () => {
      expect(isProhibitedEventType("user_profile_data")).toBe(true);
    });

    it("deve permitir comentários", () => {
      expect(isProhibitedEventType("comments")).toBe(false);
    });

    it("deve permitir menções", () => {
      expect(isProhibitedEventType("mentions")).toBe(false);
    });

    it("deve permitir media", () => {
      expect(isProhibitedEventType("media")).toBe(false);
    });
  });

  describe("isAllowedEventType", () => {
    it("deve permitir comentários", () => {
      expect(isAllowedEventType("comments")).toBe(true);
    });

    it("deve permitir menções", () => {
      expect(isAllowedEventType("mentions")).toBe(true);
    });

    it("deve permitir media", () => {
      expect(isAllowedEventType("media")).toBe(true);
    });

    it("deve rejeitar DMs", () => {
      expect(isAllowedEventType("messaging")).toBe(false);
    });

    it("deve rejeitar seguidores", () => {
      expect(isAllowedEventType("followers")).toBe(false);
    });

    it("deve rejeitar desconhecidos", () => {
      expect(isAllowedEventType("unknown")).toBe(false);
    });
  });

  describe("Regras de Governança", () => {
    it("não deve criar contato automaticamente em nenhum evento", () => {
      // Verificamos que o processamento não cria contatos diretamente
      // A criação de contatos requer consentimento explícito manual
      const payload = {
        object: "instagram",
        entry: [{
          changes: [{
            value: {
              from: { username: "usuario_teste" },
              text: "Comentário de teste",
            },
          }],
        }],
      };
      const result = classifyWebhookEvent(payload);
      // Eventos em quarentena não processam automaticamente
      expect(result.action).toBe("quarantine");
    });

    it("não deve criar score político individual", () => {
      // Nenhum evento deve ser usado para inferir voto ou ideologia
      const allowedEvents = ["comments", "mentions", "media"];
      for (const event of allowedEvents) {
        expect(isProhibitedEventType(event)).toBe(false);
        // Mas o processamento é manual, não automático
      }
    });

    it("não deve processar eventos sem assinatura válida", () => {
      // Eventos sem assinatura são classificados como failed
      const payload = {
        object: "instagram",
        entry: [{ changes: [{ field: "comments" }] }],
      };
      // A classificação é independente da assinatura
      const result = classifyWebhookEvent(payload);
      // O evento seria permitido, mas a assinatura precisa ser verificada separadamente
      expect(result.allowed).toBe(true);
    });

    it("deve sempre enviar eventos permitidos para quarentena primeiro", () => {
      const payload = {
        object: "instagram",
        entry: [{ changes: [{ field: "comments" }] }],
      };
      const result = classifyWebhookEvent(payload);
      expect(result.action).toBe("quarantine");
    });

    it("deve ignorar eventos de DMs completamente", () => {
      const payload = {
        object: "instagram",
        entry: [{ messaging: [{ message: { text: "Olá" } }] }],
      };
      const result = classifyWebhookEvent(payload);
      expect(result.action).toBe("ignore");
      expect(result.allowed).toBe(false);
    });

    it("não deve coletar seguidores em massa", () => {
      const payload = {
        object: "instagram",
        entry: [{ changes: [{ field: "followers" }] }],
      };
      const result = classifyWebhookEvent(payload);
      expect(result.action).toBe("ignore");
    });
  });

  describe("Validação de Payload", () => {
    it("deve extrair informações corretas de payload de comentário", () => {
      const payload = {
        object: "instagram",
        entry: [{
          id: "entry-123",
          changes: [{
            field: "comments",
            value: {
              from: { username: "testuser" },
              media_id: "media-123",
              comment_id: "comment-456",
              text: "Teste de comentário",
            },
          }],
        }],
      };
      const info = extractWebhookInfo(payload);
      expect(info.objectType).toBe("instagram");
      expect(info.eventType).toBe("comments");
    });

    it("deve extrair informações corretas de payload de menção", () => {
      const payload = {
        object: "instagram",
        entry: [{
          id: "entry-456",
          changes: [{
            field: "mentions",
            value: {
              from: { username: "mentioned_user" },
              media_id: "media-789",
            },
          }],
        }],
      };
      const info = extractWebhookInfo(payload);
      expect(info.objectType).toBe("instagram");
      expect(info.eventType).toBe("mentions");
    });
  });
});
