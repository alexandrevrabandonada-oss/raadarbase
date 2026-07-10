import type { SupabaseClient } from "@supabase/supabase-js";
import type { Json } from "@/lib/supabase/database.types";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { RadarEntity } from "@/lib/radar-hub/types";

type Table<Row, Insert = Partial<Row>, Update = Partial<Insert>> = { Row: Row; Insert: Insert; Update: Update; Relationships: [] };
type EntityInsert = Omit<RadarEntity, "id" | "created_at" | "updated_at"> & { id?: string; created_at?: string; updated_at?: string };

export type RadarIdentifierRow = {
  id: string; entity_id: string; source_type: string; identifier_type: string; identifier_value: string;
  normalized_identifier: string; url: string | null; username: string | null; normalized_username: string | null;
  is_primary: boolean; confidence: number; created_at: string; updated_at: string;
};
export type RadarEvidenceRow = {
  id: string; entity_id: string; source_type: string; source_name: string; source_url: string | null;
  source_reference: string | null; captured_at: string; field_name: string; field_value: Json; confidence: number;
  evidence_kind: string; raw_excerpt: string | null; content_hash: string; created_at: string;
};
export type RadarRelationshipRow = {
  id: string; subject_entity_id: string; predicate: string; object_entity_id: string; relationship_label: string | null;
  confidence: number; evidence_id: string | null; valid_from: string | null; valid_until: string | null; created_at: string; updated_at: string;
};
export type RadarJobRow = {
  id: string; status: string; requested_by: string; source_type: string | null; input_type: string; mode: string;
  total_items: number; processed_items: number; created_entities: number; updated_entities: number;
  merged_entities: number; rejected_items: number; error_message: string | null; started_at: string | null;
  finished_at: string | null; created_at: string;
};
export type RadarQueueRow = {
  id: number; job_id: string; entity_id: string | null; source_type: string; payload: Json; status: string;
  attempts: number; max_attempts: number; locked_at: string | null; locked_by: string | null; next_run_at: string;
  last_error: string | null; created_at: string; updated_at: string;
};
export type RadarMergeSuggestionRow = {
  id: string; entity_a_id: string; entity_b_id: string; suggested_reason: string; confidence: number;
  status: string; reviewed_by: string | null; reviewed_at: string | null; created_at: string;
};
export type RadarConnectorRow = {
  id: string; source_type: string; display_name: string; enabled: boolean; mode: string; base_url: string | null;
  rate_limit_per_minute: number; requires_api_key: boolean; last_health_status: string | null;
  last_health_checked_at: string | null; last_synced_at: string | null; created_at: string; updated_at: string;
};
export type RadarHistoryRow = { id: number; entity_id: string; snapshot: Json; changed_fields: string[]; reason: string; created_by: string | null; created_at: string };
export type RadarNoteRow = { id: number; entity_id: string; body: string; created_by: string; created_by_email: string | null; created_at: string; updated_at: string };

export type RadarHubDatabase = {
  public: {
    Tables: {
      radar_entities: Table<RadarEntity, EntityInsert, Partial<EntityInsert>>;
      radar_entity_identifiers: Table<RadarIdentifierRow, Omit<RadarIdentifierRow, "id" | "created_at" | "updated_at"> & { id?: string; created_at?: string; updated_at?: string }>;
      radar_source_evidence: Table<RadarEvidenceRow, Omit<RadarEvidenceRow, "id" | "created_at"> & { id?: string; created_at?: string }>;
      radar_entity_relationships: Table<RadarRelationshipRow, Omit<RadarRelationshipRow, "id" | "created_at" | "updated_at"> & { id?: string; created_at?: string; updated_at?: string }>;
      radar_enrichment_jobs: Table<RadarJobRow, Omit<RadarJobRow, "id" | "created_at" | "status" | "processed_items" | "created_entities" | "updated_entities" | "merged_entities" | "rejected_items" | "error_message" | "started_at" | "finished_at"> & Partial<Pick<RadarJobRow, "id" | "created_at" | "status" | "processed_items" | "created_entities" | "updated_entities" | "merged_entities" | "rejected_items" | "error_message" | "started_at" | "finished_at">>>;
      radar_enrichment_queue: Table<RadarQueueRow, Omit<RadarQueueRow, "id" | "created_at" | "updated_at" | "status" | "attempts" | "max_attempts" | "locked_at" | "locked_by" | "next_run_at" | "last_error"> & Partial<Pick<RadarQueueRow, "status" | "attempts" | "max_attempts" | "locked_at" | "locked_by" | "next_run_at" | "last_error">>>;
      radar_merge_suggestions: Table<RadarMergeSuggestionRow, Omit<RadarMergeSuggestionRow, "id" | "created_at" | "status" | "reviewed_by" | "reviewed_at"> & Partial<Pick<RadarMergeSuggestionRow, "status" | "reviewed_by" | "reviewed_at">>>;
      radar_source_connectors: Table<RadarConnectorRow>;
      radar_entity_history: Table<RadarHistoryRow, Omit<RadarHistoryRow, "id" | "created_at"> & { id?: number; created_at?: string }>;
      radar_entity_notes: Table<RadarNoteRow, Omit<RadarNoteRow, "id" | "created_at" | "updated_at"> & { id?: number; created_at?: string; updated_at?: string }>;
    };
    Views: Record<string, never>;
    Functions: {
      get_radar_entity_kpis: { Args: Record<PropertyKey, never>; Returns: Array<{ total_entities: number; average_score: number; average_confidence: number; needs_review: number; pending_enrichment: number }> };
      search_radar_entities: { Args: { p_q?: string | null; p_entity_type?: string | null; p_category?: string | null; p_city?: string | null; p_state?: string | null; p_region?: string | null; p_source_type?: string | null; p_min_score?: number | null; p_max_score?: number | null; p_has_relationship?: boolean | null; p_offset?: number; p_limit?: number; p_sort?: string; p_direction?: string }; Returns: Array<{ entity: Json; total_count: number }> };
      get_radar_entity_facets: { Args: Record<PropertyKey, never>; Returns: Json };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export function getRadarHubClient() {
  return getSupabaseAdminClient() as unknown as SupabaseClient<RadarHubDatabase>;
}
