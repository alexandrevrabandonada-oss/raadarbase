#!/usr/bin/env node

import { existsSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const reportsDir = join(__dirname, "..", "reports");
const outputPath = join(reportsDir, "staging-webhook-validation.md");
const dryRunPath = join(reportsDir, "staging-webhook-dry-run.json");
const evidencePath = join(reportsDir, "staging-webhook-evidence.json");
const goNoGoPath = join(reportsDir, "staging-webhook-go-no-go.json");

function readJson(path) {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

function boolText(value) {
  return value ? "sim" : "nao";
}

function inferPendingReason(dryRun, evidence, decision) {
  if (evidence?.status === "PENDING_EXTERNAL_VALIDATION" && evidence?.reason) {
    return evidence.reason;
  }

  const failedCheck = dryRun?.checks?.find((item) => !item.ok);
  if (failedCheck) {
    return `Dry-run externo bloqueado em ${failedCheck.name} (${failedCheck.detail}).`;
  }

  if (decision === "PENDING_EXTERNAL_VALIDATION") {
    return "Executar validacao externa com APP_URL real e Supabase real.";
  }

  return null;
}

function main() {
  const generatedAt = new Date().toISOString();
  const dryRun = readJson(dryRunPath);
  const evidence = readJson(evidencePath);
  const goNoGo = readJson(goNoGoPath);

  const appUrlPresent = Boolean(process.env.APP_URL);
  const decision = goNoGo?.decision || "PENDING_EXTERNAL_VALIDATION";
  const pendingReason = inferPendingReason(dryRun, evidence, decision);

  const goNoGoSection = goNoGo
    ? `\n- sinais avaliados:\n${Object.entries(goNoGo.signals || {})
        .map(([key, value]) => `  - ${key}: ${value ? "ok" : "missing"}`)
        .join("\n")}\n`
    : "Sem artefato de go/no-go encontrado.";

  const content = `# Validacao de Staging dos Webhooks Meta

- Data/hora: ${generatedAt}
- APP_URL presente: ${boolText(appUrlPresent)}
- dry-run executado: ${boolText(dryRun?.executedWithAppUrl)}
- decisao go/no-go: ${decision}

## Evidencias SQL redigidas

- total meta_webhook_events: ${evidence?.totalMetaWebhookEvents ?? 0}
- total em quarentena: ${evidence?.totalQuarantined ?? 0}
- total processado: ${evidence?.totalProcessed ?? 0}
- total ignorado: ${evidence?.totalIgnored ?? 0}
- total failed: ${evidence?.totalFailed ?? 0}
- total assinatura invalida: ${evidence?.totalInvalidSignature ?? 0}
- total incidentes relacionados a webhook: ${evidence?.totalWebhookIncidents ?? 0}
- total audit_logs relacionados a webhook: ${evidence?.totalWebhookAuditLogs ?? 0}

## Ultimos sinais (redigidos)

- ultimo evento: ${evidence?.lastEvent ? JSON.stringify(evidence.lastEvent) : "n/a"}
- ultimo incidente: ${evidence?.lastIncident ? JSON.stringify(evidence.lastIncident) : "n/a"}

## Resultado go/no-go

${goNoGoSection}

## Pendencias

- ${decision === "GO_STAGING" && !pendingReason ? "Sem pendencias externas obrigatorias identificadas neste momento." : pendingReason || "Existem sinais pendentes ou bloqueios externos a resolver antes do GO_STAGING."}

## Checklist final

- [${dryRun?.executedWithAppUrl ? "x" : " "}] dry-run externo com APP_URL
- [${(evidence?.totalMetaWebhookEvents ?? 0) > 0 ? "x" : " "}] eventos webhook registrados
- [${(evidence?.totalWebhookAuditLogs ?? 0) > 0 ? "x" : " "}] audit logs encontrados
- [${(evidence?.totalWebhookIncidents ?? 0) > 0 ? "x" : " "}] incidentes encontrados
- [${decision === "GO_STAGING" ? "x" : " "}] decisao GO_STAGING

## Aviso

Nao colar secrets neste relatorio.
`;

  mkdirSync(reportsDir, { recursive: true });
  writeFileSync(outputPath, content, "utf8");

  console.log("[staging:webhook:report] Report generated:", outputPath);
}

main();
