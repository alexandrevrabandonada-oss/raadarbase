import type { OperationalCycleGuardrailCode, OperationalCycleSeverity } from "./cycle-types";

const SEVERITY_WEIGHT: Record<OperationalCycleSeverity, number> = {
  stable: 0,
  info: 1,
  attention: 2,
  care: 3,
  critical: 4,
};

export function compareOperationalCycleSeverity(
  left: OperationalCycleSeverity,
  right: OperationalCycleSeverity,
) {
  return SEVERITY_WEIGHT[right] - SEVERITY_WEIGHT[left];
}

export function severityForGuardrail(guardrail: OperationalCycleGuardrailCode): OperationalCycleSeverity {
  switch (guardrail) {
    case "do_not_contact":
    case "sensitive_data":
      return "critical";
    case "consent_required":
    case "waiting_window":
    case "overload":
      return "care";
    case "recent_contact":
    case "manual_action_required":
      return "attention";
  }
}
