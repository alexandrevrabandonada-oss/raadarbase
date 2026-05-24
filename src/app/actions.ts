"use server";

import * as contacts from "./actions/contacts";
import * as templates from "./actions/templates";
import * as feedback from "./actions/feedback";
import * as volunteers from "./actions/volunteers";
import * as telemetry from "./actions/telemetry";

import type { ActionResult } from "./actions/utils";
import type {
  PersonStatus,
  PersonResponseKind,
  PersonReferralType,
  PersonReferralStatus,
  KanbanColumnId,
  MessageTemplate,
} from "@/lib/types";
import type { BoardColumnId } from "@/lib/outreach-workflow";
import type { PilotFeedbackLoopStatus } from "@/lib/data/pilot-feedback-loop";
import type { PersonImportPreview } from "@/lib/data/import";
import type { Json } from "@/lib/supabase/database.types";



// --- CONTACTS ---
export async function updateContactStatus(personId: string, status: PersonStatus): Promise<ActionResult> {
  return contacts.updateContactStatus(personId, status);
}

export async function registerManualDm(personId: string): Promise<ActionResult> {
  return contacts.registerManualDm(personId);
}

export async function recordDMPreparedAction(personId: string, origin: string, templateId?: string | null): Promise<ActionResult> {
  return contacts.recordDMPreparedAction(personId, origin, templateId);
}

export async function confirmDMSentAction(personId: string, origin: string, templateId?: string | null): Promise<ActionResult> {
  return contacts.confirmDMSentAction(personId, origin, templateId);
}

export async function markResponded(personId: string): Promise<ActionResult> {
  return contacts.markResponded(personId);
}

export async function markContactConfirmed(personId: string, channel?: string): Promise<ActionResult> {
  return contacts.markContactConfirmed(personId, channel);
}

export async function markDoNotContact(personId: string, reason?: string): Promise<ActionResult> {
  return contacts.markDoNotContact(personId, reason);
}

export async function updatePersonNotes(personId: string, notes: string): Promise<ActionResult> {
  return contacts.updatePersonNotes(personId, notes);
}

export async function updatePersonTags(personId: string, tags: string[]): Promise<ActionResult> {
  return contacts.updatePersonTags(personId, tags);
}

export async function createOutreachTask(
  personId: string,
  input?: { column?: KanbanColumnId; title?: string; notes?: string },
): Promise<ActionResult> {
  return contacts.createOutreachTask(personId, input);
}

export async function recordPersonResponse(personId: string, responseType: PersonResponseKind): Promise<ActionResult> {
  return contacts.recordPersonResponse(personId, responseType);
}

export async function recordPersonReferral(
  personId: string,
  target: PersonReferralType,
  details?: {
    targetId?: string;
    notes?: string;
    status?: PersonReferralStatus;
    createConfirmationTask?: boolean;
  },
): Promise<ActionResult> {
  return contacts.recordPersonReferral(personId, target, details);
}

export async function updatePersonReferralStatus(
  referralId: string,
  personId: string,
  status: PersonReferralStatus,
  notes?: string,
): Promise<ActionResult> {
  return contacts.updatePersonReferralStatus(referralId, personId, status, notes);
}

export async function updateOutreachTaskStatus(taskId: string, nextColumn: BoardColumnId): Promise<ActionResult> {
  return contacts.updateOutreachTaskStatus(taskId, nextColumn);
}

export async function getPersonInteractionsAction(personId: string) {
  return contacts.getPersonInteractionsAction(personId);
}

export async function anonymizeContact(personId: string): Promise<ActionResult> {
  return contacts.anonymizeContact(personId);
}

export async function resolveDuplicateAction(
  mainId: string,
  duplicateId: string,
  action: "archive" | "keep_separate",
): Promise<ActionResult> {
  return contacts.resolveDuplicateAction(mainId, duplicateId, action);
}

