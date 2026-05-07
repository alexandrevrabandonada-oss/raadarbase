import type { AuditLogEntry, InteractionWithPost, MessageTemplate, OutreachTaskWithPerson, PersonResponseKind, PersonTimelineItem, PersonWithContact } from "@/lib/types";
import { buildPriorityPersonProfile, buildPriorityReasons } from "./people-priority";

export type PersonOperationalProfile = {
  person: PersonWithContact;
  priority: ReturnType<typeof buildPriorityPersonProfile>;
  reasons: string[];
  currentTask: OutreachTaskWithPerson | null;
  compatibleTemplate: MessageTemplate | null;
  timeline: PersonTimelineItem[];
};

export const PERSON_RESPONSE_OPTIONS: Array<{
  key: PersonResponseKind;
  label: string;
  hint: string;
}> = [
  { key: "nao_respondeu", label: "Ainda sem retorno", hint: "Tentamos contato, mas a pessoa ainda não visualizou ou respondeu." },
  { key: "respondeu_bem", label: "Respondeu Bem (Criar Vínculo)", hint: "A conversa fluiu. Próximo passo é aprofundar ou encaminhar." },
  { key: "pediu_informacoes", label: "Tirou Dúvida / Pediu Info", hint: "A pessoa tem dúvidas pontuais sobre a pré-campanha ou pautas." },
  { key: "quer_entrar_grupo", label: "Deseja entrar no Grupo", hint: "Interesse em participar das listas de transmissão ou grupos de zap." },
  { key: "quer_ir_evento", label: "Deseja ir a Evento", hint: "Interesse em participar de plenárias, mutirões ou reuniões." },
  { key: "quer_conhecer_missao_eluta", label: "Interesse no app ÉLuta", hint: "Quer baixar o app e participar das missões digitais." },
  { key: "quer_ajudar_online", label: "Ajuda Online (Mobilizador)", hint: "Disponível para compartilhar conteúdos e atuar nas redes." },
  { key: "quer_ajudar_presencial", label: "Ajuda Campo (Voluntário)", hint: "Disponível para rua, panfletagem e mobilização física." },
  { key: "nao_quer_contato", label: "Retirar da Lista (Privacidade)", hint: "A pessoa pediu expressamente para não ser mais abordada." },
  { key: "revisar_depois", label: "Pausar e Rever Depois", hint: "Não é o momento certo agora. Vamos retomar em outra janela." },
];

export function getCompatibleTemplate(
  templates: MessageTemplate[],
  profile: ReturnType<typeof buildPriorityPersonProfile>,
): MessageTemplate | null {
  if (!profile.suggestedTemplateName) return null;
  return templates.find((template) => template.name === profile.suggestedTemplateName) ?? null;
}

export function buildPersonTimeline(
  interactions: InteractionWithPost[],
  tasks: OutreachTaskWithPerson[],
  auditLogs: AuditLogEntry[],
): PersonTimelineItem[] {
  const interactionItems: PersonTimelineItem[] = interactions.map((interaction) => ({
    id: `instagram-${interaction.id}`,
    type: "instagram",
    title: interaction.type.replace("_", " "),
    description: interaction.text || "Interação registrada sem texto adicional.",
    occurredAt: interaction.occurredAt,
    badge: interaction.theme,
  }));

  const taskItems: PersonTimelineItem[] = tasks.map((task) => ({
    id: `task-${task.id}`,
    type: "tarefa",
    title: task.title,
    description: task.notes || `Etapa operacional: ${task.column}.`,
    occurredAt: task.completedAt ?? task.dueAt ?? new Date().toISOString(),
    badge: task.column,
  }));

  const auditItems: PersonTimelineItem[] = auditLogs.map((entry) => ({
    id: `audit-${entry.id}`,
    type: "registro",
    title: entry.summary,
    description: typeof entry.metadata === "object" && entry.metadata && "responseType" in entry.metadata
      ? `Registro de resposta: ${String(entry.metadata.responseType)}`
      : entry.action,
    occurredAt: entry.createdAt,
    badge: entry.action,
  }));

  return [...interactionItems, ...taskItems, ...auditItems].sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  );
}

export function buildPersonOperationalProfile(
  person: PersonWithContact,
  interactions: InteractionWithPost[],
  tasks: OutreachTaskWithPerson[],
  templates: MessageTemplate[],
  auditLogs: AuditLogEntry[],
  now = new Date(),
): PersonOperationalProfile {
  const currentTask = tasks.find((task) => !task.completedAt) ?? null;
  const priority = buildPriorityPersonProfile(
    person,
    interactions.map((interaction) => ({
      type: interaction.type,
      occurredAt: interaction.occurredAt,
      text: interaction.text,
      theme: interaction.theme,
    })),
    currentTask,
    templates,
    now,
  );

  return {
    person,
    priority,
    reasons: buildPriorityReasons(
      person,
      interactions.map((interaction) => ({
        type: interaction.type,
        occurredAt: interaction.occurredAt,
        text: interaction.text,
        theme: interaction.theme,
      })),
      currentTask,
      now,
    ),
    currentTask,
    compatibleTemplate: getCompatibleTemplate(templates, priority),
    timeline: buildPersonTimeline(interactions, tasks, auditLogs),
  };
}
