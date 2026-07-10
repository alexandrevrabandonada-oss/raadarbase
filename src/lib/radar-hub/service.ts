import type { Json } from "@/lib/supabase/database.types";
import { shouldUseMockData } from "@/lib/config";
import { getInfluenceClient } from "@/lib/influence/db-types";
import { MOCK_INFLUENCE_PROFILES } from "@/lib/influence/mock-data";
import { sanitizeText } from "@/lib/influence/sanitize";
import { classifyPublicRole, createConfiguredAiClassifier } from "@/lib/radar-hub/classification";
import { getRadarHubClient, type RadarIdentifierRow } from "@/lib/radar-hub/db-types";
import { resolveEntityIdentity, type IdentityCandidate } from "@/lib/radar-hub/identity";
import { MOCK_RADAR_ENTITIES } from "@/lib/radar-hub/mock-data";
import { ConfiguredHttpProvider, ExistingInstagramProvider, getProvider } from "@/lib/radar-hub/providers";
import { calculateTerritorialInfluenceScore } from "@/lib/radar-hub/score";
import type { NormalizedSourceRecord, RadarEntity, RadarRelationshipPredicate, RadarSourceType } from "@/lib/radar-hub/types";

type Actor = { id: string; email: string | null };
export type HubImportResult = { jobId: string | null; total: number; inserted: number; updated: number; duplicates: number; mergeSuggestions: number; rejected: number; errors: string[] };

function unique<T>(values: T[]) { return [...new Set(values)]; }

async function findIdentityCandidates(record: NormalizedSourceRecord): Promise<IdentityCandidate[]> {
  const supabase = getRadarHubClient();
  const identifierValues = unique(record.identifiers.map((identifier) => identifier.normalizedValue));
  const [identifierResult, nameResult] = await Promise.all([
    identifierValues.length ? supabase.from("radar_entity_identifiers").select("*").in("normalized_identifier", identifierValues) : Promise.resolve({ data: [], error: null }),
    supabase.from("radar_entities").select("*").eq("normalized_name", record.normalizedName).limit(20),
  ]);
  if (identifierResult.error) throw identifierResult.error;
  if (nameResult.error) throw nameResult.error;
  const entityIds = unique([...(identifierResult.data ?? []).map((identifier) => identifier.entity_id), ...(nameResult.data ?? []).map((entity) => entity.id)]);
  if (!entityIds.length) return [];
  const [entities, identifiers] = await Promise.all([
    supabase.from("radar_entities").select("*").in("id", entityIds),
    supabase.from("radar_entity_identifiers").select("*").in("entity_id", entityIds),
  ]);
  if (entities.error) throw entities.error;
  if (identifiers.error) throw identifiers.error;
  return (entities.data ?? []).map((entity) => ({
    entityId: entity.id, entityType: entity.entity_type, normalizedName: entity.normalized_name, city: entity.primary_city,
    identifiers: (identifiers.data ?? []).filter((identifier) => identifier.entity_id === entity.id).map((identifier) => ({
      sourceType: identifier.source_type as RadarSourceType, identifierType: identifier.identifier_type,
      value: identifier.identifier_value, normalizedValue: identifier.normalized_identifier, url: identifier.url,
      username: identifier.username, normalizedUsername: identifier.normalized_username, isPrimary: identifier.is_primary,
      confidence: identifier.confidence,
    })),
  }));
}

function entityInsert(record: NormalizedSourceRecord, score: ReturnType<typeof calculateTerritorialInfluenceScore>) {
  return {
    entity_type: record.entityType, display_name: record.displayName, normalized_name: record.normalizedName,
    description: record.description, primary_city: record.location.city, primary_state: record.location.state,
    primary_region: record.location.region, location_confidence: record.location.confidence,
    main_category: record.mainCategory, secondary_categories: record.secondaryCategories, tags: record.tags,
    status: "active" as const, influence_score: score.total, influence_score_breakdown: score as unknown as Json,
    confidence_score: record.confidence, last_enriched_at: record.capturedAt,
  };
}

