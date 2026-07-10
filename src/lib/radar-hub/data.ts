import { shouldUseMockData } from "@/lib/config";
import { getInfluenceClient } from "@/lib/influence/db-types";
import { getRadarHubClient, type RadarRelationshipRow } from "@/lib/radar-hub/db-types";
import { MOCK_RADAR_CONNECTORS, MOCK_RADAR_ENTITIES, MOCK_RADAR_EVIDENCE, MOCK_RADAR_IDENTIFIERS, MOCK_RADAR_MERGES, MOCK_RADAR_RELATIONSHIPS } from "@/lib/radar-hub/mock-data";
import { RADAR_CATEGORIES, RADAR_ENTITY_TYPES, RADAR_SOURCE_TYPES, type RadarCategory, type RadarEntity, type RadarEntityFilters, type RadarEntityListResult, type RadarEntityType, type RadarSourceType } from "@/lib/radar-hub/types";
import { sanitizeText } from "@/lib/influence/sanitize";

const SORT_COLUMNS = { score: "influence_score", name: "normalized_name", confidence: "confidence_score", updated: "updated_at" } as const;

function normalizeFilters(filters: RadarEntityFilters) {
  return {
    ...filters,
    page: Math.max(1, Math.floor(filters.page ?? 1)),
    pageSize: Math.min(100, Math.max(10, Math.floor(filters.pageSize ?? 50))),
    sort: filters.sort && SORT_COLUMNS[filters.sort] ? filters.sort : "score" as const,
    direction: filters.direction === "asc" ? "asc" as const : "desc" as const,
  };
}

function countBy(items: RadarEntity[], key: "entity_type" | "main_category" | "primary_city") {
  const result: Record<string, number> = {};
  for (const item of items) {
    const value = item[key];
    if (value) result[value] = (result[value] ?? 0) + 1;
  }
  return result;
}

function filterMockEntities(filters: RadarEntityFilters) {
  const q = filters.q?.toLocaleLowerCase("pt-BR");
  const relatedIds = new Set(MOCK_RADAR_RELATIONSHIPS.flatMap((relationship) => [relationship.subject_entity_id, relationship.object_entity_id]));
  const sourceIds = filters.sourceType ? new Set(MOCK_RADAR_IDENTIFIERS.filter((identifier) => identifier.source_type === filters.sourceType).map((identifier) => identifier.entity_id)) : null;
  return MOCK_RADAR_ENTITIES.filter((entity) => {
    if (q && !`${entity.display_name} ${entity.description ?? ""}`.toLocaleLowerCase("pt-BR").includes(q)) return false;
    if (filters.entityType && entity.entity_type !== filters.entityType) return false;
    if (filters.category && entity.main_category !== filters.category && !entity.secondary_categories.includes(filters.category)) return false;
    if (filters.city && entity.primary_city !== filters.city) return false;
    if (filters.state && entity.primary_state !== filters.state.toUpperCase()) return false;
    if (filters.region && entity.primary_region !== filters.region) return false;
    if (filters.minScore !== undefined && entity.influence_score < filters.minScore) return false;
    if (filters.maxScore !== undefined && entity.influence_score > filters.maxScore) return false;
    if (filters.hasRelationship !== undefined && relatedIds.has(entity.id) !== filters.hasRelationship) return false;
    if (sourceIds && !sourceIds.has(entity.id)) return false;
    return entity.status !== "archived";
  });
}

function parseFacetRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).map(([key, amount]) => [key, Number(amount) || 0]));
}

