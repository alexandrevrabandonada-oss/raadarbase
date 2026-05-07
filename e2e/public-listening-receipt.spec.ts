import { test, expect } from "@playwright/test";

test.describe("Public Listening Receipt", () => {
  test.beforeEach(async ({ page }) => {
    // Note: This is a public page, so no login is performed here.
  });

  test("renders public receipt without authentication", async ({ page }) => {
    await page.goto("/recibo/escuta");
    
    await expect(page.locator("text=Recibo Público da Escuta")).toBeVisible();
    await expect(page.locator("text=Este recibo mostra dados agregados de escuta pública.")).toBeVisible();
    
    // Check if shareable summary exists
    await expect(page.locator("text=Copiar texto (WhatsApp)")).toBeVisible();
    
    // Check export buttons
    const htmlExportLink = await page.locator("a[href*='format=html']").getAttribute("href");
    expect(htmlExportLink).toBeTruthy();

    const mdExportLink = await page.locator("a[href*='format=markdown']").getAttribute("href");
    expect(mdExportLink).toBeTruthy();
  });

  test("export endpoint returns valid HTML without PII", async ({ request }) => {
    const response = await request.get("/api/recibo/escuta/export?format=html");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("text/html");
    
    const htmlText = await response.text();
    expect(htmlText).toContain("Recibo Público da Escuta");
    expect(htmlText).toContain("Recibo público agregado");
    
    // Verify absence of typical PII signatures
    expect(htmlText).not.toMatch(/@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    expect(htmlText).not.toMatch(/\b\d{4,5}-?\d{4}\b/);
  });
  
  test("export endpoint returns valid Markdown without PII", async ({ request }) => {
    const response = await request.get("/api/recibo/escuta/export?format=markdown");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("text/markdown");
    
    const mdText = await response.text();
    expect(mdText).toContain("# Recibo Público da Escuta");
    
    // Verify absence of typical PII signatures
    expect(mdText).not.toMatch(/@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    expect(mdText).not.toMatch(/\b\d{4,5}-?\d{4}\b/);
  });
});
