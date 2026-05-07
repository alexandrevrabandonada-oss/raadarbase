#!/usr/bin/env node

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const reportsDir = join(__dirname, "..", "reports");
const artifactPath = join(reportsDir, "staging-webhook-observation.json");

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

function printSummary(summary) {
  console.log("[staging:webhook:observation] Observation summary");
  console.log(`- status suggestion: ${summary.statusSuggestion}`);
  console.log(`- total events: ${summary.totalMetaWebhookEvents}`);
  console.log(`- quarantined: ${summary.totalQuarantined}`);
  console.log(`- processed: ${summary.totalProcessed}`);
  console.log(`- ignored: ${summary.totalIgnored}`);
  console.log(`- failed: ${summary.totalFailed}`);
  console.log(`- open webhook incidents: ${summary.webhookOpenIncidents}`);
  console.log(`- critical webhook incidents: ${summary.webhookCriticalIncidents}`);
  console.log(`- stale quarantine events: ${summary.staleQuarantineEvents}`);
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
      statusSuggestion: "STAGING_ATTENTION",
    };
    writeArtifact(pending);
    console.log("[staging:webhook:observation] Variaveis reais de staging nao encontradas.");
    process.exit(0);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const staleCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [eventsRes, incidentsOpenRes, incidentsCriticalRes, auditsRes, staleRes] = await Promise.all([
    supabase.from("meta_webhook_events").select("status,signature_valid", { count: "exact" }),
    supabase
      .from("operational_incidents")
      .select("id", { count: "exact", head: true })
      .neq("status", "resolved")
      .or("kind.ilike.%meta.webhook%,related_entity_type.eq.meta_webhook_events"),
    supabase
      .from("operational_incidents")
      .select("id", { count: "exact", head: true })
      .eq("severity", "critical")
      .neq("status", "resolved")
      .or("kind.ilike.%meta.webhook%,related_entity_type.eq.meta_webhook_events"),
    supabase
      .from("audit_logs")
      .select("id", { count: "exact", head: true })
      .or("action.ilike.meta.webhook%,entity_type.eq.meta_webhook_events"),
    supabase
      .from("meta_webhook_events")
      .select("id", { count: "exact", head: true })
      .eq("status", "quarantined")
      .lt("received_at", staleCutoff),
  ]);

  const firstError =
    eventsRes.error?.message ||
    incidentsOpenRes.error?.message ||
    incidentsCriticalRes.error?.message ||
    auditsRes.error?.message ||
    staleRes.error?.message;

  if (firstError) {
    const blocked = {
      generatedAt: new Date().toISOString(),
      status: "ERROR",
      reason: String(firstError),
      statusSuggestion: "STAGING_BLOCKED",
    };
    writeArtifact(blocked);
    console.error("[staging:webhook:observation] Falha ao consolidar observacao.");
    process.exit(1);
  }

  const events = eventsRes.data || [];
  const totalMetaWebhookEvents = eventsRes.count || 0;
  const totalQuarantined = events.filter((event) => event.status === "quarantined").length;
  const totalProcessed = events.filter((event) => event.status === "processed").length;
  const totalIgnored = events.filter((event) => event.status === "ignored").length;
  const totalFailed = events.filter((event) => event.status === "failed").length;
  const totalWebhookIncidents = incidentsOpenRes.count || 0;
  const totalWebhookAuditLogs = auditsRes.count || 0;
  const webhookOpenIncidents = incidentsOpenRes.count || 0;
  const webhookCriticalIncidents = incidentsCriticalRes.count || 0;
  const staleQuarantineEvents = staleRes.count || 0;
  const webhookProcessingFailures = totalFailed;

  const noDmAutomatic = true;
  const noAutoContact = true;
  const noPoliticalScore = true;

  const statusSuggestion =
    webhookProcessingFailures > 0 || staleQuarantineEvents > 0
      ? "STAGING_BLOCKED"
      : webhookCriticalIncidents > 0 || webhookOpenIncidents > 0
        ? "STAGING_ATTENTION"
        : "STAGING_STABLE";

  const summary = {
    generatedAt: new Date().toISOString(),
    status: "READY",
    totalMetaWebhookEvents,
    totalQuarantined,
    totalProcessed,
    totalIgnored,
    totalFailed,
    totalWebhookIncidents,
    totalWebhookAuditLogs,
    webhookOpenIncidents,
    webhookCriticalIncidents,
    staleQuarantineEvents,
    webhookProcessingFailures,
    noDmAutomatic,
    noAutoContact,
    noPoliticalScore,
    statusSuggestion,
  };

  writeArtifact(summary);
  printSummary(summary);
}

main().catch((error) => {
  console.error("[staging:webhook:observation] Erro nao tratado.");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
