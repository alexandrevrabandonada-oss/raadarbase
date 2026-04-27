import { expect, test } from "@playwright/test";

test("login renderiza", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByText("Entrar no Radar de Base")).toBeVisible();
});

test("healthcheck nao expoe segredos", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.ok()).toBeTruthy();
  const text = await response.text();
  expect(text).not.toContain("fake-secret-token");
  expect(text).not.toContain("service_role");
  expect(text).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
  const body = JSON.parse(text);
  expect(body).toHaveProperty("stuck_sync_runs_count");
  expect(body).toHaveProperty("supabase_configured");
});
