#!/usr/bin/env node

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const reportsDir = join(__dirname, "..", "reports");
const artifactPath = join(reportsDir, "staging-devolution-db-check.json");

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

function redact(message) {
  return String(message || "")
    .replace(/(token|secret|password|authorization|cookie|session)=([^\s&]+)/gi, "$1=[REDACTED]")
    .replace(/Bearer\s+[^\s]+/gi, "Bearer [REDACTED]");
}

function envValue(name) {
  return process.env[name] || "";
}

async function maybeReloadSchemaCache() {
  const accessToken = envValue("SUPABASE_ACCESS_TOKEN");
  const projectRef = process.env.SUPABASE_PROJECT_ID ?? "blimjnitngthldhazvwh";
  if (!accessToken) return { triggered: false, ok: false };

  const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: "NOTIFY pgrst, 'reload schema';" }),
  });

  return { triggered: true, ok: response.ok };
}

async function main() {
  loadLocalEnvFallback();
  const url = envValue("SUPABASE_URL") || envValue("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRole = envValue("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = envValue("NEXT_PUBLIC_SUPABASE_ANON_KEY") || envValue("SUPABASE_ANON_KEY");

  if (!url || !serviceRole) {
    const output = {
      generatedAt: new Date().toISOString(),
      status: "PENDING_EXTERNAL_VALIDATION",
      reason: "Supabase staging nao configurado (url/service role ausentes).",
      checks: [],
    };
    writeArtifact(output);
    console.log("[staging:devolution-db-check] Supabase staging nao configurado no ambiente.");
    process.exit(0);
  }

  const reload = await maybeReloadSchemaCache().catch(() => ({ triggered: false, ok: false }));
  const supabase = createClient(url, serviceRole, { auth: { persistSession: false, autoRefreshToken: false } });
  const anon = anonKey ? createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } }) : null;

  const checks = [];
  for (const table of [
    "public_devolution_publications",
    "territorial_listening_windows",
    "territorial_listening_daily_snapshots",
    "territorial_listening_outreach_logs",
    "public_receipt_distribution_logs",
    "public_receipt_distribution_cycles",
  ]) {
    const { count, error } = await supabase.from(table).select("id", { count: "exact", head: true });
    checks.push({
      table,
      serviceRoleCanRead: !error,
      serviceRoleCount: count ?? 0,
      detail: error ? redact(error.message) : "ok",
    });
  }

  const anonInsertCheck = anon
    ? await anon.from("public_devolution_publications").insert({ report_id: "00000000-0000-0000-0000-000000000000" })
    : null;
  const anonWriteBlocked = Boolean(anonInsertCheck?.error);

  const output = {
    generatedAt: new Date().toISOString(),
    status: checks.every((item) => item.serviceRoleCanRead) && anonWriteBlocked ? "OK" : "FAIL",
    schemaCacheReloaded: reload.triggered ? reload.ok : false,
    reloadAttempted: reload.triggered,
    checks,
    anonWriteBlocked,
  };

  writeArtifact(output);

  console.log("[staging:devolution-db-check] Database checklist");
  for (const item of checks) {
    console.log(`- ${item.table}: ${item.serviceRoleCanRead ? "ok" : "fail"}`);
  }
  console.log(`- anon write blocked: ${anonWriteBlocked ? "ok" : "fail"}`);
  console.log(`- schema cache reload: ${reload.triggered ? (reload.ok ? "ok" : "fail") : "not-attempted"}`);

  if (output.status !== "OK") {
    console.log("[staging:devolution-db-check] Resultado: FAIL");
    process.exit(1);
  }

  console.log("[staging:devolution-db-check] Resultado: OK");
}

main().catch((error) => {
  console.error("[staging:devolution-db-check] Erro nao tratado.");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});