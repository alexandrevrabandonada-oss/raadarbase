import { expect, test } from "@playwright/test";

test("admin por bypass gerencia acesso interno em configuracoes", async ({ page }) => {
  await page.goto("/configuracoes");

  await expect(page.getByRole("heading", { name: "Configurações e conformidade" })).toBeVisible();
  const pendingUserCard = page.getByTestId("internal-user-pending-mock-user");
  await expect(pendingUserCard).toContainText("pendente@radardebase.local");
  await expect(pendingUserCard).toContainText("status pending");

  await pendingUserCard.getByRole("button", { name: "Aprovar" }).click();
  await expect(page.getByText("Acesso liberado para pendente@radardebase.local.")).toBeVisible();
  await expect(pendingUserCard).toContainText("status active");
  await expect(pendingUserCard.getByRole("button", { name: "Aprovar" })).toBeDisabled();

  await pendingUserCard.getByRole("button", { name: "Desativar" }).click();
  await expect(page.getByText("Acesso desativado para pendente@radardebase.local.")).toBeVisible();
  await expect(pendingUserCard).toContainText("status disabled");
  await expect(pendingUserCard.getByRole("button", { name: "Desativar" })).toBeDisabled();
});