import type { Json } from "@/lib/supabase/database.types";
import type { RadarConnectorRow, RadarEvidenceRow, RadarIdentifierRow, RadarMergeSuggestionRow, RadarRelationshipRow } from "@/lib/radar-hub/db-types";
import type { RadarEntity } from "@/lib/radar-hub/types";

const now = new Date().toISOString();
function breakdown(total: number, explanation: string): Json { return { total, digital_reach: 18, regional_relevance: 18, institutional_relevance: 12, network: 7, engagement: 5, data_quality: total - 60, freshness_decay: 1, explanation: [explanation] }; }

export const MOCK_RADAR_ENTITIES: RadarEntity[] = [
  { id: "56000000-0000-4000-8000-000000000001", entity_type: "person", display_name: "Professora Aurora Demo", normalized_name: "professora aurora demo", description: "Docente fictícia de educação pública.", primary_city: "Volta Redonda", primary_state: "RJ", primary_region: "Sul Fluminense", location_confidence: .98, main_category: "professor", secondary_categories: ["educacao"], tags: ["seed", "educacao"], status: "active", influence_score: 71.2, influence_score_breakdown: breakdown(71.2, "Cidade e profissão sustentadas por fixture fictícia."), confidence_score: .94, last_enriched_at: now, created_at: now, updated_at: now },
  { id: "56000000-0000-4000-8000-000000000002", entity_type: "association", display_name: "Associação Horizonte Demo", normalized_name: "associacao horizonte demo", description: "Associação comunitária fictícia.", primary_city: "Barra Mansa", primary_state: "RJ", primary_region: "Sul Fluminense", location_confidence: .98, main_category: "associacao", secondary_categories: ["bairro_comunidade"], tags: ["seed", "comunidade"], status: "needs_review", influence_score: 66.5, influence_score_breakdown: breakdown(66.5, "Atuação associativa fictícia em Barra Mansa."), confidence_score: .92, last_enriched_at: now, created_at: now, updated_at: now },
  { id: "56000000-0000-4000-8000-000000000003", entity_type: "media", display_name: "Jornal Serra Demo", normalized_name: "jornal serra demo", description: "Veículo de imprensa regional fictício.", primary_city: "Resende", primary_state: "RJ", primary_region: "Sul Fluminense", location_confidence: .99, main_category: "veiculo_de_imprensa", secondary_categories: [], tags: ["seed", "imprensa"], status: "active", influence_score: 78.4, influence_score_breakdown: breakdown(78.4, "Veículo regional fictício com fonte seed."), confidence_score: .96, last_enriched_at: now, created_at: now, updated_at: now },
  { id: "56000000-0000-4000-8000-000000000004", entity_type: "company", display_name: "Comércio Costa Demo", normalized_name: "comercio costa demo", description: "Comércio fictício sem dados reais.", primary_city: "Angra dos Reis", primary_state: "RJ", primary_region: "Costa Verde", location_confidence: .97, main_category: "comercio", secondary_categories: [], tags: ["seed", "comercio"], status: "active", influence_score: 58.1, influence_score_breakdown: breakdown(58.1, "Comércio fictício em fonte seed."), confidence_score: .89, last_enriched_at: now, created_at: now, updated_at: now },
  { id: "56000000-0000-4000-8000-000000000005", entity_type: "digital_profile", display_name: "Perfil Digital Ponte Demo", normalized_name: "perfil digital ponte demo", description: "Perfil digital fictício vinculado ao seed Instagram.", primary_city: "Volta Redonda", primary_state: "RJ", primary_region: "Sul Fluminense", location_confidence: .95, main_category: "influenciador", secondary_categories: [], tags: ["seed", "instagram"], status: "active", influence_score: 63.7, influence_score_breakdown: breakdown(63.7, "Alcance preservado do seed do Tijolo 55."), confidence_score: .91, last_enriched_at: now, created_at: now, updated_at: now },
];

export const MOCK_RADAR_IDENTIFIERS: RadarIdentifierRow[] = [
  { id: "56100000-0000-4000-8000-000000000001", entity_id: MOCK_RADAR_ENTITIES[4].id, source_type: "instagram", identifier_type: "username", identifier_value: "radar_empresa_demo", normalized_identifier: "radar_empresa_demo", url: null, username: "radar_empresa_demo", normalized_username: "radar_empresa_demo", is_primary: true, confidence: .99, created_at: now, updated_at: now },
];
export const MOCK_RADAR_EVIDENCE: RadarEvidenceRow[] = MOCK_RADAR_ENTITIES.flatMap((entity, index) => [
  { id: `56200000-0000-4000-8000-00000000000${index + 1}`, entity_id: entity.id, source_type: "seed", source_name: "Seed fictício", source_url: null, source_reference: `fixture-${index + 1}`, captured_at: now, field_name: "display_name", field_value: entity.display_name, confidence: 1, evidence_kind: "internal_record", raw_excerpt: entity.display_name, content_hash: `hash-${index + 1}`, created_at: now },
]);
export const MOCK_RADAR_RELATIONSHIPS: RadarRelationshipRow[] = [
  { id: "56300000-0000-4000-8000-000000000001", subject_entity_id: MOCK_RADAR_ENTITIES[0].id, predicate: "member_of", object_entity_id: MOCK_RADAR_ENTITIES[1].id, relationship_label: "Participação comunitária fictícia", confidence: .9, evidence_id: null, valid_from: null, valid_until: null, created_at: now, updated_at: now },
  { id: "56300000-0000-4000-8000-000000000002", subject_entity_id: MOCK_RADAR_ENTITIES[2].id, predicate: "mentions", object_entity_id: MOCK_RADAR_ENTITIES[1].id, relationship_label: "Menção fictícia", confidence: .85, evidence_id: null, valid_from: null, valid_until: null, created_at: now, updated_at: now },
];
export const MOCK_RADAR_MERGES: RadarMergeSuggestionRow[] = [
  { id: "56400000-0000-4000-8000-000000000001", entity_a_id: MOCK_RADAR_ENTITIES[1].id, entity_b_id: MOCK_RADAR_ENTITIES[4].id, suggested_reason: "Fixture de possível vínculo; exige revisão.", confidence: .73, status: "pending", reviewed_by: null, reviewed_at: null, created_at: now },
];
export const MOCK_RADAR_CONNECTORS: RadarConnectorRow[] = [
  ["manual", "Entrada manual", true, "internal", false, "healthy"], ["csv", "Importação CSV", true, "file_import", false, "healthy"],
  ["json", "Importação JSON", true, "file_import", false, "healthy"], ["instagram", "Instagram existente (Tijolo 55)", true, "internal", false, "healthy"],
  ["configured_http", "Endpoint HTTP configurado", false, "configured_endpoint", true, "not_configured"],
].map(([source, name, enabled, mode, key, health], index) => ({ id: `56500000-0000-4000-8000-00000000000${index + 1}`, source_type: String(source), display_name: String(name), enabled: Boolean(enabled), mode: String(mode), base_url: null, rate_limit_per_minute: 30, requires_api_key: Boolean(key), last_health_status: String(health), last_health_checked_at: now, last_synced_at: source === "instagram" ? now : null, created_at: now, updated_at: now }));

