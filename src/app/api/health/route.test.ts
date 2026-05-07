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
  countOpenWebhookIncidents: async () => 0,
  countCriticalWebhookIncidents: async () => 0,
}));

vi.mock("@/lib/data/strategic-memory", () => ({
  getStrategicMemoryStats: async () => ({ activeCount: 0, draftCount: 0, totalCount: 0 }),
}));

vi.mock("@/lib/meta/webhook-processing", () => ({
  countWebhookEventsByStatus: async () => ({ received: 0, verified: 0, quarantined: 0, ignored: 0, processed: 0, failed: 0 }),
  getStaleQuarantineEvents: async () => [],
  getInvalidSignatureEvents: async () => [],
}));

vi.mock("@/lib/data/territorial-listening-outreach", () => ({
  getTerritorialConversionMetrics: async () => ({ total_outreach: 0, total_conversions: 0, conversion_rate: 0, latest_shared_at: null }),
}));

vi.mock("@/lib/data/silence-radar-impact", () => ({
  getCorrectiveActionsImpactSummary: async () => ({ totalActions: 0, doneActions: 0, plannedActions: 0, doingActions: 0, avgResolutionDays: 0, positiveImpactCount: 0, attentionImpactCount: 0 }),
}));

vi.mock("@/lib/data/silence-radar-time-series", () => ({
  getSilenceImpactTimeSeries: async () => ({ trend: "sem_dados_suficientes", points: [] }),
}));

vi.mock("@/lib/data/public-listening-receipt", () => ({
  getPublicListeningReceipt: async () => ({
    periodStart: "2026-05-01",
    periodEnd: "2026-05-07",
    windowId: "mock-window",
    topics: { topics: [], totalPostsAnalyzed: 0, totalInteractionsAnalyzed: 0, uniquePeopleReached: 0 },
    territorial: { totalReports: 0, totalNeighborhoods: 0 },
    actions: { totalActions: 0, doneActions: 0, plannedActions: 0, doingActions: 0 },
    timeSeries: { trend: "sem_dados_suficientes", points: [] },
    lastUpdatedAt: new Date().toISOString(),
  }),
}));

vi.mock("@/lib/data/public-receipt-distribution", () => ({
  listReceiptDistributionLogs: async () => [],
  listReceiptDistributionCycles: async () => [],
}));

describe("health route", () => {
  it("returns safe payload without secret markers", async () => {
    const { GET } = await import("./route");
    const response = await GET();
    const text = await response.text();

    expect(text).not.toContain("META_APP_SECRET");
    expect(text).not.toContain("META_WEBHOOK_VERIFY_TOKEN");
    expect(text).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(text).not.toContain("access_token=");
    expect(text).not.toContain('"access_token"');
    expect(text).not.toContain("META_ACCESS_TOKEN");
    expect(text).not.toContain("INSTAGRAM_BUSINESS_ACCOUNT_ID");

    const body = JSON.parse(text);
    expect(body).toHaveProperty("meta_api_credentials_present");
    expect(body).toHaveProperty("instagram_business_account_id_present");
    expect(body).toHaveProperty("meta_graph_version_present");
    expect(body).toHaveProperty("meta_manual_sync_ready");
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
