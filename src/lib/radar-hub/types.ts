import type { Json } from "@/lib/supabase/database.types";

export const RADAR_ENTITY_TYPES = [
  "person", "organization", "company", "public_institution", "media", "union",
  "association", "collective", "event", "community", "digital_profile", "unknown",
] as const;
export type RadarEntityType = (typeof RADAR_ENTITY_TYPES)[number];

export const RADAR_CATEGORIES = [
  "professor", "medico", "advogado", "jornalista", "empresa", "comercio", "sindicato",
  "ong", "associacao", "coletivo", "ambiental", "cultura", "esporte", "educacao",
  "saude", "servidor_publico", "politica_institucional", "influenciador",
  "veiculo_de_imprensa", "bairro_comunidade", "outros",
] as const;
export type RadarCategory = (typeof RADAR_CATEGORIES)[number];

export const RADAR_SOURCE_TYPES = [
  "instagram", "facebook", "tiktok", "youtube", "linkedin", "threads", "x", "website",
  "news", "tse", "cnpj", "portal_publico", "manual", "csv", "json", "radar_base", "seed",
] as const;
export type RadarSourceType = (typeof RADAR_SOURCE_TYPES)[number];

export const RADAR_RELATIONSHIP_PREDICATES = [
  "works_at", "owns", "member_of", "related_to", "appeared_in", "organized",
  "participated_in", "located_in", "mentions", "partner_of", "same_as", "possibly_same_as",
] as const;
export type RadarRelationshipPredicate = (typeof RADAR_RELATIONSHIP_PREDICATES)[number];

export type RadarIdentifierInput = {
  sourceType: RadarSourceType;
  identifierType: string;
  value: string;
  normalizedValue: string;
  url: string | null;
  username: string | null;
  normalizedUsername: string | null;
  isPrimary: boolean;
  confidence: number;
};

export type RadarEvidenceInput = {
  sourceType: RadarSourceType;
  sourceName: string;
  sourceUrl: string | null;
  sourceReference: string | null;
  capturedAt: string;
  fieldName: string;
  fieldValue: Json;
  confidence: number;
  evidenceKind: "imported_field" | "public_excerpt" | "official_api" | "manual_assertion" | "internal_record" | "derived_non_sensitive";
  rawExcerpt: string | null;
  contentHash: string;
};

export type NormalizedSourceRecord = {
  entityType: RadarEntityType;
  displayName: string;
  normalizedName: string;
  description: string | null;
  mainCategory: RadarCategory;
  secondaryCategories: RadarCategory[];
  tags: string[];
  location: { city: string | null; state: string | null; region: string | null; confidence: number };
  identifiers: RadarIdentifierInput[];
  evidence: RadarEvidenceInput[];
  metrics: { followers: number; subscribers: number; declaredReach: number; platforms: number; legacyInfluenceScore: number; internalEngagement: number };
  confidence: number;
  sourceType: RadarSourceType;
  sourceReference: string | null;
  capturedAt: string;
};

export type TerritorialInfluenceBreakdown = {
  total: number;
  digital_reach: number;
  regional_relevance: number;
  institutional_relevance: number;
  network: number;
  engagement: number;
  data_quality: number;
  freshness_decay: number;
  explanation: string[];
};

export type RadarEntity = {
  id: string;
  entity_type: RadarEntityType;
  display_name: string;
  normalized_name: string;
  description: string | null;
  primary_city: string | null;
  primary_state: string | null;
  primary_region: string | null;
  location_confidence: number;
  main_category: RadarCategory;
  secondary_categories: string[];
  tags: string[];
  status: "active" | "needs_review" | "merged" | "archived";
  influence_score: number;
  influence_score_breakdown: Json;
  confidence_score: number;
  last_enriched_at: string | null;
  created_at: string;
  updated_at: string;
};

export type RadarEntityFilters = {
  q?: string;
  entityType?: RadarEntityType;
  category?: RadarCategory;
  city?: string;
  state?: string;
  region?: string;
  sourceType?: RadarSourceType;
  minScore?: number;
  maxScore?: number;
  hasRelationship?: boolean;
  page?: number;
  pageSize?: number;
  sort?: "score" | "name" | "confidence" | "updated";
  direction?: "asc" | "desc";
};

export type RadarEntityListResult = {
  items: RadarEntity[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  kpis: { totalEntities: number; averageScore: number; averageConfidence: number; needsReview: number; pendingEnrichment: number };
  facets: { entityTypes: Record<string, number>; categories: Record<string, number>; cities: Record<string, number>; sources: Record<string, number> };
};

export const ENTITY_TYPE_LABELS: Record<RadarEntityType, string> = {
  person: "Pessoa", organization: "Organização", company: "Empresa", public_institution: "Instituição pública",
  media: "Imprensa", union: "Sindicato", association: "Associação", collective: "Coletivo", event: "Evento",
  community: "Comunidade", digital_profile: "Perfil digital", unknown: "Não definido",
};

export const RADAR_CATEGORY_LABELS: Record<RadarCategory, string> = {
  professor: "Professor(a)", medico: "Médico(a)", advogado: "Advogado(a)", jornalista: "Jornalista",
  empresa: "Empresa", comercio: "Comércio", sindicato: "Sindicato", ong: "ONG", associacao: "Associação",
  coletivo: "Coletivo", ambiental: "Ambiental", cultura: "Cultura", esporte: "Esporte", educacao: "Educação",
  saude: "Saúde", servidor_publico: "Servidor(a) público(a)", politica_institucional: "Política institucional",
  influenciador: "Influenciador(a)", veiculo_de_imprensa: "Veículo de imprensa", bairro_comunidade: "Bairro/comunidade", outros: "Outros",
};

