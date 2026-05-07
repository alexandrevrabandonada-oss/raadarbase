import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/config", () => ({
  shouldUseMockData: () => false,
}));

const listActionsMock = vi.fn();
const getImpactMock = vi.fn();
const getActiveWindowMock = vi.fn();
const listWindowsMock = vi.fn();

vi.mock("@/lib/data/silence-radar-corrective-actions", () => ({
  listSilenceRadarCorrectiveActions: (...args: unknown[]) => listActionsMock(...args),
  getCorrectiveActionImpact: (...args: unknown[]) => getImpactMock(...args),
}));

vi.mock("@/lib/data/territorial-listening-monitoring", () => ({
  getActiveTerritorialListeningWindow: (...args: unknown[]) => getActiveWindowMock(...args),
}));

vi.mock("@/lib/data/territorial-listening-windows", () => ({
  listTerritorialListeningWindows: (...args: unknown[]) => listWindowsMock(...args),
}));

import {
  classifyCorrectiveActionImpact,
  getSilenceRadarImpactDashboard,
  getStillSilentTargets,
} from "./silence-radar-impact";

describe("silence-radar-impact", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("classifica impacto conforme regra agregada", () => {
    expect(
      classifyCorrectiveActionImpact({ baseline: 2, current: 5, delta: 3, hasComparablePeriod: true }),
    ).toBe("melhoria");

    expect(
      classifyCorrectiveActionImpact({ baseline: 3, current: 3, delta: 0, hasComparablePeriod: true }),
    ).toBe("estavel");

    expect(
      classifyCorrectiveActionImpact({ baseline: 0, current: 0, delta: 0, hasComparablePeriod: true }),
    ).toBe("atencao");

    expect(
      classifyCorrectiveActionImpact({ baseline: null, current: null, delta: null, hasComparablePeriod: false }),
    ).toBe("sem_dados_suficientes");
  });

  it("calcula dashboard agregado com deltas", async () => {
    listActionsMock.mockResolvedValue([
      {
        id: "a1",
        kind: "reforco_bairro",
        target_type: "bairro",
        target_label: "Centro",
        source_metric: "report_count_in_window",
        baseline_value: 1,
        baseline_snapshot: { reportCount: 1 },
        status: "done",
        created_by: null,
        created_by_email: null,
        action_plan_item_id: "item-1",
        created_at: "2026-05-01T12:00:00.000Z",
        completed_at: "2026-05-02T12:00:00.000Z",
        metadata: {},
      },
      {
        id: "a2",
        kind: "reforco_bairro",
        target_type: "bairro",
        target_label: "Centro",
        source_metric: "report_count_in_window",
        baseline_value: 0,
        baseline_snapshot: { reportCount: 0 },
        status: "doing",
        created_by: null,
        created_by_email: null,
        action_plan_item_id: null,
        created_at: "2026-05-03T12:00:00.000Z",
        completed_at: null,
        metadata: {},
      },
    ]);

    getImpactMock
      .mockResolvedValueOnce({
        actionId: "a1",
        targetType: "bairro",
        targetLabel: "Centro",
        kind: "reforco_bairro",
        baselineValue: 1,
        baselineSnapshot: { reportCount: 1 },
        currentReportCount: 3,
        currentFormCount: 3,
        currentCommentCount: 0,
        deltaReports: 2,
        deltaForms: null,
        deltaComments: null,
      })
      .mockResolvedValueOnce({
        actionId: "a2",
        targetType: "bairro",
        targetLabel: "Centro",
        kind: "reforco_bairro",
        baselineValue: 0,
        baselineSnapshot: { reportCount: 0 },
        currentReportCount: 0,
        currentFormCount: 0,
        currentCommentCount: 0,
        deltaReports: 0,
        deltaForms: null,
        deltaComments: null,
      });

    getActiveWindowMock.mockResolvedValue(null);
    listWindowsMock.mockResolvedValue([]);

    const dashboard = await getSilenceRadarImpactDashboard();

    expect(dashboard.rows).toHaveLength(2);
    expect(dashboard.rows[0].deltaAbsolute).toBe(2);
    expect(dashboard.rows[0].impactStatus).toBe("melhoria");
    expect(dashboard.rows[1].impactStatus).toBe("atencao");

    expect(dashboard.summary.totalActions).toBe(2);
    expect(dashboard.summary.doneActions).toBe(1);
    expect(dashboard.summary.positiveImpactActions).toBe(1);
    expect(dashboard.summary.retryNeededActions).toBe(1);
  });

  it("não quebra com banco vazio", async () => {
    listActionsMock.mockResolvedValue([]);
    getActiveWindowMock.mockResolvedValue(null);
    listWindowsMock.mockResolvedValue([]);

    const dashboard = await getSilenceRadarImpactDashboard();

    expect(dashboard.rows).toEqual([]);
    expect(dashboard.summary.totalActions).toBe(0);
    expect(dashboard.stillSilentTargets).toEqual([]);

    const silentTargets = await getStillSilentTargets();
    expect(silentTargets).toEqual([]);
  });
});
