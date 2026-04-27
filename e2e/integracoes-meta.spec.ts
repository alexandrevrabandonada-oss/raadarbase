import { expect, test } from "@playwright/test";

test("integracao Meta renderiza status sem token visivel", async ({ page }) => {
  await page.goto("/integracoes/meta");
  await expect(page.getByRole("heading", { name: "Integração Meta" })).toBeVisible();
  const text = await page.locator("body").innerText();
  expect(text).toContain("Token no servidor");
  expect(text).not.toContain("fake-secret-token");
  expect(text).not.toContain("service_role");
});
