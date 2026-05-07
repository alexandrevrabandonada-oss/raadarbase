import { expect, test } from "@playwright/test";

test("evidência operacional Meta renderiza e exporta sem PII", async ({ page, request }) => {
  await page.goto("/operacao/meta-reconciliacao");

  await expect(page.getByRole("heading", { name: "Reconciliação Meta" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Gerar evidência operacional" })).toBeVisible();
  await expect(page.getByText("Histórico de evidências")).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Hash curto" })).toBeVisible();

  await page.goto("/operacao/meta-reconciliacao/evidencias/mock-meta-reconciliation-evidence");
  await expect(page.getByRole("heading", { name: "Detalhe da evidência operacional" })).toBeVisible();
  await expect(page.getByText("Audit logs relacionados")).toBeVisible();
  await expect(page.locator('a[href*="/api/meta/reconciliation/evidence/mock-meta-reconciliation-evidence/export?format=markdown"]')).toBeVisible();
  await expect(page.locator('a[href*="/api/meta/reconciliation/evidence/mock-meta-reconciliation-evidence/export?format=html"]')).toBeVisible();

  const exportResponse = await request.get("/api/meta/reconciliation/evidence/mock-meta-reconciliation-evidence/export?format=markdown");
  expect(exportResponse.ok()).toBeTruthy();

  const exportBody = await exportResponse.text();
  expect(exportBody).toContain("Evidência Operacional Meta");
  expect(exportBody).toContain("Evidência operacional agregada. Não contém dados pessoais, comentários, payload bruto ou tokens.");
  expect(exportBody).not.toContain("demo@radardebase.local");
  expect(exportBody).not.toContain("operador@example.com");
  expect(exportBody).not.toContain("raw_payload");
  expect(exportBody).not.toContain("service_role");

  const pageBody = await page.textContent("body");
  expect(pageBody).not.toContain("service_role");
  expect(pageBody).not.toContain("META_ACCESS_TOKEN");
});
