export type OperationalCycleType =
  | "person"
  | "mission"
  | "rhythm"
  | "field"
  | "memory"
  | "territory";

export type OperationalCycleSeverity =
  | "stable"
  | "info"
  | "attention"
  | "care"
  | "critical";

export type OperationalCycleState =
  | "suggested"
  | "active"
  | "waiting"
  | "blocked"
  | "completed"
  | "archived";

export type OperationalCycleGuardrailCode =
  | "do_not_contact"
  | "recent_contact"
  | "consent_required"
  | "sensitive_data"
  | "waiting_window"
  | "overload"
  | "manual_action_required";

export type OperationalCycleActionCode =
  | "review"
  | "prepare_message"
  | "open_instagram"
  | "confirm_manual_send"
  | "register_response"
  | "refer"
  | "pause"
  | "archive"
  | "create_field_action"
  | "register_result"
  | "create_memory";

export const LEGACY_MISSION_STATE_BY_CYCLE_STATE: Record<
  OperationalCycleState,
  "SUGERIDA" | "ASSUMIDA" | "EM_ESPERA" | "BLOQUEADA" | "CONCLUIDA" | "ARQUIVADA"
> = {
  suggested: "SUGERIDA",
  active: "ASSUMIDA",
  waiting: "EM_ESPERA",
  blocked: "BLOQUEADA",
  completed: "CONCLUIDA",
  archived: "ARQUIVADA",
};

export const RHYTHM_SEVERITY_BY_CYCLE_SEVERITY: Record<
  Extract<OperationalCycleSeverity, "stable" | "attention" | "critical">,
  "healthy" | "warning" | "critical"
> = {
  stable: "healthy",
  attention: "warning",
  critical: "critical",
};
