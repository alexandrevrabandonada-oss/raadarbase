#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const reportsDir = join(__dirname, "..", "reports");
const outputPath = join(reportsDir, "production-webhook-preflight.json");

function readJsonIfPresent(path) {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

function toBoolean(value, fallback = false) {
  if (typeof value === "boolean") return value;
  return fallback;
}

function toCount(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function evaluateRecommendation(payload) {
  const hardBlocked =
    payload.staging_go_status !== "GO_STAGING" ||
    payload.staging_observation_status === "STAGING_BLOCKED" ||
    payload.critical_webhook_incidents > 0 ||
    payload.processing_failures_count > 0 ||
    !payload.noDmAutomatic ||
    !payload.noAutoContact ||
    !payload.noPoliticalScore;

  if (hardBlocked) return "BLOCKED";

  const notReady =
    payload.staging_observation_status !== "STAGING_STABLE" ||
    payload.open_webhook_incidents > 0 ||
    payload.stale_quarantine_count > 0 ||
    !payload.docs_present ||
    !payload.runbook_present ||
    !payload.risk_matrix_present ||
    !payload.training_checklist_present;

  if (notReady) return "NOT_READY";
  return "READY_FOR_HUMAN_REVIEW";
}

function main() {
  const goNoGoPath = join(reportsDir, "staging-webhook-go-no-go.json");
  const observationPath = join(reportsDir, "staging-webhook-observation.json");

  const runbookPath = join(__dirname, "..", "docs", "production-webhook-runbook.md");
  const riskMatrixPath = join(__dirname, "..", "docs", "production-webhook-risk-matrix.md");
  const trainingChecklistPath = join(__dirname, "..", "docs", "webhook-operator-training-checklist.md");

  const goNoGo = readJsonIfPresent(goNoGoPath);
  const observation = readJsonIfPresent(observationPath);

  const runbookPresent = existsSync(runbookPath);
  const riskMatrixPresent = existsSync(riskMatrixPath);
  const trainingChecklistPresent = existsSync(trainingChecklistPath);
  const docsPresent = runbookPresent && riskMatrixPresent && trainingChecklistPresent;

  const payload = {
    generatedAt: new Date().toISOString(),
    staging_go_status: goNoGo?.decision ?? "UNKNOWN",
    staging_observation_status: observation?.statusSuggestion ?? "UNKNOWN",
    open_webhook_incidents: toCount(observation?.webhookOpenIncidents),
    critical_webhook_incidents: toCount(observation?.webhookCriticalIncidents),
    stale_quarantine_count: toCount(observation?.staleQuarantineEvents),
    processing_failures_count: toCount(observation?.webhookProcessingFailures),
    noDmAutomatic: toBoolean(goNoGo?.signals?.noDmAutomatic, toBoolean(observation?.noDmAutomatic, false)),
    noAutoContact: toBoolean(goNoGo?.signals?.noAutoContact, toBoolean(observation?.noAutoContact, false)),
    noPoliticalScore: toBoolean(goNoGo?.signals?.noPoliticalScore, toBoolean(observation?.noPoliticalScore, false)),
    docs_present: docsPresent,
    runbook_present: runbookPresent,
    risk_matrix_present: riskMatrixPresent,
    training_checklist_present: trainingChecklistPresent,
    production_activation_allowed: false,
  };

  payload.production_ready_recommendation = evaluateRecommendation(payload);

  mkdirSync(reportsDir, { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  console.log("[production:webhook:preflight] Safe pre-homologation summary");
  console.log(`- staging_go_status: ${payload.staging_go_status}`);
  console.log(`- staging_observation_status: ${payload.staging_observation_status}`);
  console.log(`- open_webhook_incidents: ${payload.open_webhook_incidents}`);
  console.log(`- critical_webhook_incidents: ${payload.critical_webhook_incidents}`);
  console.log(`- stale_quarantine_count: ${payload.stale_quarantine_count}`);
  console.log(`- processing_failures_count: ${payload.processing_failures_count}`);
  console.log(`- noDmAutomatic: ${payload.noDmAutomatic}`);
  console.log(`- noAutoContact: ${payload.noAutoContact}`);
  console.log(`- noPoliticalScore: ${payload.noPoliticalScore}`);
  console.log(`- docs_present: ${payload.docs_present}`);
  console.log(`- runbook_present: ${payload.runbook_present}`);
  console.log(`- risk_matrix_present: ${payload.risk_matrix_present}`);
  console.log(`- training_checklist_present: ${payload.training_checklist_present}`);
  console.log(`- production_ready_recommendation: ${payload.production_ready_recommendation}`);
}

main();