#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const defaultUrl = "https://raadarbase.vercel.app";
const appUrl = (process.env.PRODUCTION_URL || process.env.APP_URL || defaultUrl).replace(/\/$/, "");
const reportsDir = join(process.cwd(), "reports");
const outputPath = join(reportsDir, "production-activation-check.json");

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

const publicRoutes = ["/", "/recibo/escuta", "/escuta/bairro", "/voluntarios/quero-ajudar"];
const internalRoutes = [
  "/dashboard",
  "/integracoes/meta",
  "/operacao",
  "/operacao/meta-reconciliacao",
  "/radar/silencios",
  "/radar/silencios/acoes",
  "/radar/silencios/impacto",
  "/campo",
  "/voluntarios",
  "/voluntarios/inscricoes",
  "/voluntarios/revisao-periodica",
];
const protectedExportUrls = [
  "/api/voluntarios/export?include_contact=true",
  "/api/voluntarios/inscricoes/export?include_contact=true",
  "/api/contacts/export",
];

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

function findSensitiveMarkers(text) {
  return [...new Set(sensitiveMarkers.filter((pattern) => pattern.test(text)).map((pattern) => pattern.source))];
}

function findSecretValues(text) {
  const findings = [];
  for (const key of secretEnvKeys) {
    const value = process.env[key]?.trim();
    if (value && value.length > 8 && text.includes(value)) findings.push("secret_value_match");
  }
  if (/sb_(publishable|secret)_[a-z0-9._-]+/i.test(text)) findings.push("supabase_token_shape");
  if (/eyJhbGciOi[0-9A-Za-z._-]+/.test(text)) findings.push("jwt_shape");
  return [...new Set(findings)];
}

function findPii(text) {
  const findings = [];
  if (/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text)) findings.push("email_shape");
  if (/\b(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?9\d{4}[-\s]?\d{4}\b/.test(text)) findings.push("phone_shape");
  return findings;
}

async function fetchText(url, init) {
  const response = await fetch(url, { redirect: "manual", ...init });
  const text = await response.text().catch(() => "");
  return { response, text };
}

async function checkHealth() {
  const { response, text } = await fetchText(`${appUrl}/api/health`);
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }

  return {
    ok: response.ok,
    status: response.status,
    sensitiveMarkersFound: findSensitiveMarkers(text),
    secretValuesFound: findSecretValues(text),
    piiFound: findPii(text),
    mockModeFalse: json?.mock_mode === false,
    databaseReady: json?.database_ready === true,
    metaIntegrationReady: json?.meta_integration_ready === true,
    webhookRuntimeReady: json?.webhook_runtime_ready === true,
    webhookEnabledTrue: json?.meta_webhook_enabled === true,
    productionShadowSafeFalse: json?.production_shadow_safe === false,
  };
}

async function auditRoutes() {
  const results = [];
  for (const route of [...publicRoutes, ...internalRoutes]) {
    const { response, text } = await fetchText(`${appUrl}${route}`);
    const location = response.headers.get("location");
    const redirectsToLogin = Boolean(location && /\/login(?:\?|$)/i.test(location));
    const isPublic = publicRoutes.includes(route);
    const ok = isPublic
      ? route === "/" ? response.ok || [301, 302, 303, 307, 308].includes(response.status) : response.status === 200
      : response.status === 401 || response.status === 403 || redirectsToLogin;

    results.push({
      route,
      expectedAccess: isPublic ? "public" : "internal",
      status: response.status,
      redirectsToLogin,
      publiclyAccessible: response.ok,
      ok,
      sensitiveMarkersFound: findSensitiveMarkers(text),
      secretValuesFound: findSecretValues(text),
      piiFound: isPublic ? findPii(text) : [],
    });
  }
  return results;
}

async function checkProtectedExports() {
  const results = [];
  for (const path of protectedExportUrls) {
    const response = await fetch(`${appUrl}${path}`, { redirect: "manual" });
    const location = response.headers.get("location");
    const blocked = response.status === 401 || response.status === 403 || Boolean(location && /\/login(?:\?|$)/i.test(location));
    results.push({ path, status: response.status, blocked });
  }
  return results;
}

async function checkSupabaseAndRls() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey || !serviceRoleKey) {
    return { configured: false, responds: false, rlsBasicOk: false };
  }

  const headers = { apikey: anonKey, Authorization: `Bearer ${anonKey}`, "Content-Type": "application/json" };
  const health = await fetch(`${url}/rest/v1/`, { headers }).catch(() => null);
  const anonInsert = await fetch(`${url}/rest/v1/ig_people`, {
    method: "POST",
    headers: { ...headers, Prefer: "return=minimal" },
    body: JSON.stringify({ username: "activation_rls_probe" }),
  }).catch(() => null);

  const serviceClient = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const serviceRead = await serviceClient.from("meta_webhook_events").select("id", { count: "exact", head: true });

  return {
    configured: true,
    responds: Boolean(health && [200, 300, 401, 404].includes(health.status)),
    rlsBasicOk: Boolean(anonInsert && !anonInsert.ok),
    serviceReadOk: !serviceRead.error,
  };
}

