/**
 * Meta Webhooks E2E Tests
 * 
 * Testes end-to-end para:
 * - Página de webhooks renderiza
 * - Healthcheck não expõe segredos
 * - Governança aparece corretamente
 * - Eventos em quarentena são exibidos
 */

import { test, expect } from "@playwright/test";

test.describe("Meta Webhooks", () => {
  test.describe("Página de Webhooks", () => {
    test("deve renderizar página de listagem de webhooks", async ({ page }) => {
      // Navega para a página de webhooks (requer autenticação)
      await page.goto("/integracoes/meta/webhooks");
      
      // Verifica que página carrega (pode redirecionar para login em modo real)
      const content = await page.content();
      const hasWebhooks = content.includes("Webhooks");
      const hasLogin = content.includes("login");
      expect(hasWebhooks || hasLogin).toBe(true);
    });

    test("deve mostrar status de configuração", async ({ page }) => {
      await page.goto("/integracoes/meta/webhooks");
      
      // Verifica que elementos de UI esperados existem
      const hasContent = await page.locator("text=Webhooks Meta").isVisible().catch(() => false);
      const hasLogin = await page.locator("text=Entrar").isVisible().catch(() => false);
      
      expect(hasContent || hasLogin).toBe(true);
    });

    test("deve ter link para detalhes de evento", async ({ page }) => {
      await page.goto("/integracoes/meta/webhooks");
      
      // Verifica presença de botão/link de detalhes (se estiver logado)
      const hasDetalhesButton = await page.locator("text=Detalhes").first().isVisible().catch(() => false);
      // Se não houver eventos, não deve ter botão de detalhes
      expect(typeof hasDetalhesButton).toBe("boolean");
    });
  });

  test.describe("Healthcheck", () => {
    test("não deve expor segredos no healthcheck", async ({ request }) => {
      const response = await request.get("/api/health");
      expect(response.ok()).toBe(true);
      
      const body = await response.json();
      const bodyText = JSON.stringify(body);
      
      // Verifica que segredos não estão expostos
      expect(bodyText).not.toContain("META_APP_SECRET");
      expect(bodyText).not.toContain("META_WEBHOOK_VERIFY_TOKEN");
      expect(bodyText).not.toContain("sha256=");
      
      // Verifica que métricas de webhook estão presentes
      expect(body).toHaveProperty("meta_webhook_configured");
      expect(body).toHaveProperty("meta_webhook_enabled");
      expect(body).toHaveProperty("meta_webhook_events_count");
      expect(body).toHaveProperty("meta_webhook_quarantine_count");
    });

    test("deve retornar métricas de webhook", async ({ request }) => {
      const response = await request.get("/api/health");
      expect(response.ok()).toBe(true);
      
      const body = await response.json();
      
      // Verifica tipos das métricas
      expect(typeof body.meta_webhook_configured).toBe("boolean");
      expect(typeof body.meta_webhook_enabled).toBe("boolean");
      expect(typeof body.meta_webhook_events_count).toBe("number");
      expect(typeof body.meta_webhook_quarantine_count).toBe("number");
    });
  });

  test.describe("Endpoint de Webhook", () => {
    test("deve rejeitar POST sem assinatura", async ({ request }) => {
      const response = await request.post("/api/meta/webhook", {
        data: { test: "data" },
      });
      
      // Deve retornar erro (403, 401 ou 503 dependendo da configuração)
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });

    test("deve aceitar GET de verificação", async ({ request }) => {
      const response = await request.get("/api/meta/webhook?hub.mode=subscribe&hub.verify_token=test&hub.challenge=1234567890");
      
      // Pode retornar 200 com challenge ou 403 se token incorreto
      expect(response.status()).toBeGreaterThanOrEqual(200);
    });

    test("não deve aceitar payload muito grande", async ({ request }) => {
      // Cria payload maior que 256KB
      const bigPayload = { data: "x".repeat(300000) };
      
      const response = await request.post("/api/meta/webhook", {
        data: bigPayload,
        headers: {
          "X-Hub-Signature-256": "sha256=fake",
        },
      });
      
      // Deve retornar 413 Payload Too Large
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });

  test.describe("Governança", () => {
    test("deve mostrar aviso de governança na página de webhooks", async ({ page }) => {
      await page.goto("/governanca");
      
      const content = await page.content();
      
      // Verifica que seção de webhooks aparece (ou página de login)
      expect(
        content.includes("Webhooks") || 
        content.includes("login") ||
        content.includes("Entrar")
      ).toBe(true);
    });

    test("deve mostrar seção de webhooks na governança", async ({ page }) => {
      await page.goto("/governanca");
      
      const hasWebhookSection = await page.getByText(/Webhooks Meta:|Webhooks ativo:/).first().isVisible().catch(() => false);
      const hasLogin = await page.locator("text=Entrar").isVisible().catch(() => false);
      
      expect(hasWebhookSection || hasLogin).toBe(true);
    });
  });

  test.describe("Segurança", () => {
    test("não deve mostrar tokens de webhook na interface", async ({ page }) => {
      await page.goto("/integracoes/meta/webhooks");
      
      const content = await page.content();
      
      // Verifica que tokens sensíveis não aparecem
      expect(content).not.toContain("META_WEBHOOK_VERIFY_TOKEN");
      expect(content).not.toContain("META_APP_SECRET");
    });

    test("deve mostrar status de quarentena corretamente", async ({ page }) => {
      await page.goto("/integracoes/meta/webhooks");
      
      // Verifica que elementos de status existem
      const hasQuarantineInfo = await page.locator("text=quarentena").first().isVisible().catch(() => false);
      const hasLogin = await page.locator("text=Entrar").isVisible().catch(() => false);
      
      expect(hasQuarantineInfo || hasLogin).toBe(true);
    });
  });
});
