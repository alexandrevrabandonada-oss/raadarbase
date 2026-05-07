#!/usr/bin/env node

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const reportsDir = join(__dirname, "..", "reports");
const artifactPath = join(reportsDir, "staging-meta-api-check.json");

const requiredEnvNames = [
  "APP_URL",
  "META_ACCESS_TOKEN",
  "INSTAGRAM_BUSINESS_ACCOUNT_ID",
  "META_GRAPH_VERSION",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
];

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

async function safeJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function boolFrom(payload, key) {
  return typeof payload?.[key] === "boolean" ? payload[key] : null;
}

async function fetchRemoteHealth(appUrl) {
  if (!appUrl) return null;
  const response = await fetch(`${appUrl.replace(/\/+$/, "")}/api/health`, { cache: "no-store" });
  return {
    ok: response.ok,
    status: response.status,
    body: await safeJson(response),
  };
}

async function main() {
  loadLocalEnvFallback();

  console.log("[staging:meta-api-check] Meta API staging config check");

  const localChecks = requiredEnvNames.map((name) => ({
    name,
    present: Boolean(process.env[name]),
  }));

  let remote = null;
  try {
    remote = await fetchRemoteHealth(process.env.APP_URL);
  } catch (error) {
    remote = {
      ok: false,
      status: 0,
      body: null,
      error: error instanceof Error ? error.message : "Falha ao consultar health remoto.",
    };
  }

  const remoteBody = remote?.body ?? {};
  const remoteChecks = remote
    ? [
        { name: "health endpoint reachable", present: remote.ok, detail: `status=${remote.status}` },
        { name: "meta_api_credentials_present", present: boolFrom(remoteBody, "meta_api_credentials_present") === true },
        {
          name: "instagram_business_account_id_present",
          present: boolFrom(remoteBody, "instagram_business_account_id_present") === true,
        },
        { name: "meta_graph_version_present", present: boolFrom(remoteBody, "meta_graph_version_present") === true },
        { name: "meta_manual_sync_ready", present: boolFrom(remoteBody, "meta_manual_sync_ready") === true },
      ]
    : [];

  for (const check of localChecks) {
    console.log(`- [${check.present ? "x" : " "}] local ${check.name}: ${check.present}`);
  }
  for (const check of remoteChecks) {
    console.log(`- [${check.present ? "x" : " "}] remote ${check.name}: ${check.present}`);
  }

  const failures = [...localChecks, ...remoteChecks].filter((check) => !check.present);
  const summary = {
    generatedAt: new Date().toISOString(),
    status: failures.length > 0 ? "FAIL" : "OK",
    localChecks,
    remoteHealthReachable: remote?.ok ?? false,
    remoteChecks,
  };

  writeArtifact(summary);

  if (failures.length > 0) {
    console.log("[staging:meta-api-check] Resultado: FAIL.");
    process.exit(1);
  }

  console.log("[staging:meta-api-check] Resultado: OK.");
}

main().catch((error) => {
  console.error("[staging:meta-api-check] Erro nao tratado.");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
