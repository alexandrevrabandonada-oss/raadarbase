#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const docsDir = join(__dirname, "..", "docs", "decisions");
const reportsDir = join(__dirname, "..", "reports");
const outputPath = join(reportsDir, "production-decision-validation.json");

function findDecisionFile() {
  if (!existsSync(docsDir)) {
    return { filePath: null, isDraftByName: false };
  }

  const files = readdirSync(docsDir);
  const dated = files
    .filter((name) => /^production-webhook-decision-\d{4}-\d{2}-\d{2}\.md$/.test(name))
    .sort((a, b) => b.localeCompare(a));

  if (dated.length > 0) {
    return { filePath: join(docsDir, dated[0]), isDraftByName: false };
  }

  const draft = files.find((name) => name === "production-webhook-decision-DRAFT.md");
  if (draft) {
    return { filePath: join(docsDir, draft), isDraftByName: true };
  }

  return { filePath: null, isDraftByName: false };
}

function readSection(content, headingNumber) {
  const escaped = headingNumber.replace(".", "\\.");
  const regex = new RegExp(`##\\s+${escaped}[^\\n]*\\n([\\s\\S]*?)(?=\\n##\\s+\\d+\\.|$)`, "i");
  const match = content.match(regex);
  return match ? match[1].trim() : "";
}

function isFilledText(value) {
  if (!value) return false;
  const compact = value.replace(/\s+/g, " ").trim();
  if (!compact) return false;
  if (/^\[PREENCHER\]$/i.test(compact)) return false;
  if (/^\[NOME\]$/i.test(compact)) return false;
  return true;
}

function parseDecision(content) {
  const checked = [...content.matchAll(/-\s*\[[xX]\]\s*(GO_PRODUCTION|NO_GO_PRODUCTION|POSTPONE)\b/g)].map((m) => m[1]);
  const uniqueChecked = [...new Set(checked)];
  if (uniqueChecked.length === 1) return uniqueChecked[0];
  if (uniqueChecked.length > 1) return "INVALID";

  const explicit = content.match(/Decis[aã]o(?:\s+final)?\s*:\s*(GO_PRODUCTION|NO_GO_PRODUCTION|POSTPONE)\b/i);
  if (explicit) return explicit[1].toUpperCase();

  return "UNKNOWN";
}

function parseParticipants(section) {
  const rows = [...section.matchAll(/^\|\s*([^|\n]+)\s*\|\s*([^|\n]+)\s*\|\s*([^|\n]+)\s*\|\s*$/gm)]
    .map((m) => ({
      name: m[1].trim(),
      role: m[2].trim(),
      confirmation: m[3].trim(),
    }))
    .filter((row) => !/^nome$/i.test(row.name));

  const nonPlaceholderRows = rows.filter((row) => {
    if (/\[NOME\]|\[PREENCHER\]/i.test(row.name)) return false;
    if (/\[PREENCHER\]/i.test(row.confirmation)) return false;
    return true;
  });

  return { rows, nonPlaceholderRows };
}

function parseTrainingCompleted(content) {
  const checkedLine = /-\s*\[[xX]\]\s*Treinamento operacional concluido/i.test(content);
  if (checkedLine) return true;

  const yesLine = /Treinamento operacional conclu[ií]do\s*:\s*(sim|true|conclu[ií]do)/i.test(content);
  if (yesLine) return true;

  return false;
}

function parseSignatures(section) {
  const rows = [...section.matchAll(/^\|\s*([^|\n]+)\s*\|\s*([^|\n]+)\s*\|\s*([^|\n]+)\s*\|\s*([^|\n]+)\s*\|\s*$/gm)]
    .map((m) => ({
      name: m[1].trim(),
      role: m[2].trim(),
      date: m[3].trim(),
      acceptance: m[4].trim(),
    }))
    .filter((row) => !/^nome$/i.test(row.name));

  const acceptedRows = rows.filter((row) => {
    if (/\[NOME\]|\[DATA\]|\[PREENCHER\]/i.test(`${row.name} ${row.date}`)) return false;
    return /sim|yes|true/i.test(row.acceptance);
  });

  return { rows, acceptedRows };
}

