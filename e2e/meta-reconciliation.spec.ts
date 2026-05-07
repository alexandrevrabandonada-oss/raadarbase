import { expect, test } from "@playwright/test";

test("reconciliação Meta renderiza blocos principais sem segredos", async ({ page }) => {
  await page.goto("/operacao/meta-reconciliacao");

  await expect(page.getByRole("heading", { name: "Reconciliação Meta" })).toBeVisible();
  await expect(page.getByText("Posts no banco")).toBeVisible();
  await expect(page.getByText("Interações/comentários no banco")).toBeVisible();
  await expect(page.getByText("Pessoas no banco")).toBeVisible();
  await expect(page.getByText("Últimas sincronizações")).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Runs presas" })).toBeVisible();
  await expect(page.getByText("Nenhuma run iniciada sem finalização acima do limite operacional.")).toBeVisible();
  await expect(page.getByText("Possíveis divergências")).toBeVisible();

  const body = await page.textContent("body");
  expect(body).not.toContain("fake-secret-token");
  expect(body).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
  expect(body).not.toContain("service_role");
});

test("dashboard tem link para reconciliação Meta", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page.getByRole("link", { name: "Reconciliação Meta" }).first()).toBeVisible();
});
