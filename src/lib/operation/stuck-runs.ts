import { listMetaSyncRuns, type MetaSyncRun } from "@/lib/data/operation";

export const STUCK_RUN_MINUTES = 15;

export function isSyncRunStuck(run: MetaSyncRun, now = new Date(), limitMinutes = STUCK_RUN_MINUTES) {
  if (run.status !== "started") return false;
  if (run.finished_at) return false;
  const startedAt = Date.parse(run.started_at);
  if (!Number.isFinite(startedAt)) return false;
  return now.getTime() - startedAt > limitMinutes * 60 * 1000;
}

export async function getStuckSyncRuns(limitMinutes = STUCK_RUN_MINUTES) {
  const runs = await listMetaSyncRuns(100);
  const now = new Date();
  return runs.filter((run) => isSyncRunStuck(run, now, limitMinutes));
}
