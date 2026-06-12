import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { shouldUseMockData } from "@/lib/config";
import { interactions as mockInteractions, messageTemplates as mockTemplates, outreachTasks as mockTasks, people as mockPeople } from "@/lib/mock-data";
import type { AuditLogEntry, InteractionType, MessageTemplate, OutreachTaskWithPerson, PersonReferral, PersonStatus, PersonWithContact, PriorityPerson } from "@/lib/types";
import { boardColumnCountsAsReferral, boardColumnIsPendingResponse, getOutreachColumnLabel, normalizeOutreachColumn } from "@/lib/outreach-workflow";
import { attachMissionMetadataToPriorityPeople, sortPriorityPeopleByMission } from "@/lib/missions/priority-person-mission-adapter";
import { listPeople, listPeopleByResponsible, listPeopleByStatuses } from "./people";
import { handleSupabaseReadError } from "./utils";

const DAY_MS = 24 * 60 * 60 * 1000;
const RECENT_DAYS = 21;
const HISTORY_PERSON_LOOKUP_LIMIT = 5000;
const PERSON_HISTORY_BATCH_SIZE = 200;

type InteractionSummary = {
  type: InteractionType;
  occurredAt: string;
  text: string;
  theme: string | null;
};

type InteractionSummaryWithPerson = InteractionSummary & {
  personId: string;
};

function daysBetween(from: string | null, now: Date) {
  if (!from) return Number.POSITIVE_INFINITY;
  return (now.getTime() - new Date(from).getTime()) / DAY_MS;
}

function countRecentInteractions(interactions: InteractionSummary[], now: Date, days: number, type?: InteractionType) {
  return interactions.filter((interaction) => {
    if (type && interaction.type !== type) return false;
    return daysBetween(interaction.occurredAt, now) <= days;
  }).length;
}

function latestInteraction(interactions: InteractionSummary[]) {
  return interactions[0] ?? null;
}

function pickMainTheme(person: PersonWithContact, interactions: InteractionSummary[]) {
  const recentThemed = interactions.find((interaction) => interaction.theme)?.theme;
  if (recentThemed) return recentThemed;
  return person.themes[0] ?? null;
}

function hasNarrative(text: string) {
  const trimmed = text.trim();
  return trimmed.length >= 24 && /\s/.test(trimmed);
}

function computePriorityScore(person: PersonWithContact, interactions: InteractionSummary[], task: OutreachTaskWithPerson | null, hasReferral: boolean, now: Date) {
  if (person.status === "nao_abordar" || person.doNotContactReason) return -100;

  const latest = latestInteraction(interactions);
  const comments7d = countRecentInteractions(interactions, now, 7, "comentario");
  const storyReplies7d = countRecentInteractions(interactions, now, 7, "resposta_story");
  const mentions14d = countRecentInteractions(interactions, now, 14, "mencao");
  const likes14d = countRecentInteractions(interactions, now, 14, "curtida");
  const comments14d = countRecentInteractions(interactions, now, 14, "comentario");
  const recent14d = interactions.filter((interaction) => daysBetween(interaction.occurredAt, now) <= 14).length;
  const recent3d = latest ? daysBetween(latest.occurredAt, now) <= 3 : false;
  const recent7d = latest ? daysBetween(latest.occurredAt, now) <= 7 : false;
  const hasNarrativeComment = interactions.some(
    (interaction) =>
      (interaction.type === "comentario" || interaction.type === "resposta_story") &&
      daysBetween(interaction.occurredAt, now) <= 14 &&
      hasNarrative(interaction.text),
  );

  let score = 0;

  if (storyReplies7d > 0) score += 6 + Math.min(storyReplies7d - 1, 2);
  if (comments7d > 0) score += Math.min(comments7d * 2, 8);
  if (hasNarrativeComment) score += 4;
  if (mentions14d > 0) score += Math.min(mentions14d * 2, 4);
  if (comments14d >= 3) score += 2;
  if (likes14d >= 2) score += 1;
  if (likes14d >= 5) score += 1;
  if (recent3d) score += 3;
  else if (recent7d) score += 1;
  if (recent14d >= 4) score += 2;
  if (task && !task.completedAt) score += 3;
  if (task?.dueAt && daysBetween(task.dueAt, now) >= 0) score += 1;
  if (person.status === "respondeu") score += 3;
  if (person.contact?.consent_status === "confirmed" || person.status === "contato_confirmado") score += 2;
  if (!hasReferral) score += 2;
  if (person.status === "abordado") score -= 2;
  if (latest?.type === "curtida" && comments7d === 0 && storyReplies7d === 0 && mentions14d === 0) score -= 1;

  return score;
}

