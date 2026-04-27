import { expect, test } from "@playwright/test";

test("usuario nao autenticado e redirecionado ao tentar operacao", async ({ page }) => {
  await page.setExtraHTTPHeaders({ "x-e2e-bypass-auth": "off" });
  await page.goto("/operacao");
  await expect(page).toHaveURL(/\/login/);
});

test("usuario autenticado por bypass de teste acessa operacao", async ({ page }) => {
  test.skip(process.env.E2E_BYPASS_AUTH !== "true", "Defina E2E_BYPASS_AUTH=true em NODE_ENV=test.");
  await page.goto("/operacao");
  await expect(page.getByRole("heading", { name: "Operação" })).toBeVisible();
  await expect(page.getByText("Atenção operacional")).toBeVisible();
  await expect(page.getByText("Últimas sincronizações Meta")).toBeVisible();
});

test("detalhe da run nao mostra segredos", async ({ page }) => {
  await page.goto("/operacao/sync/mock-meta-sync");
  await expect(page.getByRole("heading", { name: "Detalhe da sincronização" })).toBeVisible();
  const text = await page.locator("body").innerText();
  expect(text).not.toContain("fake-secret-token");
  expect(text).not.toContain("service_role");
});
