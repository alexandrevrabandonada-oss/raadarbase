#!/usr/bin/env node

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const reportsDir = join(__dirname, "..", "reports");
const artifactPath = join(reportsDir, "staging-webhook-evidence.json");

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
      if (!process.env[key]) {
        process.env[key] = value;
      }
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

function redactString(value) {
  return value
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "[REDACTED_EMAIL]")
    .replace(/(\+?\d{1,3}[\s.-]?)?(\(?\d{2,3}\)?[\s.-]?)\d{4,5}[\s.-]?\d{4}/g, "[REDACTED_PHONE]")
    .replace(/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g, "[REDACTED_CPF]");
}

function printSummary(summary) {
  console.log("[staging:webhook:evidence] Evidence summary");
  console.log(`- total events: ${summary.totalMetaWebhookEvents}`);
  console.log(`- quarantined: ${summary.totalQuarantined}`);
  console.log(`- processed: ${summary.totalProcessed}`);
  console.log(`- ignored: ${summary.totalIgnored}`);
  console.log(`- failed: ${summary.totalFailed}`);
  console.log(`- invalid signatures: ${summary.totalInvalidSignature}`);
  console.log(`- webhook incidents: ${summary.totalWebhookIncidents}`);
  console.log(`- webhook audit logs: ${summary.totalWebhookAuditLogs}`);
}

function envValue(name) {
  return process.env[name] || "";
}

async function main() {
  loadLocalEnvFallback();
  const supabaseUrl = envValue("SUPABASE_URL") || envValue("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseServiceRole = envValue("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseServiceRole) {
    const pending = {
      generatedAt: new Date().toISOString(),
      status: "PENDING_EXTERNAL_VALIDATION",
      reason: "Supabase de staging nao configurado neste ambiente.",
      totalMetaWebhookEvents: 0,
      totalQuarantined: 0,
      totalProcessed: 0,
      totalIgnored: 0,
      totalFailed: 0,
      totalInvalidSignature: 0,
      totalWebhookIncidents: 0,
      totalWebhookAuditLogs: 0,
      lastEvent: null,
      lastIncident: null,
    };

    writeArtifact(pending);
    console.log("[staging:webhook:evidence] Variaveis reais de staging nao encontradas.");
    console.log("[staging:webhook:evidence] Resultado: PENDING_EXTERNAL_VALIDATION.");
    process.exit(0);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const [
    eventsRes,
    incidentsRes,
    auditsRes,
    lastEventRes,
    lastIncidentRes,
  ] = await Promise.all([
    supabase.from("meta_webhook_events").select("status,signature_valid", { count: "exact" }),
    supabase
      .from("operational_incidents")
      .select("id", { count: "exact" })
      .or("kind.ilike.%meta.webhook%,related_entity_type.eq.meta_webhook_events"),
    supabase
      .from("audit_logs")
      .select("id", { count: "exact" })
      .or("action.ilike.meta.webhook%,entity_type.eq.meta_webhook_events"),
    supabase
      .from("meta_webhook_events")
      .select("id,status,event_type,object_type,signature_valid,received_at")
      .order("received_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("operational_incidents")
      .select("id,kind,severity,status,title,created_at")
      .or("kind.ilike.%meta.webhook%,related_entity_type.eq.meta_webhook_events")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const firstError = eventsRes.error?.message || incidentsRes.error?.message || auditsRes.error?.message || lastEventRes.error?.message || lastIncidentRes.error?.message;

  if (firstError) {
    const normalizedError = String(firstError);
    const missingSchemaCache = /schema cache|could not find the table/i.test(normalizedError);

    if (missingSchemaCache) {
      const pending = {
        generatedAt: new Date().toISOString(),
        status: "PENDING_EXTERNAL_VALIDATION",
        reason: "Tabelas de webhook indisponiveis na API de staging (schema cache/route exposure).",
        totalMetaWebhookEvents: 0,
        totalQuarantined: 0,
        totalProcessed: 0,
        totalIgnored: 0,
        totalFailed: 0,
        totalInvalidSignature: 0,
        totalWebhookIncidents: 0,
        totalWebhookAuditLogs: 0,
        lastEvent: null,
        lastIncident: null,
      };

      writeArtifact(pending);
      console.log("[staging:webhook:evidence] Webhook tables indisponiveis na API de staging.");
      console.log("[staging:webhook:evidence] Resultado: PENDING_EXTERNAL_VALIDATION.");
      process.exit(0);
    }

    console.error("[staging:webhook:evidence] Falha ao consultar evidencias de staging.");
    console.error(normalizedError);
    process.exit(1);
  }

  const events = eventsRes.data || [];
  const totalMetaWebhookEvents = eventsRes.count || 0;
  const totalQuarantined = events.filter((e) => e.status === "quarantined").length;
  const totalProcessed = events.filter((e) => e.status === "processed").length;
  const totalIgnored = events.filter((e) => e.status === "ignored").length;
  const totalFailed = events.filter((e) => e.status === "failed").length;
  const totalInvalidSignature = events.filter((e) => e.signature_valid === false).length;

  const summary = {
    generatedAt: new Date().toISOString(),
    status: "READY",
    totalMetaWebhookEvents,
    totalQuarantined,
    totalProcessed,
    totalIgnored,
    totalFailed,
    totalInvalidSignature,
    totalWebhookIncidents: incidentsRes.count || 0,
    totalWebhookAuditLogs: auditsRes.count || 0,
    signedEventSeen: events.some((e) => e.signature_valid && ["verified", "quarantined", "processed"].includes(e.status)),
    unsignedRejectionSeen: totalInvalidSignature > 0,
    operatorIgnoredSeen: totalIgnored > 0,
    operatorProcessedSeen: totalProcessed > 0,
    lastEvent: lastEventRes.data
      ? {
          id: lastEventRes.data.id,
          status: lastEventRes.data.status,
          eventType: lastEventRes.data.event_type,
          objectType: lastEventRes.data.object_type,
          signatureValid: lastEventRes.data.signature_valid,
          receivedAt: lastEventRes.data.received_at,
        }
      : null,
    lastIncident: lastIncidentRes.data
      ? {
          id: lastIncidentRes.data.id,
          kind: lastIncidentRes.data.kind,
          severity: lastIncidentRes.data.severity,
          status: lastIncidentRes.data.status,
          title: redactString(lastIncidentRes.data.title || ""),
          createdAt: lastIncidentRes.data.created_at,
        }
      : null,
  };

  writeArtifact(summary);
  printSummary(summary);
}

main().catch((error) => {
  console.error("[staging:webhook:evidence] Erro nao tratado.");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
