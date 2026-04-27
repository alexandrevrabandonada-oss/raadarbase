import { expect, test } from "@playwright/test";

test("diagnostico mostra guardrails sem revelar segredos", async ({ page, request }) => {
  await page.goto("/configuracoes");

  await expect(page.getByText("Guardrails de produção")).toBeVisible();
  await expect(page.getByText("META_ACCESS_TOKEN ausente.")).toBeVisible();
  await expect(page.getByText("INSTAGRAM_BUSINESS_ACCOUNT_ID ausente.")).toBeVisible();

  const html = await page.locator("body").innerText();
  expect(html).not.toContain("fake-secret-token");
  expect(html).not.toContain("service_role");

  const response = await request.get("/api/health");
  const body = await response.json();
  expect(body.unsafe_production_warnings_count).toBeGreaterThan(0);
});