export async function updatePersonUsernameAction(personId: string, newUsername: string): Promise<ActionResult> {
  return contacts.updatePersonUsernameAction(personId, newUsername);
}

export async function updatePersonThemeAction(personId: string, themes: string[]): Promise<ActionResult> {
  return contacts.updatePersonThemeAction(personId, themes);
}

export async function acquireLockAction(
  personId: string
) {
  return contacts.acquireLockAction(personId);
}

export async function releaseLockAction(
  personId: string
) {
  return contacts.releaseLockAction(personId);
}

export async function checkLockAction(
  personId: string
) {
  return contacts.checkLockAction(personId);
}

// --- TEMPLATES ---
export async function upsertMessageTemplate(
  templateId: string | null,
  payload: Pick<MessageTemplate, "name" | "theme" | "body" | "category" | "whenToUse">,
): Promise<ActionResult> {
  return templates.upsertMessageTemplate(templateId, payload);
}

export async function removeMessageTemplate(templateId: string): Promise<ActionResult> {
  return templates.removeMessageTemplate(templateId);
}

export async function setCampaignDefaultTemplate(templateId: string): Promise<ActionResult> {
  return templates.setCampaignDefaultTemplate(templateId);
}

// --- FEEDBACK ---
export async function submitPilotFeedback(payload: {
  type: string;
  route: string;
  description: string;
  urgency: "low" | "medium" | "high";
}): Promise<ActionResult> {
  return feedback.submitPilotFeedback(payload);
}

export async function updatePilotFeedbackStatus(
  feedbackId: string,
  status: PilotFeedbackLoopStatus,
): Promise<ActionResult> {
  return feedback.updatePilotFeedbackStatus(feedbackId, status);
}

export async function convertPilotFeedbackToTechnicalTask(feedbackId: string): Promise<ActionResult> {
  return feedback.convertPilotFeedbackToTechnicalTask(feedbackId);
}

export async function exportPilotFeedbackToRetrospective(feedbackId: string): Promise<ActionResult> {
  return feedback.exportPilotFeedbackToRetrospective(feedbackId);
}

// --- VOLUNTEERS ---
export async function assignPersonResponsible(personId: string, internalUserId: string | null): Promise<ActionResult> {
  return volunteers.assignPersonResponsible(personId, internalUserId);
}

export async function assumePersonResponsible(personId: string): Promise<ActionResult> {
  return volunteers.assumePersonResponsible(personId);
}

export async function assignTaskResponsible(taskId: string, internalUserId: string | null): Promise<ActionResult> {
  return volunteers.assignTaskResponsible(taskId, internalUserId);
}

export async function assumeTaskResponsible(taskId: string): Promise<ActionResult> {
  return volunteers.assumeTaskResponsible(taskId);
}

export async function executePersonImportBatch(previews: PersonImportPreview[]): Promise<ActionResult> {
  return volunteers.executePersonImportBatch(previews);
}

export async function convertToVolunteerAction(
  personId: string,
  options?: {
    consentPurpose?: string;
    source?: "formulario" | "evento_campo" | "indicacao" | "outro";
  },
): Promise<ActionResult> {
  return volunteers.convertToVolunteerAction(personId, options);
}

export async function assignPeopleBatchAction(personIds: string[], responsibleId: string): Promise<ActionResult> {
  return volunteers.assignPeopleBatchAction(personIds, responsibleId);
}

// --- TELEMETRY ---
export async function listFieldAgendaEventsAction() {
  return telemetry.listFieldAgendaEventsAction();
}

export async function trackOperationalEvent(
  event: string,
  personId?: string,
  metadata?: Json,
): Promise<ActionResult> {
  return telemetry.trackOperationalEvent(event, personId, metadata);
}

import * as escutaBairro from "./escuta/bairro/actions";

export async function submitNeighborhoodListenObjectAction(payload: any): Promise<ActionResult> {
  return escutaBairro.submitNeighborhoodListenObjectAction(payload);
}

