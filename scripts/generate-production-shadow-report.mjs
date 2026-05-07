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
    `- Webhook enabled: ${check?.health?.webhookEnabledFalse ? "false" : "não confirmado"}`,
    `- meta_manual_sync_ready boolean seguro: ${status(check?.health?.metaManualSyncReadyIsBoolean)}`,
    `- Supabase responde: ${status(check?.supabase?.responds)}`,
    `- RLS básico OK: ${status(check?.supabase?.rlsBasicOk)}`,
    `- Vazamento de secret: ${check?.secretLeakDetected ? "sim" : "não"}`,
    "- Produção pública liberada: não",
    "",
    "## Rotas Testadas",
    "",
    ...(check?.routes ?? []).map((route) => `- ${route.route}: status ${route.status}, ok=${route.ok}, pii=${route.piiExposed ? "sim" : "não"}, secrets=${route.secretsExposed?.length ? "sim" : "não"}`),
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
