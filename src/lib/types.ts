import type { Database, TableRow } from "@/lib/supabase/database.types";

export type PersonStatus = Database["public"]["Enums"]["person_status"];
export type InteractionType = Database["public"]["Enums"]["interaction_type"];
export type ConsentStatus = Database["public"]["Enums"]["consent_status"];
export type InternalUserStatus = Database["public"]["Enums"]["internal_user_status"];

export type KanbanColumnId =
  | "para_abordar"
  | "mensagem_enviada"
  | "esperando_resposta"
  | "respondeu"
  | "precisa_encaminhar"
  | "convidado"
  | "entrou_na_base"
  | "primeira_acao_feita"
  | "nao_insistir"
  | "nao_abordar"
  | "novo"
  | "responder_comentario"
  | "mandar_dm_manual"
  | "aguardando_resposta"
  | "convidar_grupo"
  | "contato_confirmado"
  | "nao_abordar";

export type AuditAction =
  | "contact.status_changed"
  | "contact.dm_registered"
  | "contact.replied"
  | "contact.confirmed"
  | "contact.do_not_contact"
  | "contact.notes_updated"
  | "contact.tags_updated"
  | "contact.response_recorded"
  | "contact.responsible_assigned"
  | "contact.outreach_task_created"
  | "contact.outreach_task_updated"
  | "outreach_task.responsible_assigned"
  | "outreach_task.bulk_assigned"
  | "outreach_task.balanced"
  | "contact.referral_recorded"
  | "contact.imported"
  | "referral.created"
  | "referral.updated"
  | "referral.status_updated"
  | "message.created"
  | "message.updated"
  | "message.deleted"
  | "contacts.exported"
  | "contact.anonymized"
  | "audit.tested"
  | "meta.media_synced"
  | "meta.comments_synced"
  | "meta.account_snapshot_synced"
  | "meta.sync_marked_failed"
  | "meta.sync_retried"
  | "meta.reconciliation_evidence_generated"
  | "meta.reconciliation_evidence_exported"
  | "internal_user.approved"
  | "internal_user.disabled"
  | "incident.acknowledged"
  | "incident.resolved"
  | "incident.note_added"
  | "topic.confirmed"
  | "topic.removed"
  | "topic.suggested"
  | "report.created"
  | "report.generated"
  | "report.exported"
  | "report.archived"
  | "report.forbidden_term_detected"
  | "topic.created"
  | "topic.updated"
  | "topic.disabled"
  | "authz.access_denied"
  | "action_plan.created"
  | "action_plan.updated"
  | "action_plan.completed"
  | "action_plan.archived"
  | "action_plan.item_created"
  | "action_plan.item_updated"
  | "action_plan.item_completed"
  | "action_plan.item_archived"
  | "action_plan.suggested_from_report"
  | "action_plan.forbidden_term_detected"
  | "action_execution.evidence_created"
  | "action_execution.evidence_updated"
  | "action_execution.evidence_removed"
  | "action_execution.result_created"
  | "action_execution.result_updated"
  | "action_execution.exported"
  | "action_execution.item_completed_with_result"
  | "action_execution.forbidden_term_detected"
  | "devolution.reviewed"
  | "devolution.published"
  | "devolution.archived"
  | "territorial_listening_window.opened"
  | "territorial.snapshot_generated"
  | "territorial.window_closed"
  | "territorial.window_archived"
  | "territorial.snapshot_exported"
  | "territorial.outreach_created"
  | "territorial.outreach_shared"
  | "territorial.outreach_archived"
  | "neighborhood_listen.submitted"
  | "neighborhood_listen.reviewed"
  | "neighborhood_listen.archived"
  | "neighborhood_listen.exported"
  | "strategic_memory.created"
  | "strategic_memory.updated"
  | "strategic_memory.archived"
  | "strategic_memory.linked"
  | "strategic_memory.unlinked"
  | "strategic_memory.suggested_from_results"
  | "strategic_memory.forbidden_term_detected"
  | "strategic_memory.exported"
  | "silence_radar.corrective_action_created"
  | "silence_radar.corrective_action_completed"
  | "silence_radar.corrective_action_archived"
  | "silence_radar.impact_exported"
  | "field_agenda.event_created"
  | "field_agenda.event_updated"
  | "field_agenda.event_done"
  | "field_agenda.result_created"
  | "person.converted_to_volunteer"
  | "volunteer.created"
  | "volunteer.updated"
  | "volunteer.archived"
  | "volunteer.assigned_to_squad"
  | "volunteer.removed_from_squad"
  | "volunteer.assigned_to_field_event"
  | "volunteer.event_status_updated"
  | "volunteer.exported"
  | "volunteer.contact_exported"
  | "volunteer_application.submitted"
  | "volunteer_application.approved"
  | "volunteer_application.rejected"
  | "volunteer_application.archived"
  | "volunteer_application.converted_to_volunteer"
  | "volunteer_application.review_notes_updated"
  | "volunteer_application.exported"
  | "volunteer_application.contact_exported"
  | "volunteer_application.redaction_scheduled"
  | "volunteer_application.redacted"
  | "volunteer_application.retained"
  | "volunteer_application.bulk_redaction_scheduled"
  | "volunteer_application.bulk_redacted"
  | "volunteer_review_round.created"
  | "volunteer_review_round.completed"
  | "volunteer_review_round.archived"
  | "receipt_distribution.created"
  | "receipt_distribution.shared"
  | "receipt_distribution.archived"
  | "receipt_distribution_cycle.created"
  | "receipt_distribution_cycle.started"
  | "receipt_distribution_cycle.closed"
  | "receipt_distribution_cycle.log_linked"
  | "contact.dm_prepared"
  | "contact.dm_sent"
  | "telemetry.event_recorded"
  | "pilot.feedback_submitted"
  | "pilot.feedback_status_changed"
  | "pilot.feedback_converted_to_task"
  | "pilot.feedback_exported_to_retrospective"
  | "person.duplicate_resolved"
  | "person.username_updated"
  | "person.theme_updated_assisted"
  | "person.batch_assignment_completed";