export async function listRadarEntities(filters: RadarEntityFilters = {}): Promise<RadarEntityListResult> {
  const normalized = normalizeFilters(filters);
  if (shouldUseMockData()) {
    const filtered = filterMockEntities(normalized).toSorted((left, right) => {
      const column = SORT_COLUMNS[normalized.sort];
      const a = left[column] ?? "";
      const b = right[column] ?? "";
      const compared = typeof a === "number" && typeof b === "number" ? a - b : String(a).localeCompare(String(b), "pt-BR");
      return normalized.direction === "asc" ? compared : -compared;
    });
    const start = (normalized.page - 1) * normalized.pageSize;
    const averageScore = MOCK_RADAR_ENTITIES.reduce((sum, item) => sum + item.influence_score, 0) / MOCK_RADAR_ENTITIES.length;
    const averageConfidence = MOCK_RADAR_ENTITIES.reduce((sum, item) => sum + item.confidence_score, 0) / MOCK_RADAR_ENTITIES.length;
    return {
      items: filtered.slice(start, start + normalized.pageSize), total: filtered.length, page: normalized.page,
      pageSize: normalized.pageSize, totalPages: Math.max(1, Math.ceil(filtered.length / normalized.pageSize)),
      kpis: { totalEntities: MOCK_RADAR_ENTITIES.length, averageScore, averageConfidence, needsReview: MOCK_RADAR_ENTITIES.filter((item) => item.status === "needs_review").length, pendingEnrichment: 2 },
      facets: { entityTypes: countBy(MOCK_RADAR_ENTITIES, "entity_type"), categories: countBy(MOCK_RADAR_ENTITIES, "main_category"), cities: countBy(MOCK_RADAR_ENTITIES, "primary_city"), sources: { seed: 5, instagram: 1 } },
    };
  }

  const supabase = getRadarHubClient();
  const search = sanitizeText(normalized.q, 100)?.replace(/[,()%]/g, " ") ?? null;
  const [searchResult, kpiResult, facetResult] = await Promise.all([
    supabase.rpc("search_radar_entities", {
      p_q: search, p_entity_type: normalized.entityType ?? null, p_category: normalized.category ?? null,
      p_city: sanitizeText(normalized.city, 100), p_state: sanitizeText(normalized.state, 2), p_region: sanitizeText(normalized.region, 100),
      p_source_type: normalized.sourceType ?? null, p_min_score: normalized.minScore ?? null, p_max_score: normalized.maxScore ?? null,
      p_has_relationship: normalized.hasRelationship ?? null, p_offset: (normalized.page - 1) * normalized.pageSize,
      p_limit: normalized.pageSize, p_sort: normalized.sort, p_direction: normalized.direction,
    }),
    supabase.rpc("get_radar_entity_kpis"),
    supabase.rpc("get_radar_entity_facets"),
  ]);
  if (searchResult.error) throw searchResult.error;
  if (kpiResult.error) throw kpiResult.error;
  if (facetResult.error) throw facetResult.error;
  const items = (searchResult.data ?? []).map((row) => row.entity as unknown as RadarEntity);
  const total = Number(searchResult.data?.[0]?.total_count ?? 0);
  const kpis = kpiResult.data?.[0];
  const rawFacets = facetResult.data && typeof facetResult.data === "object" && !Array.isArray(facetResult.data) ? facetResult.data : {};
  return {
    items, total, page: normalized.page, pageSize: normalized.pageSize, totalPages: Math.max(1, Math.ceil(total / normalized.pageSize)),
    kpis: { totalEntities: Number(kpis?.total_entities ?? 0), averageScore: Number(kpis?.average_score ?? 0), averageConfidence: Number(kpis?.average_confidence ?? 0), needsReview: Number(kpis?.needs_review ?? 0), pendingEnrichment: Number(kpis?.pending_enrichment ?? 0) },
    facets: { entityTypes: parseFacetRecord(rawFacets.entityTypes), categories: parseFacetRecord(rawFacets.categories), cities: parseFacetRecord(rawFacets.cities), sources: parseFacetRecord(rawFacets.sources) },
  };
}