async function saveRecord(record: NormalizedSourceRecord, actor: Actor) {
  const supabase = getRadarHubClient();
  const classification = await classifyPublicRole(record, createConfiguredAiClassifier());
  const classified = classification.category !== "unknown" && record.mainCategory === "outros" ? { ...record, mainCategory: classification.category } : record;
  const candidates = await findIdentityCandidates(classified);
  const resolution = resolveEntityIdentity(classified, candidates);
  const score = calculateTerritorialInfluenceScore({ record: classified, evidenceCount: classified.evidence.length, averageEvidenceConfidence: classified.confidence, lastCapturedAt: classified.capturedAt });
  let entityId: string;
  let created = false;
  if (resolution.action === "link" && resolution.entityId) {
    entityId = resolution.entityId;
    const existingResult = await supabase.from("radar_entities").select("*").eq("id", entityId).single();
    if (existingResult.error) throw existingResult.error;
    const existing = existingResult.data;
    const history = await supabase.from("radar_entity_history").insert({ entity_id: entityId, snapshot: existing as unknown as Json, changed_fields: ["evidence", "identifiers", "influence_score"], reason: `enrichment:${classified.sourceType}`, created_by: actor.id });
    if (history.error) throw history.error;
    const update = {
      display_name: existing.display_name || classified.displayName,
      description: existing.description ?? classified.description,
      primary_city: existing.primary_city ?? classified.location.city,
      primary_state: existing.primary_state ?? classified.location.state,
      primary_region: existing.primary_region ?? classified.location.region,
      location_confidence: Math.max(existing.location_confidence, classified.location.confidence),
      main_category: existing.main_category === "outros" ? classified.mainCategory : existing.main_category,
      secondary_categories: unique([...existing.secondary_categories, ...classified.secondaryCategories]),
      tags: unique([...existing.tags, ...classified.tags]),
      influence_score: Math.max(existing.influence_score, score.total),
      influence_score_breakdown: score as unknown as Json,
      confidence_score: Math.max(existing.confidence_score, classified.confidence),
      last_enriched_at: classified.capturedAt,
    };
    const saved = await supabase.from("radar_entities").update(update).eq("id", entityId);
    if (saved.error) throw saved.error;
  } else {
    const inserted = await supabase.from("radar_entities").insert(entityInsert(classified, score)).select("id").single();
    if (inserted.error) throw inserted.error;
    entityId = inserted.data.id;
    created = true;
  }

  if (classified.identifiers.length) {
    const identifierRows = classified.identifiers.map((identifier) => ({
      entity_id: entityId, source_type: identifier.sourceType, identifier_type: identifier.identifierType,
      identifier_value: identifier.value, normalized_identifier: identifier.normalizedValue, url: identifier.url,
      username: identifier.username, normalized_username: identifier.normalizedUsername, is_primary: identifier.isPrimary,
      confidence: identifier.confidence,
    }));
    const saved = await supabase.from("radar_entity_identifiers").upsert(identifierRows, { onConflict: "source_type,identifier_type,normalized_identifier", ignoreDuplicates: true });
    if (saved.error) throw saved.error;
  }
  if (classified.evidence.length) {
    const evidenceRows = classified.evidence.map((evidence) => ({
      entity_id: entityId, source_type: evidence.sourceType, source_name: evidence.sourceName,
      source_url: evidence.sourceUrl, source_reference: evidence.sourceReference, captured_at: evidence.capturedAt,
      field_name: evidence.fieldName, field_value: evidence.fieldValue, confidence: evidence.confidence,
      evidence_kind: evidence.evidenceKind, raw_excerpt: evidence.rawExcerpt, content_hash: evidence.contentHash,
    }));
    const saved = await supabase.from("radar_source_evidence").upsert(evidenceRows, { onConflict: "entity_id,field_name,source_type,content_hash", ignoreDuplicates: true });
    if (saved.error) throw saved.error;
  }
  let suggestionCreated = false;
  if (resolution.action === "suggest" && resolution.candidateId) {
    const pair = await supabase.from("radar_merge_suggestions").select("id").or(`and(entity_a_id.eq.${resolution.candidateId},entity_b_id.eq.${entityId}),and(entity_a_id.eq.${entityId},entity_b_id.eq.${resolution.candidateId})`).eq("status", "pending").maybeSingle();
    if (pair.error) throw pair.error;
    if (!pair.data) {
      const suggestion = await supabase.from("radar_merge_suggestions").insert({ entity_a_id: resolution.candidateId, entity_b_id: entityId, suggested_reason: resolution.reason, confidence: resolution.confidence }).select("id").single();
      if (suggestion.error) throw suggestion.error;
      suggestionCreated = true;
      await supabase.from("radar_entities").update({ status: "needs_review" }).in("id", [resolution.candidateId, entityId]);
    }
  }
  return { entityId, created, linked: resolution.action === "link", suggestionCreated };
}

