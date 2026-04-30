import { test, expect } from "@playwright/test";

test.describe("Governança", () => {
  test.beforeEach(async ({ page }) => {
    // E2E_BYPASS_AUTH deve estar ativo no ambiente de teste
    await page.goto("/governanca");
  });

  test("deve renderizar a página de governança corretamente", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Governança" })).toBeVisible();
    await expect(page.locator("#governance-warning")).toBeVisible();
    await expect(page.getByText("O Radar de Base organiza abordagem manual")).toBeVisible();
  });

  test("deve mostrar os cards de checklist", async ({ page }) => {
    await expect(page.getByText("Checklist operacional")).toBeVisible();
    await expect(page.getByText("Checklist LGPD / Campanha")).toBeVisible();
  });

  test("deve mostrar as permissões ativas", async ({ page }) => {
    await expect(page.getByText("Permissões ativas")).toBeVisible();
    // No modo bypass admin, esperamos ver permissões de admin
    await expect(page.getByText("exportar contatos")).toBeVisible();
  });

  test("não deve expor segredos no HTML", async ({ page }) => {
    const content = await page.content();
    expect(content).not.toContain("access_token");
    expect(content).not.toContain("service_role");
  });
});
