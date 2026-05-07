import { expect, test } from "@playwright/test";

test.describe("Volunteer review dashboard", () => {
  test("painel renderiza com checklist e sem PII/tokens", async ({ page }) => {
    await page.goto("/voluntarios/revisao-periodica");
    await expect(page.locator("h1")).toContainText("Revisão periódica de voluntariado");
    await expect(page.getByText("Checklist semanal de revisão")).toBeVisible();
    await expect(page.getByText("revisar pendentes novas")).toBeVisible();
    await expect(page.getByText("Nenhum contato é feito automaticamente.")).toBeVisible();
    const main = await page.locator("main").innerText();
    expect(main).not.toContain("service_role");
    expect(main).not.toMatch(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  });

  test("exportacao agregada nao contem contato", async ({ request }) => {
    const response = await request.get("/api/voluntarios/revisao-periodica/export");
    expect(response.ok()).toBeTruthy();
    const body = await response.text();
    expect(body).toContain("pending_90d_count");
    expect(body).not.toMatch(/contact|telefone|email|@/i);
  });

  test("voluntarios tem card de revisão periódica", async ({ page }) => {
    await page.goto("/voluntarios");
    await expect(page.getByText("Revisão periódica")).toBeVisible();
    await expect(page.getByText("Abrir revisão")).toBeVisible();
  });

  test("health expõe contadores seguros do painel", async ({ request }) => {
    const response = await request.get("/api/health");
    const body = await response.json();
    expect(body).toHaveProperty("volunteer_pending_7d_count");
    expect(body).toHaveProperty("volunteer_pending_30d_count");
    expect(body).toHaveProperty("volunteer_pending_90d_count");
    expect(body).toHaveProperty("volunteer_review_rounds_count");
    expect(body).toHaveProperty("latest_volunteer_review_round_status");
  });
});