function toTemperature(score: number): PriorityPerson["temperature"] {
  if (score >= 12) return "quente";
  if (score >= 6) return "morno";
  return "frio";
}

function renderSuggestedMessage(template: MessageTemplate, person: PersonWithContact, mainTheme: string | null) {
  return template.body
    .replaceAll("{username}", person.username.replace(/^@+/, ""))
    .replaceAll("{tema}", mainTheme ?? "a pauta que você trouxe")
    .replaceAll("{link_grupo}", "[link do grupo]")
    .replaceAll("{link_formulario}", "[link do formulário]")
    .replaceAll("@@", "@");
}

function getSuggestedTemplate(task: OutreachTaskWithPerson | null, person: PersonWithContact, mainTheme: string | null, templates: MessageTemplate[]) {
  const activeTemplates = templates.filter((template) => template.active);

  // 0. Prioridade Máxima: Modelo de Campanha Ativo
  const campaignDefault = activeTemplates.find((t) => t.isCampaignDefault);
  if (campaignDefault) return campaignDefault;

  const taskColumn = normalizeOutreachColumn(task?.column);

  // 1. Prioridade por Categoria (Casos específicos de interação)
  if (person.status === "responder" || taskColumn === "para_abordar") {
    const storyMatch = activeTemplates.find(t => t.category === "Respondeu story");
    if (storyMatch && person.themes.includes("story")) return storyMatch;

    const denunciaMatch = activeTemplates.find(t => t.category === "Comentou uma denúncia");
    if (denunciaMatch && (person.themes.includes("denúncia") || person.themes.includes("problema"))) return denunciaMatch;

    const relatoMatch = activeTemplates.find(t => t.category === "Tem relato");
    if (relatoMatch && person.notes.length > 50) return relatoMatch;
  }

  if (person.status === "respondeu" || taskColumn === "precisa_encaminhar") {
    const ajudaMatch = activeTemplates.find(t => t.category === "Perguntou como ajudar");
    if (ajudaMatch) return ajudaMatch;
  }

  // 2. Fallback por Tema (Lógica legada)
  const desiredThemes = [
    mainTheme,
    taskColumn === "precisa_encaminhar" || taskColumn === "convidado" || person.status === "respondeu" || person.status === "contato_confirmado" ? "grupo" : null,
    taskColumn === "para_abordar" || person.status === "responder" ? "escuta" : null,
    "escuta",
    "formulário",
  ].filter((value): value is string => Boolean(value));

  for (const desiredTheme of desiredThemes) {
    const match = activeTemplates.find((template) => template.theme.toLowerCase() === desiredTheme.toLowerCase());
    if (match) return match;
  }

  return null;
}

function getOutreachStatusLabel(person: PersonWithContact, task: OutreachTaskWithPerson | null) {
  if (task) {
    return getOutreachColumnLabel(task.column);
  }

  switch (person.status) {
    case "responder":
      return "Responder";
    case "abordado":
      return "Abordado";
    case "respondeu":
      return "Respondeu";
    case "contato_confirmado":
      return "Contato confirmado";
    case "nao_abordar":
      return "Não abordar";
    default:
      return "Novo";
  }
}

