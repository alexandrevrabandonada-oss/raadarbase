#!/usr/bin/env node

import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const reportsDir = join(__dirname, "..", "reports");
const outputPath = join(reportsDir, "production-webhook-smoke.json");
const fixturesDir = join(__dirname, "..", "src", "lib", "meta", "__fixtures__", "webhooks");

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  const lines = readFileSync(path, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...valueParts] = trimmed.split("=");
    const value = valueParts.join("=").replace(/^"(.*)"$/, "$1");
    if (process.env[key] == null || process.env[key] === "") {
      process.env[key] = value;
    }
  }
}

loadEnvFile(join(__dirname, "..", ".env.local"));

function loadProductionEnvFallback() {
  const requiredKeys = [
    "META_WEBHOOK_VERIFY_TOKEN",
    "META_APP_SECRET",
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SECRET_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
  ];

  if (requiredKeys.every((key) => process.env[key])) return;

  const tempPath = join(process.cwd(), ".vercel", `.production-smoke-${Date.now()}.env`);
  if (process.platform === "win32") {
    execFileSync("cmd", ["/c", "vercel", "env", "pull", tempPath, "--environment=production"], {
      cwd: join(__dirname, ".."),
      stdio: "ignore",
    });
  } else {
    execFileSync("vercel", ["env", "pull", tempPath, "--environment=production"], {
      cwd: join(__dirname, ".."),
      stdio: "ignore",
    });
  }
  try {
    loadEnvFile(tempPath);
  } finally {
    if (existsSync(tempPath)) {
      try {
        rmSync(tempPath, { force: true });
      } catch {
        // noop
      }
    }
  }
}

loadProductionEnvFallback();

const appUrl = (process.env.PRODUCTION_URL || process.env.APP_URL || "https://raadarbase.vercel.app").replace(/\/$/, "");
const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN;
const appSecret = process.env.META_APP_SECRET;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

function requireEnv(name, value) {
  if (!value) throw new Error(`${name} ausente.`);
}

function loadFixture(name) {
  return JSON.parse(readFileSync(join(fixturesDir, name), "utf8"));
}

