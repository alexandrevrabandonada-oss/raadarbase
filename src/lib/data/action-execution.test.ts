import { describe, it, expect, vi } from "vitest";
import { getExecutionSummaryForPlan } from "./action-execution";

vi.mock("@/lib/supabase/admin", () => ({
  getSupabaseAdminClient: () => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({
          data: [
            {
              id: "item1",
              status: "done",
              action_item_evidence: [{ id: "ev1" }],
              action_item_results: { next_step: "Passo 1" }
            },
            {
              id: "item2",
              status: "todo",
              action_item_evidence: [],
              action_item_results: null
            }
          ],
          error: null
        }))
      }))
    }))
  })
}));

describe("Action Execution Data Layer", () => {
  it("deve calcular o resumo de execução corretamente", async () => {
    const summary = await getExecutionSummaryForPlan("plan123");
    
    expect(summary.totalItems).toBe(2);
    expect(summary.completedItems).toBe(1);
    expect(summary.itemsWithEvidence).toBe(1);
    expect(summary.itemsWithResult).toBe(1);
    expect(summary.nextSteps).toContain("Passo 1");
  });
});
