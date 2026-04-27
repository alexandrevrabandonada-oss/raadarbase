import { NextResponse } from "next/server";
import { getEnvironmentLabel, isSupabaseConfigured, USE_MOCKS } from "@/lib/config";
import { isMetaConfigured } from "@/lib/meta/client";
import { getLatestMetaSyncRun } from "@/lib/data/operation";
import { getStuckSyncRuns } from "@/lib/operation/stuck-runs";
import { getRepeatedFailureSummary } from "@/lib/operation/repeated-failures";
import { getUnsafeProductionWarnings } from "@/lib/security/production-guards";

export const dynamic = "force-dynamic";

export async function GET() {
  const productionWarnings = getUnsafeProductionWarnings();
  const [stuckRuns, latestRun, repeatedFailures] = await Promise.all([
    getStuckSyncRuns().catch(() => []),
    getLatestMetaSyncRun().catch(() => null),
    getRepeatedFailureSummary().catch(() => ({ repeatedFailureCount: 0, repeatedFailureKinds: [], repeatedFailures: [] })),
  ]);

  return NextResponse.json({
    ok: productionWarnings.every((warning) => warning.severity !== "error"),
    unsafe_production_warnings_count: productionWarnings.length,
    stuck_sync_runs_count: stuckRuns.length,
    repeated_failure_count: repeatedFailures.repeatedFailureCount,
    repeated_failure_kinds: repeatedFailures.repeatedFailureKinds,
    last_meta_sync_status: latestRun?.status ?? null,
    last_meta_sync_at: latestRun?.started_at ?? null,
    supabase_configured: isSupabaseConfigured(),
    meta_configured: isMetaConfigured(),
    mock_mode: USE_MOCKS,
    environment: getEnvironmentLabel(),
    timestamp: new Date().toISOString(),
  });
}
