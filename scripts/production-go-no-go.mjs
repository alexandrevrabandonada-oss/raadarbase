#!/usr/bin/env node

import { existsSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const reportsDir = join(__dirname, "..", "reports");
const docsDir = join(__dirname, "..", "docs");
const outputPath = join(reportsDir, "production-go-no-go-summary.json");

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
  if (
    !payload.guardrails_ok ||
    payload.critical_webhook_incidents > 0 ||
    payload.production_preflight_recommendation === "BLOCKED" ||
    payload.staging_go_status !== "GO_STAGING"
  ) {
    return "BLOCKED";
  }

  if (!payload.training_template_ready) {
    return "NEEDS_TRAINING";
  }

  if (payload.staging_observation_status !== "STAGING_STABLE") {
    return "NEEDS_STAGING_STABILITY";
  }

  if (!payload.docs_ready) {
    return "BLOCKED";
  }

  return "READY_FOR_HUMAN_DECISION";
}

function main() {
  const preflight = readJsonIfPresent(join(reportsDir, "production-webhook-preflight.json"));
  const goNoGo = readJsonIfPresent(join(reportsDir, "staging-webhook-go-no-go.json"));
  const observation = readJsonIfPresent(join(reportsDir, "staging-webhook-observation.json"));

  const runbookPresent = existsSync(join(docsDir, "production-webhook-runbook.md"));
  const riskMatrixPresent = existsSync(join(docsDir, "production-webhook-risk-matrix.md"));
  const trainingChecklistPresent = existsSync(join(docsDir, "webhook-operator-training-checklist.md"));
  const meetingTemplatePresent = existsSync(join(docsDir, "production-go-no-go-meeting-template.md"));
  const decisionExamplePresent = existsSync(join(docsDir, "decisions", "production-webhook-decision-example.md"));

  const docsReady =
    runbookPresent &&
    riskMatrixPresent &&
    trainingChecklistPresent &&
    meetingTemplatePresent &&
    decisionExamplePresent;

  const noDmAutomatic = toBoolean(goNoGo?.signals?.noDmAutomatic, toBoolean(observation?.noDmAutomatic, false));
  const noAutoContact = toBoolean(goNoGo?.signals?.noAutoContact, toBoolean(observation?.noAutoContact, false));
  const noPoliticalScore = toBoolean(goNoGo?.signals?.noPoliticalScore, toBoolean(observation?.noPoliticalScore, false));
  const guardrailsOk = noDmAutomatic && noAutoContact && noPoliticalScore;

  const payload = {
    generatedAt: new Date().toISOString(),
    staging_go_status: goNoGo?.decision ?? "UNKNOWN",
    staging_observation_status: observation?.statusSuggestion ?? "UNKNOWN",
    production_preflight_recommendation: preflight?.production_ready_recommendation ?? "UNKNOWN",
    open_webhook_incidents: toCount(observation?.webhookOpenIncidents),
    critical_webhook_incidents: toCount(observation?.webhookCriticalIncidents),
    guardrails_ok: guardrailsOk,
    noDmAutomatic,
    noAutoContact,
    noPoliticalScore,
    docs_ready: docsReady,
    runbook_present: runbookPresent,
    risk_matrix_present: riskMatrixPresent,
    training_checklist_present: trainingChecklistPresent,
    meeting_template_present: meetingTemplatePresent,
    decision_example_present: decisionExamplePresent,
    training_template_ready: trainingChecklistPresent && meetingTemplatePresent,
    human_decision_required: true,
    automatic_activation_allowed: false,
  };

  payload.recommendation = evaluateRecommendation(payload);

  mkdirSync(reportsDir, { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  console.log("[production:go-no-go] Production go/no-go summary");
  console.log(`- staging_go_status: ${payload.staging_go_status}`);
  console.log(`- staging_observation_status: ${payload.staging_observation_status}`);
  console.log(`- production_preflight_recommendation: ${payload.production_preflight_recommendation}`);
  console.log(`- open_webhook_incidents: ${payload.open_webhook_incidents}`);
  console.log(`- critical_webhook_incidents: ${payload.critical_webhook_incidents}`);
  console.log(`- guardrails_ok: ${payload.guardrails_ok}`);
  console.log(`- docs_ready: ${payload.docs_ready}`);
  console.log(`- training_template_ready: ${payload.training_template_ready}`);
  console.log(`- human_decision_required: ${payload.human_decision_required}`);
  console.log(`- automatic_activation_allowed: ${payload.automatic_activation_allowed}`);
  console.log(`- recommendation: ${payload.recommendation}`);

  if (payload.recommendation === "BLOCKED") {
    process.exitCode = 1;
  }
}

main();