async function main() {
  const health = await checkHealth();
  const routes = await auditRoutes();
  const exports = await checkProtectedExports();
  const supabase = await checkSupabaseAndRls();
  const failures = [];

  if (!appUrl) failures.push("APP_URL ausente.");
  if (!health.ok) failures.push("/api/health não respondeu OK.");
  if (health.sensitiveMarkersFound.length > 0) failures.push("Health expôs marcador sensível.");
  if (health.secretValuesFound.length > 0) failures.push("Health expôs valor sensível.");
  if (health.piiFound.length > 0) failures.push("Health expôs PII.");
  if (!health.mockModeFalse) failures.push("mock_mode não está false.");
  if (!health.databaseReady) failures.push("database_ready não está true.");
  if (!health.metaIntegrationReady) failures.push("meta_integration_ready não está true.");
  if (!health.webhookRuntimeReady) failures.push("webhook_runtime_ready não está true.");
  if (!health.webhookEnabledTrue) failures.push("meta_webhook_enabled não está true.");
  if (!health.productionShadowSafeFalse) failures.push("production_shadow_safe não refletiu ambiente ativado.");

  for (const route of routes) {
    if (!route.ok) failures.push(`Status inesperado para ${route.route}.`);
    if (route.expectedAccess === "internal" && route.publiclyAccessible) failures.push(`Rota interna acessível sem sessão: ${route.route}.`);
    if (route.sensitiveMarkersFound.length > 0) failures.push(`Rota expôs marcador sensível: ${route.route}.`);
    if (route.secretValuesFound.length > 0) failures.push(`Rota expôs valor sensível: ${route.route}.`);
    if (route.piiFound.length > 0) failures.push(`Rota expôs PII: ${route.route}.`);
  }

  for (const exportCheck of exports) {
    if (!exportCheck.blocked) failures.push(`Export protegido acessível sem sessão: ${exportCheck.path}.`);
  }

  if (!supabase.configured || !supabase.responds) failures.push("Supabase não respondeu com anon key.");
  if (!supabase.rlsBasicOk) failures.push("RLS básico não bloqueou escrita anon em ig_people.");
  if (!supabase.serviceReadOk) failures.push("Service role sem leitura técnica em meta_webhook_events.");

  const findings = {
    sensitiveMarkersFound:
      health.sensitiveMarkersFound.length + routes.reduce((count, route) => count + route.sensitiveMarkersFound.length, 0),
    secretValuesFound:
      health.secretValuesFound.length + routes.reduce((count, route) => count + route.secretValuesFound.length, 0),
    piiFound:
      health.piiFound.length + routes.reduce((count, route) => count + route.piiFound.length, 0),
    internalRoutesPublic: routes.filter((route) => route.expectedAccess === "internal" && route.publiclyAccessible).length,
    protectedExportLeaks: exports.filter((entry) => !entry.blocked).length,
  };

  const recommendation =
    findings.sensitiveMarkersFound > 0 ||
    findings.secretValuesFound > 0 ||
    findings.piiFound > 0 ||
    findings.internalRoutesPublic > 0 ||
    findings.protectedExportLeaks > 0
      ? "ACCESS_BLOCKED"
      : failures.length > 0
        ? "NEEDS_FIX"
        : "ACTIVATION_READY";

  const payload = {
    generatedAt: new Date().toISOString(),
    appUrl,
    environment: "production-active",
    health,
    routes,
    exports,
    supabase,
    findings,
    failures,
    webhookEnabled: true,
    recommendation,
  };

  mkdirSync(reportsDir, { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  console.log("[production:activation-check]");
  console.log(`- domain: ${appUrl}`);
  console.log(`- health_ok: ${health.ok}`);
  console.log(`- mock_mode_false: ${health.mockModeFalse}`);
  console.log(`- webhook_runtime_ready: ${health.webhookRuntimeReady}`);
  console.log(`- webhook_enabled_true: ${health.webhookEnabledTrue}`);
  console.log(`- routes_ok: ${routes.every((route) => route.ok && route.sensitiveMarkersFound.length === 0 && route.secretValuesFound.length === 0 && route.piiFound.length === 0)}`);
  console.log(`- exports_protected: ${exports.every((entry) => entry.blocked)}`);
  console.log(`- supabase_responds: ${supabase.responds}`);
  console.log(`- rls_basic_ok: ${supabase.rlsBasicOk}`);
  console.log(`- sensitive_markers_found: ${findings.sensitiveMarkersFound}`);
  console.log(`- secret_values_found: ${findings.secretValuesFound}`);
  console.log(`- pii_found: ${findings.piiFound}`);
  console.log(`- recommendation: ${recommendation}`);

  if (recommendation !== "ACTIVATION_READY") process.exitCode = 1;
}

main().catch((error) => {
  console.error(`[production:activation-check] erro: ${error instanceof Error ? error.message : "falha desconhecida"}`);
  process.exit(1);
});