function getNextAction(person: PersonWithContact, task: OutreachTaskWithPerson | null, latest: InteractionSummary | null, hasReferral: boolean) {
  const taskColumn = normalizeOutreachColumn(task?.column);
  if (person.status === "nao_abordar" || taskColumn === "nao_abordar") {
    return "Não abordar: Respeitar o pedido da pessoa.";
  }
  if (taskColumn === "esperando_resposta" || person.status === "abordado") {
    return "Acompanhar: Ver se houve resposta e decidir o próximo passo.";
  }
  if (taskColumn === "mensagem_enviada") {
    return "Conversar: Continuar o papo iniciado pelo Instagram.";
  }
  if (taskColumn === "para_abordar" || person.status === "responder") {
    return "Responder: Mandar a primeira mensagem de boas-vindas.";
  }
  if ((taskColumn === "precisa_encaminhar" || taskColumn === "convidado" || person.status === "respondeu") && !hasReferral) {
    return "Encaminhar: Convidar para grupo, evento ou ação específica.";
  }
  if (taskColumn === "entrou_na_base" || person.status === "contato_confirmado") {
    return "Integrar: Confirmar participação em atividades coletivas.";
  }
  if (taskColumn === "primeira_acao_feita") {
    return "Engajar: Definir como essa pessoa pode ajudar mais.";
  }
  if (taskColumn === "nao_insistir") {
    return "Pausar: Aguardar um melhor momento para retomar.";
  }
  if (latest?.type === "resposta_story") {
    return "Responder o story manualmente e entender melhor a demanda.";
  }
  return "Revisar a interação recente e registrar uma tarefa de abordagem.";
}

function getPriorityReason(person: PersonWithContact, interactions: InteractionSummary[], task: OutreachTaskWithPerson | null, mainTheme: string | null, hasReferral: boolean, now: Date) {
  const comments7d = countRecentInteractions(interactions, now, 7, "comentario");
  const storyReplies7d = countRecentInteractions(interactions, now, 7, "resposta_story");
  const latest = latestInteraction(interactions);
  const latestTheme = latest?.theme ?? mainTheme;

  if (comments7d >= 2) {
    return `Interação frequente: Comentou ${comments7d} vezes esta semana.`;
  }
  if (storyReplies7d > 0 && !hasReferral) {
    return "Engajamento via Story: Respondeu e aguarda encaminhamento.";
  }
  if (latestTheme && latest && hasNarrative(latest.text) && (latest.type === "comentario" || latest.type === "resposta_story")) {
    return `Relato sobre ${latestTheme}: Trouxe informação detalhada.`;
  }
  if ((person.status === "respondeu" || task?.column === "aguardando_resposta") && !hasReferral) {
    return "Pendente de Encaminhamento: Demonstrou interesse claro.";
  }
  if (latest && person.status !== "abordado" && person.status !== "contato_confirmado") {
    return "Abordagem pendente: Interação recente sem resposta da equipe.";
  }
  if (task && !task.completedAt) {
    return "Tarefa em aberto: Existe um compromisso de contato.";
  }
  return "Manutenção de Vínculo: Vale retomar a conversa.";
}

export function buildPriorityReasons(
  person: PersonWithContact,
  interactions: Array<InteractionSummary | InteractionSummaryWithPerson>,
  task: OutreachTaskWithPerson | null,
  now = new Date(),
) {
  const reasons: string[] = [];
  const comments7d = countRecentInteractions(interactions, now, 7, "comentario");
  const storyReplies7d = countRecentInteractions(interactions, now, 7, "resposta_story");
  const latest = latestInteraction(interactions);
  const mainTheme = pickMainTheme(person, interactions);
  const hasReferral = boardColumnCountsAsReferral(task?.column) || person.status === "contato_confirmado";

  if (comments7d > 0) reasons.push(`Interações recentes: ${comments7d} comentário${comments7d > 1 ? "s" : ""} nos últimos 7 dias.`);
  if (storyReplies7d > 0) reasons.push("Houve resposta de story que ainda pede conversa manual.");
  if (mainTheme) reasons.push(`Pauta principal observada: ${mainTheme}.`);
  if (person.status === "respondeu") reasons.push("Já houve resposta anterior registrada.");
  if (task && !task.completedAt) reasons.push(`Existe tarefa pendente: ${task.title}.`);
  if (!hasReferral) reasons.push("Ainda não há encaminhamento registrado.");
  if (latest && hasNarrative(latest.text) && (latest.type === "comentario" || latest.type === "resposta_story")) {
    reasons.push("Trouxe relato textual útil para aprofundar a conversa.");
  }

  return reasons;
}

