"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireInternalSession } from "@/lib/supabase/auth";
import { requireRole } from "@/lib/authz/roles";
import {
  addVolunteerToSquad,
  archiveVolunteer,
  assignVolunteerToFieldEvent,
  createSquad,
  createVolunteer,
  removeVolunteerFromSquad,
  updateVolunteer,
  updateVolunteerEventStatus,
  type SquadKind,
  type VolunteerContactPreference,
  type VolunteerMutationInput,
  type VolunteerEventStatus,
  type VolunteerStatus,
  type VolunteerSource,
  type VolunteerWeekday,
  type VolunteerPeriod,
  VOLUNTEER_PERIODS,
  VOLUNTEER_WEEKDAYS,
} from "@/lib/data/volunteers";
import {
  approveVolunteerApplication,
  archiveVolunteerApplication,
  rejectVolunteerApplication,
  submitVolunteerApplication,
  updateVolunteerApplicationReviewNotes,
  type VolunteerApplicationInput,
} from "@/lib/data/volunteer-applications";
import {
  bulkRedactVolunteerApplications,
  bulkScheduleVolunteerApplicationRedaction,
  markVolunteerApplicationRetained,
  redactVolunteerApplication,
  scheduleVolunteerApplicationRedaction,
  type VolunteerApplicationRetentionFilters,
} from "@/lib/data/volunteer-application-retention";
import {
  archiveVolunteerReviewRound,
  completeVolunteerReviewRound,
  createVolunteerReviewRound,
} from "@/lib/data/volunteer-review-dashboard";

