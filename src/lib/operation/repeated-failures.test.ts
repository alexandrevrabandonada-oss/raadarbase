import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/data/operation", () => ({
  listMetaSyncRuns: vi.fn(),
}));

import { listMetaSyncRuns } from "@/lib/data/operation";
import { getRepeatedFailureSummary } from "@/lib/operation/repeated-failures";

describe("repeated failures", () => {
  it("detects repeated failures by kind and aggregate meta failures", async () => {
    vi.mocked(listMetaSyncRuns).mockResolvedValue([
      {
        id: "run-1",
        actor_email: null,
        actor_id: null,
        error_message: "erro",
        finished_at: null,
        inserted_count: 0,
        kind: "meta.comments",
        metadata: {},
        skipped_count: 0,
        started_at: new Date().toISOString(),
        status: "error",
        updated_count: 0,
      },
      {
        id: "run-2",
        actor_email: null,
        actor_id: null,
        error_message: "erro",
        finished_at: null,
        inserted_count: 0,
        kind: "meta.comments",
        metadata: {},
        skipped_count: 0,
        started_at: new Date().toISOString(),
        status: "error",
        updated_count: 0,
      },
      {
        id: "run-3",
        actor_email: null,
        actor_id: null,
        error_message: "erro",
        finished_at: null,
        inserted_count: 0,
        kind: "meta.comments",
        metadata: {},
        skipped_count: 0,
        started_at: new Date().toISOString(),
        status: "error",
        updated_count: 0,
      },
      {
        id: "run-4",
        actor_email: null,
        actor_id: null,
        error_message: "erro",
        finished_at: null,
        inserted_count: 0,
        kind: "meta.account",
        metadata: {},
        skipped_count: 0,
        started_at: new Date().toISOString(),
        status: "error",
        updated_count: 0,
      },
      {
        id: "run-5",
        actor_email: null,
        actor_id: null,
        error_message: "erro",
        finished_at: null,
        inserted_count: 0,
        kind: "meta.account",
        metadata: {},
        skipped_count: 0,
        started_at: new Date().toISOString(),
        status: "error",
        updated_count: 0,
      },
    ]);

    const summary = await getRepeatedFailureSummary();

    expect(summary.repeatedFailureKinds).toEqual(["meta.comments"]);
    expect(summary.repeatedFailureCount).toBe(2);
    expect(summary.repeatedFailures[0]?.count).toBe(3);
  });
});