export async function importRadarEntities(input: unknown, format: "csv" | "json" | "manual", actor: Actor, filename?: string | null): Promise<HubImportResult> {
  const provider = getProvider(format);
  const normalized = await provider.normalize(input);
  if (shouldUseMockData()) return { jobId: "mock-hub-import", total: normalized.length, inserted: normalized.length, updated: 0, duplicates: 0, mergeSuggestions: 0, rejected: 0, errors: [] };
  const supabase = getRadarHubClient();
  const job = await supabase.from("radar_enrichment_jobs").insert({ requested_by: actor.id, source_type: format, input_type: "import", mode: "safe", total_items: normalized.length }).select("*").single();
  if (job.error) throw job.error;
  await supabase.from("radar_enrichment_jobs").update({ status: "processing", started_at: new Date().toISOString() }).eq("id", job.data.id);
  const result: HubImportResult = { jobId: job.data.id, total: normalized.length, inserted: 0, updated: 0, duplicates: 0, mergeSuggestions: 0, rejected: 0, errors: [] };
  for (const record of normalized) {
    try {
      const saved = await saveRecord(record, actor);
      if (saved.created) result.inserted += 1; else { result.updated += 1; result.duplicates += 1; }
      if (saved.suggestionCreated) result.mergeSuggestions += 1;
    } catch (error) {
      result.rejected += 1;
      if (result.errors.length < 20) result.errors.push(error instanceof Error ? error.message : "Falha desconhecida.");
    }
  }
  const status = result.rejected ? "completed_with_errors" : "completed";
  const updated = await supabase.from("radar_enrichment_jobs").update({ status, processed_items: normalized.length, created_entities: result.inserted, updated_entities: result.updated, rejected_items: result.rejected, error_message: result.errors.join(" | ") || null, finished_at: new Date().toISOString() }).eq("id", job.data.id);
  if (updated.error) throw updated.error;
  void filename;
  return result;
}

export async function syncInstagramProfilesToRadarEntities(actor: Actor) {
  const provider = new ExistingInstagramProvider();
  const profiles = [];
  if (shouldUseMockData()) profiles.push(...MOCK_INFLUENCE_PROFILES);
  else {
    const supabase = getInfluenceClient();
    for (let offset = 0; ; offset += 1000) {
      const batch = await supabase.from("instagram_profiles").select("*").range(offset, offset + 999);
      if (batch.error) throw batch.error;
      profiles.push(...(batch.data ?? []));
      if ((batch.data?.length ?? 0) < 1000) break;
    }
  }
  const normalized = await provider.normalize(profiles);
  if (shouldUseMockData()) return { jobId: "mock-instagram-sync", total: normalized.length, inserted: normalized.length, updated: 0, rejected: 0, errors: [] };
  const supabase = getRadarHubClient();
  const job = await supabase.from("radar_enrichment_jobs").insert({ requested_by: actor.id, source_type: "instagram", input_type: "instagram_sync", mode: "safe", total_items: normalized.length }).select("*").single();
  if (job.error) throw job.error;
  await supabase.from("radar_enrichment_jobs").update({ status: "processing", started_at: new Date().toISOString() }).eq("id", job.data.id);
  let inserted = 0; let updated = 0; let rejected = 0; const errors: string[] = [];
  for (const record of normalized) {
    try { const saved = await saveRecord(record, actor); if (saved.created) inserted += 1; else updated += 1; }
    catch (error) { rejected += 1; if (errors.length < 20) errors.push(error instanceof Error ? error.message : "Falha desconhecida."); }
  }
  const status = rejected ? "completed_with_errors" : "completed";
  await Promise.all([
    supabase.from("radar_enrichment_jobs").update({ status, processed_items: normalized.length, created_entities: inserted, updated_entities: updated, rejected_items: rejected, error_message: errors.join(" | ") || null, finished_at: new Date().toISOString() }).eq("id", job.data.id),
    supabase.from("radar_source_connectors").update({ last_synced_at: new Date().toISOString(), last_health_status: "healthy", last_health_checked_at: new Date().toISOString() }).eq("source_type", "instagram"),
  ]);
  return { jobId: job.data.id, total: normalized.length, inserted, updated, rejected, errors };
}