function getLatestInteractionLabel(interaction: InteractionSummary | null) {
  if (!interaction) return "Sem interação recente";
  const typeLabel: Record<InteractionType, string> = {
    comentario: "Comentário",
    curtida: "Curtida",
    resposta_story: "Story",
    dm_manual: "DM manual",
    mencao: "Menção",
  };
  const formattedDate = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(interaction.occurredAt));
  return `${typeLabel[interaction.type]} em ${formattedDate}`;
}

function computeAnnouncementStatus(
  person: PersonWithContact,
  interactions: InteractionSummary[],
  auditLogs: AuditLogEntry[],
): PriorityPerson["announcementStatus"] {
  if (person.status === "respondeu" || person.status === "contato_confirmado") {
    return "respondeu";
  }

  const sentLogs = auditLogs.filter((log) => log.action === "contact.dm_sent");
  const preparedLogs = auditLogs.filter((log) => log.action === "contact.dm_prepared");
  const manualDmInteractions = interactions.filter((interaction) => interaction.type === "dm_manual");
  const responseRecordedLogs = auditLogs
    .filter((log) => log.action === "contact.response_recorded")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (responseRecordedLogs.length > 0) {
    const latestLog = responseRecordedLogs[0];
    const metadata = latestLog.metadata;
    if (metadata && typeof metadata === "object") {
      const meta = metadata as Record<string, unknown>;
      if (meta.responseType === "revisar_depois" || meta.responseType === "manter_aguardando") {
        return "revisar_depois";
      }
    }
  }

  const hasLegacySentSignal =
    Boolean(person.contact?.last_contacted_at) || manualDmInteractions.length > 0;

  if (person.status === "abordado" || sentLogs.length > 0 || hasLegacySentSignal) {
    const latestSentTime = sentLogs.reduce((latest, log) => {
      const timestamp = new Date(log.createdAt).getTime();
      return Number.isFinite(timestamp) ? Math.max(latest, timestamp) : latest;
    }, 0);
    const latestManualDmTime = manualDmInteractions.reduce((latest, interaction) => {
      const timestamp = new Date(interaction.occurredAt).getTime();
      return Number.isFinite(timestamp) ? Math.max(latest, timestamp) : latest;
    }, 0);
    const latestContactedAtTime = person.contact?.last_contacted_at
      ? new Date(person.contact.last_contacted_at).getTime()
      : 0;
    const latestSentSignalTime = Math.max(latestSentTime, latestManualDmTime, latestContactedAtTime);

    const hasPreparedAfterSent =
      latestSentSignalTime > 0 &&
      preparedLogs.some((log) => new Date(log.createdAt).getTime() > latestSentSignalTime);

    if (!hasPreparedAfterSent) {
      return "enviado";
    }
  }

  if (preparedLogs.length > 0) {
    return "preparado";
  }

  return "nao_iniciado";
}

