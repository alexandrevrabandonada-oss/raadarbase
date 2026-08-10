import { describe, expect, it } from "vitest";
import {
  buildOutreachGoalStats,
  parseOutreachGoalSnapshot,
  type OutreachGoalSnapshot,
} from "./outreach-goal";

const snapshot: OutreachGoalSnapshot = {
  total_people: 100,
  do_not_contact: 5,
  sent_by_status: 40,
  sent_today: 3,
  operator_scores: [
    {
      operator_id: "operator-1",
      operator_email: "operador@radar.test",
      operator_name: "Operador Teste",
      total_sent: 20,
      sent_today: 2,
      last_sent_at: "2026-08-10T12:00:00.000Z",
    },
  ],
};

describe("outreach goal aggregation", () => {
  it("converte o snapshot agregado sem precisar do histórico de auditoria", () => {
    const stats = buildOutreachGoalStats(snapshot, new Date("2026-08-10T12:00:00.000Z"));

    expect(stats).toMatchObject({
      totalEligible: 95,
      totalSent: 40,
      totalRemaining: 55,
      progressPercent: 42.1,
      daysRemaining: 6,
      dailyGoal: 10,
      sentToday: 3,
    });
    expect(stats.operatorScores).toEqual([
      {
        operatorId: "operator-1",
        operatorEmail: "operador@radar.test",
        operatorName: "Operador Teste",
        totalSent: 20,
        sentToday: 2,
        lastSentAt: "2026-08-10T12:00:00.000Z",
      },
    ]);
  });

  it("limita enviados ao total elegível", () => {
    const stats = buildOutreachGoalStats(
      { ...snapshot, total_people: 4, do_not_contact: 1, sent_by_status: 9 },
      new Date("2026-08-10T12:00:00.000Z"),
    );

    expect(stats.totalEligible).toBe(3);
    expect(stats.totalSent).toBe(3);
    expect(stats.totalRemaining).toBe(0);
    expect(stats.progressPercent).toBe(100);
  });

  it("rejeita payload incompleto da RPC", () => {
    expect(() => parseOutreachGoalSnapshot({ total_people: 10 })).toThrow(/Resposta inválida/);
  });
});