export async function createEnrichmentJob(input: { entityIds: string[]; sourceTypes: string[]; mode: "safe" | "configured" | "manual_review"; processNow?: boolean }, actor: Actor) {
  const entityIds = unique(input.entityIds).slice(0, 1000);
  if (!entityIds.length) throw new Error("Selecione ao menos uma entidade.");
  const allowedSources = unique(input.sourceTypes.map((source) => sanitizeText(source, 40)).filter((source): source is string => Boolean(source))).slice(0, 10);
  if (input.mode === "configured" && !process.env.RADAR_ALLOWED_ENRICHMENT_ENDPOINTS) throw new Error("Nenhum endpoint de enriquecimento está configurado.");
  if (shouldUseMockData()) return { id: "mock-enrichment-job", status: input.processNow ? "completed" : "queued", total_items: entityIds.length, processed_items: input.processNow ? entityIds.length : 0 };
  const supabase = getRadarHubClient();
  const job = await supabase.from("radar_enrichment_jobs").insert({ requested_by: actor.id, source_type: allowedSources.join(",") || null, input_type: input.mode === "manual_review" ? "manual_review" : "entities", mode: input.mode, total_items: entityIds.length }).select("*").single();
  if (job.error) throw job.error;
  const queue = await supabase.from("radar_enrichment_queue").insert(entityIds.map((entityId) => ({ job_id: job.data.id, entity_id: entityId, source_type: allowedSources[0] ?? "radar_base", payload: { sourceTypes: allowedSources, mode: input.mode } })));
  if (queue.error) throw queue.error;
  return input.processNow ? processEnrichmentJob(job.data.id, actor) : job.data;
}

function entityToRecord(entity: RadarEntity, identifiers: RadarIdentifierRow[]): NormalizedSourceRecord {
  return {
    entityType: entity.entity_type, displayName: entity.display_name, normalizedName: entity.normalized_name,
    description: entity.description, mainCategory: entity.main_category, secondaryCategories: entity.secondary_categories as never,
    tags: entity.tags, location: { city: entity.primary_city, state: entity.primary_state, region: entity.primary_region, confidence: entity.location_confidence },
    identifiers: identifiers.map((identifier) => ({ sourceType: identifier.source_type as RadarSourceType, identifierType: identifier.identifier_type, value: identifier.identifier_value, normalizedValue: identifier.normalized_identifier, url: identifier.url, username: identifier.username, normalizedUsername: identifier.normalized_username, isPrimary: identifier.is_primary, confidence: identifier.confidence })),
    evidence: [], metrics: { followers: 0, subscribers: 0, declaredReach: 0, platforms: new Set(identifiers.map((identifier) => identifier.source_type)).size, legacyInfluenceScore: entity.influence_score, internalEngagement: 0 },
    confidence: entity.confidence_score, sourceType: "radar_base", sourceReference: entity.id, capturedAt: entity.last_enriched_at ?? entity.updated_at,
  };
}