function buildPriorityPerson(
  person: PersonWithContact,
  interactions: InteractionSummary[],
  task: OutreachTaskWithPerson | null,
  auditLogs: AuditLogEntry[],
  templates: MessageTemplate[],
  now: Date,
): PriorityPerson {
  const mainTheme = pickMainTheme(person, interactions);
  const latest = latestInteraction(interactions);
  const comments7d = countRecentInteractions(interactions, now, 7, "comentario");
  const storyReplies7d = countRecentInteractions(interactions, now, 7, "resposta_story");
  const hasNarrativeComment = interactions.some(
    (interaction) =>
      (interaction.type === "comentario" || interaction.type === "resposta_story") &&
      daysBetween(interaction.occurredAt, now) <= 14 &&
      hasNarrative(interaction.text),
  );
  const hasPendingTask = Boolean(task && !task.completedAt);
  const isPendingResponse = boardColumnIsPendingResponse(task?.column) || person.status === "abordado";
  const hasReferral = person.status === "contato_confirmado" || person.themes.some(t => t.startsWith("quer_"));
  const priorityScore = computePriorityScore(person, interactions, task, hasReferral, now);
  
  const scoreLabel = priorityScore >= 14 ? "Muito quente" : 
                    priorityScore >= 9 ? "Quente" : 
                    priorityScore >= 4 ? "Morno" : "Observar";
  
  const scoreIntensity = Math.min(100, Math.max(0, (priorityScore / 18) * 100));

  const riskFlags = {
    noReferralAfterResponse: (person.status === "respondeu" || task?.column === "precisa_encaminhar") && !hasReferral,
    recentOutreach: latest?.type === "dm_manual" && daysBetween(latest.occurredAt, now) < 1,
    doNotContact: person.status === "nao_abordar" || Boolean(person.doNotContactReason),
  };

  const scoreTooltip = [
    `Score: ${priorityScore}`,
    latest ? `Última interação: ${latest.type}` : null,
    storyReplies7d > 0 ? `Story recente (+${6 + Math.min(storyReplies7d - 1, 2)})` : null,
    comments7d > 0 ? `Comentários recentes (+${Math.min(comments7d * 2, 8)})` : null,
    hasNarrativeComment ? "Comentário com contexto (+4)" : null,
    hasPendingTask ? "Possui tarefa aberta (+3)" : null,
    !hasReferral ? "Sem encaminhamento (+2)" : null,
    riskFlags.recentOutreach ? "Penalização: contato recente" : null
  ].filter(Boolean).join(" · ");

  const suggestedTemplate = getSuggestedTemplate(task, person, mainTheme, templates);
  const priorityEligible = person.status !== "nao_abordar" && !person.doNotContactReason;
  const announcementStatus = computeAnnouncementStatus(person, interactions, auditLogs);

  return {
    ...person,
    mainTheme,
    temperature: toTemperature(priorityScore),
    priorityScore,
    priorityReason: getPriorityReason(person, interactions, task, mainTheme, hasReferral, now),
    nextAction: getNextAction(person, task, latest, hasReferral),
    latestInteractionLabel: getLatestInteractionLabel(latest),
    latestInteractionType: latest?.type ?? null,
    outreachStatusLabel: getOutreachStatusLabel(person, task),
    responsibleId: task?.responsibleId ?? person.responsibleId,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    responsibleName: (task as any)?.internal_users?.full_name ?? person.responsibleName,
    suggestedMessage: suggestedTemplate ? renderSuggestedMessage(suggestedTemplate, person, mainTheme) : null,
    suggestedTemplateName: suggestedTemplate?.name ?? null,
    suggestedTemplateId: suggestedTemplate?.id ?? null,
    instagramUrl: person.username ? `https://www.instagram.com/${person.username.replace(/^@+/, "")}/` : null,
    hasPendingTask,
    isPendingResponse,
    hasReferral,
    priorityEligible,
    announcementStatus,
    scoreLabel,
    scoreIntensity,
    scoreTooltip,
    riskFlags,
  };
}

export function buildPriorityPersonProfile(
  person: PersonWithContact,
  interactions: InteractionSummary[],
  task: OutreachTaskWithPerson | null,
  auditLogs: AuditLogEntry[],
  templates: MessageTemplate[],
  now = new Date(),
) {
  return buildPriorityPerson(person, interactions, task, auditLogs, templates, now);
}

