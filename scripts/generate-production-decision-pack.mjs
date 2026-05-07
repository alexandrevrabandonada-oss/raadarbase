#!/usr/bin/env node

import { existsSync, readFileSync, mkdirSync, writeFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const reportsDir = join(__dirname, "..", "reports");
const docsDir = join(__dirname, "..", "docs");
const outputPath = join(reportsDir, "production-decision-pack.md");

function readJsonIfPresent(path) {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

function toCount(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function riskRows() {
  const riskPath = join(docsDir, "production-webhook-risk-matrix.md");
  if (!existsSync(riskPath)) return "(Matriz de risco nao encontrada)";
  const content = readFileSync(riskPath, "utf8");
  const match = content.match(/\|.*Risco.*\|[\s\S]*?(?=\n##|\n---|\n$|$)/);
  return match ? match[0].trim() : "(Tabela de riscos nao extraida)";
}

function trainingSection() {
  const checklistPath = join(docsDir, "webhook-operator-training-checklist.md");
  if (!existsSync(checklistPath)) return "(Checklist de treinamento nao encontrado)";
  return readFileSync(checklistPath, "utf8").trim();
}

function findDecisionFilePath() {
  const decisionsDir = join(docsDir, "decisions");
  if (!existsSync(decisionsDir)) return null;

  const files = readdirSync(decisionsDir);
  const dated = files
    .filter((name) => /^production-webhook-decision-\d{4}-\d{2}-\d{2}\.md$/.test(name))
    .sort((a, b) => b.localeCompare(a));

  if (dated.length > 0) return `docs/decisions/${dated[0]}`;
  if (files.includes("production-webhook-decision-DRAFT.md")) {
    return "docs/decisions/production-webhook-decision-DRAFT.md";
  }

  return null;
}

function main() {
  const preflight = readJsonIfPresent(join(reportsDir, "production-webhook-preflight.json"));
  const goNoGo = readJsonIfPresent(join(reportsDir, "staging-webhook-go-no-go.json"));
  const observation = readJsonIfPresent(join(reportsDir, "staging-webhook-observation.json"));
  const summary = readJsonIfPresent(join(reportsDir, "production-go-no-go-summary.json"));
  const decisionValidation = readJsonIfPresent(join(reportsDir, "production-decision-validation.json"));

  const stagingGoStatus = goNoGo?.decision ?? "UNKNOWN";
  const stagingObservation = observation?.statusSuggestion ?? "UNKNOWN";
  const preflightRec = preflight?.production_ready_recommendation ?? "UNKNOWN";
  const summaryRec = summary?.recommendation ?? "UNKNOWN";
  const openIncidents = toCount(observation?.webhookOpenIncidents);
  const criticalIncidents = toCount(observation?.webhookCriticalIncidents);
  const staleQuarantine = toCount(observation?.staleQuarantineEvents);
  const failures = toCount(observation?.webhookProcessingFailures);
  const guardrailsOk = summary?.guardrails_ok !== false;
  const docsReady = summary?.docs_ready !== false;
  const now = new Date().toISOString();
  const decisionFilePath = findDecisionFilePath();
  const humanDecisionStatus = decisionValidation?.status ?? "NOT_VALIDATED";
  const humanDecision = decisionValidation?.decision ?? "UNKNOWN";
  const productionAuthorized = decisionValidation?.production_activation_allowed === true;

  const meetingTemplatePresent = existsSync(join(docsDir, "production-go-no-go-meeting-template.md"));
  const decisionExamplePresent = existsSync(join(docsDir, "decisions", "production-webhook-decision-example.md"));

  const lines = [
    "# Pacote de Decisao de Producao — Webhooks Meta/Instagram",
    "",
    `> Gerado em: ${now}`,
    "> AVISO: Este documento NAO autoriza ativacao automatica de producao.",
    "> A ativacao exige decisao humana conjunta, registrada e assinada pelos responsaveis formais.",
    "",
    "---",
    "",
    "## Resumo Executivo",
    "",
    `- staging_go_status: **${stagingGoStatus}**`,
    `- staging_observation_status: **${stagingObservation}**`,
    `- production_preflight_recommendation: **${preflightRec}**`,
    `- production_go_no_go_recommendation: **${summaryRec}**`,
    `- guardrails_ok: **${guardrailsOk}**`,
    `- docs_ready: **${docsReady}**`,
    `- human_decision_status: **${humanDecisionStatus}**`,
    `- production_activation_allowed_by_decision: **${productionAuthorized}**`,
    "",
    "---",
    "",
    "## Status Staging",
    "",
    `- Go/No-Go: ${stagingGoStatus}`,
    `- Observacao: ${stagingObservation}`,
    `- Incidentes abertos (webhook): ${openIncidents}`,
    `- Incidentes criticos (webhook): ${criticalIncidents}`,
    `- Eventos em quarentena envelhecidos: ${staleQuarantine}`,
    `- Falhas de processamento: ${failures}`,
    "",
    "---",
    "",
    "## Status Preflight",
    "",
    `- production:webhook:preflight: ${preflightRec}`,
    `- noDmAutomatic: ${preflight?.noDmAutomatic ?? "N/A"}`,
    `- noAutoContact: ${preflight?.noAutoContact ?? "N/A"}`,
    `- noPoliticalScore: ${preflight?.noPoliticalScore ?? "N/A"}`,
    `- docs_present: ${preflight?.docs_present ?? "N/A"}`,
    "",
    "---",
    "",
    "## Status da Decisao Humana",
    "",
    `- decision_file_path: ${decisionFilePath ?? "(nao encontrado)"}`,
    `- decision_validation_status: ${humanDecisionStatus}`,
    `- decision: ${humanDecision}`,
    `- decision_file_found: ${decisionValidation?.decision_file_found ?? false}`,
    `- decision_is_draft: ${decisionValidation?.is_draft ?? "N/A"}`,
    `- participants_present: ${decisionValidation?.participants_present ?? "N/A"}`,
    `- roles_present: ${decisionValidation?.roles_present ?? "N/A"}`,
    `- training_completed: ${decisionValidation?.training_completed ?? "N/A"}`,
    `- rollback_present: ${decisionValidation?.rollback_present ?? "N/A"}`,
    `- signatures_present: ${decisionValidation?.signatures_present ?? "N/A"}`,
    `- production_authorized: ${productionAuthorized}`,
    "",
    "---",
    "",
    "## Riscos",
    "",
    riskRows(),
    "",
    "---",
    "",
    "## Checklist de Treinamento Operacional",
    "",
    trainingSection(),
    "",
    "---",
    "",
    "## Pendencias",
    "",
    "1. Reuniao formal de go/no-go com os tres responsaveis (tecnico, operacao, compliance).",
    "2. Preenchimento e assinatura da ata: docs/production-go-no-go-meeting-template.md",
    "3. Registro da decisao em: docs/decisions/",
    "4. Conclusao do checklist de treinamento com evidencias reais dos operadores.",
    "",
    "---",
    "",
    "## Documentos de Apoio",
    "",
    `- Template de ata: docs/production-go-no-go-meeting-template.md (presente: ${meetingTemplatePresent})`,
    `- Exemplo de decisao: docs/decisions/production-webhook-decision-example.md (presente: ${decisionExamplePresent})`,
    "- Runbook: docs/production-webhook-runbook.md",
    "- Matriz de risco: docs/production-webhook-risk-matrix.md",
    "",
    "---",
    "",
    "## Decisao Humana Necessaria",
    "",
    `- human_decision_required: **true**`,
    `- automatic_activation_allowed: **false**`,
    "",
    "A producao so pode ser ativada apos:",
    "1. Reuniao com os tres responsaveis.",
    "2. Ata preenchida, assinada e arquivada.",
    "3. Decisao registrada como GO_PRODUCTION.",
    "4. Configuracao manual de producao aplicada pelo responsavel tecnico.",
    "",
    "---",
    "",
    "> AVISO: Este documento NAO autoriza ativacao automatica de producao.",
  ];

  mkdirSync(reportsDir, { recursive: true });
  writeFileSync(outputPath, lines.join("\n") + "\n", "utf8");

  console.log("[production:decision-pack] Production decision pack gerado.");
  console.log(`- recommendation: ${summaryRec}`);
  console.log(`- human_decision_status: ${humanDecisionStatus}`);
  console.log(`- production_authorized: ${productionAuthorized}`);
  console.log(`- output: reports/production-decision-pack.md`);
}

main();
