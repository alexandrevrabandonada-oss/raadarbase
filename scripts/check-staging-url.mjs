#!/usr/bin/env node

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const reportsDir = join(__dirname, "..", "reports");
const artifactPath = join(reportsDir, "staging-check-url.json");

function loadEnvFromFile(filePath) {
  try {
    const text = readFileSync(filePath, "utf8");
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const idx = line.indexOf("=");
      if (idx <= 0) continue;
      const key = line.slice(0, idx).trim();
      let value = line.slice(idx + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // optional env file
  }
}

function loadLocalEnvFallback() {
  loadEnvFromFile(join(__dirname, "..", ".env"));
  loadEnvFromFile(join(__dirname, "..", ".env.local"));
}

function writeArtifact(payload) {
  mkdirSync(reportsDir, { recursive: true });
  writeFileSync(artifactPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function redactError(message) {
  if (!message) return "unknown error";

  return String(message)
    .replace(/(token|secret|password|authorization|cookie|session)=([^\s&]+)/gi, "$1=[REDACTED]")
    .replace(/Bearer\s+[^\s]+/gi, "Bearer [REDACTED]")
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "[REDACTED_EMAIL]")
    .replace(/(\+?\d{1,3}[\s.-]?)?(\(?\d{2,3}\)?[\s.-]?)\d{4,5}[\s.-]?\d{4}/g, "[REDACTED_PHONE]");
}

function classifyLikelyCause(status, errorText) {
  const lower = (errorText || "").toLowerCase();

  if (!status && /fetch failed|econnrefused|enotfound|timed out|network/.test(lower)) {
    return "deploy dormindo, dominio errado, bloqueio de rede ou app fora do ar";
  }

  if (status === 404) {
    return "rota nao publicada ou path incorreto";
  }

  if (status >= 500) {
    return "erro 500 no servidor ou env ausente no deploy";
  }

  if (status >= 400) {
    return "erro de configuracao, token invalido ou bloqueio de acesso";
  }

  return "sem causa aparente";
}

async function checkUrl(name, url) {
  try {
    const response = await fetch(url, { method: "GET" });
    return {
      name,
      ok: response.ok,
      status: response.status,
      message: `HTTP ${response.status}`,
      urlChecked: name,
    };
  } catch (error) {
    const message = redactError(error instanceof Error ? error.message : String(error));
    return {
      name,
      ok: false,
      status: null,
      message,
      urlChecked: name,
    };
  }
}

async function main() {
  loadLocalEnvFallback();
  const appUrlRaw = process.env.APP_URL || "";
  const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN || "staging-check-token";

  if (!appUrlRaw) {
    const output = {
      generatedAt: new Date().toISOString(),
      status: "PENDING_EXTERNAL_VALIDATION",
      appUrlConfigured: false,
      reason: "APP_URL ausente no ambiente.",
      checks: [],
      likelyCause: "env ausente",
    };

    writeArtifact(output);
    console.log("[staging:check-url] APP_URL: not configured");
    console.log("[staging:check-url] Resultado: PENDING_EXTERNAL_VALIDATION");
    process.exit(0);
  }

  let parsed;
  try {
    parsed = new URL(appUrlRaw);
  } catch {
    const output = {
      generatedAt: new Date().toISOString(),
      status: "PENDING_EXTERNAL_VALIDATION",
      appUrlConfigured: true,
      appUrlValid: false,
      reason: "APP_URL invalida.",
      checks: [],
      likelyCause: "dominio errado",
    };

    writeArtifact(output);
    console.log("[staging:check-url] APP_URL: invalid format");
    console.log("[staging:check-url] Resultado: PENDING_EXTERNAL_VALIDATION");
    process.exit(0);
  }

  const baseUrl = parsed.toString().replace(/\/$/, "");
  const isLoopback = ["127.0.0.1", "localhost", "::1"].includes(parsed.hostname);

  if (isLoopback) {
    const output = {
      generatedAt: new Date().toISOString(),
      status: "PENDING_EXTERNAL_VALIDATION",
      appUrlConfigured: true,
      appUrlValid: true,
      checks: [],
      likelyCause: "dominio errado (APP_URL local/loopback; necessario endpoint de staging publico)",
    };

    writeArtifact(output);
    console.log("[staging:check-url] APP_URL: loopback/local");
    console.log("[staging:check-url] Causa provavel: dominio errado para staging externo");
    console.log("[staging:check-url] Resultado: PENDING_EXTERNAL_VALIDATION");
    process.exit(0);
  }
  const webhookCheckUrl = `${baseUrl}/api/meta/webhook?hub.mode=subscribe&hub.verify_token=${encodeURIComponent(verifyToken)}&hub.challenge=staging-check`;

  const checks = [];
  checks.push(await checkUrl("GET APP_URL", baseUrl));
  checks.push(await checkUrl("GET APP_URL/api/health", `${baseUrl}/api/health`));
  checks.push(await checkUrl("GET APP_URL/api/meta/webhook", webhookCheckUrl));

  const firstFailure = checks.find((item) => !item.ok);
  const likelyCause = firstFailure ? classifyLikelyCause(firstFailure.status, firstFailure.message) : "sem causa aparente";

  const output = {
    generatedAt: new Date().toISOString(),
    status: firstFailure ? "PENDING_EXTERNAL_VALIDATION" : "READY",
    appUrlConfigured: true,
    appUrlValid: true,
    checks,
    likelyCause,
  };

  writeArtifact(output);

  console.log("[staging:check-url] APP_URL: configured");
  for (const item of checks) {
    console.log(`- ${item.name}: ${item.status === null ? "NETWORK_ERROR" : `HTTP ${item.status}`} (${item.ok ? "ok" : "fail"})`);
  }

  if (firstFailure) {
    console.log(`[staging:check-url] Causa provavel: ${likelyCause}`);
    console.log("[staging:check-url] Resultado: PENDING_EXTERNAL_VALIDATION");
    process.exit(0);
  }

  console.log("[staging:check-url] Resultado: READY");
}

main().catch((error) => {
  console.error("[staging:check-url] Erro nao tratado.");
  console.error(redactError(error instanceof Error ? error.message : String(error)));
  process.exit(1);
});
