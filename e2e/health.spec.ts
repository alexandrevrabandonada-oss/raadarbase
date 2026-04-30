import { expect, test } from "@playwright/test";

test("healthcheck responde sem segredos ou marcadores sensíveis", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.ok()).toBeTruthy();

  const text = await response.text();
  expect(text).not.toContain("META_APP_SECRET");
  expect(text).not.toContain("META_WEBHOOK_VERIFY_TOKEN");
  expect(text).not.toContain("access_token");
  expect(text).not.toContain("service_role");
  expect(text).not.toContain("webhook_verify_token");
  expect(text).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
  expect(text).not.toContain("META_ACCESS_TOKEN");

  const body = JSON.parse(text);
  expect(body).toHaveProperty("ok");
  expect(body).toHaveProperty("unsafe_production_warnings_count");
  expect(body).toHaveProperty("repeated_failure_count");
  expect(body).toHaveProperty("staging_webhook_validation_status");
  expect(body).toHaveProperty("staging_webhook_signed_event_seen");
  expect(body).toHaveProperty("staging_webhook_unsigned_rejection_seen");
  expect(body).toHaveProperty("staging_webhook_operator_processed_seen");
  expect(body).toHaveProperty("staging_webhook_operator_ignored_seen");

  expect(
    [
      "not_configured",
      "pending_external_validation",
      "ready_for_staging_enable",
      "blocked",
    ].includes(body.staging_webhook_validation_status),
  ).toBe(true);
});