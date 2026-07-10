import { RADAR_CATEGORIES, type NormalizedSourceRecord, type RadarCategory } from "@/lib/radar-hub/types";

export type PublicRoleClassification = { category: RadarCategory | "unknown"; confidence: number; explanation: string };
export type RadarAiClassifier = (record: NormalizedSourceRecord) => Promise<PublicRoleClassification | null>;

export function deterministicPublicClassification(record: NormalizedSourceRecord): PublicRoleClassification {
  if (record.mainCategory !== "outros") {
    return { category: record.mainCategory, confidence: Math.max(0.7, record.confidence), explanation: "Categoria sustentada por regra pública/profissional determinística." };
  }
  return { category: "unknown", confidence: 0, explanation: "Sem evidência pública objetiva suficiente." };
}

function valid(value: PublicRoleClassification | null): value is PublicRoleClassification {
  return Boolean(value && (value.category === "unknown" || RADAR_CATEGORIES.includes(value.category)) && value.confidence >= 0 && value.confidence <= 1 && value.explanation.length <= 300);
}

export async function classifyPublicRole(record: NormalizedSourceRecord, aiClassifier?: RadarAiClassifier) {
  const deterministic = deterministicPublicClassification(record);
  if (deterministic.category !== "unknown" || !aiClassifier) return deterministic;
  const aiResult = await aiClassifier(record);
  return valid(aiResult) ? aiResult : deterministic;
}

export function createConfiguredAiClassifier(): RadarAiClassifier | undefined {
  const endpoint = process.env.RADAR_AI_CLASSIFIER_URL;
  if (!endpoint) return undefined;
  return async (record) => {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json", ...(process.env.RADAR_AI_CLASSIFIER_KEY ? { authorization: `Bearer ${process.env.RADAR_AI_CLASSIFIER_KEY}` } : {}) },
      body: JSON.stringify({
        instruction: "Classifique somente papel público, profissional ou organizacional explícito. Não infira raça, religião, saúde, sexualidade, etnia, opinião política, voto ou localização. Retorne unknown em dúvida.",
        allowedCategories: [...RADAR_CATEGORIES, "unknown"],
        record: { entityType: record.entityType, displayName: record.displayName, description: record.description, identifiers: record.identifiers.map(({ sourceType, identifierType }) => ({ sourceType, identifierType })) },
      }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) return null;
    const result: unknown = await response.json();
    return result && typeof result === "object" ? result as PublicRoleClassification : null;
  };
}

