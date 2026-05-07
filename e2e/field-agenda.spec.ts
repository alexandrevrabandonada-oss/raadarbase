import { test, expect } from "@playwright/test";

test.describe("Field Agenda Module", () => {
  test.beforeEach(async ({ page }) => {
    // In a real E2E we might need to login, but here we assume internal session is mocked or available in the test env
    await page.goto("/campo");
  });

  test("should render the field agenda main page", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("Agenda de Campo");
    await expect(page.locator("text=Nova ação de campo")).toBeVisible();
  });

  test("should navigate to new event form", async ({ page }) => {
    await page.locator('a[href="/campo/novo"]').first().click();
    await expect(page).toHaveURL(/\/campo\/novo/);
    await expect(page.locator("h1")).toContainText("Nova Ação de Campo");
  });

  test("should show governance warning in form", async ({ page }) => {
    await page.goto("/campo/novo");
    await expect(page.locator("text=Aviso de Governança")).toBeVisible();
    await expect(page.locator("text=Não use para abordar pessoas individualmente")).toBeVisible();
  });
});
