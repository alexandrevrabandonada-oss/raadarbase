#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const defaultUrl = "https://raadarbase.vercel.app";
const appUrl = (process.env.PRODUCTION_SHADOW_URL || process.env.APP_URL || defaultUrl).replace(/\/$/, "");
const reportsDir = join(process.cwd(), "reports");
const outputPath = join(reportsDir, "production-shadow-check.json");

const sensitiveMarkers = [
  /meta_app_secret/i,
  /meta_access_token/i,
  /meta_webhook_verify_token/i,
  /supabase_service_role_key/i,
  /next_public_supabase_anon_key/i,
  /access_token/i,
  /app_secret/i,
  /service_role/i,
  /webhook_verify_token/i,
  /bearer\s+[a-z0-9._-]+/i,
  /raw_payload/i,
  /["']contact_email["']\s*:/i,
  /["']contact_phone["']\s*:/i,
  /["']comment_text["']\s*:/i,
  /["']username["']\s*:/i,
];

const secretEnvKeys = [
  "SUPABASE_SECRET_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "META_ACCESS_TOKEN",
  "META_APP_SECRET",
  "META_WEBHOOK_VERIFY_TOKEN",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
];

const criticalRoutes = [
  "/",
  "/dashboard",
  "/integracoes/meta",
  "/recibo/escuta",
  "/escuta/bairro",
  "/campo",
  "/voluntarios",
  "/voluntarios/quero-ajudar",
  "/radar/silencios",
];

const publicRoutes = ["/", "/recibo/escuta", "/escuta/bairro", "/voluntarios/quero-ajudar"];

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  const lines = readFileSync(path, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...valueParts] = trimmed.split("=");
    process.env[key] ??= valueParts.join("=").replace(/^"(.*)"$/, "$1");
  }
}

loadEnvFile(".env.local");

async function fetchText(url, init) {
  const response = await fetch(url, { redirect: "manual", ...init });
  const text = await response.text().catch(() => "");
  return { response, text };
}

function findSensitiveMarkers(text) {
  const markers = sensitiveMarkers.filter((pattern) => pattern.test(text)).map((pattern) => pattern.source);
  return [...new Set(markers)];
}

function findSecretValues(text) {
  const matches = [];
  for (const key of secretEnvKeys) {
    const value = process.env[key]?.trim();
    if (value && value.length > 8 && text.includes(value)) {
      matches.push(key);
    }
  }
  if (/sb_(publishable|secret)_[a-z0-9._-]+/i.test(text)) matches.push("supabase_token_shape");
  if (/eyJhbGciOi[0-9A-Za-z._-]+/.test(text)) matches.push("jwt_shape");
  return [...new Set(matches)];
}

function findPii(text) {
  const findings = [];
  if (/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text)) findings.push("email_shape");
  if (/\b(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?9\d{4}[-\s]?\d{4}\b/.test(text)) findings.push("phone_shape");
  return findings;
}

async function checkHealth() {
  const { response, text } = await fetchText(`${appUrl}/api/health`);
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    // handled by status fields
  }
  return {
    ok: response.ok,
    status: response.status,
    sensitiveMarkersFound: findSensitiveMarkers(text),
    secretValuesFound: findSecretValues(text),
    piiFound: findPii(text),
    mockModeFalse: json?.mock_mode === false,
    metaManualSyncReadyIsBoolean: typeof json?.meta_manual_sync_ready === "boolean",
    webhookEnabledFalse: json?.meta_webhook_enabled === false,
  };
}

async function checkRoutes() {
  const results = [];
  for (const route of criticalRoutes) {
    const { response, text } = await fetchText(`${appUrl}${route}`);
    const isPublic = publicRoutes.includes(route);
    results.push({
      route,
      status: response.status,
      ok: response.ok || [301, 302, 303, 307, 308].includes(response.status),
      sensitiveMarkersFound: findSensitiveMarkers(text),
      secretValuesFound: findSecretValues(text),
      piiFound: isPublic ? findPii(text) : [],
    });
  }
  return results;
}

async function checkSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return { configured: false, responds: false, rlsBasicOk: false };
  const headers = { apikey: anon, Authorization: `Bearer ${anon}`, "Content-Type": "application/json" };
  const health = await fetch(`${url}/rest/v1/`, { headers }).catch(() => null);
  const rls = await fetch(`${url}/rest/v1/ig_people`, {
    method: "POST",
    headers: { ...headers, Prefer: "return=minimal" },
    body: JSON.stringify({ username: "shadow_rls_probe" }),
  }).catch(() => null);
  return {
    configured: true,
    responds: Boolean(health && [200, 300, 401, 404].includes(health.status)),
    rlsBasicOk: Boolean(rls && !rls.ok),
  };
}

