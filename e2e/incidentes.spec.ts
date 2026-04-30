import { test, expect } from "@playwright/test";

test.describe("Incidentes", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/operacao/incidentes");
  });

  test("deve renderizar a página de incidentes", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Incidentes Operacionais" })).toBeVisible();
    await expect(page.getByText("Incidentes abertos")).toBeVisible();
  });

  test("deve permitir visualizar a tabela de incidentes", async ({ page }) => {
    const table = page.getByRole("table");
    await expect(table).toBeVisible();
    await expect(table.getByRole("columnheader", { name: "Severidade" })).toBeVisible();
    await expect(table.getByRole("columnheader", { name: "Título" })).toBeVisible();
  });

  test("healthcheck não deve expor segredos", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    
    expect(body).toHaveProperty("incident_open_count");
    expect(body).toHaveProperty("critical_incident_count");
    expect(body.webhook_ready).toBe(false);

    const text = await response.text();
    expect(text).not.toContain("access_token");
    expect(text).not.toContain("service_role");
  });
});
