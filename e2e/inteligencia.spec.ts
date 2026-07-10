import path from "node:path";
import { expect, test } from "@playwright/test";

test.describe("Hub de Fontes e Inteligência", () => {
  test("smoke completo: painel, filtro, detalhe, grafo, importação e sync", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });

    await page.goto("/dashboard/inteligencia");
    await expect(page.getByRole("heading", { name: "Hub de Fontes e Enriquecimento" })).toBeVisible();
    await expect(page.getByText("Professora Aurora Demo")).toBeVisible();
    await page.getByLabel("Categoria").selectOption("veiculo_de_imprensa");
    await page.getByRole("button", { name: "Aplicar" }).click();
    await expect(page.getByText("Jornal Serra Demo")).toBeVisible();
    await expect(page.getByText("Professora Aurora Demo")).not.toBeVisible();

    await page.getByText("Jornal Serra Demo").click();
    await expect(page.getByRole("heading", { name: "Jornal Serra Demo" })).toBeVisible();
    await expect(page.getByText(/Evidências e identificadores/)).toBeVisible();

    await page.goto("/dashboard/inteligencia/grafo");
    await expect(page.getByRole("img", { name: "Grafo territorial" })).toBeVisible();
    await expect(page.getByText(/entidades e .* relações visíveis/)).toBeVisible();

    await page.goto("/dashboard/inteligencia/fontes");
    await page.locator('input[type="file"]').setInputFiles(path.join(process.cwd(), "e2e", "fixtures", "inteligencia-demo.json"));
    await page.getByRole("button", { name: "Importar" }).click();
    await expect(page.getByRole("status")).toContainText("1 itens processados");
    await page.getByRole("button", { name: "Sincronizar agora" }).click();
    await expect(page.getByRole("status")).toContainText("itens processados");

    expect(consoleErrors.filter((message) => !message.includes("favicon"))).toEqual([]);
  });
});
