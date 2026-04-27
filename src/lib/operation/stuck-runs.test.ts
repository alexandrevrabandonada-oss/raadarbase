import { describe, expect, it } from "vitest";
import { isSyncRunStuck } from "./stuck-runs";
import type { MetaSyncRun } from "@/lib/data/operation";

function run(overrides: Partial<MetaSyncRun>): MetaSyncRun {
  return {
    id: "run-1",
    actor_id: null,
    actor_email: null,
    kind: "meta.media",
    status: "started",
    started_at: "2026-04-27T12:00:00.000Z",
    finished_at: null,
    inserted_count: 0,
    updated_count: 0,
    skipped_count: 0,
    error_message: null,
    metadata: {},
    ...overrides,
  };
}

describe("stuck runs", () => {
  const now = new Date("2026-04-27T12:20:01.000Z");

  it("run started recente nao e presa", () => {
    expect(isSyncRunStuck(run({ started_at: "2026-04-27T12:10:00.000Z" }), now)).toBe(false);
  });

  it("run started antiga e presa", () => {
    expect(isSyncRunStuck(run({ started_at: "2026-04-27T12:00:00.000Z" }), now)).toBe(true);
  });

  it("run success nao e presa", () => {
    expect(isSyncRunStuck(run({ status: "success", finished_at: "2026-04-27T12:01:00.000Z" }), now)).toBe(false);
  });

  it("run error nao e presa", () => {
    expect(isSyncRunStuck(run({ status: "error", finished_at: "2026-04-27T12:01:00.000Z" }), now)).toBe(false);
  });

  it("run sem finished_at dentro do limite nao e presa", () => {
    expect(isSyncRunStuck(run({ started_at: "2026-04-27T12:06:00.000Z" }), now)).toBe(false);
  });
});
