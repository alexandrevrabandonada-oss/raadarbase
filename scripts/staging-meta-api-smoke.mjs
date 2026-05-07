#!/usr/bin/env node

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const reportsDir = join(__dirname, "..", "reports");
const artifactPath = join(reportsDir, "staging-meta-api-smoke.json");

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
      if (!process.env[key]) process.env[key] = value;
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

function redact(value) {
  const token = process.env.META_ACCESS_TOKEN;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  let output = String(value ?? "");
  if (token) output = output.replaceAll(token, "[redacted]");
  if (serviceRole) output = output.replaceAll(serviceRole, "[redacted]");
  return output
    .replace(/access_token=[^&\s]+/gi, "access_token=[redacted]")
    .replace(/"access_token"\s*:\s*"[^"]+"/gi, '"access_token":"[redacted]"');
}

async function safeJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function requireEnv(name) {
  if (!process.env[name]) {
    throw new Error(`${name} ausente.`);
  }
}

async function main() {
  loadLocalEnvFallback();

  console.log("[staging:meta-api-smoke] Meta API smoke test");

  try {
    for (const name of ["META_ACCESS_TOKEN", "INSTAGRAM_BUSINESS_ACCOUNT_ID", "META_GRAPH_VERSION"]) {
      requireEnv(name);
    }

    const version = process.env.META_GRAPH_VERSION;
    const accountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
    const url = new URL(`https://graph.facebook.com/${version}/${accountId}`);
    url.searchParams.set("fields", "id,username,name,media_count");
    url.searchParams.set("access_token", process.env.META_ACCESS_TOKEN);

    const response = await fetch(url, { cache: "no-store" });
    const body = await safeJson(response);
    const graphError = body?.error;

    if (!response.ok || graphError) {
      const message = redact(graphError?.message ?? `Meta API retornou HTTP ${response.status}.`);
      writeArtifact({
        generatedAt: new Date().toISOString(),
        status: "FAIL",
        httpStatus: response.status,
        errorCode: graphError?.code ? String(graphError.code) : null,
        errorMessage: message,
      });
      console.log(`[staging:meta-api-smoke] Resultado: FAIL (${response.status}).`);
      console.log(`[staging:meta-api-smoke] erro: ${message}`);
      process.exit(1);
    }

    const summary = {
      generatedAt: new Date().toISOString(),
      status: "OK",
      httpStatus: response.status,
      accountResponded: Boolean(body?.id),
      usernamePresent: Boolean(body?.username),
      namePresent: Boolean(body?.name),
      mediaCountPresent: typeof body?.media_count === "number",
    };

    writeArtifact(summary);
    console.log("[staging:meta-api-smoke] Resultado: OK.");
    console.log(`- account responded: ${summary.accountResponded}`);
    console.log(`- username present: ${summary.usernamePresent}`);
    console.log(`- media count present: ${summary.mediaCountPresent}`);
  } catch (error) {
    const message = redact(error instanceof Error ? error.message : String(error));
    writeArtifact({
      generatedAt: new Date().toISOString(),
      status: "FAIL",
      errorMessage: message,
    });
    console.log("[staging:meta-api-smoke] Resultado: FAIL.");
    console.log(`[staging:meta-api-smoke] erro: ${message}`);
    process.exit(1);
  }
}

main();
