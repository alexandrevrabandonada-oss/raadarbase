import { test, expect } from "@playwright/test";

test.describe("Temas e Taxonomia", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/temas");
  });

  test("deve renderizar a página de temas", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Temas e Pautas" })).toBeVisible();
    await expect(page.getByText("Saúde")).toBeVisible();
    await expect(page.getByText("Transporte")).toBeVisible();
  });

  test("deve renderizar a fila de revisão", async ({ page }) => {
    await page.goto("/temas/revisao");
    await expect(page.getByRole("heading", { name: "Fila de Revisão de Temas" })).toBeVisible();
  });

  test("deve renderizar a página de um tema individual com aviso de governança", async ({ page }) => {
    await page.goto("/temas/saude");
    await expect(page.getByRole("heading", { name: "Tema: Saúde" })).toBeVisible();
    await expect(page.getByText("Aviso de Governança")).toBeVisible();
    await expect(page.getByText("não representa o perfil político")).toBeVisible();
  });

  test("não deve expor segredos no HTML das páginas de temas", async ({ page }) => {
    const content = await page.content();
    expect(content).not.toContain("access_token");
    expect(content).not.toContain("service_role");
  });
});
