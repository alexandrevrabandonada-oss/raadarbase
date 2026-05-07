import { expect, test } from "@playwright/test";

test.describe("Radar de Silêncios - Impacto", () => {
  test("página de impacto renderiza", async ({ page }) => {
    await page.goto("/radar/silencios/impacto");

    await expect(page.getByRole("heading", { name: "Impacto das Ações Corretivas" })).toBeVisible();
    await expect(page.getByText("Ações criadas")).toBeVisible();
    await expect(page.getByText("Tabela de impacto por ação")).toBeVisible();
  });

  test("não exibe marcadores sensíveis no conteúdo", async ({ page }) => {
    await page.goto("/radar/silencios/impacto");

    const content = await page.locator("body").innerText();
    expect(content.toLowerCase()).not.toContain("token");
    expect(content.toLowerCase()).not.toContain("username");
    expect(content.toLowerCase()).not.toContain("comment");
  });

  test("exportação de impacto não retorna PII", async ({ request }) => {
    const response = await request.get("/api/radar/silencios/impacto/export");
    expect(response.ok()).toBeTruthy();

    const payload = await response.text();
    expect(payload.toLowerCase()).not.toContain("username");
    expect(payload.toLowerCase()).not.toContain("email");
    expect(payload.toLowerCase()).not.toContain("token");
    expect(payload.toLowerCase()).not.toContain("comment");
  });
});
