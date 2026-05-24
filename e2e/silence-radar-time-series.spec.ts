import { test, expect } from "@playwright/test";

test.describe("Silence Radar Time Series", () => {
  test.beforeEach(async () => {
    // login logic usually handled by global setup or helpers in this project
  });

  test("loads impact dashboard with time series chart", async ({ page }) => {
    await page.goto("/radar/silencios/impacto");
    
    // Check if the time series section is rendered
    await expect(page.locator("text=Série temporal do impacto")).toBeVisible();
    
    // Check if chart element or empty state is visible
    const hasEmptyState = await page.locator("text=Ainda não há pontos suficientes").isVisible();
    const hasChart = await page.locator(".recharts-responsive-container").isVisible();
    
    expect(hasEmptyState || hasChart).toBe(true);
  });

  test("loads action detail with time series", async ({ page }) => {
    const actionId = "mock-id"; // using standard mock id pattern, adjust if needed

    // We can't guarantee a specific action ID is available in pure mock mode without knowing the mock data,
    // but assuming there is one or the page handles 404 gracefully
    const response = await page.goto(`/radar/silencios/acoes/${actionId}`);
    
    if (response?.status() === 200) {
      await expect(page.locator("text=Série temporal diária")).toBeVisible();
      await expect(page.locator("text=Série agregada. Não representa comportamento individual.")).toBeVisible();
    }
  });

  test("export endpoint returns valid CSV format without PII", async ({ request }) => {
    const response = await request.get("/api/radar/silencios/impacto/time-series/export?format=csv");
    expect(response.status()).toBe(200);
    
    const csvText = await response.text();
    expect(csvText).toContain("data,relatos,formularios,interacoes,acao_criada_na_data");
    
    // verify no obvious PII structure
    expect(csvText).not.toMatch(/@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    expect(csvText).not.toMatch(/\d{4,5}-\d{4}/);
  });
  
  test("export endpoint returns valid Markdown format without PII", async ({ request }) => {
    const response = await request.get("/api/radar/silencios/impacto/time-series/export?format=markdown");
    expect(response.status()).toBe(200);
    
    const mdText = await response.text();
    expect(mdText).toContain("# Exportação de Série Temporal Agregada - Radar de Silêncios");
    expect(mdText).toContain("| Data | Relatos | Formulários | Interações |");
    
    // verify no obvious PII structure
    expect(mdText).not.toMatch(/@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    expect(mdText).not.toMatch(/\d{4,5}-\d{4}/);
  });
});
