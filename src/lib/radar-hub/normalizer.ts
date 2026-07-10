import { createHash } from "node:crypto";
import { inferLocation } from "@/lib/influence/location";
import { normalizeUsername, safeCount, safeUrl, sanitizeText } from "@/lib/influence/sanitize";
import { RADAR_CATEGORIES, RADAR_ENTITY_TYPES, RADAR_SOURCE_TYPES, type NormalizedSourceRecord, type RadarCategory, type RadarEntityType, type RadarSourceType } from "@/lib/radar-hub/types";

const SENSITIVE_KEYS = new Set([
  "race", "raca", "ethnicity", "etnia", "religion", "religiao", "sexual_orientation", "orientacao_sexual",
  "sex_life", "vida_sexual", "health_condition", "condicao_saude", "medical_condition", "political_opinion",
  "opiniao_politica", "voting_intention", "intencao_voto",
]);

const CATEGORY_RULES: Array<[RadarCategory, RegExp]> = [
  ["veiculo_de_imprensa", /\b(jornal|not[ií]cias|imprensa|portal\s+de\s+not[ií]cias)\b/i],
  ["sindicato", /\b(sindicato|sindical)\b/i],
  ["professor", /\b(professor(?:a)?|docente|educador(?:a)?)\b/i],
  ["medico", /\b(m[eé]dic[oa]|crm\s*[-/]?\s*\d+)\b/i],
  ["advogado", /\b(advogad[oa]|oab\s*[-/]?\s*\d+)\b/i],
  ["jornalista", /\b(jornalista|rep[oó]rter)\b/i],
  ["politica_institucional", /\b(vereador(?:a)?|deputad[oa]|prefeit[oa]|senador(?:a)?|mandato|candidat[oa])\b/i],
  ["servidor_publico", /\bservidor(?:a)?\s+p[uú]blic[oa]\b/i],
  ["associacao", /\bassocia[cç][aã]o\b/i],
  ["coletivo", /\bcoletivo\b/i],
  ["ong", /\b(ong|organiza[cç][aã]o\s+n[aã]o\s+governamental)\b/i],
  ["ambiental", /\b(meio\s+ambiente|ambiental|sustentabilidade|ecologia)\b/i],
  ["educacao", /\b(escola|educa[cç][aã]o|ensino)\b/i],
  ["saude", /\b(cl[ií]nica|hospital|sa[uú]de\s+p[uú]blica)\b/i],
  ["cultura", /\b(cultura|teatro|m[uú]sica|artes?)\b/i],
  ["esporte", /\b(esporte|futebol|atleta|academia)\b/i],
  ["comercio", /\b(loja|com[eé]rcio|varejo|restaurante|delivery)\b/i],
  ["empresa", /\b(empresa|consultoria|solu[cç][oõ]es|servi[cç]os)\b/i],
  ["influenciador", /\b(influenciador(?:a)?|creator|criador(?:a)?\s+de\s+conte[uú]do)\b/i],
  ["bairro_comunidade", /\b(bairro|comunidade|moradores)\b/i],
];

export type UniversalRecordInput = Record<string, unknown>;

function first(input: UniversalRecordInput, ...keys: string[]) {
  for (const key of keys) if (input[key] !== undefined && input[key] !== null && input[key] !== "") return input[key];
  return null;
}

