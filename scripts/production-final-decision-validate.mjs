#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const reportsDir = join(process.cwd(), "reports");
const docsDir = join(process.cwd(), "docs");
const meetingPath = join(docsDir, "production-go-no-go-final-meeting.md");
const outputPath = join(reportsDir, "production-final-decision-validation.json");

function readJson(path) {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

function readSection(content, sectionNumber) {
  const escaped = sectionNumber.replace(".", "\\.");
  const regex = new RegExp(`##\\s+${escaped}[^\\n]*\\n([\\s\\S]*?)(?=\\n##\\s+\\d+\\.|$)`, "i");
  const match = content.match(regex);
  return match ? match[1].trim() : "";
}

function isFilled(value) {
  const compact = (value ?? "").replace(/\s+/g, " ").trim();
  if (!compact) return false;
  if (/\[PREENCHER\]|\[NOME\]|\[DATA\]/i.test(compact)) return false;
  return true;
}

function parseDecision(content) {
  const checked = [...content.matchAll(/-\s*\[[xX]\]\s*(GO_PRODUCTION|NO_GO_PRODUCTION|POSTPONE)\b/g)].map((m) => m[1]);
  const unique = [...new Set(checked)];
  if (unique.length === 1) return unique[0];
  if (unique.length > 1) return "INVALID";
  return "UNKNOWN";
}

function parseParticipants(section) {
  const rows = [...section.matchAll(/^\|\s*([^|\n]+)\s*\|\s*([^|\n]+)\s*\|\s*([^|\n]+)\s*\|?\s*$/gm)]
    .map((m) => ({ name: m[1].trim(), role: m[2].trim(), confirmation: m[3].trim() }))
    .filter((row) => !/^nome$/i.test(row.name));

  return rows.filter((row) => {
    if (/\[NOME\]|\[PREENCHER\]/i.test(row.name)) return false;
    if (!/sim|yes|true/i.test(row.confirmation)) return false;
    return true;
  });
}

function parseSignatures(section) {
  const rows = [...section.matchAll(/^\|\s*([^|\n]+)\s*\|\s*([^|\n]+)\s*\|\s*([^|\n]+)\s*\|\s*([^|\n]+)\s*\|?\s*$/gm)]
    .map((m) => ({ name: m[1].trim(), role: m[2].trim(), date: m[3].trim(), acceptance: m[4].trim() }))
    .filter((row) => !/^nome$/i.test(row.name));

  return rows.filter((row) => {
    if (/\[NOME\]|\[DATA\]|\[PREENCHER\]/i.test(`${row.name} ${row.date}`)) return false;
    return /sim|yes|true/i.test(row.acceptance);
  });
}

function evidencePresent(content, reference) {
  return content.includes(reference);
}

function statusFrom(payload) {
  if (!payload.meeting_exists) return "BLOCKED_INCOMPLETE";
  if (payload.is_draft) return "BLOCKED_DRAFT";
  if (!payload.decision_explicit || payload.decision === "INVALID" || payload.decision === "UNKNOWN") return "BLOCKED_INCOMPLETE";
  if (!payload.participants_present || !payload.responsibles_present || !payload.evidences_complete || !payload.rollback_present || !payload.observation_window_present || !payload.signatures_present || !payload.justification_present) {
    return "BLOCKED_INCOMPLETE";
  }

  if (payload.decision === "GO_PRODUCTION") {
    if (!payload.shadow_ready || !payload.access_ready || !payload.webhook_production_disabled || !payload.guardrails_present || !payload.rollback_present) {
      return "BLOCKED_RISK";
    }
    return "VALID_GO_PRODUCTION";
  }

  if (payload.decision === "NO_GO_PRODUCTION") return "VALID_NO_GO_PRODUCTION";
  if (payload.decision === "POSTPONE") return "VALID_POSTPONE";
  return "BLOCKED_INCOMPLETE";
}

function main() {
  const meetingExists = existsSync(meetingPath);
  const content = meetingExists ? readFileSync(meetingPath, "utf8") : "";

  const shadowCheck = readJson(join(reportsDir, "production-shadow-check.json"));
  const routeAudit = readJson(join(reportsDir, "production-route-access-audit.json"));
  const rlsAudit = readJson(join(reportsDir, "production-rls-audit.json"));
  const roleAudit = readJson(join(reportsDir, "production-role-audit.json"));
  const accessAuditText = existsSync(join(reportsDir, "production-access-audit-report.md"))
    ? readFileSync(join(reportsDir, "production-access-audit-report.md"), "utf8")
    : "";

  const participants = parseParticipants(readSection(content, "2."));
  const signatures = parseSignatures(readSection(content, "12."));
  const decision = parseDecision(content);
  const evidences = [
    "reports/production-shadow-report.md",
    "reports/production-access-audit-report.md",
    "reports/production-shadow-check.json",
    "reports/production-route-access-audit.json",
    "reports/production-rls-audit.json",
    "reports/production-role-audit.json",
    "reports/staging-webhook-go-no-go.json",
  ];

  const payload = {
    generatedAt: new Date().toISOString(),
    meeting_exists: meetingExists,
    meeting_path: "docs/production-go-no-go-final-meeting.md",
    is_draft: /RASCUNHO\s*-\s*NAO AUTORIZA PRODUCAO/i.test(content),
    decision,
    decision_explicit: decision === "GO_PRODUCTION" || decision === "NO_GO_PRODUCTION" || decision === "POSTPONE",
    participants_present: participants.length >= 3,
    responsibles_present:
      /Responsavel tecnico:\s*(?!\[PREENCHER\])/i.test(content) &&
      /Responsavel operacao:\s*(?!\[PREENCHER\])/i.test(content) &&
      /Responsavel governanca\/compliance:\s*(?!\[PREENCHER\])/i.test(content),
    evidences_complete: evidences.every((reference) => evidencePresent(content, reference)),
    rollback_present: isFilled(readSection(content, "8.")),
    observation_window_present: isFilled(readSection(content, "9.")),
    signatures_present: signatures.length >= 3,
    justification_present: isFilled(readSection(content, "11.")),
    shadow_ready: shadowCheck?.recommendation === "SHADOW_READY",
    access_ready:
      /Route audit:\s+ACCESS_READY/i.test(accessAuditText) &&
      /RLS audit:\s+ACCESS_READY/i.test(accessAuditText) &&
      /Role audit:\s+ACCESS_READY/i.test(accessAuditText) &&
      routeAudit?.recommendation === "ACCESS_READY" &&
      rlsAudit?.recommendation === "ACCESS_READY" &&
      roleAudit?.recommendation === "ACCESS_READY",
    webhook_production_disabled: shadowCheck?.webhookEnabled === false,
    guardrails_present: /sem DM autom[aá]tica/i.test(accessAuditText) || shadowCheck?.publicProductionReleased === false,
    production_authorized: false,
  };

  payload.status = statusFrom(payload);
  payload.production_authorized = payload.status === "VALID_GO_PRODUCTION";

  mkdirSync(reportsDir, { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  console.log("[production:final-decision:validate]");
  console.log(`- meeting_exists: ${payload.meeting_exists}`);
  console.log(`- is_draft: ${payload.is_draft}`);
  console.log(`- decision: ${payload.decision}`);
  console.log(`- participants_present: ${payload.participants_present}`);
  console.log(`- responsibles_present: ${payload.responsibles_present}`);
  console.log(`- evidences_complete: ${payload.evidences_complete}`);
  console.log(`- rollback_present: ${payload.rollback_present}`);
  console.log(`- observation_window_present: ${payload.observation_window_present}`);
  console.log(`- signatures_present: ${payload.signatures_present}`);
  console.log(`- production_authorized: ${payload.production_authorized}`);
  console.log(`- status: ${payload.status}`);

  if (payload.status !== "VALID_GO_PRODUCTION" && payload.status !== "VALID_NO_GO_PRODUCTION" && payload.status !== "VALID_POSTPONE") {
    process.exitCode = 1;
  }
}

main();
