import type {
  AuditLogEntry,
  InteractionWithPost,
  MessageTemplate,
  OutreachTask,
  PersonReferral,
  PersonWithContact,
} from "@/lib/types";
import type { FieldAgendaEvent, FieldAgendaEventResult } from "@/lib/data/field-agenda";
import type {
  OperationalCycleActionCode,
  OperationalCycleGuardrailCode,
  OperationalCycleSeverity,
  OperationalCycleType,
} from "@/lib/operational-cycle/cycle-types";

export type MissionType =
  | "ESCUTA"
  | "VINCULO"
  | "RETORNO"
  | "ENCAMINHAMENTO"
  | "CUIDADO"
  | "CAMPO"
  | "MEMORIA";

export type MissionPhase =
  | "PREPARAR"
  | "CONVERSAR"
  | "REGISTRAR"
  | "ENCAMINHAR"
  | "CONCLUIR";

export type MissionState =
  | "SUGERIDA"
  | "ASSUMIDA"
  | "EM_ANDAMENTO"
  | "EM_ESPERA"
  | "BLOQUEADA"
  | "CONCLUIDA"
  | "ARQUIVADA";

export type MissionSubjectType = Extract<OperationalCycleType, "person" | "territory" | "field" | "memory">;

export type MissionSignalSeverity = Extract<OperationalCycleSeverity, "info" | "attention" | "critical">;

export type MissionActionKind =
  | "manual_contact"
  | "open_external"
  | "open_internal"
  | "record"
  | "review"
  | "route"
  | "wait"
  | "close";

export type MissionSourceType =
  | "ig_people"
  | "ig_interactions"
  | "contacts"
  | "outreach_tasks"
  | "message_templates"
  | "ig_person_referrals"
  | "field_agenda_events"
  | "field_agenda_event_results"
  | "strategic_memories"
  | "audit_logs";

export interface MissionSignal {
  code: string;
  label: string;
  detail?: string;
  severity: MissionSignalSeverity;
  at?: string | null;
}

export interface MissionGuardrail {
  code: "none" | "manual_only" | "wait_window" | Extract<OperationalCycleGuardrailCode, "do_not_contact" | "consent_required">;
  label: string;
  message: string;
  blocksContact: boolean;
}

export interface MissionAction {
  id: string;
  label: string;
  kind: MissionActionKind;
  cycleAction?: OperationalCycleActionCode;
  disabled?: boolean;
  reason?: string;
}

export interface MissionPriority {
  score: number;
  tier: 1 | 2 | 3 | 4 | 5 | 6;
  label: string;
}

export interface MissionCreatedFrom {
  source: MissionSourceType;
  id?: string | null;
  note?: string;
}

export interface RadarMission {
  id: string;
  type: MissionType;
  phase: MissionPhase;
  state: MissionState;
  title: string;
  subjectType: MissionSubjectType;
  subjectId?: string;
  reason: string;
  signals: MissionSignal[];
  guardrail: MissionGuardrail;
  nextStep: string;
  primaryAction: MissionAction;
  secondaryActions: MissionAction[];
  priority: MissionPriority;
  createdFrom: MissionCreatedFrom[];
  explainabilityText: string;
}

export interface MissionPersonInput {
  person: PersonWithContact;
  interactions: InteractionWithPost[];
  tasks?: OutreachTask[];
  referrals?: PersonReferral[];
  auditLogs?: AuditLogEntry[];
  templates?: MessageTemplate[];
}

export interface MissionFieldInput {
  event: FieldAgendaEvent;
  result?: FieldAgendaEventResult | null;
}

export interface MissionEngineInput {
  people?: MissionPersonInput[];
  fieldEvents?: MissionFieldInput[];
  now?: Date;
}
