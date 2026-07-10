import type { NormalizedSourceRecord, TerritorialInfluenceBreakdown } from "@/lib/radar-hub/types";

export type TerritorialScoreInput = {
  record: NormalizedSourceRecord;
  relationshipCount?: number;
  organizationConnections?: number;
  evidenceCount?: number;
  averageEvidenceConfidence?: number;
  hasConflict?: boolean;
  lastCapturedAt?: string | null;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}

function rounded(value: number) {
  return Number(value.toFixed(4));
}

export function calculateTerritorialInfluenceScore(input: TerritorialScoreInput): TerritorialInfluenceBreakdown {
  const { record } = input;
  const reach = Math.max(record.metrics.followers, record.metrics.subscribers, record.metrics.declaredReach);
  const reachPoints = Math.min(25, Math.log10(Math.max(1, reach)) * 5);
  const platformPoints = Math.min(5, Math.max(0, record.metrics.platforms - 1) * 1.25);
  const legacyPoints = Math.min(5, Math.max(0, record.metrics.legacyInfluenceScore) / 20);
  const digitalReach = clamp(Math.max(reachPoints + platformPoints, legacyPoints), 0, 30);

  const cityPoints = record.location.city ? 12 * record.location.confidence : 0;
  const regionPoints = record.location.region ? 8 * record.location.confidence : 0;
  const regional = clamp(cityPoints + regionPoints, 0, 20);

  const institutionalTypes = new Set(["company", "public_institution", "media", "union", "association", "organization"]);
  const institutionalCategories = new Set(["servidor_publico", "politica_institucional", "sindicato", "veiculo_de_imprensa", "empresa", "associacao"]);
  const institutional = clamp((institutionalTypes.has(record.entityType) ? 9 : 0) + (institutionalCategories.has(record.mainCategory) ? 6 : 0), 0, 15);

  const relationshipCount = Math.max(0, input.relationshipCount ?? 0);
  const organizationConnections = Math.max(0, input.organizationConnections ?? 0);
  const network = clamp(Math.log2(relationshipCount + 1) * 2.5 + Math.min(5, organizationConnections * 1.5), 0, 12);
  const engagement = clamp(Math.log10(Math.max(1, record.metrics.internalEngagement + 1)) * 5, 0, 10);

  const evidenceCount = Math.max(0, input.evidenceCount ?? record.evidence.length);
  const averageConfidence = clamp(input.averageEvidenceConfidence ?? record.confidence, 0, 1);
  const evidencePoints = Math.min(6, evidenceCount * 0.75);
  const confidencePoints = averageConfidence * 7;
  const hasConflict = input.hasConflict ?? record.tags.includes("location-conflict");
  const conflictPenalty = hasConflict ? 5 : 0;
  const dataQuality = clamp(evidencePoints + confidencePoints - conflictPenalty, 0, 13);

  const capturedAt = new Date(input.lastCapturedAt ?? record.capturedAt).getTime();
  const ageDays = Number.isFinite(capturedAt) ? Math.max(0, (Date.now() - capturedAt) / 86_400_000) : 3650;
  const freshnessDecay = clamp(Math.exp(-ageDays / 730), 0.5, 1);
  const subtotal = digitalReach + regional + institutional + network + engagement + dataQuality;
  const total = clamp(subtotal * freshnessDecay, 0, 100);

  const explanation: string[] = [];
  if (reach > 0) explanation.push(`Alcance digital de ${Math.round(reach).toLocaleString("pt-BR")} informado por fonte registrada.`);
  if (record.location.city) explanation.push(`Cidade ${record.location.city} sustentada por evidência com ${(record.location.confidence * 100).toFixed(0)}% de confiança.`);
  if (institutional > 0) explanation.push(`Papel público, profissional ou organizacional objetivo: ${record.mainCategory}.`);
  if (relationshipCount > 0) explanation.push(`${relationshipCount} relações registradas no grafo territorial.`);
  if (hasConflict) explanation.push("Qualidade reduzida por conflito de evidências pendente de revisão.");
  if (freshnessDecay < 0.95) explanation.push("Pontuação reduzida pelo envelhecimento das fontes.");

  return {
    total: rounded(total), digital_reach: rounded(digitalReach), regional_relevance: rounded(regional),
    institutional_relevance: rounded(institutional), network: rounded(network), engagement: rounded(engagement),
    data_quality: rounded(dataQuality), freshness_decay: rounded(freshnessDecay), explanation,
  };
}
