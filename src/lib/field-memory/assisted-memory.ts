import type { FieldAgendaEvent, FieldAgendaEventResult } from "@/lib/data/field-agenda";
import type { TopicCategoryRow } from "@/lib/data/topics";
import { sanitizeMemoryText } from "@/lib/strategic-memory/safety";

export const ASSISTED_FIELD_MEMORY_TYPES = [
  "Registro de Campo",
  "Pauta Viva",
  "Trava Recorrente",
  "Cuidado da Base",
  "Devolutiva Territorial",
  "Aprendizado de Mensagem",
] as const;

export type AssistedFieldMemoryType = (typeof ASSISTED_FIELD_MEMORY_TYPES)[number];

export interface AssistedMemoryChecklistState {
  noCitizenName: boolean;
  noHandle: boolean;
  noDirectContact: boolean;
  noAddress: boolean;
  noSensitiveData: boolean;
  noIndividualStoryWithoutConsent: boolean;
}

export interface AssistedFieldMemoryDraft {
  title: string;
  memoryType: AssistedFieldMemoryType;
  topicId: string | null;
  territory: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  summary: string;
  whatHappened: string;
  whatLearned: string;
  howToUseNextCycle: string;
  ethicalCare: string;
  suggestedNextStep: string;
  sourceLabel: string;
  sourceHref: string;
  sourceType: "result";
  sourceEntityId: string;
  eventId: string;
}

const HANDLE_PATTERN = /(^|\s)@[a-z0-9._-]+/im;
const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_PATTERN = /(\+?\d{1,3}[-.\s]?)?\(?\d{2,3}\)?[-.\s]?\d{4,5}[-.\s]?\d{4}/;
const ADDRESS_PATTERN = /\b(rua|r\.|avenida|av\.|travessa|tv\.|alameda|praça|praca|cep|n[uú]mero|numero)\b/i;

export function buildFieldResultMemoryHref(eventId: string, resultId: string) {
  const params = new URLSearchParams({
    source: "result",
    eventId,
    resultId,
  });
  return `/memoria/nova?${params.toString()}`;
}

function compactDate(value: string | null) {
  return value ? value.slice(0, 10) : null;
}

function normalizeTopicLabel(topic: string) {
  return topic.trim().replaceAll("_", " ");
}

export function buildFieldResultMemoryDraft(input: {
  event: FieldAgendaEvent;
  result: FieldAgendaEventResult;
  topics: TopicCategoryRow[];
}): AssistedFieldMemoryDraft {
  const { event, result, topics } = input;
  const matchedTopic =
    topics.find((topic) => topic.slug === event.topicSlug) ??
    topics.find((topic) => result.topicsDiscussed.some((item) => item.toLowerCase() === topic.slug.toLowerCase())) ??
    null;

  const summaryBase = sanitizeMemoryText(
    result.resultSummary ||
      `Ação de campo realizada em ${event.neighborhood ?? "território sem bairro definido"} com registro agregado.`,
  );

  const learnedBase =
    result.topicsDiscussed.length > 0
      ? `Os sinais mais presentes giraram em torno de ${result.topicsDiscussed.map(normalizeTopicLabel).join(", ")}.`
      : "A escuta gerou sinais que precisam ser consolidados como aprendizado coletivo.";

  const nextStepBase = sanitizeMemoryText(
    result.nextSteps ||
      "Fechar a leitura do campo e decidir qual devolutiva ou continuidade precisa entrar no próximo ciclo.",
  );

  return {
    title: `Registro de Campo - ${event.title}`,
    memoryType: "Registro de Campo",
    topicId: matchedTopic?.id ?? null,
    territory: event.neighborhood ?? result.neighborhoodsMentioned[0] ?? null,
    periodStart: compactDate(event.startsAt),
    periodEnd: compactDate(event.endsAt ?? result.createdAt),
    summary: summaryBase,
    whatHappened: summaryBase,
    whatLearned: learnedBase,
    howToUseNextCycle: "Usar esta leitura para ajustar a próxima rodada de escuta, devolutiva ou ação territorial sem expor relatos individuais.",
    ethicalCare: "Registrar apenas síntese agregada. Não incluir nomes, @, contatos, endereços ou relatos individuais sem consentimento explícito.",
    suggestedNextStep: nextStepBase,
    sourceLabel: `Resultado de campo em ${event.neighborhood ?? "território sem bairro definido"} (${compactDate(result.createdAt) ?? "data sem registro"})`,
    sourceHref: `/campo/${event.id}`,
    sourceType: "result",
    sourceEntityId: result.id,
    eventId: event.id,
  };
}

export function buildAssistedMemorySummary(input: {
  whatHappened: string;
  whatLearned: string;
  howToUseNextCycle: string;
  suggestedNextStep: string;
}) {
  const sections = [
    ["O que aconteceu", input.whatHappened],
    ["O que aprendemos", input.whatLearned],
    ["Como usar no próximo ciclo", input.howToUseNextCycle],
    ["Próximo passo sugerido", input.suggestedNextStep],
  ];

  return sections
    .map(([label, value]) => `${label}: ${sanitizeMemoryText(value.trim())}`)
    .join("\n\n");
}

export function detectObviousSensitiveMemoryContent(text: string) {
  const issues: string[] = [];
  if (HANDLE_PATTERN.test(text)) issues.push("handle");
  if (EMAIL_PATTERN.test(text)) issues.push("email");
  if (PHONE_PATTERN.test(text)) issues.push("phone");
  if (ADDRESS_PATTERN.test(text)) issues.push("address");
  return issues;
}

export function hasCompletedAssistedMemoryChecklist(checklist: AssistedMemoryChecklistState) {
  return Object.values(checklist).every(Boolean);
}
