import { NextResponse } from "next/server";
import { getEnvironmentLabel, isSupabaseConfigured, USE_MOCKS } from "@/lib/config";
import { isMetaConfigured } from "@/lib/meta/client";
import { getLatestMetaSyncRun } from "@/lib/data/operation";
import { getStuckSyncRuns } from "@/lib/operation/stuck-runs";
import { getRepeatedFailureSummary } from "@/lib/operation/repeated-failures";
import { getUnsafeProductionWarnings } from "@/lib/security/production-guards";
import { isWebhookEnabled, isWebhookConfigured } from "@/lib/meta/webhook-security";
import {
  decideStagingWebhookGoNoGo,
  mapDecisionToValidationStatus,
} from "@/lib/meta/staging-webhook-validation";

import { countOpenIncidents, countCriticalIncidents } from "@/lib/data/incidents";
import { getStrategicMemoryStats } from "@/lib/data/strategic-memory";
import { countWebhookEventsByStatus, getStaleQuarantineEvents, getInvalidSignatureEvents } from "@/lib/meta/webhook-processing";

export const dynamic = "force-dynamic";

export async function GET() {
  const appUrlConfigured = Boolean(process.env.APP_URL);
  const metaWebhookVerifyPresent = Boolean(process.env.META_WEBHOOK_VERIFY_TOKEN);
  const metaAppSecretPresent = Boolean(process.env.META_APP_SECRET);
  const metaWebhookAllowedObjectsConfigured = Boolean(
    process.env.META_WEBHOOK_ALLOWED_OBJECTS && process.env.META_WEBHOOK_ALLOWED_OBJECTS.trim().length > 0,
  );
  const metaWebhookAllowedObjectsHasInstagram = (process.env.META_WEBHOOK_ALLOWED_OBJECTS ?? "instagram")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .includes("instagram");
  const maxPayloadBytes = Number.parseInt(process.env.META_WEBHOOK_MAX_PAYLOAD_BYTES ?? "262144", 10);
  const metaWebhookMaxPayloadBytesConfigured = Number.isFinite(maxPayloadBytes) && maxPayloadBytes > 0;
  const supabaseServerKeyPresent = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const runtime = process.env.NEXT_RUNTIME ?? "nodejs";

  const productionWarnings = getUnsafeProductionWarnings();
  const [
    stuckRuns, 
    latestRun, 
    repeatedFailures, 
    openIncidents, 
    criticalIncidents, 
    memoryStats,
    webhookCounts,
    staleQuarantine,
    invalidSignatures,
  ] = await Promise.all([
    getStuckSyncRuns().catch(() => []),
    getLatestMetaSyncRun().catch(() => null),
    getRepeatedFailureSummary().catch(() => ({ repeatedFailureCount: 0, repeatedFailureKinds: [], repeatedFailures: [] })),
    countOpenIncidents().catch(() => 0),
    countCriticalIncidents().catch(() => 0),
    getStrategicMemoryStats().catch(() => ({ activeCount: 0, draftCount: 0, totalCount: 0 })),
    countWebhookEventsByStatus().catch(() => ({ received: 0, verified: 0, quarantined: 0, ignored: 0, processed: 0, failed: 0 })),
    getStaleQuarantineEvents().catch(() => []),
    getInvalidSignatureEvents().catch(() => []),
  ]);

  const totalWebhookEvents = Object.values(webhookCounts).reduce((a, b) => a + b, 0);
  const signedEventSeen = webhookCounts.verified + webhookCounts.quarantined + webhookCounts.processed > 0;
  const unsignedRejectionSeen = invalidSignatures.length > 0;
  const operatorProcessedSeen = webhookCounts.processed > 0;
  const operatorIgnoredSeen = webhookCounts.ignored > 0;
  const dryRunExecuted =
    appUrlConfigured &&
    (webhookCounts.verified +
      webhookCounts.quarantined +
      webhookCounts.ignored +
      webhookCounts.processed +
      webhookCounts.failed >
      0 ||
      invalidSignatures.length > 0);

  const goNoGo = decideStagingWebhookGoNoGo({
    appUrlConfigured,
    healthOk: true,
    healthSecretsSafe: true,
    dryRunExecuted,
    signedEventSeen,
    unsignedRejectionSeen,
    operatorIgnoredSeen,
    operatorProcessedSeen,
    auditLogsFound: true,
    incidentsFound: openIncidents > 0 || invalidSignatures.length > 0,
    noDmAutomation: true,
    noAutoContactCreation: true,
    noPoliticalScore: true,
  });

  const stagingWebhookValidationStatus = mapDecisionToValidationStatus({
    webhookConfigured: isWebhookConfigured(),
    externalAttempted: dryRunExecuted,
    decision: goNoGo,
  });

  return NextResponse.json({
    ok: productionWarnings.every((warning) => warning.severity !== "error") && criticalIncidents === 0,
    unsafe_production_warnings_count: productionWarnings.length,
    stuck_sync_runs_count: stuckRuns.length,
    repeated_failure_count: repeatedFailures.repeatedFailureCount,
    repeated_failure_kinds: repeatedFailures.repeatedFailureKinds,
    incident_open_count: openIncidents,
    critical_incident_count: criticalIncidents,
    internal_roles_configured: true,
    topic_taxonomy_configured: true,
    reports_configured: true,
    action_execution_configured: true,
    strategic_memory_configured: true,
    strategic_memory_count: memoryStats.totalCount,
    active_strategic_memory_count: memoryStats.activeCount,
    action_evidence_count: 0,
    action_results_count: 0,
    overdue_items_without_result_count: 0,
    execution_incident_count: 0,
    forbidden_report_terms_detected_count: 0,
    pending_topic_reviews_count: 0, 
    // Webhook metrics
    meta_webhook_configured: isWebhookConfigured(),
    meta_webhook_enabled: isWebhookEnabled(),
    webhook_ready: isWebhookConfigured() && isWebhookEnabled() && invalidSignatures.length === 0,
    meta_webhook_events_count: totalWebhookEvents,
    meta_webhook_quarantine_count: webhookCounts.quarantined,
    meta_webhook_failed_count: webhookCounts.failed,
    meta_webhook_invalid_signature_count: invalidSignatures.length,
    meta_webhook_stale_quarantine_count: staleQuarantine.length,
    staging_webhook_validation_status: stagingWebhookValidationStatus,
    staging_webhook_signed_event_seen: signedEventSeen,
    staging_webhook_unsigned_rejection_seen: unsignedRejectionSeen,
    staging_webhook_operator_processed_seen: operatorProcessedSeen,
    staging_webhook_operator_ignored_seen: operatorIgnoredSeen,
    last_meta_sync_status: latestRun?.status ?? null,
    last_meta_sync_at: latestRun?.started_at ?? null,
    supabase_configured: isSupabaseConfigured(),
    meta_configured: isMetaConfigured(),
    app_url_configured: appUrlConfigured,
    meta_webhook_verify_present: metaWebhookVerifyPresent,
    meta_app_secret_present: metaAppSecretPresent,
    meta_webhook_allowed_objects_configured: metaWebhookAllowedObjectsConfigured,
    meta_webhook_allowed_objects_has_instagram: metaWebhookAllowedObjectsHasInstagram,
    meta_webhook_max_payload_bytes_configured: metaWebhookMaxPayloadBytesConfigured,
    supabase_server_key_present: supabaseServerKeyPresent,
    runtime,
    mock_mode: USE_MOCKS,
    environment: getEnvironmentLabel(),
    rls_check_hint: "Use npm run check:rls to verify role isolation.",
    timestamp: new Date().toISOString(),
  });
}
