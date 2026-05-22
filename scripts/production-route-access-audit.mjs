#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const defaultUrl = "https://raadarbase.vercel.app";
const appUrl = (process.env.PRODUCTION_SHADOW_URL || process.env.APP_URL || defaultUrl).replace(/\/$/, "");
const reportsDir = join(process.cwd(), "reports");
const outputPath = join(reportsDir, "production-route-access-audit.json");

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
  "SUPABASE_SERVICE_ROLE_KEY",
  "META_ACCESS_TOKEN",
  "META_APP_SECRET",
  "META_WEBHOOK_VERIFY_TOKEN",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
];

const auditedRoutes = [
  { path: "/", expectedAccess: "neutral" },
  { path: "/dashboard", expectedAccess: "internal" },
  { path: "/integracoes/meta", expectedAccess: "internal" },
  { path: "/operacao", expectedAccess: "internal" },
  { path: "/operacao/meta-reconciliacao", expectedAccess: "internal" },
  { path: "/radar/silencios", expectedAccess: "internal" },
  { path: "/radar/silencios/acoes", expectedAccess: "internal" },
  { path: "/radar/silencios/impacto", expectedAccess: "internal" },
  { path: "/campo", expectedAccess: "internal" },
  { path: "/escuta/bairro/admin", expectedAccess: "internal" },
  { path: "/execucao", expectedAccess: "internal" },
  { path: "/governanca", expectedAccess: "internal" },
  { path: "/minha-fila", expectedAccess: "internal" },
  { path: "/posts", expectedAccess: "internal" },
  { path: "/recibo/escuta/distribuicao", expectedAccess: "internal" },
  { path: "/relatorios", expectedAccess: "internal" },
  { path: "/ritmo", expectedAccess: "internal" },
  { path: "/temas", expectedAccess: "internal" },
  { path: "/voluntarios", expectedAccess: "internal" },
  { path: "/voluntarios/inscricoes", expectedAccess: "internal" },
  { path: "/voluntarios/revisao-periodica", expectedAccess: "internal" },
  { path: "/recibo/escuta", expectedAccess: "public" },
  { path: "/escuta/bairro", expectedAccess: "public" },
  { path: "/voluntarios/quero-ajudar", expectedAccess: "public" },
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
  return sensitiveMarkers.filter((pattern) => pattern.test(text)).map((pattern) => pattern.source);
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

async function fetchRoute(path) {
  const response = await fetch(`${appUrl}${path}`, { redirect: "manual" });
  const body = await response.text().catch(() => "");
  return { response, body };
}

function classifyResult(route, response, body) {
  const location = response.headers.get("location");
  const sensitiveMarkersFound = findSensitiveMarkers(body);
  const secretValuesFound = findSecretValues(body);
  const piiFound = findPii(body);
  const redirectsToLogin = Boolean(location && /\/login(?:\?|$)/i.test(location));
  const isPubliclyAccessible = response.ok;

  let ok = false;
  if (route.expectedAccess === "public") {
    ok = response.status === 200;
  } else if (route.expectedAccess === "internal") {
    ok = response.status === 401 || response.status === 403 || redirectsToLogin;
  } else {
    ok = response.ok || redirectsToLogin || [301, 302, 303, 307, 308].includes(response.status);
  }

  return {
    route: route.path,
    expectedAccess: route.expectedAccess,
    status: response.status,
    location: redirectsToLogin ? "/login" : location,
    ok,
    publiclyAccessible: isPubliclyAccessible,
    redirectsToLogin,
    sensitiveMarkersFound,
    secretValuesFound,
    piiFound,
  };
}

async function main() {
  const results = [];
  const failures = [];

  for (const route of auditedRoutes) {
    const { response, body } = await fetchRoute(route.path);
    const result = classifyResult(route, response, body);
    results.push(result);

    if (!result.ok) failures.push(`Status inesperado para ${route.path}.`);
    if (route.expectedAccess === "internal" && result.publiclyAccessible) failures.push(`Rota interna acessível sem sessão: ${route.path}.`);
    if (route.expectedAccess === "public" && result.status !== 200) failures.push(`Rota pública não respondeu 200: ${route.path}.`);
    if (result.sensitiveMarkersFound.length > 0) failures.push(`Rota expôs marcador sensível: ${route.path}.`);
    if (result.secretValuesFound.length > 0) failures.push(`Rota expôs valor sensível: ${route.path}.`);
    if (result.piiFound.length > 0) failures.push(`Rota expôs PII: ${route.path}.`);
  }

  const findings = {
    sensitiveMarkersFound: results.reduce((count, route) => count + route.sensitiveMarkersFound.length, 0),
    secretValuesFound: results.reduce((count, route) => count + route.secretValuesFound.length, 0),
    piiFound: results.reduce((count, route) => count + route.piiFound.length, 0),
    internalRoutesPublic: results.filter((route) => route.expectedAccess === "internal" && route.publiclyAccessible).length,
  };

  const recommendation =
    findings.internalRoutesPublic > 0 || findings.sensitiveMarkersFound > 0 || findings.secretValuesFound > 0 || findings.piiFound > 0
      ? "ACCESS_BLOCKED"
      : failures.length > 0
        ? "NEEDS_FIX"
        : "ACCESS_READY";

  const payload = {
    generatedAt: new Date().toISOString(),
    appUrl,
    results,
    findings,
    failures,
    recommendation,
    productionAuthorized: false,
  };

  mkdirSync(reportsDir, { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  console.log("[production:route-audit]");
  console.log(`- domain: ${appUrl}`);
  console.log(`- public_routes_ok: ${results.filter((route) => route.expectedAccess === "public").every((route) => route.ok)}`);
  console.log(`- internal_routes_protected: ${findings.internalRoutesPublic === 0}`);
  console.log(`- sensitive_markers_found: ${findings.sensitiveMarkersFound}`);
  console.log(`- secret_values_found: ${findings.secretValuesFound}`);
  console.log(`- pii_found: ${findings.piiFound}`);
  console.log(`- recommendation: ${recommendation}`);

  if (recommendation !== "ACCESS_READY") process.exitCode = 1;
}

main().catch((error) => {
  console.error(`[production:route-audit] erro: ${error instanceof Error ? error.message : "falha desconhecida"}`);
  process.exit(1);
});
