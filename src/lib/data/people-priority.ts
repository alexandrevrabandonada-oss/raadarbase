import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { shouldUseMockData } from "@/lib/config";
import { interactions as mockInteractions, messageTemplates as mockTemplates, outreachTasks as mockTasks, people as mockPeople } from "@/lib/mock-data";
import type { InteractionType, MessageTemplate, OutreachTaskWithPerson, PersonWithContact, PriorityPerson } from "@/lib/types";
import { boardColumnCountsAsReferral, boardColumnIsPendingResponse, getOutreachColumnLabel, normalizeOutreachColumn } from "@/lib/outreach-workflow";
import { listPeople } from "./people";
import { handleSupabaseReadError } from "./utils";

const DAY_MS = 24 * 60 * 60 * 1000;
const RECENT_DAYS = 21;

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
  const recent14d = interactions.filter((interaction) => daysBetween(interaction.occurredAt, now) <= 14).length;
  const recent3d = latest ? daysBetween(latest.occurredAt, now) <= 3 : false;
  const hasNarrativeComment = interactions.some(
    (interaction) =>
      (interaction.type === "comentario" || interaction.type === "resposta_story") &&
      daysBetween(interaction.occurredAt, now) <= 14 &&
      hasNarrative(interaction.text),
  );

  let score = 0;

  if (recent3d) score += 3;
  if (comments7d > 0) score += Math.min(comments7d, 4);
  if (storyReplies7d > 0) score += 4;
  if (mentions14d > 0) score += 2;
  if (likes14d >= 2) score += 1;
  if (recent14d >= 3) score += 3;
  if (hasNarrativeComment) score += 3;
  if (task && !task.completedAt) score += 3;
  if (task?.dueAt && daysBetween(task.dueAt, now) >= 0) score += 1;
  if (person.status === "respondeu") score += 3;
  if (person.contact?.consent_status === "confirmed" || person.status === "contato_confirmado") score += 2;
  if (!hasReferral) score += 2;
  if (person.status === "abordado") score -= 1;

  return score;
}

function toTemperature(score: number): PriorityPerson["temperature"] {
  if (score >= 10) return "quente";
  if (score >= 6) return "morno";
  return "frio";
}

function renderSuggestedMessage(template: MessageTemplate, person: PersonWithContact, mainTheme: string | null) {
  return template.body
    .replaceAll("{username}", `@${person.username}`)
    .replaceAll("{tema}", mainTheme ?? "a pauta que você trouxe")
    .replaceAll("{link_grupo}", "[link do grupo]")
    .replaceAll("{link_formulario}", "[link do formulário]");
}

function getSuggestedTemplate(task: OutreachTaskWithPerson | null, person: PersonWithContact, mainTheme: string | null, templates: MessageTemplate[]) {
  const activeTemplates = templates.filter((template) => template.active);
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

function buildPriorityPerson(
  person: PersonWithContact,
  interactions: InteractionSummary[],
  task: OutreachTaskWithPerson | null,
  templates: MessageTemplate[],
  now: Date,
): PriorityPerson {
  const mainTheme = pickMainTheme(person, interactions);
  const latest = latestInteraction(interactions);
  const hasPendingTask = Boolean(task && !task.completedAt);
  const isPendingResponse = boardColumnIsPendingResponse(task?.column) || person.status === "abordado";
  const hasReferral = person.status === "contato_confirmado" || person.themes.some(t => t.startsWith("quer_"));
  const priorityScore = computePriorityScore(person, interactions, task, hasReferral, now);
  
  const scoreLabel = priorityScore >= 12 ? "Muito quente" : 
                    priorityScore >= 8 ? "Quente" : 
                    priorityScore >= 4 ? "Morno" : "Observar";
  
  const scoreIntensity = Math.min(100, Math.max(0, (priorityScore / 15) * 100));

  const riskFlags = {
    noReferralAfterResponse: (person.status === "respondeu" || task?.column === "precisa_encaminhar") && !hasReferral,
    recentOutreach: latest?.type === "dm_manual" && daysBetween(latest.occurredAt, now) < 1,
    doNotContact: person.status === "nao_abordar" || Boolean(person.doNotContactReason),
  };

  const scoreTooltip = [
    `Score: ${priorityScore}`,
    latest ? `Última interação: ${latest.type}` : null,
    hasPendingTask ? "Possui tarefa aberta (+3)" : null,
    !hasReferral ? "Sem encaminhamento (+2)" : null,
    riskFlags.recentOutreach ? "Penalização: contato recente" : null
  ].filter(Boolean).join(" · ");

  const suggestedTemplate = getSuggestedTemplate(task, person, mainTheme, templates);
  const priorityEligible = person.status !== "nao_abordar" && !person.doNotContactReason;

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
    instagramUrl: person.username ? `https://www.instagram.com/${person.username}/` : null,
    hasPendingTask,
    isPendingResponse,
    hasReferral,
    priorityEligible,
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
  templates: MessageTemplate[],
  now = new Date(),
) {
  return buildPriorityPerson(person, interactions, task, templates, now);
}

export function buildPriorityPeople(
  people: PersonWithContact[],
  interactions: InteractionSummaryWithPerson[],
  tasks: OutreachTaskWithPerson[],
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

  return people
    .map((person) => buildPriorityPerson(person, interactionsByPerson.get(person.id) ?? [], tasksByPerson.get(person.id) ?? null, templates, now))
    .sort((a, b) => {
      if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore;
      return new Date(b.lastInteractionAt ?? 0).getTime() - new Date(a.lastInteractionAt ?? 0).getTime();
    });
}

export async function listPriorityPeople(): Promise<PriorityPerson[]> {
  const now = new Date();

  if (shouldUseMockData()) {
    return buildPriorityPeople(mockPeople, mockInteractionsSummary(), mockTasks, mockTemplates, now);
  }

  try {
    const supabase = getSupabaseAdminClient();
    const cutoff = new Date(now.getTime() - RECENT_DAYS * DAY_MS).toISOString();
    const [people, tasksResult, templatesResult, interactionsResult] = await Promise.all([
      listPeople(cutoff),
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
    }));

    const interactions: InteractionSummaryWithPerson[] = (interactionsResult.data ?? []).map((interaction) => ({
      type: interaction.type,
      occurredAt: interaction.occurred_at,
      text: interaction.text_content ?? "",
      theme: interaction.theme,
      personId: interaction.person_id,
    }));

    return buildPriorityPeople(people, interactions, tasks, templates, now);
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