export function buildPriorityPeople(
  people: PersonWithContact[],
  interactions: InteractionSummaryWithPerson[],
  tasks: OutreachTaskWithPerson[],
  auditLogs: AuditLogEntry[],
  templates: MessageTemplate[],
  now = new Date(),
) {
  const recentCutoff = new Date(now.getTime() - RECENT_DAYS * DAY_MS);
  const recentInteractions = interactions.filter((interaction) => new Date(interaction.occurredAt) >= recentCutoff);
  const interactionsByPerson = new Map<string, InteractionSummary[]>();

  for (const interaction of recentInteractions) {
    const current = interactionsByPerson.get(interaction.personId) ?? [];
    current.push(interaction);
    interactionsByPerson.set(interaction.personId, current);
  }

  const tasksByPerson = new Map<string, OutreachTaskWithPerson>();
  for (const task of tasks) {
    if (task.completedAt) continue;
    const current = tasksByPerson.get(task.personId);
    if (!current) {
      tasksByPerson.set(task.personId, task);
      continue;
    }
    const currentDue = current.dueAt ? new Date(current.dueAt).getTime() : Number.POSITIVE_INFINITY;
    const nextDue = task.dueAt ? new Date(task.dueAt).getTime() : Number.POSITIVE_INFINITY;
    if (nextDue < currentDue) tasksByPerson.set(task.personId, task);
  }

  const auditLogsByPerson = new Map<string, AuditLogEntry[]>();
  for (const auditLog of auditLogs) {
    if (!auditLog.entityId) continue;
    const current = auditLogsByPerson.get(auditLog.entityId) ?? [];
    current.push(auditLog);
    auditLogsByPerson.set(auditLog.entityId, current);
  }

  return people
    .map((person) =>
      buildPriorityPerson(
        person,
        interactionsByPerson.get(person.id) ?? [],
        tasksByPerson.get(person.id) ?? null,
        auditLogsByPerson.get(person.id) ?? [],
        templates,
        now,
      ),
    )
    .sort((a, b) => {
      if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore;
      return new Date(b.lastInteractionAt ?? 0).getTime() - new Date(a.lastInteractionAt ?? 0).getTime();
    });
}

function chunkPersonIds(personIds: string[]) {
  const chunks: string[][] = [];
  for (let index = 0; index < personIds.length; index += PERSON_HISTORY_BATCH_SIZE) {
    chunks.push(personIds.slice(index, index + PERSON_HISTORY_BATCH_SIZE));
  }
  return chunks;
}

