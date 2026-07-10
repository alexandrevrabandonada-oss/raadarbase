import type { SupabaseClient } from "@supabase/supabase-js";
import type { Json } from "@/lib/supabase/database.types";
import type { InfluenceProfile } from "@/lib/influence/types";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type TableDefinition<Row, Insert = Partial<Row>, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

type ProfileInsert = Omit<InfluenceProfile, "id" | "created_at" | "updated_at"> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type InfluenceDatabase = {
  public: {
    Tables: {
      instagram_profiles: TableDefinition<InfluenceProfile, ProfileInsert, Partial<ProfileInsert>>;
      influence_score_config: TableDefinition<{
        id: string; config: Json; updated_at: string; updated_by: string | null;
      }>;
      instagram_profile_history: TableDefinition<{
        id: number; profile_id: string; snapshot: Json; changed_fields: string[];
        reason: string; created_at: string; created_by: string | null;
      }, {
        profile_id: string; snapshot: Json; changed_fields?: string[]; reason?: string; created_by?: string | null;
      }>;
      instagram_profile_classifications: TableDefinition<{
        id: number; profile_id: string; categoria: string; confidence: number; source: string;
        rationale: string | null; created_at: string; created_by: string | null;
      }, {
        profile_id: string; categoria: string; confidence: number; source: string;
        rationale?: string | null; created_by?: string | null;
      }>;
      instagram_profile_notes: TableDefinition<{
        id: number; profile_id: string; body: string; created_at: string;
        created_by: string; created_by_email: string | null;
      }, {
        profile_id: string; body: string; created_by: string; created_by_email?: string | null;
      }>;
      instagram_imports: TableDefinition<{
        id: string; filename: string | null; format: string; status: string; total_rows: number;
        inserted_rows: number; updated_rows: number; duplicate_rows: number; rejected_rows: number;
        error_summary: string | null; created_at: string; completed_at: string | null; created_by: string;
      }, {
        filename?: string | null; format: string; status?: string; total_rows?: number; inserted_rows?: number;
        updated_rows?: number; duplicate_rows?: number; rejected_rows?: number; error_summary?: string | null;
        completed_at?: string | null; created_by: string;
      }>;
      instagram_update_jobs: TableDefinition<{
        id: string; status: string; stale_before: string; requested_limit: number; concurrency: number;
        total_items: number; completed_items: number; failed_items: number; created_at: string;
        started_at: string | null; completed_at: string | null; created_by: string;
      }, {
        status?: string; stale_before: string; requested_limit: number; concurrency: number;
        total_items?: number; completed_items?: number; failed_items?: number; started_at?: string | null;
        completed_at?: string | null; created_by: string;
      }>;
      instagram_update_queue: TableDefinition<{
        id: number; job_id: string; profile_id: string; status: string; attempts: number; max_attempts: number;
        next_attempt_at: string; locked_at: string | null; locked_by: string | null; last_error: string | null;
        created_at: string; updated_at: string;
      }, {
        job_id: string; profile_id: string; status?: string; attempts?: number; max_attempts?: number;
        next_attempt_at?: string; locked_at?: string | null; locked_by?: string | null; last_error?: string | null;
      }>;
      instagram_processing_logs: TableDefinition<{
        id: number; job_id: string | null; profile_id: string | null; level: string; event: string;
        message: string; metadata: Json; created_at: string;
      }, {
        job_id?: string | null; profile_id?: string | null; level: string; event: string;
        message: string; metadata?: Json;
      }>;
    };
    Views: Record<string, never>;
    Functions: {
      get_instagram_influence_kpis: {
        Args: Record<PropertyKey, never>;
        Returns: Array<{ total_profiles: number; total_followers: number; average_followers: number }>;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export function getInfluenceClient() {
  return getSupabaseAdminClient() as unknown as SupabaseClient<InfluenceDatabase>;
}