export function normalizeName(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

export function findSensitiveFields(input: unknown, prefix = "", depth = 0): string[] {
  if (!input || typeof input !== "object" || depth > 3) return [];
  const fields: string[] = [];
  for (const [key, value] of Object.entries(input)) {
    const normalizedKey = key.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const path = prefix ? `${prefix}.${key}` : key;
    if (SENSITIVE_KEYS.has(normalizedKey)) fields.push(path);
    else if (value && typeof value === "object") fields.push(...findSensitiveFields(value, path, depth + 1));
  }
  return fields;
}

function inferCategory(input: UniversalRecordInput, text: string): RadarCategory {
  const explicit = sanitizeText(first(input, "mainCategory", "main_category", "category", "categoria"), 80)?.toLowerCase().replaceAll("-", "_");
  if (explicit && RADAR_CATEGORIES.includes(explicit as RadarCategory)) return explicit as RadarCategory;
  return CATEGORY_RULES.find(([, pattern]) => pattern.test(text))?.[0] ?? "outros";
}

function inferEntityType(input: UniversalRecordInput, category: RadarCategory): RadarEntityType {
  const explicit = sanitizeText(first(input, "entityType", "entity_type", "type", "tipo"), 60)?.toLowerCase();
  if (explicit && RADAR_ENTITY_TYPES.includes(explicit as RadarEntityType)) return explicit as RadarEntityType;
  if (category === "empresa" || category === "comercio") return "company";
  if (category === "sindicato") return "union";
  if (category === "associacao") return "association";
  if (category === "coletivo") return "collective";
  if (category === "veiculo_de_imprensa") return "media";
  if (category === "bairro_comunidade") return "community";
  if (["professor", "medico", "advogado", "jornalista", "servidor_publico", "politica_institucional"].includes(category)) return "person";
  return "unknown";
}

function contentHash(...parts: unknown[]) {
  return createHash("sha256").update(parts.map((part) => JSON.stringify(part)).join("|")).digest("hex");
}

function sourceLabel(sourceType: RadarSourceType) {
  return sourceType === "radar_base" ? "Base interna do Radar" : sourceType.toUpperCase();
}

export function normalizeUniversalRecord(input: UniversalRecordInput, defaultSource: RadarSourceType = "manual"): NormalizedSourceRecord {
  const sensitive = findSensitiveFields(input);
  if (sensitive.length) throw new Error(`Campos sensíveis não são aceitos: ${sensitive.join(", ")}.`);
  const sourceRaw = sanitizeText(first(input, "source", "sourceType", "source_type"), 40)?.toLowerCase();
  const sourceType = sourceRaw && RADAR_SOURCE_TYPES.includes(sourceRaw as RadarSourceType) ? sourceRaw as RadarSourceType : defaultSource;
  const displayName = sanitizeText(first(input, "displayName", "display_name", "name", "nome", "fullName"), 200);
  const username = normalizeUsername(first(input, "username", "userName", "handle"));
  if (!displayName && !username) throw new Error("Nome ou username é obrigatório.");
  const resolvedName = displayName ?? `@${username}`;
  const description = sanitizeText(first(input, "description", "descricao", "bio", "biography"), 1000);
  const text = `${resolvedName} ${description ?? ""}`;
  const mainCategory = inferCategory(input, text);
  const entityType = inferEntityType(input, mainCategory);
  const site = safeUrl(first(input, "url", "site", "website", "profileUrl"));
  const explicitCity = sanitizeText(first(input, "city", "cidade"), 100);
  const explicitState = sanitizeText(first(input, "state", "estado"), 2)?.toUpperCase() ?? null;
  const inferred = inferLocation({ bio: description, site, text });
  const locationConflict = Boolean(explicitCity && inferred?.cidade && explicitCity.toLocaleLowerCase("pt-BR") !== inferred.cidade.toLocaleLowerCase("pt-BR"));
  const city = explicitCity ?? inferred?.cidade ?? null;
  const state = explicitState ?? inferred?.estado ?? null;
  const region = sanitizeText(first(input, "region", "regiao"), 100) ?? (["Volta Redonda", "Barra Mansa", "Resende", "Piraí", "Pinheiral", "Itatiaia", "Quatis", "Porto Real", "Valença", "Rio Claro"].includes(city ?? "") ? "Sul Fluminense" : null);
  const locationConfidence = city ? (explicitCity ? locationConflict ? 0.55 : 0.95 : inferred?.confidence ?? 0) : 0;
  const capturedAtRaw = sanitizeText(first(input, "capturedAt", "captured_at", "collectedAt"), 40);
  const capturedAt = capturedAtRaw && Number.isFinite(new Date(capturedAtRaw).getTime()) ? new Date(capturedAtRaw).toISOString() : new Date().toISOString();
  const sourceReference = sanitizeText(first(input, "sourceReference", "source_reference", "externalId"), 500);
  const followers = safeCount(first(input, "followers", "seguidores", "followersCount"));
  const subscribers = safeCount(first(input, "subscribers", "inscritos", "subscriberCount"));
  const declaredReach = safeCount(first(input, "reach", "alcance", "declaredReach"));
  const legacyInfluenceScore = Number(first(input, "legacyInfluenceScore", "influence_score", "score") ?? 0) || 0;
  const internalEngagement = safeCount(first(input, "internalEngagement", "interacoes_internas", "engagement"));

  const identifiers = [] as NormalizedSourceRecord["identifiers"];
  if (username) identifiers.push({ sourceType, identifierType: "username", value: username, normalizedValue: username, url: site, username, normalizedUsername: username, isPrimary: true, confidence: 0.99 });
  if (site) identifiers.push({ sourceType: sourceType === "manual" ? "website" : sourceType, identifierType: "url", value: site, normalizedValue: site.toLowerCase().replace(/\/$/, ""), url: site, username, normalizedUsername: username, isPrimary: !username, confidence: 0.98 });
  const officialId = sanitizeText(first(input, "officialId", "official_id", "cnpj", "tseId"), 120);
  if (officialId) identifiers.push({ sourceType: input.cnpj ? "cnpj" : input.tseId ? "tse" : sourceType, identifierType: "official_id", value: officialId, normalizedValue: officialId.replace(/\D/g, "") || officialId.toLowerCase(), url: site, username: null, normalizedUsername: null, isPrimary: true, confidence: 1 });

  const evidence = [] as NormalizedSourceRecord["evidence"];
  const addEvidence = (fieldName: string, fieldValue: unknown, confidence: number, excerpt?: string | null) => {
    if (fieldValue === null || fieldValue === undefined || fieldValue === "") return;
    evidence.push({ sourceType, sourceName: sourceLabel(sourceType), sourceUrl: site, sourceReference, capturedAt, fieldName, fieldValue: fieldValue as never, confidence, evidenceKind: sourceType === "manual" ? "manual_assertion" : sourceType === "radar_base" || sourceType === "instagram" ? "internal_record" : "imported_field", rawExcerpt: sanitizeText(excerpt, 1000), contentHash: contentHash(sourceType, sourceReference, fieldName, fieldValue) });
  };
  addEvidence("display_name", resolvedName, 0.98, resolvedName);
  addEvidence("description", description, 0.85, description);
  addEvidence("main_category", mainCategory, mainCategory === "outros" ? 0.2 : 0.82, description);
  addEvidence("primary_city", city, locationConfidence, description);
  addEvidence("primary_state", state, locationConfidence, description);
  addEvidence("primary_region", region, locationConfidence, description);
  if (locationConflict) addEvidence("location_conflict", { explicitCity, inferredCity: inferred?.cidade, inferredState: inferred?.estado }, 1, description);
  addEvidence("followers", followers || null, 0.9, null);
  addEvidence("subscribers", subscribers || null, 0.9, null);
  addEvidence("declared_reach", declaredReach || null, 0.8, null);

  const evidenceConfidence = evidence.length ? evidence.reduce((sum, item) => sum + item.confidence, 0) / evidence.length : 0;
  const tags = Array.from(new Set([...(Array.isArray(input.tags) ? input.tags : []).map((tag) => sanitizeText(tag, 60)).filter((tag): tag is string => Boolean(tag)), ...(locationConflict ? ["location-conflict"] : [])])).slice(0, 30);
  const secondaryCategories = Array.from(new Set((Array.isArray(input.secondaryCategories) ? input.secondaryCategories : []).filter((item): item is RadarCategory => typeof item === "string" && RADAR_CATEGORIES.includes(item as RadarCategory)))).filter((item) => item !== mainCategory).slice(0, 10);
  return {
    entityType, displayName: resolvedName, normalizedName: normalizeName(resolvedName), description, mainCategory,
    secondaryCategories, tags, location: { city, state, region, confidence: locationConfidence }, identifiers, evidence,
    metrics: { followers, subscribers, declaredReach, platforms: Math.max(1, identifiers.filter((item) => item.username).length), legacyInfluenceScore: Math.max(0, legacyInfluenceScore), internalEngagement },
    confidence: Number(evidenceConfidence.toFixed(4)), sourceType, sourceReference, capturedAt,
  };
}
