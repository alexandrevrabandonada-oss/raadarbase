import { expect, test } from "@playwright/test";

test.describe("Volunteer public applications", () => {
  test("renders public consent-first application page", async ({ page }) => {
    await page.goto("/voluntarios/quero-ajudar");
    await expect(page.locator("h1")).toContainText("Quer ajudar a organizar");
    await expect(page.getByText("Seu cadastro será revisado por uma pessoa da equipe", { exact: false })).toBeVisible();
    await expect(page.getByText("Isso não cria abordagem automática.", { exact: false })).toBeVisible();
    await expect(page.getByLabel("Nome de exibição")).toBeVisible();
  });

  test("success page does not promise immediate return", async ({ page }) => {
    await page.goto("/voluntarios/quero-ajudar/sucesso");
    await expect(page.getByText("Inscrição recebida")).toBeVisible();
    await expect(page.getByText("não cria voluntário ativo automaticamente", { exact: false })).toBeVisible();
    await expect(page.getByText("Não há promessa de retorno imediato.")).toBeVisible();
  });

  test("internal queue hides contact in list", async ({ page }) => {
    await page.goto("/voluntarios/inscricoes");
    await expect(page.locator("h1")).toContainText("Inscrições de voluntariado");
    await expect(page.getByText("Nada vira voluntário ativo automaticamente.")).toBeVisible();
    await expect(page.getByText("Exportar seguro")).toBeVisible();
  });

  test("application export omits contact by default", async ({ request }) => {
    const response = await request.get("/api/voluntarios/inscricoes/export");
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(Array.isArray(body)).toBeTruthy();
    if (body.length > 0) {
      expect(body[0]).not.toHaveProperty("contact_email");
      expect(body[0]).not.toHaveProperty("contact_phone");
    }
  });

  test("volunteers main page links to applications", async ({ page }) => {
    await page.goto("/voluntarios");
    await expect(page.getByText("Ver inscrições")).toBeVisible();
  });
});
