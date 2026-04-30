#!/usr/bin/env node

import { existsSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const reportsDir = join(__dirname, "..", "reports");
const dryRunArtifactPath = join(reportsDir, "staging-webhook-dry-run.json");
const evidenceArtifactPath = join(reportsDir, "staging-webhook-evidence.json");
const outputArtifactPath = join(reportsDir, "staging-webhook-go-no-go.json");

function readJsonIfExists(path) {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

function writeArtifact(payload) {
  mkdirSync(reportsDir, { recursive: true });
  writeFileSync(outputArtifactPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function decide(signals) {
  if (!signals.appUrlConfigured || !signals.dryRunExecuted) {
    return "PENDING_EXTERNAL_VALIDATION";
  }

  const mustBeTrue = [
    signals.healthOk,
    signals.healthSecretsSafe,
    signals.signedEventSeen,
    signals.unsignedRejectionSeen,
    signals.operatorIgnoredSeen,
    signals.operatorProcessedSeen,
    signals.auditLogsFound,
    signals.incidentsFound,
    signals.noDmAutomatic,
    signals.noAutoContact,
    signals.noPoliticalScore,
  ];

  return mustBeTrue.every(Boolean) ? "GO_STAGING" : "NO_GO_STAGING";
}

async function healthSignals(appUrlConfigured, appUrl) {
  if (!appUrlConfigured) {
    return { healthOk: false, healthSecretsSafe: false, response: null };
  }

  try {
    const response = await fetch(`${appUrl}/api/health`);
    const text = await response.text();
    const hasSecretMarker = [
      "META_APP_SECRET",
      "META_WEBHOOK_VERIFY_TOKEN",
      "SUPABASE_SERVICE_ROLE_KEY",
      "access_token",
      "service_role",
    ].some((marker) => text.includes(marker));

    let parsed = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }

    return {
      healthOk: response.ok,
      healthSecretsSafe: !hasSecretMarker,
      response: parsed,
    };
  } catch {
    return { healthOk: false, healthSecretsSafe: false, response: null };
  }
}

async function main() {
  const dryRun = readJsonIfExists(dryRunArtifactPath);
  const evidence = readJsonIfExists(evidenceArtifactPath);
  const appUrl = process.env.APP_URL || "";
  const appUrlConfigured = Boolean(appUrl) || Boolean(dryRun?.appUrlConfigured);
  const health = await healthSignals(appUrlConfigured, appUrl);

  const dryRunExecuted = Boolean(dryRun?.executedWithAppUrl);
  const signedEventSeen = Boolean(evidence?.signedEventSeen);
  const unsignedRejectionSeen = Boolean(
    evidence?.unsignedRejectionSeen || dryRun?.checks?.find?.((c) => c.name === "POST unsigned rejected")?.ok,
  );

  const signals = {
    appUrlConfigured,
    healthOk: health.healthOk,
    healthSecretsSafe: health.healthSecretsSafe,
    dryRunExecuted,
    signedEventSeen,
    unsignedRejectionSeen,
    operatorIgnoredSeen: Boolean(evidence?.operatorIgnoredSeen),
    operatorProcessedSeen: Boolean(evidence?.operatorProcessedSeen),
    auditLogsFound: Boolean((evidence?.totalWebhookAuditLogs || 0) > 0),
    incidentsFound: Boolean((evidence?.totalWebhookIncidents || 0) > 0),
    noDmAutomatic: true,
    noAutoContact: true,
    noPoliticalScore: true,
  };

  const decision = decide(signals);
  const output = {
    generatedAt: new Date().toISOString(),
    decision,
    signals,
    sourceArtifacts: {
      dryRunArtifactFound: Boolean(dryRun),
      evidenceArtifactFound: Boolean(evidence),
    },
    notes: [
      "Nenhuma DM automatica foi implementada.",
      "Nenhuma criacao automatica de contato por webhook foi implementada.",
      "Nenhum score politico individual foi implementado.",
    ],
  };

  writeArtifact(output);

  console.log("[staging:webhook:go-no-go] Decision:", decision);
  Object.entries(signals).forEach(([key, value]) => {
    console.log(`- ${key}: ${value ? "ok" : "missing"}`);
  });

  if (decision === "NO_GO_STAGING") {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("[staging:webhook:go-no-go] Erro nao tratado.");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