async function main() {
  const health = await checkHealth();
  const routes = await checkRoutes();
  const supabase = await checkSupabase();
  const failures = [];

  if (!appUrl) failures.push("APP_URL ausente.");
  if (!health.ok) failures.push("/api/health não respondeu OK.");
  if (health.sensitiveMarkersFound.length > 0) failures.push("Health expôs marcador sensível.");
  if (health.secretValuesFound.length > 0) failures.push("Health expôs valor sensível.");
  if (health.piiFound.length > 0) failures.push("Health expôs PII.");
  if (!health.mockModeFalse) failures.push("mock_mode não está false.");
  if (!health.metaManualSyncReadyIsBoolean) failures.push("meta_manual_sync_ready não é boolean seguro.");
  if (!health.webhookEnabledFalse) failures.push("meta_webhook_enabled não está false.");
  for (const route of routes) {
    if (!route.ok) failures.push(`Rota crítica falhou: ${route.route}`);
    if (route.sensitiveMarkersFound.length > 0) failures.push(`Rota expôs marcador sensível: ${route.route}`);
    if (route.secretValuesFound.length > 0) failures.push(`Rota expôs valor sensível: ${route.route}`);
    if (route.piiFound.length > 0) failures.push(`Página pública expôs padrão de PII: ${route.route}`);
  }
  if (!supabase.configured || !supabase.responds) failures.push("Supabase não respondeu com anon key.");
  if (!supabase.rlsBasicOk) failures.push("RLS básico não bloqueou escrita anon em ig_people.");

  const totals = {
    sensitiveMarkersFound:
      health.sensitiveMarkersFound.length + routes.reduce((count, route) => count + route.sensitiveMarkersFound.length, 0),
    secretValuesFound:
      health.secretValuesFound.length + routes.reduce((count, route) => count + route.secretValuesFound.length, 0),
    piiFound:
      health.piiFound.length + routes.reduce((count, route) => count + route.piiFound.length, 0),
  };

  const status = totals.sensitiveMarkersFound > 0 || totals.secretValuesFound > 0 || totals.piiFound > 0
    ? "SHADOW_BLOCKED"
    : failures.length > 0
      ? "NEEDS_FIX"
      : "SHADOW_READY";

  const payload = {
    generatedAt: new Date().toISOString(),
    appUrl,
    environment: "production-shadow",
    health,
    routes,
    supabase,
    findings: totals,
    failures,
    secretLeakDetected: status === "SHADOW_BLOCKED",
    webhookEnabled: false,
    publicProductionReleased: false,
    recommendation: status,
  };

  mkdirSync(reportsDir, { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  console.log("[production:shadow-check]");
  console.log(`- domain: ${appUrl}`);
  console.log(`- health_ok: ${health.ok}`);
  console.log(`- mock_mode_false: ${health.mockModeFalse}`);
  console.log(`- webhook_enabled_false: ${health.webhookEnabledFalse}`);
  console.log(`- routes_ok: ${routes.every((route) => route.ok && route.sensitiveMarkersFound.length === 0 && route.secretValuesFound.length === 0 && route.piiFound.length === 0)}`);
  console.log(`- supabase_responds: ${supabase.responds}`);
  console.log(`- rls_basic_ok: ${supabase.rlsBasicOk}`);
  console.log(`- sensitive_markers_found: ${totals.sensitiveMarkersFound}`);
  console.log(`- secret_values_found: ${totals.secretValuesFound}`);
  console.log(`- pii_found: ${totals.piiFound}`);
  console.log(`- secret_leak_detected: ${payload.secretLeakDetected}`);
  console.log(`- recommendation: ${status}`);

  if (status !== "SHADOW_READY") process.exitCode = 1;
}

main().catch((error) => {
  console.error(`[production:shadow-check] erro: ${error instanceof Error ? error.message : "falha desconhecida"}`);
  process.exit(1);
});
