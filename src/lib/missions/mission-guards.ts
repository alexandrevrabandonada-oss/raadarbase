import type { AuditLogEntry, InteractionWithPost, OutreachTask, PersonReferral, PersonWithContact } from "@/lib/types";

function toTimestamp(value?: string | null): number | null {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function daysSince(value: string | null | undefined, now: Date): number | null {
  const timestamp = toTimestamp(value);
  if (timestamp === null) return null;
  return (now.getTime() - timestamp) / (1000 * 60 * 60 * 24);
}

export function hasDoNotContact(person: PersonWithContact): boolean {
  return person.status === "nao_abordar" || Boolean(person.doNotContactReason);
}

export function getActiveTask(tasks: OutreachTask[] = []): OutreachTask | null {
  return tasks.find((task) => !task.completedAt) ?? null;
}

export function getLatestInteraction(interactions: InteractionWithPost[]): InteractionWithPost | null {
  return [...interactions].sort((a, b) => toTimestamp(b.occurredAt)! - toTimestamp(a.occurredAt)!)[0] ?? null;
}

export function hasRecentContactSignal(
  person: PersonWithContact,
  interactions: InteractionWithPost[],
  auditLogs: AuditLogEntry[] = [],
  now: Date,
  windowDays = 3,
): boolean {
  const latestManualDm = interactions
    .filter((interaction) => interaction.type === "dm_manual")
    .map((interaction) => interaction.occurredAt)
    .sort()
    .at(-1);

  const latestConfirmedDm = auditLogs
    .filter((entry) => entry.action === "contact.dm_sent")
    .map((entry) => entry.createdAt)
    .sort()
    .at(-1);

  const lastSignals = [person.contact?.last_contacted_at ?? null, latestManualDm ?? null, latestConfirmedDm ?? null]
    .map((value) => daysSince(value, now))
    .filter((value): value is number => value !== null);

  if (lastSignals.length === 0) return false;
  return Math.min(...lastSignals) < windowDays;
}

export function hasPreparedDmWithoutConfirmation(auditLogs: AuditLogEntry[] = []): boolean {
  const latestPrepared = auditLogs
    .filter((entry) => entry.action === "contact.dm_prepared")
    .map((entry) => toTimestamp(entry.createdAt))
    .filter((value): value is number => value !== null)
    .sort((a, b) => b - a)[0];

  if (!latestPrepared) return false;

  const latestSent = auditLogs
    .filter((entry) => entry.action === "contact.dm_sent")
    .map((entry) => toTimestamp(entry.createdAt))
    .filter((value): value is number => value !== null)
    .sort((a, b) => b - a)[0];

  return !latestSent || latestPrepared > latestSent;
}

const POSITIVE_RESPONSE_PATTERN =
  /\b(quero|topo|interesse|interessad|me chama|me manda|grupo|evento|reuni[aã]o|ajudar|participar)\b/i;

export function hasPositiveResponseWithoutDestination(
  person: PersonWithContact,
  interactions: InteractionWithPost[],
  referrals: PersonReferral[] = [],
): boolean {
  const hasResolvedReferral = referrals.some((referral) =>
    ["convidado", "confirmou", "compareceu", "ajudou", "concluido", "recebeu_link", "acessou", "fez_primeira_missao", "colaborador", "pode_puxar_missao"].includes(referral.status),
  );

  if (hasResolvedReferral) return false;
  if (person.status === "respondeu") return true;

  return interactions.some((interaction) => POSITIVE_RESPONSE_PATTERN.test(interaction.text));
}

export function hasRecentThematicComment(interactions: InteractionWithPost[], now: Date, windowDays = 7): boolean {
  return interactions.some((interaction) => {
    if (interaction.type !== "comentario") return false;
    const age = daysSince(interaction.occurredAt, now);
    if (age === null || age > windowDays) return false;
    return Boolean(interaction.theme) || interaction.text.trim().length >= 12;
  });
}

export function hasRecurringInteractions(person: PersonWithContact, interactions: InteractionWithPost[], now: Date): boolean {
  const recentInteractions = interactions.filter((interaction) => {
    const age = daysSince(interaction.occurredAt, now);
    return age !== null && age <= 14;
  });

  return recentInteractions.length >= 3 || (person.totalInteractions >= 5 && recentInteractions.length >= 2);
}

export function hasLongOpenCycle(
  person: PersonWithContact,
  activeTask: OutreachTask | null,
  referrals: PersonReferral[] = [],
  now: Date,
  staleDays = 7,
): boolean {
  const hasResolvedReferral = referrals.some((referral) =>
    ["confirmou", "compareceu", "ajudou", "concluido", "fez_primeira_missao", "colaborador", "pode_puxar_missao"].includes(referral.status),
  );

  if (hasResolvedReferral) return false;

  const isOpenCycle =
    person.status === "abordado" ||
    person.status === "respondeu" ||
    activeTask?.column === "esperando_resposta" ||
    activeTask?.column === "mensagem_enviada" ||
    activeTask?.column === "precisa_encaminhar";

  if (!isOpenCycle) return false;

  const referenceDates = [
    person.lastInteractionAt,
    person.contact?.last_contacted_at ?? null,
    activeTask?.updatedAt ?? null,
  ]
    .map((value) => daysSince(value, now))
    .filter((value): value is number => value !== null);

  if (referenceDates.length === 0) return false;
  return Math.min(...referenceDates) >= staleDays;
}
