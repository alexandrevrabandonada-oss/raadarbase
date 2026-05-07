#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const reportsDir = join(process.cwd(), "reports");
const docsDir = join(process.cwd(), "docs");
const outputPath = join(reportsDir, "production-final-decision-pack.md");

function readJson(path) {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

function readText(path) {
  return existsSync(path) ? readFileSync(path, "utf8") : "";
}

function nextStep(status) {
  if (status === "VALID_GO_PRODUCTION") return "P05 Ativação manual controlada.";
  if (status === "VALID_NO_GO_PRODUCTION") return "Executar plano de correções e convocar nova revisão.";
  if (status === "VALID_POSTPONE") return "Agendar nova decisão humana com ata completa.";
  return "Completar a ata final e repetir a validação.";
}

function main() {
  const shadow = readJson(join(reportsDir, "production-shadow-check.json"));
  const accessRoute = readJson(join(reportsDir, "production-route-access-audit.json"));
  const accessRls = readJson(join(reportsDir, "production-rls-audit.json"));
  const accessRole = readJson(join(reportsDir, "production-role-audit.json"));
  const validation = readJson(join(reportsDir, "production-final-decision-validation.json"));
  const meeting = readText(join(docsDir, "production-go-no-go-final-meeting.md"));

  const decision = validation?.decision ?? "UNKNOWN";
  const status = validation?.status ?? "BLOCKED_INCOMPLETE";
  const productionAuthorized = validation?.production_authorized === true;
  const risksAccepted = /## 6\.[\s\S]*?(?=\n## 7\.)/i.exec(meeting)?.[0] ?? "Sem registro.";
  const rollback = /## 8\.[\s\S]*?(?=\n## 9\.)/i.exec(meeting)?.[0] ?? "Sem registro.";

  const lines = [
    "# Production Final Decision Pack",
    "",
    `- Gerado em: ${new Date().toISOString()}`,
    `- Shadow status: ${shadow?.recommendation ?? "desconhecido"}`,
    `- Access audit status: rota=${accessRoute?.recommendation ?? "?"}, rls=${accessRls?.recommendation ?? "?"}, role=${accessRole?.recommendation ?? "?"}`,
    `- Webhook produção status: ${shadow?.webhookEnabled === false ? "disabled" : "indefinido"}`,
    `- Decisão humana: ${decision}`,
    `- Validation status: ${status}`,
    `- Produção autorizada: ${productionAuthorized ? "sim" : "não"}`,
    "",
    "## Resumo Executivo",
    "",
    status === "VALID_GO_PRODUCTION"
      ? "- A ata final validou GO_PRODUCTION, mas este tijolo não executa ativação."
      : "- A produção permanece bloqueada até decisão humana final válida.",
    "",
    "## Riscos",
    "",
    risksAccepted.trim(),
    "",
    "## Rollback",
    "",
    rollback.trim(),
    "",
    "## Próximo passo recomendado",
    "",
    `- ${nextStep(status)}`,
  ];

  mkdirSync(reportsDir, { recursive: true });
  writeFileSync(outputPath, `${lines.join("\n")}\n`, "utf8");

  console.log("[production:final-decision-pack]");
  console.log(`- report: ${outputPath}`);
  console.log(`- validation_status: ${status}`);
  console.log(`- production_authorized: ${productionAuthorized ? "sim" : "não"}`);
}

main();
