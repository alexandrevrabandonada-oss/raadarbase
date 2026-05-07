#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const reportsDir = join(process.cwd(), "reports");
const outputPath = join(reportsDir, "production-rls-audit.json");

const sensitiveTables = [
  "ig_people",
  "ig_interactions",
  "meta_webhook_events",
  "meta_webhook_event_links",
  "public_devolution_publications",
  "territorial_listening_windows",
  "territorial_listening_daily_snapshots",
  "territorial_listening_outreach_logs",
  "campaign_volunteers",
  "campaign_volunteer_applications",
  "campaign_squads",
  "campaign_squad_members",
  "field_agenda_events",
  "field_agenda_event_results",
  "silence_radar_corrective_actions",
  "public_receipt_distribution_logs",
  "public_receipt_distribution_cycles",
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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const appUrl = (process.env.PRODUCTION_SHADOW_URL || process.env.APP_URL || "https://raadarbase.vercel.app").replace(/\/$/, "");

function isPermissionDenied(message) {
  return /permission|row-level security|violates row-level security|not allowed|new row/i.test(message);
}

async function auditTable(anonClient, serviceClient, table) {
  const serviceRead = await serviceClient.from(table).select("*", { count: "exact", head: true });
  const anonRead = await anonClient.from(table).select("*", { count: "exact", head: true });
  const anonWrite = await anonClient.from(table).insert({}).select("id").limit(1);

  const serviceReadOk = !serviceRead.error;
  const serviceCount = serviceRead.count ?? 0;
  const anonReadBlocked = Boolean(anonRead.error) || (anonRead.count ?? 0) === 0;
  const anonWriteBlocked = Boolean(anonWrite.error) && isPermissionDenied(anonWrite.error.message);

  return {
    table,
    serviceReadOk,
    serviceCount,
    anonReadBlocked,
    anonReadStatus: anonRead.error ? "error" : (anonRead.count ?? 0) > 0 ? "rows_visible" : "empty_or_hidden",
    anonWriteBlocked,
    anonWriteStatus: anonWrite.error ? (isPermissionDenied(anonWrite.error.message) ? "permission_blocked" : "other_error") : "write_succeeded",
  };
}

async function auditProtectedExports() {
  const results = [];
  for (const path of protectedExportUrls) {
    const response = await fetch(`${appUrl}${path}`, { redirect: "manual" });
    const location = response.headers.get("location");
    const blocked = response.status === 401 || response.status === 403 || Boolean(location && /\/login(?:\?|$)/i.test(location));
    results.push({
      path,
      status: response.status,
      blocked,
    });
  }
  return results;
}

async function main() {
  if (!url || !anonKey || !serviceRoleKey) {
    console.error("[production:rls-audit] variáveis do Supabase ausentes.");
    process.exit(1);
  }

  const anonClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const serviceClient = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const tables = [];
  for (const table of sensitiveTables) {
    tables.push(await auditTable(anonClient, serviceClient, table));
  }

  const exportChecks = await auditProtectedExports();
  const failures = [];

  for (const table of tables) {
    if (!table.serviceReadOk) failures.push(`Service role sem leitura técnica em ${table.table}.`);
    if (!table.anonReadBlocked) failures.push(`Leitura anon indevida em ${table.table}.`);
    if (!table.anonWriteBlocked) failures.push(`Escrita anon indevida em ${table.table}.`);
  }

  for (const exportCheck of exportChecks) {
    if (!exportCheck.blocked) failures.push(`Export protegido acessível sem sessão: ${exportCheck.path}.`);
  }

  const findings = {
    serviceReadFailures: tables.filter((table) => !table.serviceReadOk).length,
    anonReadLeaks: tables.filter((table) => !table.anonReadBlocked).length,
    anonWriteLeaks: tables.filter((table) => !table.anonWriteBlocked).length,
    protectedExportLeaks: exportChecks.filter((item) => !item.blocked).length,
  };

  const recommendation =
    findings.anonReadLeaks > 0 || findings.anonWriteLeaks > 0 || findings.protectedExportLeaks > 0
      ? "ACCESS_BLOCKED"
      : failures.length > 0
        ? "NEEDS_FIX"
        : "ACCESS_READY";

  const payload = {
    generatedAt: new Date().toISOString(),
    appUrl,
    tables,
    exportChecks,
    findings,
    failures,
    recommendation,
    productionAuthorized: false,
  };

  mkdirSync(reportsDir, { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  console.log("[production:rls-audit]");
  console.log(`- tables_checked: ${tables.length}`);
  console.log(`- anon_read_leaks: ${findings.anonReadLeaks}`);
  console.log(`- anon_write_leaks: ${findings.anonWriteLeaks}`);
  console.log(`- protected_export_leaks: ${findings.protectedExportLeaks}`);
  console.log(`- recommendation: ${recommendation}`);

  if (recommendation !== "ACCESS_READY") process.exitCode = 1;
}

main().catch((error) => {
  console.error(`[production:rls-audit] erro: ${error instanceof Error ? error.message : "falha desconhecida"}`);
  process.exit(1);
});
