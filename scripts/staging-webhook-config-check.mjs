#!/usr/bin/env node

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const appUrl = process.env.APP_URL;
const reportsDir = join(__dirname, "..", "reports");
const artifactPath = join(reportsDir, "staging-webhook-config-check.json");

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

function readBoolean(obj, key) {
  return typeof obj?.[key] === "boolean" ? obj[key] : null;
}

function readBooleanAny(obj, keys) {
  for (const key of keys) {
    const value = readBoolean(obj, key);
    if (value !== null) {
      return value;
    }
  }
  return null;
}

async function fetchHealth(baseUrl) {
  const response = await fetch(`${baseUrl}/api/health`);
  const body = await safeJson(response);
  return {
    ok: response.ok,
    status: response.status,
    body,
  };
}

async function fetchDiagnostics(baseUrl) {
  const response = await fetch(`${baseUrl}/api/meta/webhook/diagnostics`);
  const body = await safeJson(response);
  return {
    ok: response.ok,
    status: response.status,
    body,
  };
}

function resolveSource(health, diagnostics) {
  const diagnosticsAvailable = diagnostics.ok && diagnostics.body && typeof diagnostics.body === "object";
  if (diagnosticsAvailable) {
    return {
      source: "diagnostics",
      payload: diagnostics.body,
      diagnosticsStatus: diagnostics.status,
    };
  }

  return {
    source: "health",
    payload: health.body,
    diagnosticsStatus: diagnostics.status,
  };
}

async function main() {
  console.log("[staging:webhook:config-check] Remote webhook config check");

  if (!appUrl) {
    writeArtifact({
      generatedAt: new Date().toISOString(),
      appUrlConfigured: false,
      status: "PENDING_EXTERNAL_VALIDATION",
      reason: "APP_URL nao configurada.",
      checks: [],
    });
    console.log("[staging:webhook:config-check] APP_URL nao configurada.");
    process.exit(0);
  }

  const host = new URL(appUrl).hostname;
  console.log(`[staging:webhook:config-check] using APP_URL host: ${host}`);

  try {
    const health = await fetchHealth(appUrl);
    const diagnostics = await fetchDiagnostics(appUrl);
    const resolved = resolveSource(health, diagnostics);
    const payload = resolved.payload ?? {};

    const checks = [
      {
        name: "health endpoint reachable",
        ok: health.ok,
        detail: `status=${health.status}`,
      },
      {
        name: "verify token present",
        ok:
          readBooleanAny(payload, [
            "meta_webhook_verify_token_present",
            "meta_webhook_verify_present",
          ]) === true,
        detail: "boolean only",
      },
      {
        name: "app secret present",
        ok: readBoolean(payload, "meta_app_secret_present") === true,
        detail: "boolean only",
      },
      {
        name: "service role present",
        ok:
          readBooleanAny(payload, [
            "supabase_service_role_present",
            "supabase_server_key_present",
          ]) === true,
        detail: "boolean only",
      },
      {
        name: "webhook enabled",
        ok: readBoolean(payload, "meta_webhook_enabled") === true,
        detail: "boolean only",
      },
      {
        name: "allowed objects configured",
        ok: readBoolean(payload, "meta_webhook_allowed_objects_configured") === true,
        detail: "boolean only",
      },
      {
        name: "allowed object includes instagram",
        ok: readBoolean(payload, "meta_webhook_allowed_objects_has_instagram") === true,
        detail: "boolean only",
      },
      {
        name: "max payload configured",
        ok: readBoolean(payload, "meta_webhook_max_payload_bytes_configured") === true,
        detail: "boolean only",
      },
    ];

    console.log(`[staging:webhook:config-check] source: ${resolved.source}`);
    console.log(`[staging:webhook:config-check] diagnostics endpoint status: ${resolved.diagnosticsStatus}`);
    for (const check of checks) {
      console.log(`- [${check.ok ? "x" : " "}] ${check.name} (${check.detail})`);
    }

    const failures = checks.filter((item) => !item.ok);

    writeArtifact({
      generatedAt: new Date().toISOString(),
      appUrlConfigured: true,
      status: failures.length > 0 ? "NO_GO_STAGING" : "READY",
      source: resolved.source,
      diagnosticsStatus: resolved.diagnosticsStatus,
      checks,
      environment: typeof payload.environment === "string" ? payload.environment : null,
      runtime: typeof payload.runtime === "string" ? payload.runtime : null,
    });

    if (failures.length > 0) {
      process.exit(1);
    }

    console.log("[staging:webhook:config-check] Remote config check concluido.");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    writeArtifact({
      generatedAt: new Date().toISOString(),
      appUrlConfigured: true,
      status: "PENDING_EXTERNAL_VALIDATION",
      reason: message,
      checks: [],
    });
    console.log(`[staging:webhook:config-check] indisponivel: ${message}`);
    process.exit(0);
  }
}

main();
