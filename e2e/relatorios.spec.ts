import { test, expect } from "@playwright/test";

test.describe("Relatórios de Mobilização", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/relatorios");
  });

  test("deve renderizar a página de listagem de relatórios", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Relatórios de Mobilização" })).toBeVisible();
  });

  test("deve renderizar o formulário de novo relatório com aviso de governança", async ({ page }) => {
    await page.goto("/relatorios/novo");
    await expect(page.getByRole("heading", { name: "Novo Relatório de Mobilização" })).toBeVisible();
    await expect(page.getByText("Relatórios descrevem pautas públicas")).toBeVisible();
  });

  test("deve bloquear títulos com termos proibidos", async ({ page }) => {
    await page.goto("/relatorios/novo");
    await page.fill("#title", "Relatório de Voto Certo");
    await page.fill("#period_start", "2026-04-01");
    await page.fill("#period_end", "2026-04-30");
    await page.click('button:has-text("Criar Rascunho")');
    
    await expect(page.getByText('O termo "voto certo" é proibido')).toBeVisible();
  });
});