export type ContactRecord = TableRow<"contacts">;
export type BairroEscutaSubmissionRow = TableRow<"bairro_escuta_submissions">;
export type PublicDevolutionPublicationRow = TableRow<"public_devolution_publications">;
export type TerritorialListeningWindowRow = TableRow<"territorial_listening_windows">;
export type TerritorialListeningDailySnapshotRow = TableRow<"territorial_listening_daily_snapshots">;
export type TerritorialListeningOutreachLogRow = TableRow<"territorial_listening_outreach_logs">;
export type IgPeopleRow = TableRow<"ig_people">;
export type IgPostRow = TableRow<"ig_posts">;
export type IgInteractionRow = TableRow<"ig_interactions">;
export type OutreachTaskRow = TableRow<"outreach_tasks">;
export type MessageTemplateRow = TableRow<"message_templates">;
export type AuditLogRow = TableRow<"audit_logs">;
export type InternalUserRow = TableRow<"internal_users">;
export type CampaignVolunteerRow = TableRow<"campaign_volunteers">;
export type CampaignSquadRow = TableRow<"campaign_squads">;
export type CampaignSquadMemberRow = TableRow<"campaign_squad_members">;
export type FieldAgendaEventVolunteerRow = TableRow<"field_agenda_event_volunteers">;
export type OperationalRetentionPolicyRow = TableRow<"operational_retention_policies">;
export type OperationalIncidentRow = TableRow<"operational_incidents">;
export type OperationalIncidentSeverity = OperationalIncidentRow["severity"];
export type OperationalIncidentStatus = OperationalIncidentRow["status"];

