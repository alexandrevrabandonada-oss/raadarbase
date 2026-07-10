import { afterEach, describe, expect, it, vi } from "vitest";
import { normalizeUniversalRecord } from "./normalizer";
import { calculateTerritorialInfluenceScore } from "./score";

describe("calculateTerritorialInfluenceScore", () => {
  afterEach(() => vi.useRealTimers());
  it("combina alcance, território, instituição, rede e qualidade com explicação", () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date("2026-07-09T12:00:00Z"));
    const record = normalizeUniversalRecord({ name: "Sindicato Demo", bio: "Sindicato em Volta Redonda RJ", followers: 100_000, internalEngagement: 999, capturedAt: "2026-07-09T10:00:00Z" }, "json");
    const score = calculateTerritorialInfluenceScore({ record, relationshipCount: 7, organizationConnections: 2, evidenceCount: 12, averageEvidenceConfidence: .9 });
    expect(score.total).toBeGreaterThan(70);
    expect(score.institutional_relevance).toBe(15);
    expect(score.network).toBeGreaterThan(0);
    expect(score.explanation.join(" ")).toContain("Volta Redonda");
  });
  it("penaliza conflito e envelhecimento sem produzir score negativo", () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date("2026-07-09T12:00:00Z"));
    const record = normalizeUniversalRecord({ name: "Empresa Antiga", capturedAt: "2016-01-01T00:00:00Z" });
    const clean = calculateTerritorialInfluenceScore({ record, evidenceCount: 10, averageEvidenceConfidence: 1 });
    const conflicted = calculateTerritorialInfluenceScore({ record, evidenceCount: 10, averageEvidenceConfidence: 1, hasConflict: true });
    expect(conflicted.data_quality).toBeLessThan(clean.data_quality);
    expect(conflicted.freshness_decay).toBe(.5);
    expect(conflicted.total).toBeGreaterThanOrEqual(0);
  });
});
