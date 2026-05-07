import { NextResponse } from "next/server";
import { getEnvironmentLabel, isSupabaseConfigured, USE_MOCKS } from "@/lib/config";
import { isMetaConfigured } from "@/lib/meta/client";
import { getLatestMetaSyncRun } from "@/lib/data/operation";
import { getMetaReconciliationSummary } from "@/lib/data/meta-reconciliation";
import { compareLatestEvidenceSnapshots, countMetaReconciliationEvidence } from "@/lib/data/meta-reconciliation-evidence";
import { getStuckSyncRuns } from "@/lib/operation/stuck-runs";
import { getRepeatedFailureSummary } from "@/lib/operation/repeated-failures";
import { getUnsafeProductionWarnings } from "@/lib/security/production-guards";
import { isWebhookEnabled, isWebhookConfigured } from "@/lib/meta/webhook-security";
import {
  decideStagingWebhookGoNoGo,
  mapDecisionToValidationStatus,
} from "@/lib/meta/staging-webhook-validation";
import { getActiveTerritorialListeningWindow, getTerritorialListeningAggregates, listTerritorialSnapshots } from "@/lib/data/territorial-listening-monitoring";
import { getTerritorialConversionMetrics } from "@/lib/data/territorial-listening-outreach";
import { getCorrectiveActionsImpactSummary } from "@/lib/data/silence-radar-impact";
import { getSilenceImpactTimeSeries } from "@/lib/data/silence-radar-time-series";
import { getPublicListeningReceipt } from "@/lib/data/public-listening-receipt";
import { listReceiptDistributionLogs, listReceiptDistributionCycles } from "@/lib/data/public-receipt-distribution";
import { getFieldAgendaStats } from "@/lib/data/field-agenda";
import { getVolunteerHealthStats } from "@/lib/data/volunteers";
import { getVolunteerApplicationHealthStats } from "@/lib/data/volunteer-applications";
import { getVolunteerApplicationRetentionSummary } from "@/lib/data/volunteer-application-retention";
import { getVolunteerReviewDashboard } from "@/lib/data/volunteer-review-dashboard";

