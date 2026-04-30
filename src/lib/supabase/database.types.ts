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
      action_plans: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          source_report_id: string | null;
          topic_id: string | null;
          status: "draft" | "active" | "done" | "archived";
          priority: "low" | "medium" | "high";
          due_date: string | null;
          created_by: string | null;
          created_by_email: string | null;
          created_at: string;
          updated_at: string;
          completed_at: string | null;
          metadata: Json;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          source_report_id?: string | null;
          topic_id?: string | null;
          status?: "draft" | "active" | "done" | "archived";
          priority?: "low" | "medium" | "high";
          due_date?: string | null;
          created_by?: string | null;
          created_by_email?: string | null;
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
          metadata?: Json;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          source_report_id?: string | null;
          topic_id?: string | null;
          status?: "draft" | "active" | "done" | "archived";
          priority?: "low" | "medium" | "high";
          due_date?: string | null;
          created_by?: string | null;
          created_by_email?: string | null;
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
          metadata?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "action_plans_source_report_id_fkey";
            columns: ["source_report_id"];
            referencedRelation: "mobilization_reports";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "action_plans_topic_id_fkey";
            columns: ["topic_id"];
            referencedRelation: "topic_categories";
            referencedColumns: ["id"];
          },
        ];
      };
      action_plan_items: {
        Row: {
          id: string;
          action_plan_id: string;
          type: "post_publico" | "resposta_publica" | "reuniao" | "plenaria" | "escuta_bairro" | "material_explicativo" | "encaminhamento" | "tarefa_interna" | "video_curto" | "story" | "carrossel";
          title: string;
          description: string | null;
          status: "todo" | "doing" | "done" | "blocked" | "archived";
          assigned_to_email: string | null;
          due_date: string | null;
          created_at: string;
          updated_at: string;
          completed_at: string | null;
          metadata: Json;
        };
        Insert: {
          id?: string;
          action_plan_id: string;
          type: "post_publico" | "resposta_publica" | "reuniao" | "plenaria" | "escuta_bairro" | "material_explicativo" | "encaminhamento" | "tarefa_interna" | "video_curto" | "story" | "carrossel";
          title: string;
          description?: string | null;
          status?: "todo" | "doing" | "done" | "blocked" | "archived";
          assigned_to_email?: string | null;
          due_date?: string | null;
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
          metadata?: Json;
        };
        Update: {
          id?: string;
          action_plan_id?: string;
          type?: "post_publico" | "resposta_publica" | "reuniao" | "plenaria" | "escuta_bairro" | "material_explicativo" | "encaminhamento" | "tarefa_interna" | "video_curto" | "story" | "carrossel";
          title?: string;
          description?: string | null;
          status?: "todo" | "doing" | "done" | "blocked" | "archived";
          assigned_to_email?: string | null;
          due_date?: string | null;
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
          metadata?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "action_plan_items_action_plan_id_fkey";
            columns: ["action_plan_id"];
            referencedRelation: "action_plans";
            referencedColumns: ["id"];
          },
        ];
      };
      action_item_evidence: {
        Row: {
          id: string;
          action_plan_item_id: string;
          evidence_type: "nota_interna" | "link_publico" | "arquivo_referencia" | "foto_registro" | "print_publico" | "ata_reuniao" | "encaminhamento" | "resultado";
          title: string;
          description: string | null;
          url: string | null;
          created_by: string | null;
          created_by_email: string | null;
          created_at: string;
          updated_at: string;
          metadata: Json;
        };
        Insert: {
          id?: string;
          action_plan_item_id: string;
          evidence_type: "nota_interna" | "link_publico" | "arquivo_referencia" | "foto_registro" | "print_publico" | "ata_reuniao" | "encaminhamento" | "resultado";
          title: string;
          description?: string | null;
          url?: string | null;
          created_by?: string | null;
          created_by_email?: string | null;
          created_at?: string;
          updated_at?: string;
          metadata?: Json;
        };
        Update: {
          id?: string;
          action_plan_item_id?: string;
          evidence_type?: "nota_interna" | "link_publico" | "arquivo_referencia" | "foto_registro" | "print_publico" | "ata_reuniao" | "encaminhamento" | "resultado";
          title?: string;
          description?: string | null;
          url?: string | null;
          created_by?: string | null;
          created_by_email?: string | null;
          created_at?: string;
          updated_at?: string;
          metadata?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "action_item_evidence_action_plan_item_id_fkey";
            columns: ["action_plan_item_id"];
            referencedRelation: "action_plan_items";
            referencedColumns: ["id"];
          },
        ];
      };
      action_item_results: {
        Row: {
          id: string;
          action_plan_item_id: string;
          result_summary: string;
          public_response: string | null;
          lessons_learned: string | null;
          next_step: string | null;
          created_by: string | null;
          created_by_email: string | null;
          created_at: string;
          updated_at: string;
          metadata: Json;
        };
        Insert: {
          id?: string;
          action_plan_item_id: string;
          result_summary: string;
          public_response?: string | null;
          lessons_learned?: string | null;
          next_step?: string | null;
          created_by?: string | null;
          created_by_email?: string | null;
          created_at?: string;
          updated_at?: string;
          metadata?: Json;
        };
        Update: {
          id?: string;
          action_plan_item_id?: string;
          result_summary?: string;
          public_response?: string | null;
          lessons_learned?: string | null;
          next_step?: string | null;
          created_by?: string | null;
          created_by_email?: string | null;
          created_at?: string;
          updated_at?: string;
          metadata?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "action_item_results_action_plan_item_id_fkey";
            columns: ["action_plan_item_id"];
            referencedRelation: "action_plan_items";
            referencedColumns: ["id"];
          },
        ];
      };
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
      operational_incidents: {
        Row: {
          acknowledged_at: string | null;
          actor_email: string | null;
          created_at: string;
          description: string | null;
          id: string;
          kind: string;
          metadata: Json;
          related_entity_id: string | null;
          related_entity_type: string | null;
          resolved_at: string | null;
          severity: "info" | "warning" | "critical";
          status: "open" | "acknowledged" | "resolved";
          title: string;
        };
        Insert: {
          acknowledged_at?: string | null;
          actor_email?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          kind: string;
          metadata?: Json;
          related_entity_id?: string | null;
          related_entity_type?: string | null;
          resolved_at?: string | null;
          severity: "info" | "warning" | "critical";
          status?: "open" | "acknowledged" | "resolved";
          title: string;
        };
        Update: {
          acknowledged_at?: string | null;
          actor_email?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          kind?: string;
          metadata?: Json;
          related_entity_id?: string | null;
          related_entity_type?: string | null;
          resolved_at?: string | null;
          severity?: "info" | "warning" | "critical";
          status?: "open" | "acknowledged" | "resolved";
          title?: string;
        };
        Relationships: [];
      };
      operational_retention_policies: {
        Row: {
          created_at: string;
          enabled: boolean;
          entity: string;
          id: string;
          retention_days: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          enabled?: boolean;
          entity: string;
          id?: string;
          retention_days: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          enabled?: boolean;
          entity?: string;
          id?: string;
          retention_days?: number;
          updated_at?: string;
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
      topic_categories: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          color: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description?: string | null;
          color?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          description?: string | null;
          color?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      interaction_topic_tags: {
        Row: {
          id: string;
          interaction_id: string;
          topic_id: string;
          source: "manual" | "rule_suggestion" | "operator_confirmed";
          confidence: number | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          interaction_id: string;
          topic_id: string;
          source: "manual" | "rule_suggestion" | "operator_confirmed";
          confidence?: number | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          interaction_id?: string;
          topic_id?: string;
          source?: "manual" | "rule_suggestion" | "operator_confirmed";
          confidence?: number | null;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "interaction_topic_tags_interaction_id_fkey";
            columns: ["interaction_id"];
            referencedRelation: "ig_interactions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "interaction_topic_tags_topic_id_fkey";
            columns: ["topic_id"];
            referencedRelation: "topic_categories";
            referencedColumns: ["id"];
          },
        ];
      };
      post_topic_tags: {
        Row: {
          id: string;
          post_id: string;
          topic_id: string;
          source: "manual" | "rule_suggestion" | "operator_confirmed";
          confidence: number | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          topic_id: string;
          source: "manual" | "rule_suggestion" | "operator_confirmed";
          confidence?: number | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          topic_id?: string;
          source?: "manual" | "rule_suggestion" | "operator_confirmed";
          confidence?: number | null;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "post_topic_tags_post_id_fkey";
            columns: ["post_id"];
            referencedRelation: "ig_posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "post_topic_tags_topic_id_fkey";
            columns: ["topic_id"];
            referencedRelation: "topic_categories";
            referencedColumns: ["id"];
          },
        ];
      };
      mobilization_reports: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          period_start: string | null;
          period_end: string | null;
          status: "draft" | "generated" | "archived";
          created_by: string | null;
          created_by_email: string | null;
          created_at: string;
          updated_at: string;
          generated_at: string | null;
          filters: Json;
          snapshot: Json;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          period_start?: string | null;
          period_end?: string | null;
          status?: "draft" | "generated" | "archived";
          created_by?: string | null;
          created_by_email?: string | null;
          created_at?: string;
          updated_at?: string;
          generated_at?: string | null;
          filters?: Json;
          snapshot?: Json;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          period_start?: string | null;
          period_end?: string | null;
          status?: "draft" | "generated" | "archived";
          created_by?: string | null;
          created_by_email?: string | null;
          created_at?: string;
          updated_at?: string;
          generated_at?: string | null;
          filters?: Json;
          snapshot?: Json;
        };
        Relationships: [];
      };
      strategic_memories: {
        Row: {
          id: string;
          title: string;
          summary: string;
          topic_id: string | null;
          period_start: string | null;
          period_end: string | null;
          territory: string | null;
          status: "draft" | "active" | "archived";
          created_by: string | null;
          created_by_email: string | null;
          created_at: string;
          updated_at: string;
          archived_at: string | null;
          metadata: Json;
        };
        Insert: {
          id?: string;
          title: string;
          summary: string;
          topic_id?: string | null;
          period_start?: string | null;
          period_end?: string | null;
          territory?: string | null;
          status?: "draft" | "active" | "archived";
          created_by?: string | null;
          created_by_email?: string | null;
          created_at?: string;
          updated_at?: string;
          archived_at?: string | null;
          metadata?: Json;
        };
        Update: {
          id?: string;
          title?: string;
          summary?: string;
          topic_id?: string | null;
          period_start?: string | null;
          period_end?: string | null;
          territory?: string | null;
          status?: "draft" | "active" | "archived";
          created_by?: string | null;
          created_by_email?: string | null;
          created_at?: string;
          updated_at?: string;
          archived_at?: string | null;
          metadata?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "strategic_memories_created_by_fkey";
            columns: ["created_by"];
            referencedRelation: "internal_users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "strategic_memories_topic_id_fkey";
            columns: ["topic_id"];
            referencedRelation: "topic_categories";
            referencedColumns: ["id"];
          },
        ];
      };
      strategic_memory_links: {
        Row: {
          id: string;
          memory_id: string;
          entity_type: "topic" | "report" | "action_plan" | "action_plan_item" | "evidence" | "result";
          entity_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          memory_id: string;
          entity_type: "topic" | "report" | "action_plan" | "action_plan_item" | "evidence" | "result";
          entity_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          memory_id?: string;
          entity_type?: "topic" | "report" | "action_plan" | "action_plan_item" | "evidence" | "result";
          entity_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "strategic_memory_links_memory_id_fkey";
            columns: ["memory_id"];
            referencedRelation: "strategic_memories";
            referencedColumns: ["id"];
          },
        ];
      };
      meta_webhook_event_links: {
        Row: {
          id: string;
          webhook_event_id: string;
          entity_type: "ig_post" | "ig_person" | "ig_interaction" | "meta_sync_run" | "incident" | "topic";
          entity_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          webhook_event_id: string;
          entity_type: "ig_post" | "ig_person" | "ig_interaction" | "meta_sync_run" | "incident" | "topic";
          entity_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          webhook_event_id?: string;
          entity_type?: "ig_post" | "ig_person" | "ig_interaction" | "meta_sync_run" | "incident" | "topic";
          entity_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "meta_webhook_event_links_webhook_event_id_fkey";
            columns: ["webhook_event_id"];
            referencedRelation: "meta_webhook_events";
            referencedColumns: ["id"];
          },
        ];
      };
      meta_webhook_events: {
        Row: {
          id: string;
          external_event_id: string | null;
          object_type: string;
          event_type: string | null;
          status: "received" | "verified" | "quarantined" | "ignored" | "processed" | "failed";
          signature_valid: boolean;
          received_at: string;
          processed_at: string | null;
          source: string;
          raw_payload: Json;
          redacted_payload: Json;
          error_message: string | null;
          metadata: Json;
        };
        Insert: {
          id?: string;
          external_event_id?: string | null;
          object_type: string;
          event_type?: string | null;
          status?: "received" | "verified" | "quarantined" | "ignored" | "processed" | "failed";
          signature_valid?: boolean;
          received_at?: string;
          processed_at?: string | null;
          source?: string;
          raw_payload?: Json;
          redacted_payload?: Json;
          error_message?: string | null;
          metadata?: Json;
        };
        Update: {
          id?: string;
          external_event_id?: string | null;
          object_type?: string;
          event_type?: string | null;
          status?: "received" | "verified" | "quarantined" | "ignored" | "processed" | "failed";
          signature_valid?: boolean;
          received_at?: string;
          processed_at?: string | null;
          source?: string;
          raw_payload?: Json;
          redacted_payload?: Json;
          error_message?: string | null;
          metadata?: Json;
        };
        Relationships: [];
      };
      mobilization_report_topics: {
        Row: {
          id: string;
          report_id: string;
          topic_id: string;
          interaction_count: number;
          post_count: number;
          people_count: number;
          summary: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          report_id: string;
          topic_id: string;
          interaction_count?: number;
          post_count?: number;
          people_count?: number;
          summary?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          report_id?: string;
          topic_id?: string;
          interaction_count?: number;
          post_count?: number;
          people_count?: number;
          summary?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "mobilization_report_topics_report_id_fkey";
            columns: ["report_id"];
            referencedRelation: "mobilization_reports";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mobilization_report_topics_topic_id_fkey";
            columns: ["topic_id"];
            referencedRelation: "topic_categories";
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
      interaction_type: "comentario" | "curtida" | "resposta_story" | "dm_manual" | "mencao";
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
