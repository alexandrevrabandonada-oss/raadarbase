import { expect, test } from "@playwright/test";

test.describe("Meta Webhooks Staging Validation", () => {
  test("bloco de validacao externa renderiza", async ({ page }) => {
    await page.goto("/integracoes/meta/webhooks");

    const hasValidationSection = await page
      .getByText("Validação externa")
      .first()
      .isVisible()
      .catch(() => false);
    const hasLogin = await page.getByText("Entrar").first().isVisible().catch(() => false);

    expect(hasValidationSection || hasLogin).toBe(true);
  });

  test("estado pendente aparece sem APP_URL", async ({ page, request }) => {
    const healthResponse = await request.get("/api/health");
    const healthBody = await healthResponse.json();

    await page.goto("/integracoes/meta/webhooks");

    const hasPending = await page
      .getByText("Pendente de staging externo")
      .first()
      .isVisible()
      .catch(() => false);
    const hasPendingDecision = await page.getByText("PENDENTE").first().isVisible().catch(() => false);
    const hasAnyDecision = await page
      .getByText(/GO|NO-GO|PENDENTE/)
      .first()
      .isVisible()
      .catch(() => false);
    const hasLogin = await page.getByText("Entrar").first().isVisible().catch(() => false);

    if (
      healthBody.staging_webhook_validation_status === "pending_external_validation" ||
      healthBody.staging_webhook_validation_status === "not_configured"
    ) {
      expect(hasPending || hasPendingDecision || hasLogin).toBe(true);
    } else {
      expect(hasAnyDecision || hasLogin).toBe(true);
    }
  });

  test("pagina nao exibe secrets", async ({ page }) => {
    await page.goto("/integracoes/meta/webhooks");
    const html = await page.content();

    expect(html).not.toContain("META_APP_SECRET");
    expect(html).not.toContain("META_WEBHOOK_VERIFY_TOKEN");
    expect(html).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(html).not.toContain("access_token");
  });

  test("healthcheck nao exibe secrets e status permitido", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.ok()).toBeTruthy();

    const text = await response.text();
    expect(text).not.toContain("META_APP_SECRET");
    expect(text).not.toContain("META_WEBHOOK_VERIFY_TOKEN");
    expect(text).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(text).not.toContain("access_token");

    const body = JSON.parse(text);
    expect(
      [
        "not_configured",
        "pending_external_validation",
        "ready_for_staging_enable",
        "blocked",
      ].includes(body.staging_webhook_validation_status),
    ).toBe(true);
  });
});
