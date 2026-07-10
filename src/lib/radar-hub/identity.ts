import type { NormalizedSourceRecord, RadarEntityType, RadarIdentifierInput } from "@/lib/radar-hub/types";

export type IdentityCandidate = {
  entityId: string;
  entityType: RadarEntityType;
  normalizedName: string;
  city: string | null;
  identifiers: RadarIdentifierInput[];
};

export type IdentityResolution = {
  action: "link" | "suggest" | "create";
  entityId: string | null;
  candidateId: string | null;
  confidence: number;
  reason: string;
};

function domain(url: string | null) {
  if (!url) return null;
  try { return new URL(url).hostname.toLowerCase().replace(/^www\./, ""); } catch { return null; }
}

export function resolveEntityIdentity(record: NormalizedSourceRecord, candidates: IdentityCandidate[]): IdentityResolution {
  for (const candidate of candidates) {
    for (const incoming of record.identifiers) {
      const exact = candidate.identifiers.find((identifier) => identifier.sourceType === incoming.sourceType && identifier.identifierType === incoming.identifierType && identifier.normalizedValue === incoming.normalizedValue);
      if (exact) return { action: "link", entityId: candidate.entityId, candidateId: candidate.entityId, confidence: incoming.identifierType === "official_id" ? 1 : 0.99, reason: `Mesmo identificador ${incoming.identifierType} na fonte ${incoming.sourceType}.` };
    }
  }
  const incomingDomains = new Set(record.identifiers.map((identifier) => domain(identifier.url)).filter((value): value is string => value !== null && !["instagram.com", "facebook.com", "linkedin.com", "youtube.com", "tiktok.com", "x.com"].includes(value)));
  for (const candidate of candidates) {
    if (candidate.identifiers.some((identifier) => incomingDomains.has(domain(identifier.url) ?? ""))) {
      return { action: "suggest", entityId: null, candidateId: candidate.entityId, confidence: 0.82, reason: "Mesmo domínio público; requer revisão humana." };
    }
  }
  for (const candidate of candidates) {
    if (candidate.normalizedName === record.normalizedName && candidate.city && record.location.city && candidate.city === record.location.city) {
      const confidence = candidate.entityType === "person" || record.entityType === "person" ? 0.72 : 0.88;
      return { action: "suggest", entityId: null, candidateId: candidate.entityId, confidence, reason: "Mesmo nome normalizado e cidade, sem identificador comum; não mesclar automaticamente." };
    }
  }
  return { action: "create", entityId: null, candidateId: null, confidence: 0, reason: "Nenhuma evidência de identidade suficiente." };
}
