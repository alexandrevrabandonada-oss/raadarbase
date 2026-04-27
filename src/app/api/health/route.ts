import { NextResponse } from "next/server";
import { getEnvironmentLabel, isSupabaseConfigured, USE_MOCKS } from "@/lib/config";
import { isMetaConfigured } from "@/lib/meta/client";
import { getLatestMetaSyncRun } from "@/lib/data/operation";
import { getStuckSyncRuns } from "@/lib/operation/stuck-runs";

export const dynamic = "force-dynamic";

export async function GET() {
  const [stuckRuns, latestRun] = await Promise.all([
    getStuckSyncRuns().catch(() => []),
    getLatestMetaSyncRun().catch(() => null),
  ]);

  return NextResponse.json({
    app: "ok",
    stuck_sync_runs_count: stuckRuns.length,
    last_meta_sync_status: latestRun?.status ?? null,
    last_meta_sync_at: latestRun?.started_at ?? null,
    supabase_configured: isSupabaseConfigured(),
    meta_configured: isMetaConfigured(),
    mock_mode: USE_MOCKS,
    environment: getEnvironmentLabel(),
    timestamp: new Date().toISOString(),
  });
}
