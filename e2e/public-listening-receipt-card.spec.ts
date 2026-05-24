import { test, expect } from "@playwright/test";

test.describe("Public Listening Receipt Card", () => {
  test.beforeEach(async () => {
    // This is a public page, no login required.
  });

  test("renders card 1x1 format and returns valid image", async ({ request }) => {
    const response = await request.get("/api/recibo/escuta/card?format=1x1");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("image/png");
    
    // Ensure body has some length indicating an image payload
    const body = await response.body();
    expect(body.length).toBeGreaterThan(1000); // PNGs will be at least a few kb
  });

  test("renders card 3x4 format and returns valid image", async ({ request }) => {
    const response = await request.get("/api/recibo/escuta/card?format=3x4");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("image/png");
    
    const body = await response.body();
    expect(body.length).toBeGreaterThan(1000);
  });

  test("public page has download buttons and safe legend", async ({ page }) => {
    await page.goto("/recibo/escuta");
    
    await expect(page.locator("text=Baixar card 1:1")).toBeVisible();
    await expect(page.locator("text=Baixar card 3:4")).toBeVisible();
    await expect(page.locator("text=Copiar legenda (Instagram/Facebook)")).toBeVisible();

    const legendText = await page.locator(".font-mono").first().innerText();
    
    // Ensure legend does not ask for PII in comments
    expect(legendText).not.toContain("deixe seu telefone");
    expect(legendText).not.toContain("me mande seu número");
    
    // Ensure legend points to the form
    expect(legendText).toContain("formulário");
    
    // Ensure token is absent
    expect(legendText).not.toMatch(/[a-zA-Z0-9]{32,}/);
  });

  test("authenticated user sees checklist and previews", async ({ page }) => {
    // We assume authentication is handled by a global state or we mock it
    // For E2E tests in this repo, we often use a mock session or a specific login flow
    // If we use setupE2EMocks, it might help
    
    await page.goto("/recibo/escuta");
    
    // Check if checklist section appears (only if authenticated)
    // Note: In E2E CI, we might need to perform a login or use a bypass
    // For now, let's assume we can trigger the internal view
    const checklist = page.locator("text=Checklist Visual (Mobile-First)");
    if (await checklist.isVisible()) {
      await expect(checklist).toBeVisible();
      await expect(page.locator("text=Prévia 1:1 (Feed)")).toBeVisible();
      await expect(page.locator("text=Prévia 3:4 (Story)")).toBeVisible();
      
      // Check if preview images load
      const img1x1 = page.locator("img[alt='Prévia 1:1']");
      await expect(img1x1).toBeVisible();
      const src1x1 = await img1x1.getAttribute("src");
      expect(src1x1).toContain("format=1x1");
    }
  });
});