export async function listPriorityPeople(options?: { statuses?: PersonStatus[]; limit?: number; responsibleId?: string }): Promise<PriorityPerson[]> {
  const now = new Date();

  if (shouldUseMockData()) {
    const mockAuditLogs: AuditLogEntry[] = [
      {
        id: "audit-1",
        actorId: "mock-operator",
        actorEmail: "operador@radar.camp",
        action: "contact.dm_prepared",
        entityType: "ig_people",
        entityId: "p-marco", // Marco Alves (status "novo") -> should become "preparado"
        summary: "Mensagem preparada para envio",
        metadata: {},
        createdAt: new Date(now.getTime() - 3600000).toISOString(),
      },
      {
        id: "audit-2",
        actorId: "mock-operator",
        actorEmail: "operador@radar.camp",
        action: "contact.response_recorded",
        entityType: "ig_people",
        entityId: "p-ana", // Ana Souza (status "responder") -> should become "revisar_depois"
        summary: "Resposta registrada como revisar depois",
        metadata: { responseType: "revisar_depois" },
        createdAt: new Date(now.getTime() - 7200000).toISOString(),
      },
    ];

    const mockPeopleSource = options?.responsibleId
      ? mockPeople.filter((person) => person.responsibleId === options.responsibleId)
      : mockPeople;
    const priorityPeople = buildPriorityPeople(mockPeopleSource, mockInteractionsSummary(), mockTasks, mockAuditLogs, mockTemplates, now);
    return sortPriorityPeopleByMission(attachMissionMetadataToPriorityPeople({
      priorityPeople,
      interactions: mockInteractionsSummary(),
      tasks: mockTasks,
      auditLogs: mockAuditLogs,
      now,
    }));
  }

  try {
    const supabase = getSupabaseAdminClient();
    const cutoff = new Date(now.getTime() - RECENT_DAYS * DAY_MS).toISOString();
    const [people, tasksResult, templatesResult, interactionsResult] = await Promise.all([
      options?.responsibleId
        ? listPeopleByResponsible(options.responsibleId, options.limit)
        : options?.statuses
          ? listPeopleByStatuses(options.statuses, options.limit)
          : listPeople(undefined, options?.limit),
      supabase.from("outreach_tasks").select("*, internal_users(full_name)").is("completed_at", null).order("created_at", { ascending: false }),
      supabase.from("message_templates").select("*").eq("active", true).order("updated_at", { ascending: false }),
      supabase
        .from("ig_interactions")
        .select("person_id, type, occurred_at, text_content, theme")
        .gte("occurred_at", cutoff)
        .order("occurred_at", { ascending: false }),
    ]);

    if (tasksResult.error) throw tasksResult.error;
    if (templatesResult.error) throw templatesResult.error;
    if (interactionsResult.error) throw interactionsResult.error;

    const tasks: OutreachTaskWithPerson[] = (tasksResult.data ?? []).map((task) => ({
      id: task.id,
      personId: task.person_id,
      column: task.column_key as OutreachTaskWithPerson["column"],
      title: task.title,
      notes: task.notes,
      dueAt: task.due_at,
      completedAt: task.completed_at,
      createdAt: task.created_at,
      updatedAt: task.updated_at,
      responsibleId: task.responsible_id ?? null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      internal_users: (task as any).internal_users,
      person: null,
    }));

    const templates: MessageTemplate[] = (templatesResult.data ?? []).map((template) => ({
      id: template.id,
      name: template.name,
      theme: template.theme ?? "",
      body: template.body,
      category: template.category ?? null,
      whenToUse: template.when_to_use ?? null,
      active: template.active,
      updatedAt: template.updated_at,
      isCampaignDefault: template.is_campaign_default ?? false,
    }));

    const interactions: InteractionSummaryWithPerson[] = (interactionsResult.data ?? []).map((interaction) => ({
      type: interaction.type,
      occurredAt: interaction.occurred_at,
      text: interaction.text_content ?? "",
      theme: interaction.theme,
      personId: interaction.person_id,
    }));

    const personIds = people.slice(0, HISTORY_PERSON_LOOKUP_LIMIT).map((person) => person.id);
    let referrals: PersonReferral[] = [];
    let auditLogs: AuditLogEntry[] = [];

    if (personIds.length > 0) {
      const referralRows = [];
      const auditRows = [];

      for (const batch of chunkPersonIds(personIds)) {
        const [referralsResult, auditLogsResult] = await Promise.all([
          supabase
            .from("ig_person_referrals")
            .select("*")
            .in("person_id", batch)
            .order("updated_at", { ascending: false }),
          supabase
            .from("audit_logs")
            .select("*")
            .eq("entity_type", "ig_people")
            .in("entity_id", batch)
            .in("action", ["contact.dm_prepared", "contact.dm_sent", "contact.do_not_contact", "contact.response_recorded"])
            .order("created_at", { ascending: false }),
        ]);

        if (referralsResult.error) throw referralsResult.error;
        if (auditLogsResult.error) throw auditLogsResult.error;
        referralRows.push(...(referralsResult.data ?? []));
        auditRows.push(...(auditLogsResult.data ?? []));
      }

      referrals = referralRows.map((referral) => ({
        id: referral.id,
        personId: referral.person_id,
        targetType: referral.target_type,
        targetId: referral.target_id,
        status: referral.status,
        notes: referral.notes,
        createdAt: referral.created_at,
        updatedAt: referral.updated_at,
        responsibleId: referral.responsible_id ?? null,
        externalId: referral.external_id ?? null,
        lastEventAt: referral.last_event_at ?? null,
        lastEventType: referral.last_event_type ?? null,
        lastEventSource:
          referral.last_event_source === "manual" || referral.last_event_source === "webhook"
            ? referral.last_event_source
            : null,
        metadata: referral.metadata,
      }));

      auditLogs = auditRows.map((entry) => ({
        id: entry.id,
        actorId: entry.actor_id,
        actorEmail: entry.actor_email,
        action: entry.action,
        entityType: entry.entity_type,
        entityId: entry.entity_id,
        summary: entry.summary,
        metadata: entry.metadata,
        createdAt: entry.created_at,
      }));
    }

    const priorityPeople = buildPriorityPeople(people, interactions, tasks, auditLogs, templates, now);

    return sortPriorityPeopleByMission(attachMissionMetadataToPriorityPeople({
      priorityPeople,
      interactions,
      tasks,
      referrals,
      auditLogs,
      now,
    }));
  } catch (error) {
    handleSupabaseReadError("listPriorityPeople", error);
  }
}

function mockInteractionsSummary(): InteractionSummaryWithPerson[] {
  return mockInteractions.map((interaction) => ({
    personId: interaction.personId,
    type: interaction.type,
    occurredAt: interaction.occurredAt,
    text: interaction.text,
    theme: interaction.theme,
  }));
}