export async function getRadarEntityDetail(id: string) {
  if (shouldUseMockData()) {
    const entity = MOCK_RADAR_ENTITIES.find((item) => item.id === id);
    if (!entity) return null;
    const relationships = MOCK_RADAR_RELATIONSHIPS.filter((item) => item.subject_entity_id === id || item.object_entity_id === id);
    return {
      entity,
      identifiers: MOCK_RADAR_IDENTIFIERS.filter((item) => item.entity_id === id),
      evidence: MOCK_RADAR_EVIDENCE.filter((item) => item.entity_id === id), relationships,
      relatedEntities: Object.fromEntries(MOCK_RADAR_ENTITIES.map((item) => [item.id, item])),
      history: [], notes: [], mergeSuggestions: MOCK_RADAR_MERGES.filter((item) => item.entity_a_id === id || item.entity_b_id === id),
      instagramProfile: id === MOCK_RADAR_ENTITIES[4].id ? { id: "10000000-0000-4000-8000-000000000001", username: "radar_empresa_demo", influence_score: 46.67 } : null,
    };
  }
  const supabase = getRadarHubClient();
  const [entity, identifiers, evidence, relationships, history, notes, suggestions] = await Promise.all([
    supabase.from("radar_entities").select("*").eq("id", id).maybeSingle(),
    supabase.from("radar_entity_identifiers").select("*").eq("entity_id", id).order("is_primary", { ascending: false }),
    supabase.from("radar_source_evidence").select("*").eq("entity_id", id).order("captured_at", { ascending: false }).limit(200),
    supabase.from("radar_entity_relationships").select("*").or(`subject_entity_id.eq.${id},object_entity_id.eq.${id}`).limit(200),
    supabase.from("radar_entity_history").select("*").eq("entity_id", id).order("created_at", { ascending: false }).limit(100),
    supabase.from("radar_entity_notes").select("*").eq("entity_id", id).order("created_at", { ascending: false }).limit(100),
    supabase.from("radar_merge_suggestions").select("*").or(`entity_a_id.eq.${id},entity_b_id.eq.${id}`).order("created_at", { ascending: false }).limit(50),
  ]);
  for (const result of [entity, identifiers, evidence, relationships, history, notes, suggestions]) if (result.error) throw result.error;
  if (!entity.data) return null;
  const relatedIds = Array.from(new Set((relationships.data ?? []).flatMap((item) => [item.subject_entity_id, item.object_entity_id]).filter((relatedId) => relatedId !== id)));
  const related = relatedIds.length ? await supabase.from("radar_entities").select("*").in("id", relatedIds) : { data: [], error: null };
  if (related.error) throw related.error;
  const instagramIdentifier = (identifiers.data ?? []).find((item) => item.source_type === "instagram" && item.identifier_type === "username");
  let instagramProfile: { id: string; username: string; influence_score: number } | null = null;
  if (instagramIdentifier) {
    const profile = await getInfluenceClient().from("instagram_profiles").select("id,username,influence_score").eq("username", instagramIdentifier.normalized_identifier).maybeSingle();
    if (!profile.error) instagramProfile = profile.data;
  }
  return { entity: entity.data, identifiers: identifiers.data ?? [], evidence: evidence.data ?? [], relationships: relationships.data ?? [], relatedEntities: Object.fromEntries((related.data ?? []).map((item) => [item.id, item])), history: history.data ?? [], notes: notes.data ?? [], mergeSuggestions: suggestions.data ?? [], instagramProfile };
}

