import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/config", () => ({
  getEnvironmentLabel: () => "test",
  isSupabaseConfigured: () => true,
  USE_MOCKS: true,
}));

vi.mock("@/lib/meta/client", () => ({
  isMetaConfigured: () => true,
}));

vi.mock("@/lib/data/operation", () => ({
  getLatestMetaSyncRun: async () => ({ status: "success", started_at: "2026-04-29T00:00:00.000Z" }),
}));

vi.mock("@/lib/operation/stuck-runs", () => ({
  getStuckSyncRuns: async () => [],
}));

vi.mock("@/lib/operation/repeated-failures", () => ({
  getRepeatedFailureSummary: async () => ({ repeatedFailureCount: 0, repeatedFailureKinds: [], repeatedFailures: [] }),
}));

vi.mock("@/lib/security/production-guards", () => ({
  getUnsafeProductionWarnings: () => [],
}));

vi.mock("@/lib/meta/webhook-security", () => ({
  isWebhookEnabled: () => false,
  isWebhookConfigured: () => false,
}));

vi.mock("@/lib/data/incidents", () => ({
  countOpenIncidents: async () => 0,
  countCriticalIncidents: async () => 0,
}));

vi.mock("@/lib/data/strategic-memory", () => ({
  getStrategicMemoryStats: async () => ({ activeCount: 0, draftCount: 0, totalCount: 0 }),
}));

vi.mock("@/lib/meta/webhook-processing", () => ({
  countWebhookEventsByStatus: async () => ({ received: 0, verified: 0, quarantined: 0, ignored: 0, processed: 0, failed: 0 }),
  getStaleQuarantineEvents: async () => [],
  getInvalidSignatureEvents: async () => [],
}));

describe("health route", () => {
  it("returns safe payload without secret markers", async () => {
    const { GET } = await import("./route");
    const response = await GET();
    const text = await response.text();

    expect(text).not.toContain("META_APP_SECRET");
    expect(text).not.toContain("META_WEBHOOK_VERIFY_TOKEN");
    expect(text).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(text).not.toContain("access_token");

    const body = JSON.parse(text);
    expect(body).toHaveProperty("staging_webhook_validation_status");
    expect(
      [
        "not_configured",
        "pending_external_validation",
        "ready_for_staging_enable",
        "blocked",
      ].includes(body.staging_webhook_validation_status),
    ).toBe(true);
  });
});