function parseCsv(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseCheckboxList<T extends string>(formData: FormData, key: string, allowed: readonly T[]) {
  return formData
    .getAll(key)
    .map((value) => String(value))
    .filter((value): value is T => allowed.includes(value as T));
}

function parseVolunteerForm(formData: FormData): VolunteerMutationInput {
  return {
    displayName: String(formData.get("displayName") ?? ""),
    neighborhood: String(formData.get("neighborhood") ?? ""),
    city: String(formData.get("city") ?? ""),
    contactEmail: String(formData.get("contactEmail") ?? ""),
    contactPhone: String(formData.get("contactPhone") ?? ""),
    contactPreference: String(formData.get("contactPreference") ?? "nenhum") as VolunteerContactPreference,
    consentToContact: formData.get("consentToContact") === "on",
    consentToStoreData: formData.get("consentToStoreData") === "on",
    availability: {
      weekdays: parseCheckboxList(formData, "availabilityWeekdays", VOLUNTEER_WEEKDAYS) as VolunteerWeekday[],
      periods: parseCheckboxList(formData, "availabilityPeriods", VOLUNTEER_PERIODS) as VolunteerPeriod[],
      notes: String(formData.get("availabilityNotes") ?? ""),
    },
    skills: formData.getAll("skills").map((value) => String(value)),
    interests: parseCsv(formData.get("interests")),
    status: String(formData.get("status") ?? "novo") as VolunteerStatus,
    source: String(formData.get("source") ?? "formulario") as VolunteerSource,
  };
}

function parseVolunteerApplicationForm(formData: FormData): VolunteerApplicationInput {
  return {
    displayName: String(formData.get("displayName") ?? ""),
    neighborhood: String(formData.get("neighborhood") ?? ""),
    city: String(formData.get("city") ?? ""),
    contactEmail: String(formData.get("contactEmail") ?? ""),
    contactPhone: String(formData.get("contactPhone") ?? ""),
    contactPreference: String(formData.get("contactPreference") ?? "nenhum") as VolunteerContactPreference,
    consentToContact: formData.get("consentToContact") === "on",
    consentToStoreData: formData.get("consentToStoreData") === "on",
    availability: {
      weekdays: parseCheckboxList(formData, "availabilityWeekdays", VOLUNTEER_WEEKDAYS) as VolunteerWeekday[],
      periods: parseCheckboxList(formData, "availabilityPeriods", VOLUNTEER_PERIODS) as VolunteerPeriod[],
      notes: String(formData.get("availabilityNotes") ?? ""),
    },
    skills: formData.getAll("skills").map((value) => String(value)),
    interests: parseCsv(formData.get("interests")),
    honeypot: String(formData.get("website") ?? ""),
  };
}

function encodeError(error: unknown) {
  const message = error instanceof Error ? error.message : "Falha na operação.";
  return encodeURIComponent(message);
}

function currentActor(session: Awaited<ReturnType<typeof requireInternalSession>>) {
  return { id: session.id, email: session.email };
}

function parseRetentionFilters(formData: FormData): VolunteerApplicationRetentionFilters {
  const status = String(formData.get("status") ?? "");
  const retentionStatus = String(formData.get("retentionStatus") ?? "");
  return {
    status: ["pending", "approved", "rejected", "archived"].includes(status) ? status as VolunteerApplicationRetentionFilters["status"] : undefined,
    retentionStatus: ["active", "scheduled_for_redaction", "redacted", "retained"].includes(retentionStatus) ? retentionStatus as VolunteerApplicationRetentionFilters["retentionStatus"] : undefined,
  };
}

export async function createVolunteerAction(formData: FormData) {
  await requireRole(["admin", "operador", "comunicacao"]);
  const session = await requireInternalSession();

  try {
    const volunteer = await createVolunteer(parseVolunteerForm(formData), currentActor(session));
    revalidatePath("/voluntarios");
    redirect(`/voluntarios/${volunteer?.id}`);
  } catch (error) {
    redirect(`/voluntarios/novo?error=${encodeError(error)}`);
  }
}

export async function updateVolunteerAction(id: string, formData: FormData) {
  await requireRole(["admin", "operador", "comunicacao"]);
  const session = await requireInternalSession();

  try {
    await updateVolunteer(id, parseVolunteerForm(formData), currentActor(session));
    revalidatePath("/voluntarios");
    revalidatePath(`/voluntarios/${id}`);
    redirect(`/voluntarios/${id}`);
  } catch (error) {
    redirect(`/voluntarios/${id}/editar?error=${encodeError(error)}`);
  }
}

export async function pauseVolunteerAction(id: string) {
  await requireRole(["admin", "operador", "comunicacao"]);
  const session = await requireInternalSession();
  await updateVolunteer(id, { status: "pausado" }, currentActor(session));
  revalidatePath("/voluntarios");
  revalidatePath(`/voluntarios/${id}`);
  redirect(`/voluntarios/${id}`);
}

export async function archiveVolunteerAction(id: string) {
  await requireRole(["admin", "operador", "comunicacao"]);
  const session = await requireInternalSession();
  await archiveVolunteer(id, currentActor(session));
  revalidatePath("/voluntarios");
  revalidatePath(`/voluntarios/${id}`);
  redirect(`/voluntarios/${id}`);
}

export async function createSquadAction(formData: FormData) {
  await requireRole(["admin", "operador", "comunicacao"]);
  const session = await requireInternalSession();

  await createSquad(
    {
      name: String(formData.get("name") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
      kind: String(formData.get("kind") ?? "outro") as SquadKind,
    },
    currentActor(session),
  );

  revalidatePath("/voluntarios/squads");
  redirect("/voluntarios/squads");
}

export async function addVolunteerToSquadAction(formData: FormData) {
  await requireRole(["admin", "operador", "comunicacao"]);
  const session = await requireInternalSession();
  const squadId = String(formData.get("squadId") ?? "");
  const volunteerId = String(formData.get("volunteerId") ?? "");
  const role = String(formData.get("role") ?? "");
  const returnTo = String(formData.get("returnTo") ?? `/voluntarios/${volunteerId}`);

  await addVolunteerToSquad(squadId, volunteerId, currentActor(session), role);
  revalidatePath("/voluntarios");
  revalidatePath("/voluntarios/squads");
  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function removeVolunteerFromSquadAction(formData: FormData) {
  await requireRole(["admin", "operador", "comunicacao"]);
  const session = await requireInternalSession();
  const squadId = String(formData.get("squadId") ?? "");
  const volunteerId = String(formData.get("volunteerId") ?? "");
  const returnTo = String(formData.get("returnTo") ?? `/voluntarios/${volunteerId}`);

  await removeVolunteerFromSquad(squadId, volunteerId, currentActor(session));
  revalidatePath("/voluntarios");
  revalidatePath("/voluntarios/squads");
  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function assignVolunteerToFieldEventAction(formData: FormData) {
  await requireRole(["admin", "operador", "comunicacao"]);
  const session = await requireInternalSession();
  const eventId = String(formData.get("eventId") ?? "");
  const volunteerId = String(formData.get("volunteerId") ?? "");
  const role = String(formData.get("role") ?? "");
  const returnTo = String(formData.get("returnTo") ?? `/campo/${eventId}`);

  await assignVolunteerToFieldEvent(eventId, volunteerId, role, currentActor(session));
  revalidatePath(`/campo/${eventId}`);
  revalidatePath(`/voluntarios/${volunteerId}`);
  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function updateVolunteerEventStatusAction(formData: FormData) {
  await requireRole(["admin", "operador", "comunicacao"]);
  const session = await requireInternalSession();
  const eventId = String(formData.get("eventId") ?? "");
  const volunteerId = String(formData.get("volunteerId") ?? "");
  const status = String(formData.get("status") ?? "convidado") as VolunteerEventStatus;
  const returnTo = String(formData.get("returnTo") ?? `/campo/${eventId}`);

  await updateVolunteerEventStatus(eventId, volunteerId, status, currentActor(session));
  revalidatePath(`/campo/${eventId}`);
  revalidatePath(`/voluntarios/${volunteerId}`);
  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function submitVolunteerApplicationAction(formData: FormData) {
  try {
    await submitVolunteerApplication(parseVolunteerApplicationForm(formData));
  } catch (error) {
    redirect(`/voluntarios/quero-ajudar?error=${encodeError(error)}`);
  }
  redirect("/voluntarios/quero-ajudar/sucesso");
}

export async function approveVolunteerApplicationAction(id: string, formData: FormData) {
  await requireRole(["admin", "operador", "comunicacao"]);
  const session = await requireInternalSession();
  await approveVolunteerApplication(
    id,
    {
      volunteerStatus: String(formData.get("volunteerStatus") ?? "novo") as VolunteerStatus,
      reviewNotes: String(formData.get("reviewNotes") ?? ""),
    },
    currentActor(session),
  );
  revalidatePath("/voluntarios");
  revalidatePath("/voluntarios/inscricoes");
  revalidatePath(`/voluntarios/inscricoes/${id}`);
  redirect(`/voluntarios/inscricoes/${id}`);
}

export async function rejectVolunteerApplicationAction(id: string, formData: FormData) {
  await requireRole(["admin", "operador", "comunicacao"]);
  const session = await requireInternalSession();
  await rejectVolunteerApplication(id, String(formData.get("reviewNotes") ?? ""), currentActor(session));
  revalidatePath("/voluntarios/inscricoes");
  revalidatePath(`/voluntarios/inscricoes/${id}`);
  redirect(`/voluntarios/inscricoes/${id}`);
}

export async function archiveVolunteerApplicationAction(id: string) {
  await requireRole(["admin", "operador", "comunicacao"]);
  const session = await requireInternalSession();
  await archiveVolunteerApplication(id, currentActor(session));
  revalidatePath("/voluntarios/inscricoes");
  redirect("/voluntarios/inscricoes");
}

export async function updateVolunteerApplicationReviewNotesAction(id: string, formData: FormData) {
  await requireRole(["admin", "operador", "comunicacao"]);
  const session = await requireInternalSession();
  await updateVolunteerApplicationReviewNotes(id, String(formData.get("reviewNotes") ?? ""), currentActor(session));
  revalidatePath(`/voluntarios/inscricoes/${id}`);
  redirect(`/voluntarios/inscricoes/${id}`);
}

export async function scheduleVolunteerApplicationRedactionAction(id: string, formData: FormData) {
  await requireRole(["admin", "operador"]);
  const session = await requireInternalSession();
  await scheduleVolunteerApplicationRedaction(id, String(formData.get("reason") ?? ""), currentActor(session));
  revalidatePath("/voluntarios/inscricoes/retencao");
  revalidatePath(`/voluntarios/inscricoes/${id}`);
  redirect(`/voluntarios/inscricoes/${id}`);
}

export async function redactVolunteerApplicationAction(id: string, formData: FormData) {
  await requireRole(["admin"]);
  const session = await requireInternalSession();
  await redactVolunteerApplication(id, String(formData.get("reason") ?? ""), currentActor(session));
  revalidatePath("/voluntarios/inscricoes");
  revalidatePath("/voluntarios/inscricoes/retencao");
  revalidatePath(`/voluntarios/inscricoes/${id}`);
  redirect(`/voluntarios/inscricoes/${id}`);
}

export async function markVolunteerApplicationRetainedAction(id: string, formData: FormData) {
  await requireRole(["admin", "operador"]);
  const session = await requireInternalSession();
  await markVolunteerApplicationRetained(id, String(formData.get("reason") ?? ""), currentActor(session));
  revalidatePath("/voluntarios/inscricoes/retencao");
  revalidatePath(`/voluntarios/inscricoes/${id}`);
  redirect(`/voluntarios/inscricoes/${id}`);
}

export async function bulkScheduleVolunteerApplicationRedactionAction(formData: FormData) {
  await requireRole(["admin", "operador"]);
  const session = await requireInternalSession();
  await bulkScheduleVolunteerApplicationRedaction(parseRetentionFilters(formData), String(formData.get("reason") ?? ""), currentActor(session));
  revalidatePath("/voluntarios/inscricoes/retencao");
  redirect("/voluntarios/inscricoes/retencao");
}

export async function bulkRedactVolunteerApplicationsAction(formData: FormData) {
  await requireRole(["admin"]);
  const session = await requireInternalSession();
  await bulkRedactVolunteerApplications(parseRetentionFilters(formData), String(formData.get("reason") ?? ""), currentActor(session));
  revalidatePath("/voluntarios/inscricoes");
  revalidatePath("/voluntarios/inscricoes/retencao");
  redirect("/voluntarios/inscricoes/retencao");
}

export async function createVolunteerReviewRoundAction(formData: FormData) {
  await requireRole(["admin", "operador"]);
  const session = await requireInternalSession();
  await createVolunteerReviewRound(
    {
      title: String(formData.get("title") ?? ""),
      notes: String(formData.get("notes") ?? ""),
    },
    currentActor(session),
  );
  revalidatePath("/voluntarios/revisao-periodica");
  redirect("/voluntarios/revisao-periodica");
}

export async function completeVolunteerReviewRoundAction(id: string, formData: FormData) {
  await requireRole(["admin", "operador"]);
  const session = await requireInternalSession();
  await completeVolunteerReviewRound(
    id,
    {
      reviewedPendingCount: Number(formData.get("reviewedPendingCount") ?? 0),
      approvedCount: Number(formData.get("approvedCount") ?? 0),
      rejectedCount: Number(formData.get("rejectedCount") ?? 0),
      archivedCount: Number(formData.get("archivedCount") ?? 0),
      redactedCount: Number(formData.get("redactedCount") ?? 0),
      retainedCount: Number(formData.get("retainedCount") ?? 0),
      notes: String(formData.get("notes") ?? ""),
    },
    currentActor(session),
  );
  revalidatePath("/voluntarios/revisao-periodica");
  redirect("/voluntarios/revisao-periodica");
}

export async function archiveVolunteerReviewRoundAction(id: string) {
  await requireRole(["admin", "operador"]);
  const session = await requireInternalSession();
  await archiveVolunteerReviewRound(id, currentActor(session));
  revalidatePath("/voluntarios/revisao-periodica");
  redirect("/voluntarios/revisao-periodica");
}
