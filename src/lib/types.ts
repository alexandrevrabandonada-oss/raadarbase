import type { Database, TableRow } from "@/lib/supabase/database.types";

export type PersonStatus = Database["public"]["Enums"]["person_status"];
export type InteractionType = Database["public"]["Enums"]["interaction_type"];
export type ConsentStatus = Database["public"]["Enums"]["consent_status"];
export type InternalUserStatus = Database["public"]["Enums"]["internal_user_status"];

export type KanbanColumnId =
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
  | "internal_user.approved"
  | "internal_user.disabled";

export type ContactRecord = TableRow<"contacts">;
export type IgPeopleRow = TableRow<"ig_people">;
export type IgPostRow = TableRow<"ig_posts">;
export type IgInteractionRow = TableRow<"ig_interactions">;
export type OutreachTaskRow = TableRow<"outreach_tasks">;
export type MessageTemplateRow = TableRow<"message_templates">;
export type AuditLogRow = TableRow<"audit_logs">;
export type InternalUserRow = TableRow<"internal_users">;

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
  person: Pick<PersonWithContact, "id" | "username" | "status"> | null;
};

export type MessageTemplate = {
  id: string;
  name: string;
  theme: string;
  body: string;
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
