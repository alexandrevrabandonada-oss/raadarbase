#!/usr/bin/env node

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const reportsDir = join(__dirname, "..", "reports");
const artifactPath = join(reportsDir, "staging-db-check.json");

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

function redactError(message) {
  if (!message) return "unknown error";

  return String(message)
    .replace(/(token|secret|password|authorization|cookie|session)=([^\s&]+)/gi, "$1=[REDACTED]")
    .replace(/Bearer\s+[^\s]+/gi, "Bearer [REDACTED]");
}

function classifyTableError(message) {
  const msg = String(message || "").toLowerCase();

  if (/schema cache|could not find the table/.test(msg)) {
    return "api_schema_cache_stale_or_not_exposed";
  }

  if (/does not exist|relation .* does not exist/.test(msg)) {
    return "table_missing";
  }

  if (/permission denied|42501|rls|not authorized|jwt/.test(msg)) {
    return "permission_or_rls_block";
  }

  return "unknown_error";
}

function envValue(name) {
  return process.env[name] || "";
}

async function tableExistsViaCount(supabase, tableName) {
  const result = await supabase.from(tableName).select("id", { count: "exact", head: true });

  if (result.error) {
    const detail = redactError(result.error.message);
    return {
      table: tableName,
      exists: false,
      ok: false,
      detail,
      classification: classifyTableError(detail),
    };
  }

  return {
    table: tableName,
    exists: true,
    ok: true,
    detail: "ok",
    classification: "ok",
  };
}

async function checkMencaoSupport(supabase) {
  const result = await supabase
    .from("ig_interactions")
    .select("id", { count: "exact", head: true })
    .eq("type", "mencao");

  if (!result.error) {
    return {
      enumMencaoExistsOrAccepted: true,
      mode: "db_filter_accepted",
      detail: "ok",
    };
  }

  const msg = redactError(result.error.message || "");
  const invalidEnum = /invalid input value for enum|22P02|mencao/.test(msg);

  return {
    enumMencaoExistsOrAccepted: !invalidEnum,
    mode: invalidEnum ? "db_filter_rejected" : "inconclusive",
    detail: msg,
  };
}

async function checkBasicRls(url, anonKey) {
  if (!url || !anonKey) {
    return {
      checked: false,
      readPolicyForAnonBlocked: null,
      detail: "anon key ausente para teste de RLS basico",
    };
  }

  const anon = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const readEvents = await anon.from("meta_webhook_events").select("id").limit(1);
  const readLinks = await anon.from("meta_webhook_event_links").select("id").limit(1);

  const blockedEvents = Boolean(readEvents.error);
  const blockedLinks = Boolean(readLinks.error);

  return {
    checked: true,
    readPolicyForAnonBlocked: blockedEvents && blockedLinks,
    eventsDetail: blockedEvents ? redactError(readEvents.error.message) : "anon read allowed",
    linksDetail: blockedLinks ? redactError(readLinks.error.message) : "anon read allowed",
  };
}

function classifyApiExposure(detail) {
  const msg = String(detail || "").toLowerCase();
  if (/schema cache|could not find the table/.test(msg)) return "schema_cache_stale_or_not_exposed";
  if (/permission denied|42501|rls|not authorized|jwt/.test(msg)) return "blocked_by_policy_or_auth";
  if (/anon read allowed/.test(msg)) return "visible_to_anon";
  return "unknown";
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
      tables: [],
      enumCheck: null,
      rlsCheck: null,
    };

    writeArtifact(output);
    console.log("[staging:db-check] Supabase staging nao configurado no ambiente.");
    console.log("[staging:db-check] Resultado: PENDING_EXTERNAL_VALIDATION");
    process.exit(0);
  }

  const supabase = createClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const requiredTables = [
    "meta_webhook_events",
    "meta_webhook_event_links",
    "audit_logs",
    "operational_incidents",
    "ig_posts",
    "ig_people",
    "ig_interactions",
  ];

  const tables = [];
  for (const tableName of requiredTables) {
    tables.push(await tableExistsViaCount(supabase, tableName));
  }

  const enumCheck = await checkMencaoSupport(supabase);
  const rlsCheck = await checkBasicRls(url, anonKey);

  const webhookApiExposure = {
    metaWebhookEvents: classifyApiExposure(rlsCheck.eventsDetail),
    metaWebhookEventLinks: classifyApiExposure(rlsCheck.linksDetail),
  };

  const schemaCacheIssue =
    webhookApiExposure.metaWebhookEvents === "schema_cache_stale_or_not_exposed" ||
    webhookApiExposure.metaWebhookEventLinks === "schema_cache_stale_or_not_exposed";

  const tableFailures = tables.filter((item) => !item.ok);
  const status =
    tableFailures.length > 0
      ? "FAIL"
      : schemaCacheIssue
        ? "PENDING_EXTERNAL_VALIDATION"
        : "READY";

  const output = {
    generatedAt: new Date().toISOString(),
    status,
    tables,
    enumCheck,
    rlsCheck,
    webhookApiExposure,
    guidance: {
      schemaCacheIssue,
      nextActions: schemaCacheIssue
        ? [
            "Confirmar migrations 015 e 015a no projeto Supabase de staging correto.",
            "Executar NOTIFY pgrst, 'reload schema' no SQL editor do staging.",
            "Validar exposicao do schema public no PostgREST/Supabase API.",
          ]
        : [],
    },
  };

  writeArtifact(output);

  console.log("[staging:db-check] Database checklist");
  for (const item of tables) {
    console.log(`- ${item.table}: ${item.ok ? "ok" : "fail"}`);
  }
  console.log(`- mencao support: ${enumCheck.enumMencaoExistsOrAccepted ? "ok" : "fail"}`);
  console.log(`- rls basic: ${rlsCheck.checked ? (rlsCheck.readPolicyForAnonBlocked ? "ok" : "warning") : "not-checked"}`);
  console.log(`- webhook api exposure (events): ${webhookApiExposure.metaWebhookEvents}`);
  console.log(`- webhook api exposure (links): ${webhookApiExposure.metaWebhookEventLinks}`);

  if (schemaCacheIssue) {
    console.log("[staging:db-check] Resultado: PENDING_EXTERNAL_VALIDATION (schema cache/exposure)");
    process.exit(0);
  }

  if (status === "FAIL") {
    console.log("[staging:db-check] Resultado: FAIL");
    process.exit(1);
  }

  console.log("[staging:db-check] Resultado: READY");
}

main().catch((error) => {
  console.error("[staging:db-check] Erro nao tratado.");
  console.error(redactError(error instanceof Error ? error.message : String(error)));
  process.exit(1);
});
