import { expect, test } from "@playwright/test";

test.describe("Radar de Influência", () => {
  test("smoke: abre painel, KPIs e ranking virtualizado", async ({ page }) => {
    await page.goto("/dashboard/influencia");
    await expect(page.getByRole("heading", { name: "Radar de Influência" })).toBeVisible();
    await expect(page.getByText("Total de perfis")).toBeVisible();
    await expect(page.getByLabel("Ranking virtualizado de perfis")).toBeVisible();
    await expect(page.getByText("Jornal Regional Demo")).toBeVisible();
  });

  test("filtra ranking por cidade", async ({ page }) => {
    await page.goto("/dashboard/influencia?cidade=Resende");
    await expect(page.getByText("Professora Demo")).toBeVisible();
    await expect(page.getByText("Empresa Sul Demo")).not.toBeVisible();
  });
});

