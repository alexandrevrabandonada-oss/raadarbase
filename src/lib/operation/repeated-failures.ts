import { listMetaSyncRuns } from "@/lib/data/operation";

export type RepeatedFailureSummary = {
  repeatedFailureCount: number;
  repeatedFailureKinds: string[];
  repeatedFailures: Array<{
    kind: string;
    count: number;
    latestRunId: string;
    latestFailureAt: string;
  }>;
};

export async function getRepeatedFailureSummary(hours = 24): Promise<RepeatedFailureSummary> {
  const runs = await listMetaSyncRuns(200);
  const since = Date.now() - hours * 60 * 60 * 1000;
  const recentErrorRuns = runs.filter(
    (run) => run.status === "error" && new Date(run.started_at).getTime() >= since,
  );

  const failuresByKind = new Map<
    string,
    { kind: string; count: number; latestRunId: string; latestFailureAt: string }
  >();

  for (const run of recentErrorRuns) {
    const current = failuresByKind.get(run.kind);
    if (!current) {
      failuresByKind.set(run.kind, {
        kind: run.kind,
        count: 1,
        latestRunId: run.id,
        latestFailureAt: run.started_at,
      });
      continue;
    }

    current.count += 1;
    if (new Date(run.started_at).getTime() > new Date(current.latestFailureAt).getTime()) {
      current.latestFailureAt = run.started_at;
      current.latestRunId = run.id;
    }
  }

  const repeatedFailures = Array.from(failuresByKind.values())
    .filter((item) => item.count >= 3)
    .sort((left, right) => right.count - left.count);

  const repeatedFailureCount = repeatedFailures.length + (recentErrorRuns.length >= 5 ? 1 : 0);
  const repeatedFailureKinds = repeatedFailures.map((item) => item.kind);

  return {
    repeatedFailureCount,
    repeatedFailureKinds,
    repeatedFailures,
  };
}