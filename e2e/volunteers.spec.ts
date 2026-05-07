import { expect, test } from "@playwright/test";

test.describe("Volunteers Module", () => {
  test("should render volunteers main page even when empty", async ({ page }) => {
    await page.goto("/voluntarios");
    await expect(page.locator("h1")).toContainText("Voluntários");
    await expect(page.getByText("Novo voluntário")).toBeVisible();
    await expect(page.getByText("base de interações do Instagram", { exact: false })).toBeVisible();
  });

  test("should render consent-first volunteer form", async ({ page }) => {
    await page.goto("/voluntarios/novo");
    await expect(page.locator("h1")).toContainText("Novo voluntário");
    await expect(page.getByText("Consentimento explícito", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Nenhum comentário ou interação do Instagram cria voluntário automaticamente.")).toBeVisible();
  });

  test("should render squads page", async ({ page }) => {
    await page.goto("/voluntarios/squads");
    await expect(page.locator("h1")).toContainText("Squads");
    await expect(page.getByRole("button", { name: "Criar squad" })).toBeVisible();
  });

  test("default export should omit contact fields", async ({ request }) => {
    const response = await request.get("/api/voluntarios/export");
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(Array.isArray(body)).toBeTruthy();

    if (body.length > 0) {
      expect(body[0]).not.toHaveProperty("contact_email");
      expect(body[0]).not.toHaveProperty("contact_phone");
    }
  });
});