export async function listRadarRelationships(filters: { entityId?: string; predicate?: string; category?: string; city?: string; depth?: number } = {}) {
  if (shouldUseMockData()) {
    let items = MOCK_RADAR_RELATIONSHIPS;
    if (filters.entityId) items = items.filter((item) => item.subject_entity_id === filters.entityId || item.object_entity_id === filters.entityId);
    if (filters.predicate) items = items.filter((item) => item.predicate === filters.predicate);
    const entities = MOCK_RADAR_ENTITIES.filter((entity) => !filters.category || entity.main_category === filters.category).filter((entity) => !filters.city || entity.primary_city === filters.city);
    const entityIds = new Set(entities.map((entity) => entity.id));
    if (filters.category || filters.city) items = items.filter((item) => entityIds.has(item.subject_entity_id) || entityIds.has(item.object_entity_id));
    return { items, entities: Object.fromEntries(MOCK_RADAR_ENTITIES.map((entity) => [entity.id, entity])), depth: Math.min(3, Math.max(1, filters.depth ?? 1)) };
  }
  const supabase = getRadarHubClient();
  const depth = Math.min(3, Math.max(1, Math.floor(filters.depth ?? 1)));
  let frontier = filters.entityId ? new Set([filters.entityId]) : new Set<string>();
  const found = new Map<string, RadarRelationshipRow>();
  for (let level = 0; level < depth; level += 1) {
    let query = supabase.from("radar_entity_relationships").select("*").limit(1000);
    if (filters.predicate) query = query.eq("predicate", filters.predicate);
    if (frontier.size) query = query.or(`subject_entity_id.in.(${[...frontier].join(",")}),object_entity_id.in.(${[...frontier].join(",")})`);
    const result = await query;
    if (result.error) throw result.error;
    const next = new Set<string>();
    for (const relationship of result.data ?? []) {
      found.set(relationship.id, relationship);
      next.add(relationship.subject_entity_id); next.add(relationship.object_entity_id);
    }
    frontier = new Set([...next].filter((id) => !frontier.has(id)));
    if (!filters.entityId) break;
  }
  const entityIds = new Set([...found.values()].flatMap((item) => [item.subject_entity_id, item.object_entity_id]));
  const entitiesResult = entityIds.size ? await supabase.from("radar_entities").select("*").in("id", [...entityIds]) : { data: [], error: null };
  if (entitiesResult.error) throw entitiesResult.error;
  let entities = entitiesResult.data ?? [];
  if (filters.category) entities = entities.filter((entity) => entity.main_category === filters.category);
  if (filters.city) entities = entities.filter((entity) => entity.primary_city === filters.city);
  const allowedIds = new Set(entities.map((entity) => entity.id));
  const items = filters.category || filters.city ? [...found.values()].filter((item) => allowedIds.has(item.subject_entity_id) || allowedIds.has(item.object_entity_id)) : [...found.values()];
  return { items, entities: Object.fromEntries(entities.map((entity) => [entity.id, entity])), depth };
}

export async function listRadarConnectors() {
  if (shouldUseMockData()) return MOCK_RADAR_CONNECTORS;
  const result = await getRadarHubClient().from("radar_source_connectors").select("*").order("display_name");
  if (result.error) throw result.error;
  return result.data ?? [];
}

export function parseRadarEntityFilters(params: URLSearchParams): RadarEntityFilters {
  const numberParam = (key: string) => { const raw = params.get(key); if (!raw) return undefined; const value = Number(raw); return Number.isFinite(value) && value >= 0 ? value : undefined; };
  const entityType = params.get("entityType"); const category = params.get("category"); const source = params.get("sourceType");
  const sort = params.get("sort");
  return {
    q: params.get("q") ?? undefined,
    entityType: entityType && RADAR_ENTITY_TYPES.includes(entityType as RadarEntityType) ? entityType as RadarEntityType : undefined,
    category: category && RADAR_CATEGORIES.includes(category as RadarCategory) ? category as RadarCategory : undefined,
    city: params.get("city") ?? undefined, state: params.get("state") ?? undefined, region: params.get("region") ?? undefined,
    sourceType: source && RADAR_SOURCE_TYPES.includes(source as RadarSourceType) ? source as RadarSourceType : undefined,
    minScore: numberParam("minScore"), maxScore: numberParam("maxScore"), hasRelationship: params.get("hasRelationship") === "true" ? true : params.get("hasRelationship") === "false" ? false : undefined,
    page: numberParam("page"), pageSize: numberParam("pageSize"), sort: sort === "name" || sort === "confidence" || sort === "updated" ? sort : "score", direction: params.get("direction") === "asc" ? "asc" : "desc",
  };
}