export type InternalUserListItem = {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  status: InternalUserStatus;
  approvedAt: string | null;
  approvedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PersonWithContact = {
  id: string;
  username: string;
  displayName: string | null;
  totalInteractions: number;
  lastInteractionAt: string | null;
  themes: string[];
  status: PersonStatus;
  notes: string;
  doNotContactReason: string | null;
  syncedAt: string | null;
  responsibleId: string | null;
  responsibleName: string | null;
  contact: ContactRecord | null;
};

export type InteractionWithPost = {
  id: string;
  personId: string;
  postId: string | null;
  type: InteractionType;
  occurredAt: string;
  text: string;
  theme: string | null;
  post: {
    id: string;
    caption: string | null;
    shortcode: string | null;
  } | null;
};

export type OutreachTaskWithPerson = {
  id: string;
  personId: string;
  column: KanbanColumnId;
  title: string;
  notes: string;
  dueAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  responsibleId: string | null;
  person: Pick<PersonWithContact, "id" | "username" | "status"> | null;
};

export type PersonReferralType = 
  | "evento_campo"
  | "voluntariado"
  | "grupo_lista"
  | "missao_eluta"
  | "missao_simples"
  | "revisar_depois"
  | "nao_abordar";

export type PersonReferralStatus = 
  | "recomendado"
  | "convidado"
  | "respondeu"
  | "confirmou"
  | "compareceu"
  | "ajudou"
  | "recusou"
  | "interessado"
  | "em_revisao"
  | "concluido"
  | "recebeu_link"
  | "acessou"
  | "fez_primeira_missao"
  | "colaborador"
  | "pode_puxar_missao";

export type PersonReferral = {
  id: string;
  personId: string;
  targetType: PersonReferralType;
  targetId: string | null;
  status: PersonReferralStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
  responsibleId?: string | null;
  externalId?: string | null;
  lastEventAt?: string | null;
  lastEventType?: string | null;
  lastEventSource?: "manual" | "webhook" | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: any;
};

export type MessageTemplate = {
  id: string;
  name: string;
  theme: string;
  body: string;
  category: string | null;
  whenToUse: string | null;
  active: boolean;
  updatedAt: string;
};

export type AuditLogEntry = {
  id: string;
  actorId: string | null;
  actorEmail: string | null;
  action: AuditAction | string;
  entityType: string;
  entityId: string | null;
  summary: string;
  metadata: Database["public"]["Tables"]["audit_logs"]["Row"]["metadata"];
  createdAt: string;
};

export type IgPost = {
  id: string;
  shortcode: string;
  permalink: string | null;
  caption: string;
  publishedAt: string;
  interactions: number;
  comments: number;
  mobilizationScore: number;
  topic: string;
};

export type IgPerson = PersonWithContact;
export type IgInteraction = InteractionWithPost;
export type OutreachTask = OutreachTaskWithPerson;

export type PriorityTemperature = "quente" | "morno" | "frio";

export type PeoplePriorityQuickFilter =
  | "todos"
  | "quentes"
  | "sem_responsavel"
  | "pendente_resposta"
  | "sem_encaminhamento"
  | "nao_abordar";

export type PriorityPerson = PersonWithContact & {
  mainTheme: string | null;
  temperature: PriorityTemperature;
  priorityScore: number;
  priorityReason: string;
  nextAction: string;
  latestInteractionLabel: string;
  latestInteractionType: InteractionType | null;
  outreachStatusLabel: string;
  responsibleId: string | null;
  responsibleName: string | null;
  suggestedMessage: string | null;
  suggestedTemplateName: string | null;
  instagramUrl: string | null;
  hasPendingTask: boolean;
  isPendingResponse: boolean;
  hasReferral: boolean;
  priorityEligible: boolean;
  scoreLabel: string;
  scoreIntensity: number; // 0-100
  scoreTooltip: string;
  riskFlags: {
    noReferralAfterResponse: boolean;
    recentOutreach: boolean;
    doNotContact: boolean;
  };
};

export type PersonResponseKind =
  | "nao_respondeu"
  | "respondeu_bem"
  | "pediu_informacoes"
  | "quer_entrar_grupo"
  | "quer_ir_evento"
  | "quer_conhecer_missao_eluta"
  | "quer_ajudar_online"
  | "quer_ajudar_presencial"
  | "nao_quer_contato"
  | "revisar_depois"
  | "manter_aguardando"
  | "arquivar_sem_retorno"
  | "resposta_tardia";

export type PersonTimelineItem = {
  id: string;
  type: "instagram" | "tarefa" | "registro";
  title: string;
  description: string;
  occurredAt: string;
  badge?: string | null;
};

export type TerritorySummary = {
  neighborhood: string;
  peopleMonitored: number;
  priorityPeople: number;
  topThemes: Array<{ theme: string; count: number }>;
  referrals: number;
  volunteers: number;
  openTasks: number;
  fieldActions: number;
  lastActionAt: string | null;
  priorityScore: number;
};

export type TerritoryDetail = TerritorySummary & {
  recentEvents: Array<{
    id: string;
    title: string;
    startsAt: string | null;
    status: string;
  }>;
  suggestedAction: string | null;
  historicalThemes: Array<{ theme: string; count: number }>;
  aggregatedPeople: Array<{
    label: string;
    value: number;
    description: string;
  }>;
  recentMemory: Array<{
    id: string;
    title: string;
    summary: string;
    source: string;
    occurredAt: string | null;
  }>;
  phaseWhy: string;
  nextActions: string[];
};
