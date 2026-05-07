import { expect, test } from "@playwright/test";

test.describe("Volunteer application retention", () => {
  test("renders retention dashboard without exposing PII", async ({ page }) => {
    await page.goto("/voluntarios/inscricoes/retencao");
    await expect(page.locator("h1")).toContainText("Retenção de inscrições");
    await expect(page.getByText("Elegíveis", { exact: true })).toBeVisible();
    await expect(page.getByText("Anonimizadas", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Agendar anonimização elegível")).toBeVisible();
    await expect(page.locator("body")).not.toContainText("service_role");
  });

  test("applications queue links to retention", async ({ page }) => {
    await page.goto("/voluntarios/inscricoes");
    await expect(page.getByText("Retenção")).toBeVisible();
  });

  test("health exposes safe retention counters", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body).toHaveProperty("volunteer_applications_eligible_for_redaction_count");
    expect(body).toHaveProperty("volunteer_applications_redacted_count");
    expect(body).toHaveProperty("volunteer_applications_scheduled_redaction_count");
    expect(body).toHaveProperty("volunteer_applications_retained_count");
  });
});
