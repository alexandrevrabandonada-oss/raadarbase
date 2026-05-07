#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const defaultUrl = "https://raadarbase.vercel.app";
const appUrl = (process.env.PRODUCTION_SHADOW_URL || process.env.APP_URL || defaultUrl).replace(/\/$/, "");
const reportsDir = join(process.cwd(), "reports");
const outputPath = join(reportsDir, "production-shadow-check.json");

const forbiddenMarkers = [
  "service_role",
  "sbp_",
  "eyJhbGciOi",
  "raw_payload",
  "contact_email",
  "contact_phone",
];

const secretEnvKeys = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "META_ACCESS_TOKEN",
  "META_APP_SECRET",
  "META_WEBHOOK_VERIFY_TOKEN",
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

function hasForbiddenMarker(text) {
  const markers = forbiddenMarkers.filter((marker) => text.toLowerCase().includes(marker.toLowerCase()));
  for (const key of secretEnvKeys) {
    const value = process.env[key]?.trim();
    if (value && value.length > 8 && text.includes(value)) {
      markers.push(key);
    }
  }
  return markers;
}

function hasPiiShape(text) {
  return /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text) || /\b(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?9\d{4}[-\s]?\d{4}\b/.test(text);
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
    secretsExposed: hasForbiddenMarker(text),
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
      secretsExposed: hasForbiddenMarker(text),
      piiExposed: isPublic ? hasPiiShape(text) : false,
    });
  }
  return results;
}

async function checkSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
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
  if (health.secretsExposed.length > 0) failures.push("Health expôs marcador sensível.");
  if (!health.mockModeFalse) failures.push("mock_mode não está false.");
  if (!health.metaManualSyncReadyIsBoolean) failures.push("meta_manual_sync_ready não é boolean seguro.");
  if (!health.webhookEnabledFalse) failures.push("meta_webhook_enabled não está false.");
  for (const route of routes) {
    if (!route.ok) failures.push(`Rota crítica falhou: ${route.route}`);
    if (route.secretsExposed.length > 0) failures.push(`Rota expôs marcador sensível: ${route.route}`);
    if (route.piiExposed) failures.push(`Página pública expôs padrão de PII: ${route.route}`);
  }
  if (!supabase.configured || !supabase.responds) failures.push("Supabase não respondeu com anon key.");
  if (!supabase.rlsBasicOk) failures.push("RLS básico não bloqueou escrita anon em ig_people.");

  const status = health.secretsExposed.length > 0 || routes.some((route) => route.secretsExposed.length > 0 || route.piiExposed)
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
  console.log(`- routes_ok: ${routes.every((route) => route.ok && route.secretsExposed.length === 0 && !route.piiExposed)}`);
  console.log(`- supabase_responds: ${supabase.responds}`);
  console.log(`- rls_basic_ok: ${supabase.rlsBasicOk}`);
  console.log(`- secret_leak_detected: ${payload.secretLeakDetected}`);
  console.log(`- recommendation: ${status}`);

  if (status !== "SHADOW_READY") process.exitCode = 1;
}

main().catch((error) => {
  console.error(`[production:shadow-check] erro: ${error instanceof Error ? error.message : "falha desconhecida"}`);
  process.exit(1);
});