function hmac(payload) {
  return crypto.createHmac("sha256", appSecret).update(payload, "utf8").digest("hex");
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function fetchJson(url, init) {
  const response = await fetch(url, init);
  const text = await response.text().catch(() => "");
  return { response, text, json: safeJsonParse(text) };
}

function buildServiceClient() {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function findEventByExternalId(supabase, externalId) {
  const { data, error } = await supabase
    .from("meta_webhook_events")
    .select("id, status, signature_valid, object_type, event_type, received_at, processed_at, metadata, redacted_payload")
    .eq("external_event_id", externalId)
    .order("received_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Falha ao buscar evento ${externalId}: ${error.message}`);
  return data;
}

async function findEventById(supabase, eventId) {
  const { data, error } = await supabase
    .from("meta_webhook_events")
    .select("id, external_event_id, status, signature_valid, object_type, event_type, received_at, processed_at, metadata, redacted_payload")
    .eq("id", eventId)
    .maybeSingle();

  if (error) throw new Error(`Falha ao buscar evento ${eventId}: ${error.message}`);
  return data;
}

async function countAuditLogs(supabase, action, entityId = null) {
  let query = supabase.from("audit_logs").select("id", { count: "exact", head: true }).eq("action", action);
  if (entityId) query = query.eq("entity_id", entityId);
  const { count, error } = await query;
  if (error) throw new Error(`Falha ao contar audit logs (${action}): ${error.message}`);
  return count ?? 0;
}

async function countIncidents(supabase, kind) {
  const { count, error } = await supabase
    .from("operational_incidents")
    .select("id", { count: "exact", head: true })
    .eq("kind", kind);
  if (error) throw new Error(`Falha ao contar incidentes (${kind}): ${error.message}`);
  return count ?? 0;
}

function payloadHasVisiblePii(redactedPayload) {
  const text = JSON.stringify(redactedPayload ?? {});
  if (/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text)) return true;
  if (/\b(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?9\d{4}[-\s]?\d{4}\b/.test(text)) return true;
  return false;
}

async function main() {
  requireEnv("META_WEBHOOK_VERIFY_TOKEN", verifyToken);
  requireEnv("META_APP_SECRET", appSecret);
  requireEnv("NEXT_PUBLIC_SUPABASE_URL", supabaseUrl);
  requireEnv("SUPABASE secret/service key", serviceRoleKey);

  const supabase = buildServiceClient();
  const challenge = `challenge-${Date.now()}`;
  const signedFixture = loadFixture("instagram-comment-public.json");
  const unsignedFixture = loadFixture("instagram-comment-public.json");

  signedFixture.entry[0].id = `1784140571${Date.now()}`;
  signedFixture.entry[0].time = Math.floor(Date.now() / 1000);
  signedFixture.entry[0].changes[0].value.comment_id = `179-prod-${Date.now()}`;
  signedFixture.entry[0].changes[0].value.media_id = `179-media-${Date.now()}`;

  const externalId = signedFixture.entry[0].changes[0].value.comment_id;
  const signedPayload = JSON.stringify(signedFixture);
  const signature = hmac(signedPayload);

  const auditBefore = {
    verified: await countAuditLogs(supabase, "meta.webhook_verified"),
    rejected: await countAuditLogs(supabase, "meta.webhook_rejected"),
    quarantined: await countAuditLogs(supabase, "meta.webhook_quarantined"),
  };
  const incidentsBefore = {
    invalidSignature: await countIncidents(supabase, "meta.webhook_invalid_signature"),
  };

  const getResult = await fetch(`${appUrl}/api/meta/webhook?hub.mode=subscribe&hub.verify_token=${encodeURIComponent(verifyToken)}&hub.challenge=${encodeURIComponent(challenge)}`);
  const getText = await getResult.text();

  const signedResult = await fetchJson(`${appUrl}/api/meta/webhook`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Hub-Signature-256": `sha256=${signature}`,
    },
    body: signedPayload,
  });

  const unsignedResult = await fetchJson(`${appUrl}/api/meta/webhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(unsignedFixture),
  });

  const persistedEventId = signedResult.json?.event_id ?? null;
  const event = persistedEventId
    ? await findEventById(supabase, persistedEventId)
    : await findEventByExternalId(supabase, externalId);

  const auditAfter = {
    verified: await countAuditLogs(supabase, "meta.webhook_verified"),
    rejected: await countAuditLogs(supabase, "meta.webhook_rejected"),
    quarantined: await countAuditLogs(supabase, "meta.webhook_quarantined"),
  };
  const incidentsAfter = {
    invalidSignature: await countIncidents(supabase, "meta.webhook_invalid_signature"),
  };

  const checks = {
    getVerificationOk: getResult.status === 200 && getText === challenge,
    signedAccepted: signedResult.response.status === 200,
    signedQuarantined: signedResult.json?.status === "quarantined" && Boolean(signedResult.json?.event_id),
    unsignedRejected: signedResult.response.status !== 401 && unsignedResult.response.status === 401,
    eventPersisted: Boolean(event?.id),
    eventInQuarantine: event?.status === "quarantined",
    eventSignatureValid: event?.signature_valid === true,
    auditLogCreated: auditAfter.quarantined > auditBefore.quarantined,
    invalidIncidentCreated: incidentsAfter.invalidSignature > incidentsBefore.invalidSignature,
    redactedPayloadSafe: !payloadHasVisiblePii(event?.redacted_payload),
  };

  const failures = [];
  if (!checks.getVerificationOk) failures.push("GET verification não retornou challenge.");
  if (!checks.signedAccepted) failures.push("POST assinado não retornou 200.");
  if (!checks.signedQuarantined) failures.push("POST assinado não retornou status quarantined.");
  if (!checks.unsignedRejected) failures.push("POST sem assinatura não foi rejeitado com 401.");
  if (!checks.eventPersisted) failures.push("Evento assinado não foi persistido.");
  if (!checks.eventInQuarantine) failures.push("Evento assinado não ficou em quarentena.");
  if (!checks.eventSignatureValid) failures.push("Evento persistido não marcou signature_valid=true.");
  if (!checks.auditLogCreated) failures.push("Audit log de quarentena não foi observado.");
  if (!checks.invalidIncidentCreated) failures.push("Incidente para assinatura inválida não foi observado.");
  if (!checks.redactedPayloadSafe) failures.push("Payload redigido expôs PII.");

  const payload = {
    generatedAt: new Date().toISOString(),
    appUrl,
    checks,
    http: {
      getVerificationStatus: getResult.status,
      signedStatus: signedResult.response.status,
      signedBody: signedResult.json ? { success: signedResult.json.success === true, status: signedResult.json.status ?? null, hasEventId: Boolean(signedResult.json.event_id) } : null,
      unsignedStatus: unsignedResult.response.status,
    },
    event: event ? {
      id: event.id,
      status: event.status,
      signatureValid: event.signature_valid,
      objectType: event.object_type,
      eventType: event.event_type,
      receivedAt: event.received_at,
      processedAt: event.processed_at,
    } : null,
    auditLogs: {
      quarantinedDelta: auditAfter.quarantined - auditBefore.quarantined,
      rejectedDelta: auditAfter.rejected - auditBefore.rejected,
      verifiedDelta: auditAfter.verified - auditBefore.verified,
    },
    incidents: {
      invalidSignatureDelta: incidentsAfter.invalidSignature - incidentsBefore.invalidSignature,
    },
    failures,
    recommendation: failures.length === 0 ? "WEBHOOK_SMOKE_READY" : "WEBHOOK_SMOKE_BLOCKED",
  };

  mkdirSync(reportsDir, { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  console.log("[production:webhook-smoke]");
  console.log(`- get_verification_ok: ${checks.getVerificationOk}`);
  console.log(`- signed_accepted: ${checks.signedAccepted}`);
  console.log(`- signed_quarantined: ${checks.signedQuarantined}`);
  console.log(`- unsigned_rejected: ${checks.unsignedRejected}`);
  console.log(`- event_persisted: ${checks.eventPersisted}`);
  console.log(`- event_in_quarantine: ${checks.eventInQuarantine}`);
  console.log(`- audit_log_created: ${checks.auditLogCreated}`);
  console.log(`- invalid_incident_created: ${checks.invalidIncidentCreated}`);
  console.log(`- redacted_payload_safe: ${checks.redactedPayloadSafe}`);
  console.log(`- recommendation: ${payload.recommendation}`);

  if (payload.recommendation !== "WEBHOOK_SMOKE_READY") process.exitCode = 1;
}

main().catch((error) => {
  mkdirSync(reportsDir, { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    appUrl,
    failures: [error instanceof Error ? error.message : "falha desconhecida"],
    recommendation: "WEBHOOK_SMOKE_BLOCKED",
  }, null, 2)}\n`, "utf8");
  console.error(`[production:webhook-smoke] erro: ${error instanceof Error ? error.message : "falha desconhecida"}`);
  process.exit(1);
});
