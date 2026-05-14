import { describe, expect, it } from "vitest";
import {
  OPERATIONAL_CYCLE_COPY,
  actionAllowsAutomation,
  assertOperationalCycleText,
  containsForbiddenOperationalCycleWords,
} from "./cycle-copy";
import { severityForGuardrail } from "./cycle-priority";

describe("operational cycle contract", () => {
  it("não deixa palavras proibidas entrarem na copy comum", () => {
    for (const value of Object.values(OPERATIONAL_CYCLE_COPY)) {
      expect(containsForbiddenOperationalCycleWords(value)).toBe(false);
      expect(assertOperationalCycleText(value)).toBe(value);
    }
  });

  it("do_not_contact sempre vira critical", () => {
    expect(severityForGuardrail("do_not_contact")).toBe("critical");
  });

  it("manual_action_required nunca sugere automação", () => {
    expect(actionAllowsAutomation("confirm_manual_send")).toBe(false);
    expect(actionAllowsAutomation("prepare_message")).toBe(false);
    expect(actionAllowsAutomation("open_instagram")).toBe(false);
  });
});
