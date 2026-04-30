import { describe, expect, it } from "vitest";
import {
  decideStagingWebhookGoNoGo,
  mapDecisionToValidationStatus,
  sanitizeStagingEvidence,
  type StagingGoNoGoSignals,
} from "./staging-webhook-validation";

function baseSignals(): StagingGoNoGoSignals {
  return {
    appUrlConfigured: true,
    healthOk: true,
    healthSecretsSafe: true,
    dryRunExecuted: true,
    signedEventSeen: true,
    unsignedRejectionSeen: true,
    operatorIgnoredSeen: true,
    operatorProcessedSeen: true,
    auditLogsFound: true,
    incidentsFound: true,
    noDmAutomation: true,
    noAutoContactCreation: true,
    noPoliticalScore: true,
  };
}

describe("staging webhook validation", () => {
  it("returns GO_STAGING when all criteria are met", () => {
    expect(decideStagingWebhookGoNoGo(baseSignals())).toBe("GO_STAGING");
  });

  it("returns PENDING_EXTERNAL_VALIDATION when APP_URL or dry-run is missing", () => {
    expect(
      decideStagingWebhookGoNoGo({ ...baseSignals(), appUrlConfigured: false }),
    ).toBe("PENDING_EXTERNAL_VALIDATION");

    expect(
      decideStagingWebhookGoNoGo({ ...baseSignals(), dryRunExecuted: false }),
    ).toBe("PENDING_EXTERNAL_VALIDATION");
  });

  it("returns NO_GO_STAGING when external validation exists but criteria fail", () => {
    expect(
      decideStagingWebhookGoNoGo({ ...baseSignals(), operatorProcessedSeen: false }),
    ).toBe("NO_GO_STAGING");
  });

  it("maps validation status safely", () => {
    expect(
      mapDecisionToValidationStatus({
        webhookConfigured: false,
        externalAttempted: false,
        decision: "PENDING_EXTERNAL_VALIDATION",
      }),
    ).toBe("not_configured");

    expect(
      mapDecisionToValidationStatus({
        webhookConfigured: true,
        externalAttempted: true,
        decision: "NO_GO_STAGING",
      }),
    ).toBe("blocked");

    expect(
      mapDecisionToValidationStatus({
        webhookConfigured: true,
        externalAttempted: true,
        decision: "GO_STAGING",
      }),
    ).toBe("ready_for_staging_enable");
  });

  it("sanitizes sensitive evidence fields and PII", () => {
    const sanitized = sanitizeStagingEvidence({
      raw_payload: { token: "abc" },
      sample: "contato teste@dominio.com e +55 24 99999-1234 cpf 123.456.789-00",
      keep: "ok",
    });

    expect(sanitized.raw_payload).toBe("[REDACTED]");
    expect(sanitized.sample).not.toContain("teste@dominio.com");
    expect(sanitized.sample).not.toContain("99999-1234");
    expect(sanitized.sample).not.toContain("123.456.789-00");
    expect(sanitized.keep).toBe("ok");
  });
});