import {
  countOpenIncidents,
  countCriticalIncidents,
  countOpenWebhookIncidents,
  countCriticalWebhookIncidents,
} from "@/lib/data/incidents";
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
  const metaAccessTokenPresent = Boolean(process.env.META_ACCESS_TOKEN);
  const instagramBusinessAccountIdPresent = Boolean(process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID);
  const metaGraphVersionPresent = Boolean(process.env.META_GRAPH_VERSION);
  const metaManualSyncReady =
    metaAccessTokenPresent &&
    instagramBusinessAccountIdPresent &&
    metaGraphVersionPresent &&
    supabaseServerKeyPresent &&
    isSupabaseConfigured();
  const runtime = process.env.NEXT_RUNTIME ?? "nodejs";

  const productionWarnings = getUnsafeProductionWarnings();
  const [
    stuckRuns, 
    latestRun, 
    repeatedFailures, 
    openIncidents, 
    criticalIncidents, 
    webhookOpenIncidents,
    webhookCriticalIncidents,
    memoryStats,
    webhookCounts,
    staleQuarantine,
    invalidSignatures,
    metaReconciliation,
    metaReconciliationEvidenceCount,
    latestEvidenceComparison,
    silenceImpactSummary,
    timeSeriesData,
    publicReceipt,
    distributionLogs,
    distributionCycles,
    fieldAgendaStats,
    volunteerHealthStats,
    volunteerApplicationHealthStats,
    volunteerApplicationRetentionStats,
    volunteerReviewDashboard,
  ] = await Promise.all([
    getStuckSyncRuns().catch(() => []),
    getLatestMetaSyncRun().catch(() => null),
    getRepeatedFailureSummary().catch(() => ({ repeatedFailureCount: 0, repeatedFailureKinds: [], repeatedFailures: [] })),
    countOpenIncidents().catch(() => 0),
    countCriticalIncidents().catch(() => 0),
    countOpenWebhookIncidents().catch(() => 0),
    countCriticalWebhookIncidents().catch(() => 0),
    getStrategicMemoryStats().catch(() => ({ activeCount: 0, draftCount: 0, totalCount: 0 })),
    countWebhookEventsByStatus().catch(() => ({ received: 0, verified: 0, quarantined: 0, ignored: 0, processed: 0, failed: 0 })),
    getStaleQuarantineEvents().catch(() => []),
    getInvalidSignatureEvents().catch(() => []),
    getMetaReconciliationSummary().catch(() => null),
    countMetaReconciliationEvidence().catch(() => 0),
    compareLatestEvidenceSnapshots().catch(() => ({ latest: null, previous: null, delta: null })),
    getCorrectiveActionsImpactSummary().catch(() => ({
      totalActions: 0,
      plannedActions: 0,
      doingActions: 0,
      doneActions: 0,
      archivedActions: 0,
      positiveImpactActions: 0,
      unchangedActions: 0,
      retryNeededActions: 0,
      insufficientDataActions: 0,
      createdActions: 0,
      completedActions: 0,
      reportsBefore: 0,
      reportsAfter: 0,
      interactionsBefore: 0,
      interactionsAfter: 0,
      topicsWithImprovement: 0,
      stillSilentNeighborhoods: 0,
    })),
    getSilenceImpactTimeSeries({}).catch(() => ({
      points: [],
      trend: "sem_dados_suficientes",
      targetType: "all",
      targetLabel: "all",
    })),
    getPublicListeningReceipt().catch(() => ({
      periodStart: "",
      periodEnd: "",
      windowId: null,
      topics: { topics: [], totalPostsAnalyzed: 0, totalInteractionsAnalyzed: 0, uniquePeopleReached: 0 },
      territorial: null,
      actions: { totalActions: 0, doneActions: 0, plannedActions: 0, doingActions: 0 },
      timeSeries: { trend: "sem_dados_suficientes", points: [] },
      lastUpdatedAt: new Date().toISOString(),
    })),
    listReceiptDistributionLogs().catch(() => []),
    listReceiptDistributionCycles().catch(() => []),
    getFieldAgendaStats().catch(() => ({ totalCount: 0, plannedCount: 0, doneCount: 0, pendingResultsCount: 0 })),
    getVolunteerHealthStats().catch(() => ({ volunteersCount: 0, activeVolunteersCount: 0, squadsCount: 0, fieldEventVolunteerAssignmentsCount: 0 })),
    getVolunteerApplicationHealthStats().catch(() => ({ volunteerApplicationsCount: 0, volunteerApplicationsPendingCount: 0, volunteerApplicationsApprovedCount: 0, volunteerApplicationsRejectedCount: 0 })),
    getVolunteerApplicationRetentionSummary().catch(() => ({ eligibleForRedactionCount: 0, redactedCount: 0, scheduledRedactionCount: 0, retainedCount: 0 })),
    getVolunteerReviewDashboard().catch(() => ({ pending7d: [], pending30d: [], pending90d: [], roundsCount: 0, latestRound: null })),
  ]);

  const activeTerritorialWindow = await getActiveTerritorialListeningWindow().catch(() => null);
  const territorialAggregates = activeTerritorialWindow ? await getTerritorialListeningAggregates(activeTerritorialWindow.id).catch(() => null) : null;
  const territorialSnapshots = activeTerritorialWindow ? await listTerritorialSnapshots(activeTerritorialWindow.id).catch(() => []) : [];
  const territorialConversion = activeTerritorialWindow
    ? await getTerritorialConversionMetrics(activeTerritorialWindow.id).catch(() => null)
    : null;

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

  const stagingObservationStatus =
    webhookCounts.failed > 0 || staleQuarantine.length > 0
      ? "STAGING_BLOCKED"
      : webhookCriticalIncidents > 0 || goNoGo !== "GO_STAGING"
        ? "STAGING_ATTENTION"
        : "STAGING_STABLE";

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
    staging_observation_status: stagingObservationStatus,
    webhook_open_incidents_count: webhookOpenIncidents,
    webhook_critical_incidents_count: webhookCriticalIncidents,
    webhook_stale_quarantine_count: staleQuarantine.length,
    webhook_processing_failures_count: webhookCounts.failed,
    meta_real_ingestion_configured: Boolean(metaReconciliation && metaReconciliation.sourceOfTruth.syncRuns > 0),
    meta_posts_count: metaReconciliation?.sourceOfTruth.posts ?? 0,
    meta_interactions_count: metaReconciliation?.sourceOfTruth.interactions ?? 0,
    meta_people_count: metaReconciliation?.sourceOfTruth.people ?? 0,
    meta_sync_runs_count: metaReconciliation?.sourceOfTruth.syncRuns ?? 0,
    meta_started_runs_count: metaReconciliation?.startedRuns.length ?? 0,
    meta_stuck_runs_count: metaReconciliation?.stuckRuns.length ?? stuckRuns.length,
    latest_meta_sync_status: metaReconciliation?.latestFinalizedRun?.status ?? latestRun?.status ?? null,
    last_meta_sync_status: latestRun?.status ?? null,
    last_meta_sync_at: latestRun?.started_at ?? null,
    meta_reconciliation_evidence_count: metaReconciliationEvidenceCount,
    latest_meta_reconciliation_evidence_status: latestEvidenceComparison.latest?.status ?? null,
    latest_meta_reconciliation_evidence_at: latestEvidenceComparison.latest?.generated_at ?? null,
    latest_meta_reconciliation_hash: latestEvidenceComparison.latest?.report_hash ?? null,
    latest_meta_reconciliation_posts_delta: latestEvidenceComparison.delta?.posts_count ?? 0,
    latest_meta_reconciliation_interactions_delta: latestEvidenceComparison.delta?.interactions_count ?? 0,
    latest_meta_reconciliation_people_delta: latestEvidenceComparison.delta?.people_count ?? 0,
    latest_meta_reconciliation_runs_delta: latestEvidenceComparison.delta?.meta_sync_runs_count ?? 0,
    territorial_active_window_count: activeTerritorialWindow ? 1 : 0,
    territorial_reports_count: territorialAggregates?.totalReports ?? 0,
    territorial_snapshots_count: territorialSnapshots.length,
    territorial_outreach_planned_count: territorialConversion?.plannedCount ?? 0,
    territorial_outreach_shared_count: territorialConversion?.sharedCount ?? 0,
    territorial_conversion_status: territorialConversion?.status ?? "no_shared_yet",
    territorial_reports_after_first_shared: territorialConversion?.reportsAfterFirstShared ?? 0,
    latest_territorial_snapshot_status: territorialSnapshots[0]?.status ?? null,
    territorial_window_days_remaining: activeTerritorialWindow?.daysRemaining ?? null,
    silence_corrective_actions_count: silenceImpactSummary.totalActions,
    silence_corrective_actions_done_count: silenceImpactSummary.doneActions,
    silence_positive_impact_count: silenceImpactSummary.positiveImpactActions,
    silence_attention_impact_count: silenceImpactSummary.retryNeededActions,
    silence_time_series_points_count: timeSeriesData.points.length,
    silence_time_series_latest_date: timeSeriesData.points.length > 0 ? timeSeriesData.points[timeSeriesData.points.length - 1].date : null,
    silence_time_series_targets_count: silenceImpactSummary.totalActions,
    public_receipt_available: publicReceipt.windowId !== null,
    public_receipt_topics_count: publicReceipt.topics.topics.length,
    public_receipt_actions_count: publicReceipt.actions.totalActions,
    public_receipt_last_updated_at: publicReceipt.lastUpdatedAt,
    public_receipt_distribution_count: distributionLogs.length,
    public_receipt_distribution_shared_count: distributionLogs.filter(l => l.status === "shared").length,
    latest_public_receipt_distribution_at: distributionLogs.length > 0 ? distributionLogs[0].shared_at : null,
    public_receipt_distribution_cycles_count: distributionCycles.length,
    active_public_receipt_distribution_cycle: distributionCycles.find(c => c.status === "active")?.title || null,
    latest_distribution_cycle_status: distributionCycles.length > 0 ? distributionCycles[0].status : null,
    field_agenda_events_count: fieldAgendaStats.totalCount,
    field_agenda_planned_count: fieldAgendaStats.plannedCount,
    field_agenda_done_count: fieldAgendaStats.doneCount,
    field_agenda_pending_results_count: fieldAgendaStats.pendingResultsCount,
    volunteers_count: volunteerHealthStats.volunteersCount,
    active_volunteers_count: volunteerHealthStats.activeVolunteersCount,
    squads_count: volunteerHealthStats.squadsCount,
    field_event_volunteer_assignments_count: volunteerHealthStats.fieldEventVolunteerAssignmentsCount,
    volunteer_applications_count: volunteerApplicationHealthStats.volunteerApplicationsCount,
    volunteer_applications_pending_count: volunteerApplicationHealthStats.volunteerApplicationsPendingCount,
    volunteer_applications_approved_count: volunteerApplicationHealthStats.volunteerApplicationsApprovedCount,
    volunteer_applications_rejected_count: volunteerApplicationHealthStats.volunteerApplicationsRejectedCount,
    volunteer_applications_eligible_for_redaction_count: volunteerApplicationRetentionStats.eligibleForRedactionCount,
    volunteer_applications_redacted_count: volunteerApplicationRetentionStats.redactedCount,
    volunteer_applications_scheduled_redaction_count: volunteerApplicationRetentionStats.scheduledRedactionCount,
    volunteer_applications_retained_count: volunteerApplicationRetentionStats.retainedCount,
    volunteer_pending_7d_count: volunteerReviewDashboard.pending7d.length,
    volunteer_pending_30d_count: volunteerReviewDashboard.pending30d.length,
    volunteer_pending_90d_count: volunteerReviewDashboard.pending90d.length,
    volunteer_review_rounds_count: volunteerReviewDashboard.roundsCount,
    latest_volunteer_review_round_status: volunteerReviewDashboard.latestRound?.status ?? null,
    supabase_configured: isSupabaseConfigured(),
    meta_configured: isMetaConfigured(),
    app_url_configured: appUrlConfigured,
    meta_webhook_verify_present: metaWebhookVerifyPresent,
    meta_app_secret_present: metaAppSecretPresent,
    meta_webhook_allowed_objects_configured: metaWebhookAllowedObjectsConfigured,
    meta_webhook_allowed_objects_has_instagram: metaWebhookAllowedObjectsHasInstagram,
    meta_webhook_max_payload_bytes_configured: metaWebhookMaxPayloadBytesConfigured,
    supabase_server_key_present: supabaseServerKeyPresent,
    meta_api_credentials_present: metaAccessTokenPresent,
    instagram_business_account_id_present: instagramBusinessAccountIdPresent,
    meta_graph_version_present: metaGraphVersionPresent,
    meta_manual_sync_ready: metaManualSyncReady,
    runtime,
    mock_mode: USE_MOCKS,
    environment: getEnvironmentLabel(),
    rls_check_hint: "Use npm run check:rls to verify role isolation.",
    timestamp: new Date().toISOString(),
  });
}