export async function processEnrichmentJob(jobId: string, actor: Actor) {
  const supabase = getRadarHubClient();
  const job = await supabase.from("radar_enrichment_jobs").select("*").eq("id", jobId).single();
  if (job.error) throw job.error;
  await supabase.from("radar_enrichment_jobs").update({ status: "processing", started_at: job.data.started_at ?? new Date().toISOString() }).eq("id", jobId);
  const queue = await supabase.from("radar_enrichment_queue").select("*").eq("job_id", jobId).in("status", ["pending", "failed"]).lte("next_run_at", new Date().toISOString()).limit(1000);
  if (queue.error) throw queue.error;
  let processed = 0; let rejected = 0;
  for (const item of queue.data ?? []) {
    if (!item.entity_id) { rejected += 1; continue; }
    await supabase.from("radar_enrichment_queue").update({ status: "processing", attempts: item.attempts + 1, locked_at: new Date().toISOString(), locked_by: actor.id }).eq("id", item.id).in("status", ["pending", "failed"]);
    try {
      const [entity, identifiers, evidence, relationships] = await Promise.all([
        supabase.from("radar_entities").select("*").eq("id", item.entity_id).single(),
        supabase.from("radar_entity_identifiers").select("*").eq("entity_id", item.entity_id),
        supabase.from("radar_source_evidence").select("confidence,captured_at").eq("entity_id", item.entity_id),
        supabase.from("radar_entity_relationships").select("id,subject_entity_id,object_entity_id").or(`subject_entity_id.eq.${item.entity_id},object_entity_id.eq.${item.entity_id}`),
      ]);
      if (entity.error) throw entity.error; if (identifiers.error) throw identifiers.error; if (evidence.error) throw evidence.error; if (relationships.error) throw relationships.error;
      const record = entityToRecord(entity.data, identifiers.data ?? []);
      if (job.data.mode === "configured") {
        const endpoint = (process.env.RADAR_ALLOWED_ENRICHMENT_ENDPOINTS ?? "").split(",").map((value) => value.trim()).filter(Boolean)[0];
        if (!endpoint) throw new Error("Endpoint configurado indisponível.");
        const enriched = await new ConfiguredHttpProvider(endpoint).enrich(record);
        await saveRecord(enriched.record, actor);
      } else if (job.data.mode === "manual_review") {
        const candidates = await supabase.from("radar_entities").select("*").eq("normalized_name", entity.data.normalized_name).neq("id", entity.data.id).limit(20);
        if (candidates.error) throw candidates.error;
        for (const candidate of candidates.data ?? []) {
          const existing = await supabase.from("radar_merge_suggestions").select("id").or(`and(entity_a_id.eq.${entity.data.id},entity_b_id.eq.${candidate.id}),and(entity_a_id.eq.${candidate.id},entity_b_id.eq.${entity.data.id})`).eq("status", "pending").maybeSingle();
          if (!existing.data) await supabase.from("radar_merge_suggestions").insert({ entity_a_id: entity.data.id, entity_b_id: candidate.id, suggested_reason: "Mesmo nome normalizado; revisão manual solicitada.", confidence: entity.data.primary_city && entity.data.primary_city === candidate.primary_city ? 0.78 : 0.55 });
        }
      } else {
        const evidenceItems = evidence.data ?? [];
        const average = evidenceItems.length ? evidenceItems.reduce((sum, item) => sum + item.confidence, 0) / evidenceItems.length : entity.data.confidence_score;
        const score = calculateTerritorialInfluenceScore({ record, relationshipCount: relationships.data?.length ?? 0, evidenceCount: evidenceItems.length, averageEvidenceConfidence: average, lastCapturedAt: evidenceItems[0]?.captured_at ?? entity.data.updated_at });
        await supabase.from("radar_entity_history").insert({ entity_id: entity.data.id, snapshot: entity.data as unknown as Json, changed_fields: ["influence_score"], reason: "safe_recalculation", created_by: actor.id });
        await supabase.from("radar_entities").update({ influence_score: score.total, influence_score_breakdown: score as unknown as Json, last_enriched_at: new Date().toISOString() }).eq("id", entity.data.id);
      }
      await supabase.from("radar_enrichment_queue").update({ status: job.data.mode === "manual_review" ? "manual_review" : "completed", locked_at: null, locked_by: null, last_error: null }).eq("id", item.id);
      processed += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message.slice(0, 1000) : "Falha desconhecida.";
      const delay = 2 ** Math.min(item.attempts + 1, 8);
      await supabase.from("radar_enrichment_queue").update({ status: "failed", locked_at: null, locked_by: null, last_error: message, next_run_at: new Date(Date.now() + delay * 60_000).toISOString() }).eq("id", item.id);
      rejected += 1;
    }
  }
  const status = rejected ? "completed_with_errors" : "completed";
  const savedJob = await supabase.from("radar_enrichment_jobs").update({ status, processed_items: job.data.processed_items + processed, rejected_items: job.data.rejected_items + rejected, finished_at: new Date().toISOString() }).eq("id", jobId).select("*").single();
  if (savedJob.error) throw savedJob.error;
  return savedJob.data;
}

