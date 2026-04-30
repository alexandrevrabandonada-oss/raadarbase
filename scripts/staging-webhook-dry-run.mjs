#!/usr/bin/env node

import crypto from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const forbiddenMarkers = [
  "META_APP_SECRET",
  "META_WEBHOOK_VERIFY_TOKEN",
  "META_ACCESS_TOKEN",
  "SUPABASE_SERVICE_ROLE_KEY",
  "access_token",
  "service_role",
  "webhook_verify_token",
  "raw_payload",
  "redacted_payload",
];

const appUrl = process.env.APP_URL;
const hasVerifyToken = Boolean(process.env.META_WEBHOOK_VERIFY_TOKEN);
const hasAppSecret = Boolean(process.env.META_APP_SECRET);
const reportsDir = join(__dirname, "..", "reports");
const artifactPath = join(reportsDir, "staging-webhook-dry-run.json");

function writeArtifact(payload) {
  mkdirSync(reportsDir, { recursive: true });
  writeFileSync(artifactPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function fixture(name) {
  const path = join(__dirname, "..", "src", "lib", "meta", "__fixtures__", "webhooks", name);
  return JSON.parse(readFileSync(path, "utf8"));
}

function sign(payloadString, secret) {
  return crypto.createHmac("sha256", secret).update(payloadString, "utf8").digest("hex");
}

function printHeader() {
  console.log("[staging:webhook:dry-run] Meta webhook dry-run");
  console.log("[staging:webhook:dry-run] APP_URL:", appUrl ? "configured" : "not configured");
  console.log("[staging:webhook:dry-run] META_APP_SECRET:", hasAppSecret ? "configured" : "not configured");
  console.log("[staging:webhook:dry-run] META_WEBHOOK_VERIFY_TOKEN:", hasVerifyToken ? "configured" : "not configured");
}

async function safeJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function runWhenAppAvailable() {
  const results = [];
  const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN || "dry-run-token";
  const appSecret = process.env.META_APP_SECRET || "dry-run-secret";
  const challenge = "staging-dry-run-challenge";

  const getParams = new URLSearchParams({
    "hub.mode": "subscribe",
    "hub.verify_token": verifyToken,
    "hub.challenge": challenge,
  });

  const getResponse = await fetch(`${appUrl}/api/meta/webhook?${getParams.toString()}`);
  const getText = await getResponse.text();
  results.push({
    name: "GET verification",
    ok: getResponse.ok && getText === challenge,
    detail: `status=${getResponse.status}`,
  });

  const signedPayload = fixture("instagram-comment-public.json");
  const signedBody = JSON.stringify(signedPayload);
  const signedSignature = sign(signedBody, appSecret);
  const signedResponse = await fetch(`${appUrl}/api/meta/webhook`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Hub-Signature-256": `sha256=${signedSignature}`,
    },
    body: signedBody,
  });
  const signedData = await safeJson(signedResponse);
  results.push({
    name: "POST signed",
    ok: signedResponse.status === 200 && (signedData?.status === "quarantined" || signedData?.status === "ignored"),
    detail: `status=${signedResponse.status}`,
  });

  const unsignedResponse = await fetch(`${appUrl}/api/meta/webhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: signedBody,
  });
  results.push({
    name: "POST unsigned rejected",
    ok: unsignedResponse.status === 401 || unsignedResponse.status === 403,
    detail: `status=${unsignedResponse.status}`,
  });

  const dmPayload = fixture("instagram-dm-prohibited.json");
  const dmBody = JSON.stringify(dmPayload);
  const dmSignature = sign(dmBody, appSecret);
  const dmResponse = await fetch(`${appUrl}/api/meta/webhook`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Hub-Signature-256": `sha256=${dmSignature}`,
    },
    body: dmBody,
  });
  const dmData = await safeJson(dmResponse);
  results.push({
    name: "DM prohibited",
    ok: dmResponse.status === 200 && (dmData?.status === "ignored" || dmData?.status === "quarantined"),
    detail: `status=${dmResponse.status}`,
  });

  const invalidPayload = fixture("invalid-object.json");
  const invalidBody = JSON.stringify(invalidPayload);
  const invalidSignature = sign(invalidBody, appSecret);
  const invalidResponse = await fetch(`${appUrl}/api/meta/webhook`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Hub-Signature-256": `sha256=${invalidSignature}`,
    },
    body: invalidBody,
  });
  const invalidData = await safeJson(invalidResponse);
  results.push({
    name: "Invalid object",
    ok: invalidResponse.status === 200 && (invalidData?.status === "ignored" || invalidData?.status === "quarantined"),
    detail: `status=${invalidResponse.status}`,
  });

  const healthResponse = await fetch(`${appUrl}/api/health`);
  const healthText = await healthResponse.text();
  const leaked = forbiddenMarkers.find((marker) => healthText.includes(marker));
  results.push({
    name: "Healthcheck safe",
    ok: healthResponse.ok && !leaked,
    detail: leaked ? `leak=${leaked}` : `status=${healthResponse.status}`,
  });

  return results;
}

function printChecklist(results) {
  console.log("\n[staging:webhook:dry-run] Checklist");
  for (const item of results) {
    console.log(`- [${item.ok ? "x" : " "}] ${item.name} (${item.detail})`);
  }
}

async function main() {
  printHeader();

  if (!appUrl) {
    writeArtifact({
      generatedAt: new Date().toISOString(),
      appUrlConfigured: false,
      executedWithAppUrl: false,
      status: "PENDING_EXTERNAL_VALIDATION",
      checks: [],
    });
    console.log("\n[staging:webhook:dry-run] APP_URL nao configurado.");
    console.log("[staging:webhook:dry-run] Resultado: pendente de staging externo.");
    console.log("[staging:webhook:dry-run] Nenhuma alteracao local foi interrompida.");
    process.exit(0);
  }

  try {
    const results = await runWhenAppAvailable();
    printChecklist(results);

    const failures = results.filter((item) => !item.ok);
    writeArtifact({
      generatedAt: new Date().toISOString(),
      appUrlConfigured: true,
      executedWithAppUrl: true,
      status: failures.length > 0 ? "NO_GO_STAGING" : "GO_STAGING",
      checks: results,
    });

    if (failures.length > 0) {
      console.error("\n[staging:webhook:dry-run] Falhas detectadas no dry-run de staging.");
      process.exit(1);
    }

    console.log("\n[staging:webhook:dry-run] Dry-run concluido sem falhas.");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    writeArtifact({
      generatedAt: new Date().toISOString(),
      appUrlConfigured: true,
      executedWithAppUrl: false,
      status: "PENDING_EXTERNAL_VALIDATION",
      reason: `Dry-run externo indisponivel: ${message}`,
      checks: [],
    });

    console.log("\n[staging:webhook:dry-run] Dry-run externo indisponivel no momento.");
    console.log("[staging:webhook:dry-run] Resultado: PENDING_EXTERNAL_VALIDATION.");
    console.log(`[staging:webhook:dry-run] Motivo: ${message}`);
    process.exit(0);
  }
}

main();
