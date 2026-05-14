import { describe, expect, it } from "vitest";
import { buildCycleAlerts } from "./cycle-alert-engine";
import { buildNextDecision } from "./next-decision";
import { buildRhythmSummary } from "./rhythm-summary";

describe("cycle alert engine", () => {
  it("cria alertas agregados com severidade e count", () => {
    const alerts = buildCycleAlerts({
      unassignedMissions: 3,
      pendingReturns: 6,
      openReferrals: 2,
      urgentCare: 1,
      fieldWithoutClosure: 1,
      territoryWithoutAction: 0,
      pendingMemory: 4,
      highTeamLoad: 1,
      territoriesReady: 2,
    });

    expect(alerts.some((alert) => alert.type === "urgent_care")).toBe(true);
    expect(alerts.some((alert) => alert.type === "pending_returns")).toBe(true);
    expect(alerts.find((alert) => alert.type === "field_without_closure")?.severity).toBe("critical");
  });

  it("prioriza cuidado urgente acima de retornos e sem responsável", () => {
    const alerts = buildCycleAlerts({
      unassignedMissions: 8,
      pendingReturns: 12,
      openReferrals: 4,
      urgentCare: 2,
      fieldWithoutClosure: 0,
      territoryWithoutAction: 0,
      pendingMemory: 0,
      highTeamLoad: 0,
      territoriesReady: 0,
    });

    const decision = buildNextDecision(alerts);

    expect(decision.type).toBe("urgent_care");
    expect(decision.title).toMatch(/Cuidados urgentes/i);
  });

  it("escolhe retorno pendente quando não há cuidado urgente", () => {
    const alerts = buildCycleAlerts({
      unassignedMissions: 2,
      pendingReturns: 5,
      openReferrals: 3,
      urgentCare: 0,
      fieldWithoutClosure: 0,
      territoryWithoutAction: 0,
      pendingMemory: 0,
      highTeamLoad: 0,
      territoriesReady: 0,
    });

    const decision = buildNextDecision(alerts);
    expect(decision.type).toBe("pending_returns");
  });

  it("resume o ritmo como estável quando não há alertas", () => {
    const alerts = buildCycleAlerts({
      unassignedMissions: 0,
      pendingReturns: 0,
      openReferrals: 0,
      urgentCare: 0,
      fieldWithoutClosure: 0,
      territoryWithoutAction: 0,
      pendingMemory: 0,
      highTeamLoad: 0,
      territoriesReady: 0,
    });

    const decision = buildNextDecision(alerts);
    const summary = buildRhythmSummary(alerts);

    expect(alerts).toHaveLength(0);
    expect(decision.type).toBe("steady");
    expect(summary.status).toBe("steady");
  });

  it("considera memória pendente antes de território pronto", () => {
    const alerts = buildCycleAlerts({
      unassignedMissions: 0,
      pendingReturns: 0,
      openReferrals: 0,
      urgentCare: 0,
      fieldWithoutClosure: 0,
      territoryWithoutAction: 0,
      pendingMemory: 2,
      highTeamLoad: 0,
      territoriesReady: 3,
    });

    const decision = buildNextDecision(alerts);
    expect(decision.type).toBe("pending_memory");
  });
});