export async function reviewMergeSuggestion(id: string, decision: "approved" | "rejected", actor: Actor) {
  if (shouldUseMockData()) return { ...MOCK_RADAR_ENTITIES[1], suggestionId: id, decision };
  const supabase = getRadarHubClient();
  const suggestion = await supabase.from("radar_merge_suggestions").select("*").eq("id", id).eq("status", "pending").single();
  if (suggestion.error) throw suggestion.error;
  const reviewedAt = new Date().toISOString();
  const updated = await supabase.from("radar_merge_suggestions").update({ status: decision, reviewed_by: actor.id, reviewed_at: reviewedAt }).eq("id", id);
  if (updated.error) throw updated.error;
  if (decision === "approved") {
    const relation = await supabase.from("radar_entity_relationships").upsert({ subject_entity_id: suggestion.data.entity_b_id, predicate: "same_as", object_entity_id: suggestion.data.entity_a_id, relationship_label: "Identidade equivalente aprovada em revisão humana", confidence: Math.max(0.98, suggestion.data.confidence), evidence_id: null, valid_from: reviewedAt, valid_until: null }, { onConflict: "subject_entity_id,predicate,object_entity_id" });
    if (relation.error) throw relation.error;
    await supabase.from("radar_entities").update({ status: "merged" }).eq("id", suggestion.data.entity_b_id);
  } else {
    await supabase.from("radar_entities").update({ status: "active" }).in("id", [suggestion.data.entity_a_id, suggestion.data.entity_b_id]).eq("status", "needs_review");
  }
  return { ...suggestion.data, status: decision, reviewed_by: actor.id, reviewed_at: reviewedAt };
}

export async function createRadarRelationship(input: { subjectEntityId: string; objectEntityId: string; predicate: RadarRelationshipPredicate; label?: string | null; confidence: number; evidenceId?: string | null }) {
  if (input.subjectEntityId === input.objectEntityId) throw new Error("Uma relação exige duas entidades diferentes.");
  if (input.confidence < 0 || input.confidence > 1) throw new Error("Confiança deve estar entre 0 e 1.");
  if (input.predicate === "same_as" && input.confidence < 0.98) throw new Error("same_as exige confiança mínima de 0,98; use possibly_same_as.");
  if (shouldUseMockData()) return { id: "mock-relationship", ...input };
  const result = await getRadarHubClient().from("radar_entity_relationships").upsert({ subject_entity_id: input.subjectEntityId, object_entity_id: input.objectEntityId, predicate: input.predicate, relationship_label: sanitizeText(input.label, 200), confidence: input.confidence, evidence_id: input.evidenceId ?? null, valid_from: null, valid_until: null }, { onConflict: "subject_entity_id,predicate,object_entity_id" }).select("*").single();
  if (result.error) throw result.error;
  return result.data;
}

export async function addRadarEntityNote(entityId: string, body: string, actor: Actor) {
  const sanitized = sanitizeText(body, 2000);
  if (!sanitized) throw new Error("Observação vazia.");
  if (shouldUseMockData()) return { id: 1, entity_id: entityId, body: sanitized, created_by: actor.id, created_by_email: actor.email, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  const result = await getRadarHubClient().from("radar_entity_notes").insert({ entity_id: entityId, body: sanitized, created_by: actor.id, created_by_email: actor.email }).select("*").single();
  if (result.error) throw result.error;
  return result.data;
}

