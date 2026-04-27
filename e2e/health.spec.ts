import { expect, test } from "@playwright/test";

test("healthcheck responde sem segredos ou marcadores sensíveis", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.ok()).toBeTruthy();

  const text = await response.text();
  expect(text).not.toContain("access_token");
  expect(text).not.toContain("service_role");
  expect(text).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
  expect(text).not.toContain("META_ACCESS_TOKEN");

  const body = JSON.parse(text);
  expect(body).toHaveProperty("ok");
  expect(body).toHaveProperty("unsafe_production_warnings_count");
  expect(body).toHaveProperty("repeated_failure_count");
});