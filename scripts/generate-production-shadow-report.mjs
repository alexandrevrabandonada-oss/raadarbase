#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const reportsDir = join(process.cwd(), "reports");
const checkPath = join(reportsDir, "production-shadow-check.json");
const outputPath = join(reportsDir, "production-shadow-report.md");

function readCheck() {
  if (!existsSync(checkPath)) return null;
  try {
    return JSON.parse(readFileSync(checkPath, "utf8"));
  } catch {
    return null;
  }
}

function status(value) {
  return value ? "OK" : "FAIL";
}

function main() {
  const check = readCheck();
  const recommendation = check?.recommendation ?? "NEEDS_FIX";
  const lines = [
    "# Production Shadow Report",
    "",
    `- Gerado em: ${new Date().toISOString()}`,
    `- Domínio: ${check?.appUrl ?? "não verificado"}`,
    "- Ambiente: production-shadow",
    `- Health OK: ${status(check?.health?.ok)}`,
    `- Mock mode false: ${status(check?.health?.mockModeFalse)}`,
    `- Webhook production disabled: ${check?.health?.webhookEnabledFalse ? "true" : "false"}`,
    `- Secrets safe: ${check?.secretLeakDetected ? "false" : "true"}`,
    `- Sensitive markers found: ${check?.findings?.sensitiveMarkersFound ?? 0}`,
    `- Secret values found: ${check?.findings?.secretValuesFound ?? 0}`,
    `- PII found: ${check?.findings?.piiFound ?? 0}`,
    "- Produção pública liberada: não",
    "",
    "## Falhas",
    "",
    ...(check?.failures?.length ? check.failures.map((failure) => `- ${failure}`) : ["- Nenhuma falha registrada no production-shadow-check."]),
    "",
    "## Decisão",
    "",
    `- Recomendação: ${recommendation}`,
    "- GO_PRODUCTION autorizado: não",
  ];

  mkdirSync(reportsDir, { recursive: true });
  writeFileSync(outputPath, `${lines.join("\n")}\n`, "utf8");

  console.log("[production:shadow-report]");
  console.log(`- report: ${outputPath}`);
  console.log(`- recommendation: ${recommendation}`);
  console.log(`- secret_leak_detected: ${check?.secretLeakDetected ? "sim" : "não"}`);

  if (recommendation === "SHADOW_BLOCKED") process.exitCode = 1;
}

main();