function buildStatus(payload) {
  const validDecision = payload.decision === "GO_PRODUCTION" || payload.decision === "NO_GO_PRODUCTION" || payload.decision === "POSTPONE";

  if (!payload.decision_file_found) return "BLOCKED_INCOMPLETE";
  if (payload.is_draft) return "BLOCKED_DRAFT";
  if (!validDecision) return "BLOCKED_INCOMPLETE";
  if (!payload.participants_present || !payload.roles_present || !payload.justification_present || !payload.rollback_present) {
    return "BLOCKED_INCOMPLETE";
  }

  if (payload.decision === "GO_PRODUCTION" && (!payload.training_completed || !payload.signatures_present)) {
    return "BLOCKED_INCOMPLETE";
  }

  if (payload.decision === "GO_PRODUCTION") return "VALID_GO_PRODUCTION";
  if (payload.decision === "NO_GO_PRODUCTION") return "VALID_NO_GO_PRODUCTION";
  return "VALID_POSTPONE";
}

function main() {
  const found = findDecisionFile();
  const decisionFileFound = Boolean(found.filePath && existsSync(found.filePath));
  const content = decisionFileFound ? readFileSync(found.filePath, "utf8") : "";

  const isDraftByContent = /RASCUNHO\s*-\s*NAO AUTORIZA PRODUCAO/i.test(content);
  const isDraft = found.isDraftByName || isDraftByContent;
  const decision = decisionFileFound ? parseDecision(content) : "UNKNOWN";

  const participantsSection = readSection(content, "2.");
  const participants = parseParticipants(participantsSection);
  const participantsPresent = participants.nonPlaceholderRows.length >= 3;

  const rolesPresent =
    /Responsavel tecnico/i.test(content) &&
    /Responsavel de operacao/i.test(content) &&
    /Responsavel de governanca\/compliance/i.test(content);

  const justificationSection = readSection(content, "5.");
  const rollbackSection = readSection(content, "8.");
  const signaturesSection = readSection(content, "10.");

  const justificationPresent = isFilledText(justificationSection) && !/\[PREENCHER\]/i.test(justificationSection);
  const rollbackPresent = isFilledText(rollbackSection) && !/\[PREENCHER\]/i.test(rollbackSection);
  const trainingCompleted = parseTrainingCompleted(content);
  const signatures = parseSignatures(signaturesSection);
  const signaturesPresent = signatures.acceptedRows.length >= 3;

  const payload = {
    generatedAt: new Date().toISOString(),
    decision_file_found: decisionFileFound,
    decision_file_path: decisionFileFound ? `docs/decisions/${found.filePath.split(/[/\\]/).at(-1)}` : null,
    is_draft: isDraft,
    decision,
    participants_present: participantsPresent,
    roles_present: rolesPresent,
    training_completed: trainingCompleted,
    rollback_present: rollbackPresent,
    justification_present: justificationPresent,
    signatures_present: signaturesPresent,
    production_activation_allowed: false,
  };

  payload.status = buildStatus(payload);
  payload.production_activation_allowed = payload.status === "VALID_GO_PRODUCTION";

  mkdirSync(reportsDir, { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  console.log("[production:decision:validate] Decision validation summary");
  console.log(`- decision_file_found: ${payload.decision_file_found}`);
  console.log(`- is_draft: ${payload.is_draft}`);
  console.log(`- decision: ${payload.decision}`);
  console.log(`- participants_present: ${payload.participants_present}`);
  console.log(`- roles_present: ${payload.roles_present}`);
  console.log(`- training_completed: ${payload.training_completed}`);
  console.log(`- rollback_present: ${payload.rollback_present}`);
  console.log(`- signatures_present: ${payload.signatures_present}`);
  console.log(`- production_activation_allowed: ${payload.production_activation_allowed}`);
  console.log(`- status: ${payload.status}`);
}

main();