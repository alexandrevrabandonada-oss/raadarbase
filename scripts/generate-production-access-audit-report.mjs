#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const reportsDir = join(process.cwd(), "reports");
const routeAuditPath = join(reportsDir, "production-route-access-audit.json");
const rlsAuditPath = join(reportsDir, "production-rls-audit.json");
const roleAuditPath = join(reportsDir, "production-role-audit.json");
const outputPath = join(reportsDir, "production-access-audit-report.md");

function readJson(path) {
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf8"));
}

function summarizeRecommendation(recommendations) {
  if (recommendations.includes("ACCESS_BLOCKED")) return "ACCESS_BLOCKED";
  if (recommendations.includes("NEEDS_FIX")) return "NEEDS_FIX";
  return "ACCESS_READY";
}

function buildFailures(...payloads) {
  return payloads.flatMap((payload) => payload?.failures ?? []);
}

function buildRisks(routeAudit, rlsAudit, roleAudit) {
  const risks = [];
  if ((routeAudit?.findings?.internalRoutesPublic ?? 0) > 0) risks.push("Há rota interna acessível sem sessão.");
  if ((rlsAudit?.findings?.anonReadLeaks ?? 0) > 0 || (rlsAudit?.findings?.anonWriteLeaks ?? 0) > 0) risks.push("Há tabela sensível sem bloqueio anon comprovado.");
  if ((rlsAudit?.findings?.protectedExportLeaks ?? 0) > 0) risks.push("Há export protegido acessível sem autenticação.");
  if ((roleAudit?.findings?.failedCapabilities ?? 0) > 0) risks.push("A matriz de papéis tem evidência incompleta.");
  return risks;
}

function main() {
  const routeAudit = readJson(routeAuditPath);
  const rlsAudit = readJson(rlsAuditPath);
  const roleAudit = readJson(roleAuditPath);
  const recommendation = summarizeRecommendation([
    routeAudit?.recommendation ?? "NEEDS_FIX",
    rlsAudit?.recommendation ?? "NEEDS_FIX",
    roleAudit?.recommendation ?? "NEEDS_FIX",
  ]);
  const failures = buildFailures(routeAudit, rlsAudit, roleAudit);
  const risks = buildRisks(routeAudit, rlsAudit, roleAudit);

  const lines = [
    "# Production Access Audit Report",
    "",
    `- Gerado em: ${new Date().toISOString()}`,
    `- Route audit: ${routeAudit?.recommendation ?? "não executado"}`,
    `- RLS audit: ${rlsAudit?.recommendation ?? "não executado"}`,
    `- Role audit: ${roleAudit?.recommendation ?? "não executado"}`,
    `- Recomendação: ${recommendation}`,
    "- Produção autorizada: não",
    "",
    "## Falhas",
    "",
    ...(failures.length > 0 ? failures.map((failure) => `- ${failure}`) : ["- Nenhuma falha registrada."]),
    "",
    "## Riscos",
    "",
    ...(risks.length > 0 ? risks.map((risk) => `- ${risk}`) : ["- Nenhum risco adicional registrado."]),
  ];

  mkdirSync(reportsDir, { recursive: true });
  writeFileSync(outputPath, `${lines.join("\n")}\n`, "utf8");

  console.log("[production:access-audit-report]");
  console.log(`- report: ${outputPath}`);
  console.log(`- recommendation: ${recommendation}`);

  if (recommendation !== "ACCESS_READY") process.exitCode = 1;
}

main();
