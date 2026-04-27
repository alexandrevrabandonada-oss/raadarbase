export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string;
          actor_email: string | null;
          actor_id: string | null;
          created_at: string;
          entity_id: string | null;
          entity_type: string;
          id: string;
          metadata: Json;
          summary: string;
        };
        Insert: {
          action: string;
          actor_email?: string | null;
          actor_id?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type: string;
          id?: string;
          metadata?: Json;
          summary: string;
        };
        Update: {
          action?: string;
          actor_email?: string | null;
          actor_id?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string;
          id?: string;
          metadata?: Json;
          summary?: string;
        };
        Relationships: [];
      };
      contacts: {
        Row: {
          consent_given: boolean;
          consent_purpose: string;
          consent_recorded_at: string | null;
          consent_status: Database["public"]["Enums"]["consent_status"];
          contact_channel: string;
          contact_value: string | null;
          created_at: string;
          email: string | null;
          id: string;
          last_contacted_at: string | null;
          person_id: string;
          phone: string | null;
          privacy_policy_url: string | null;
          source: string;
          updated_at: string;
        };
        Insert: {
          consent_given?: boolean;
          consent_purpose: string;
          consent_recorded_at?: string | null;
          consent_status?: Database["public"]["Enums"]["consent_status"];
          contact_channel: string;
          contact_value?: string | null;
          created_at?: string;
          email?: string | null;
          id?: string;
          last_contacted_at?: string | null;
          person_id: string;
          phone?: string | null;
          privacy_policy_url?: string | null;
          source?: string;
          updated_at?: string;
        };
        Update: {
          consent_given?: boolean;
          consent_purpose?: string;
          consent_recorded_at?: string | null;
          consent_status?: Database["public"]["Enums"]["consent_status"];
          contact_channel?: string;
          contact_value?: string | null;
          created_at?: string;
          email?: string | null;
          id?: string;
          last_contacted_at?: string | null;
          person_id?: string;
          phone?: string | null;
          privacy_policy_url?: string | null;
          source?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "contacts_person_id_fkey";
            columns: ["person_id"];
            referencedRelation: "ig_people";
            referencedColumns: ["id"];
          },
        ];
      };
      ig_interactions: {
        Row: {
          created_at: string;
          external_id: string | null;
          id: string;
          instagram_interaction_id: string | null;
          occurred_at: string;
          person_id: string;
          post_id: string | null;
          raw: Json | null;
          raw_payload: Json;
          synced_at: string | null;
          text_content: string | null;
          theme: string | null;
          type: Database["public"]["Enums"]["interaction_type"];
        };
        Insert: {
          created_at?: string;
          external_id?: string | null;
          id?: string;
          instagram_interaction_id?: string | null;
          occurred_at: string;
          person_id: string;
          post_id?: string | null;
          raw?: Json | null;
          raw_payload?: Json;
          synced_at?: string | null;
          text_content?: string | null;
          theme?: string | null;
          type: Database["public"]["Enums"]["interaction_type"];
        };
        Update: {
          created_at?: string;
          external_id?: string | null;
          id?: string;
          instagram_interaction_id?: string | null;
          occurred_at?: string;
          person_id?: string;
          post_id?: string | null;
          raw?: Json | null;
          raw_payload?: Json;
          synced_at?: string | null;
          text_content?: string | null;
          theme?: string | null;
          type?: Database["public"]["Enums"]["interaction_type"];
        };
        Relationships: [
          {
            foreignKeyName: "ig_interactions_person_id_fkey";
            columns: ["person_id"];
            referencedRelation: "ig_people";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ig_interactions_post_id_fkey";
            columns: ["post_id"];
            referencedRelation: "ig_posts";
            referencedColumns: ["id"];
          },
        ];
      };
      ig_people: {
        Row: {
          created_at: string;
          display_name: string | null;
          do_not_contact_reason: string | null;
          id: string;
          instagram_user_id: string | null;
          last_interaction_at: string | null;
          notes: string;
          raw: Json | null;
          synced_at: string | null;
          status: Database["public"]["Enums"]["person_status"];
          themes: string[];
          total_interactions: number;
          updated_at: string;
          username: string;
        };
        Insert: {
          created_at?: string;
          display_name?: string | null;
          do_not_contact_reason?: string | null;
          id?: string;
          instagram_user_id?: string | null;
          last_interaction_at?: string | null;
          notes?: string;
          raw?: Json | null;
          synced_at?: string | null;
          status?: Database["public"]["Enums"]["person_status"];
          themes?: string[];
          total_interactions?: number;
          updated_at?: string;
          username: string;
        };
        Update: {
          created_at?: string;
          display_name?: string | null;
          do_not_contact_reason?: string | null;
          id?: string;
          instagram_user_id?: string | null;
          last_interaction_at?: string | null;
          notes?: string;
          raw?: Json | null;
          synced_at?: string | null;
          status?: Database["public"]["Enums"]["person_status"];
          themes?: string[];
          total_interactions?: number;
          updated_at?: string;
          username?: string;
        };
        Relationships: [];
      };
      ig_posts: {
        Row: {
          caption: string | null;
          created_at: string;
          id: string;
          instagram_post_id: string;
          media_type: string | null;
          metrics: Json;
          permalink: string | null;
          published_at: string | null;
          raw: Json | null;
          shortcode: string | null;
          synced_at: string | null;
          updated_at: string;
        };
        Insert: {
          caption?: string | null;
          created_at?: string;
          id?: string;
          instagram_post_id: string;
          media_type?: string | null;
          metrics?: Json;
          permalink?: string | null;
          published_at?: string | null;
          raw?: Json | null;
          shortcode?: string | null;
          synced_at?: string | null;
          updated_at?: string;
        };
        Update: {
          caption?: string | null;
          created_at?: string;
          id?: string;
          instagram_post_id?: string;
          media_type?: string | null;
          metrics?: Json;
          permalink?: string | null;
          published_at?: string | null;
          raw?: Json | null;
          shortcode?: string | null;
          synced_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      internal_users: {
        Row: {
          approved_at: string | null;
          approved_by: string | null;
          created_at: string;
          email: string;
          full_name: string | null;
          id: string;
          role: string;
          status: Database["public"]["Enums"]["internal_user_status"];
          updated_at: string;
        };
        Insert: {
          approved_at?: string | null;
          approved_by?: string | null;
          created_at?: string;
          email: string;
          full_name?: string | null;
          id: string;
          role?: string;
          status?: Database["public"]["Enums"]["internal_user_status"];
          updated_at?: string;
        };
        Update: {
          approved_at?: string | null;
          approved_by?: string | null;
          created_at?: string;
          email?: string;
          full_name?: string | null;
          id?: string;
          role?: string;
          status?: Database["public"]["Enums"]["internal_user_status"];
          updated_at?: string;
        };
        Relationships: [];
      };
      meta_account_snapshots: {
        Row: {
          captured_at: string;
          followers_count: number | null;
          id: string;
          media_count: number | null;
          name: string | null;
          raw: Json | null;
          username: string | null;
        };
        Insert: {
          captured_at?: string;
          followers_count?: number | null;
          id?: string;
          media_count?: number | null;
          name?: string | null;
          raw?: Json | null;
          username?: string | null;
        };
        Update: {
          captured_at?: string;
          followers_count?: number | null;
          id?: string;
          media_count?: number | null;
          name?: string | null;
          raw?: Json | null;
          username?: string | null;
        };
        Relationships: [];
      };
      meta_sync_runs: {
        Row: {
          actor_email: string | null;
          actor_id: string | null;
          error_message: string | null;
          finished_at: string | null;
          id: string;
          inserted_count: number;
          kind: string;
          metadata: Json;
          skipped_count: number;
          started_at: string;
          status: string;
          updated_count: number;
        };
        Insert: {
          actor_email?: string | null;
          actor_id?: string | null;
          error_message?: string | null;
          finished_at?: string | null;
          id?: string;
          inserted_count?: number;
          kind: string;
          metadata?: Json;
          skipped_count?: number;
          started_at?: string;
          status: string;
          updated_count?: number;
        };
        Update: {
          actor_email?: string | null;
          actor_id?: string | null;
          error_message?: string | null;
          finished_at?: string | null;
          id?: string;
          inserted_count?: number;
          kind?: string;
          metadata?: Json;
          skipped_count?: number;
          started_at?: string;
          status?: string;
          updated_count?: number;
        };
        Relationships: [];
      };
      message_templates: {
        Row: {
          active: boolean;
          body: string;
          created_at: string;
          id: string;
          name: string;
          theme: string | null;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          body: string;
          created_at?: string;
          id?: string;
          name: string;
          theme?: string | null;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          body?: string;
          created_at?: string;
          id?: string;
          name?: string;
          theme?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      outreach_tasks: {
        Row: {
          column_key: string;
          completed_at: string | null;
          created_at: string;
          due_at: string | null;
          id: string;
          notes: string;
          person_id: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          column_key: string;
          completed_at?: string | null;
          created_at?: string;
          due_at?: string | null;
          id?: string;
          notes?: string;
          person_id: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          column_key?: string;
          completed_at?: string | null;
          created_at?: string;
          due_at?: string | null;
          id?: string;
          notes?: string;
          person_id?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "outreach_tasks_person_id_fkey";
            columns: ["person_id"];
            referencedRelation: "ig_people";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      consent_status: "pending" | "confirmed" | "revoked";
      internal_user_status: "pending" | "active" | "disabled";
      interaction_type: "comentario" | "curtida" | "resposta_story" | "dm_manual";
      person_status:
        | "novo"
        | "responder"
        | "abordado"
        | "respondeu"
        | "contato_confirmado"
        | "nao_abordar";
    };
    CompositeTypes: Record<string, never>;
  };
};

export type PublicSchema = Database["public"];
export type TableRow<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"];
export type TableInsert<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Insert"];
export type TableUpdate<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Update"];
