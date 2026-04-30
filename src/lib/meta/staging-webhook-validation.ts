export type StagingGoNoGoDecision =
  | "GO_STAGING"
  | "NO_GO_STAGING"
  | "PENDING_EXTERNAL_VALIDATION";

export type StagingWebhookValidationStatus =
  | "not_configured"
  | "pending_external_validation"
  | "ready_for_staging_enable"
  | "blocked";

export interface StagingGoNoGoSignals {
  appUrlConfigured: boolean;
  healthOk: boolean;
  healthSecretsSafe: boolean;
  dryRunExecuted: boolean;
  signedEventSeen: boolean;
  unsignedRejectionSeen: boolean;
  operatorIgnoredSeen: boolean;
  operatorProcessedSeen: boolean;
  auditLogsFound: boolean;
  incidentsFound: boolean;
  noDmAutomation: boolean;
  noAutoContactCreation: boolean;
  noPoliticalScore: boolean;
}

export function decideStagingWebhookGoNoGo(signals: StagingGoNoGoSignals): StagingGoNoGoDecision {
  if (!signals.appUrlConfigured || !signals.dryRunExecuted) {
    return "PENDING_EXTERNAL_VALIDATION";
  }

  const required = [
    signals.healthOk,
    signals.healthSecretsSafe,
    signals.signedEventSeen,
    signals.unsignedRejectionSeen,
    signals.operatorIgnoredSeen,
    signals.operatorProcessedSeen,
    signals.auditLogsFound,
    signals.incidentsFound,
    signals.noDmAutomation,
    signals.noAutoContactCreation,
    signals.noPoliticalScore,
  ];

  return required.every(Boolean) ? "GO_STAGING" : "NO_GO_STAGING";
}

export function mapDecisionToValidationStatus(input: {
  webhookConfigured: boolean;
  externalAttempted: boolean;
  decision: StagingGoNoGoDecision;
}): StagingWebhookValidationStatus {
  if (!input.webhookConfigured) {
    return "not_configured";
  }

  if (input.decision === "GO_STAGING") {
    return "ready_for_staging_enable";
  }

  if (input.decision === "NO_GO_STAGING" && input.externalAttempted) {
    return "blocked";
  }

  return "pending_external_validation";
}

const sensitiveKeyPattern =
  /token|secret|password|authorization|cookie|session|email|phone|telefone|cpf|raw_payload/i;

export function sanitizeStagingEvidence<T>(input: T): T {
  if (input === null || input === undefined) {
    return input;
  }

  if (typeof input === "string") {
    return input
      .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "[REDACTED_EMAIL]")
      .replace(/(\+?\d{1,3}[\s.-]?)?(\(?\d{2,3}\)?[\s.-]?)\d{4,5}[\s.-]?\d{4}/g, "[REDACTED_PHONE]")
      .replace(/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g, "[REDACTED_CPF]") as T;
  }

  if (Array.isArray(input)) {
    return input.map((item) => sanitizeStagingEvidence(item)) as T;
  }

  if (typeof input === "object") {
    const out: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      if (sensitiveKeyPattern.test(key)) {
        out[key] = "[REDACTED]";
      } else {
        out[key] = sanitizeStagingEvidence(value);
      }
    }

    return out as T;
  }

  return input;
}
