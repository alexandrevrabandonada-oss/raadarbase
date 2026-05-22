export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      action_item_evidence: {
        Row: {
          action_plan_item_id: string
          created_at: string
          created_by: string | null
          created_by_email: string | null
          description: string | null
          evidence_type: string
          id: string
          metadata: Json
          title: string
          updated_at: string
          url: string | null
        }
        Insert: {
          action_plan_item_id: string
          created_at?: string
          created_by?: string | null
          created_by_email?: string | null
          description?: string | null
          evidence_type: string
          id?: string
          metadata?: Json
          title: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          action_plan_item_id?: string
          created_at?: string
          created_by?: string | null
          created_by_email?: string | null
          description?: string | null
          evidence_type?: string
          id?: string
          metadata?: Json
          title?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "action_item_evidence_action_plan_item_id_fkey"
            columns: ["action_plan_item_id"]
            isOneToOne: false
            referencedRelation: "action_plan_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_item_evidence_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "internal_users"
            referencedColumns: ["id"]
          },
        ]
      }
      action_item_results: {
        Row: {
          action_plan_item_id: string
          created_at: string
          created_by: string | null
          created_by_email: string | null
          id: string
          lessons_learned: string | null
          metadata: Json
          next_step: string | null
          public_response: string | null
          result_summary: string
          updated_at: string
        }
        Insert: {
          action_plan_item_id: string
          created_at?: string
          created_by?: string | null
          created_by_email?: string | null
          id?: string
          lessons_learned?: string | null
          metadata?: Json
          next_step?: string | null
          public_response?: string | null
          result_summary: string
          updated_at?: string
        }
        Update: {
          action_plan_item_id?: string
          created_at?: string
          created_by?: string | null
          created_by_email?: string | null
          id?: string
          lessons_learned?: string | null
          metadata?: Json
          next_step?: string | null
          public_response?: string | null
          result_summary?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_item_results_action_plan_item_id_fkey"
            columns: ["action_plan_item_id"]
            isOneToOne: true
            referencedRelation: "action_plan_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_item_results_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "internal_users"
            referencedColumns: ["id"]
          },
        ]
      }
      action_plan_items: {
        Row: {
          action_plan_id: string
          assigned_to_email: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          metadata: Json
          status: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          action_plan_id: string
          assigned_to_email?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          metadata?: Json
          status?: string
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          action_plan_id?: string
          assigned_to_email?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          metadata?: Json
          status?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_plan_items_action_plan_id_fkey"
            columns: ["action_plan_id"]
            isOneToOne: false
            referencedRelation: "action_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      action_plans: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          created_by_email: string | null
          description: string | null
          due_date: string | null
          id: string
          metadata: Json
          priority: string
          source_report_id: string | null
          status: string
          title: string
          topic_id: string | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          created_by_email?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          metadata?: Json
          priority?: string
          source_report_id?: string | null
          status?: string
          title: string
          topic_id?: string | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          created_by_email?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          metadata?: Json
          priority?: string
          source_report_id?: string | null
          status?: string
          title?: string
          topic_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_plans_source_report_id_fkey"
            columns: ["source_report_id"]
            isOneToOne: false
            referencedRelation: "mobilization_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_plans_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topic_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json
          summary: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json
          summary?: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json
          summary?: string
        }
        Relationships: []
      }
      bairro_escuta_submissions: {
        Row: {
          aviso_privacidade_aceito: boolean
          bairro: string
          consent_to_contact: boolean
          consentimento_explicito: boolean
          contact_redacted: string | null
          contato_opcional: string | null
          created_at: string
          id: string
          metadata: Json
          pauta: string
          quer_contato: boolean
          relato_curto: string
          reviewed_at: string | null
          reviewed_by: string | null
          source_report_id: string | null
          status: string
        }
        Insert: {
          aviso_privacidade_aceito?: boolean
          bairro: string
          consent_to_contact?: boolean
          consentimento_explicito?: boolean
          contact_redacted?: string | null
          contato_opcional?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          pauta: string
          quer_contato?: boolean
          relato_curto: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_report_id?: string | null
          status?: string
        }
        Update: {
          aviso_privacidade_aceito?: boolean
          bairro?: string
          consent_to_contact?: boolean
          consentimento_explicito?: boolean
          contact_redacted?: string | null
          contato_opcional?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          pauta?: string
          quer_contato?: boolean
          relato_curto?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_report_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "bairro_escuta_submissions_source_report_id_fkey"
            columns: ["source_report_id"]
            isOneToOne: false
            referencedRelation: "mobilization_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          consent_given: boolean
          consent_purpose: string
          consent_recorded_at: string | null
          consent_status: Database["public"]["Enums"]["consent_status"]
          contact_channel: string
          contact_value: string | null
          created_at: string
          email: string | null
          id: string
          last_contacted_at: string | null
          person_id: string
          phone: string | null
          privacy_policy_url: string | null
          source: string
          updated_at: string
        }
        Insert: {
          consent_given?: boolean
          consent_purpose: string
          consent_recorded_at?: string | null
          consent_status?: Database["public"]["Enums"]["consent_status"]
          contact_channel: string
          contact_value?: string | null
          created_at?: string
          email?: string | null
          id?: string
          last_contacted_at?: string | null
          person_id: string
          phone?: string | null
          privacy_policy_url?: string | null
          source?: string
          updated_at?: string
        }
        Update: {
          consent_given?: boolean
          consent_purpose?: string
          consent_recorded_at?: string | null
          consent_status?: Database["public"]["Enums"]["consent_status"]
          contact_channel?: string
          contact_value?: string | null
          created_at?: string
          email?: string | null
          id?: string
          last_contacted_at?: string | null
          person_id?: string
          phone?: string | null
          privacy_policy_url?: string | null
          source?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: true
            referencedRelation: "ig_people"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_squad_members: {
        Row: {
          id: string
          joined_at: string
          role: string | null
          squad_id: string
          status: string
          volunteer_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          role?: string | null
          squad_id: string
          status?: string
          volunteer_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          role?: string | null
          squad_id?: string
          status?: string
          volunteer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_squad_members_squad_id_fkey"
            columns: ["squad_id"]
            isOneToOne: false
            referencedRelation: "campaign_squads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_squad_members_volunteer_id_fkey"
            columns: ["volunteer_id"]
            isOneToOne: false
            referencedRelation: "campaign_volunteers"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_squads: {
        Row: {
          created_at: string
          created_by: string | null
          created_by_email: string | null
          description: string | null
          id: string
          kind: string
          metadata: Json
          name: string
          status: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          created_by_email?: string | null
          description?: string | null
          id?: string
          kind: string
          metadata?: Json
          name: string
          status?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          created_by_email?: string | null
          description?: string | null
          id?: string
          kind?: string
          metadata?: Json
          name?: string
          status?: string
        }
        Relationships: []
      }
      campaign_volunteers: {
        Row: {
          availability: Json
          city: string | null
          consent_to_contact: boolean
          consent_to_store_data: boolean
          contact_email: string | null
          contact_phone: string | null
          contact_preference: string
          created_at: string
          created_by: string | null
          created_by_email: string | null
          display_name: string
          id: string
          interests: Json
          metadata: Json
          neighborhood: string | null
          skills: Json
          source: string
          status: string
          updated_at: string
        }
        Insert: {
          availability?: Json
          city?: string | null
          consent_to_contact?: boolean
          consent_to_store_data?: boolean
          contact_email?: string | null
          contact_phone?: string | null
          contact_preference?: string
          created_at?: string
          created_by?: string | null
          created_by_email?: string | null
          display_name: string
          id?: string
          interests?: Json
          metadata?: Json
          neighborhood?: string | null
          skills?: Json
          source?: string
          status?: string
          updated_at?: string
        }
        Update: {
          availability?: Json
          city?: string | null
          consent_to_contact?: boolean
          consent_to_store_data?: boolean
          contact_email?: string | null
          contact_phone?: string | null
          contact_preference?: string
          created_at?: string
          created_by?: string | null
          created_by_email?: string | null
          display_name?: string
          id?: string
          interests?: Json
          metadata?: Json
          neighborhood?: string | null
          skills?: Json
          source?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      campaign_volunteer_applications: {
        Row: {
          availability: Json
          city: string | null
          consent_to_contact: boolean
          consent_to_store_data: boolean
          contact_email: string | null
          contact_phone: string | null
          contact_preference: string
          converted_volunteer_id: string | null
          created_at: string
          display_name: string
          id: string
          interests: Json
          metadata: Json
          neighborhood: string | null
          redacted_at: string | null
          redacted_by: string | null
          redacted_by_email: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          reviewed_by_email: string | null
          retention_reason: string | null
          retention_status: string
          scheduled_redaction_at: string | null
          skills: Json
          status: string
        }
        Insert: {
          availability?: Json
          city?: string | null
          consent_to_contact?: boolean
          consent_to_store_data?: boolean
          contact_email?: string | null
          contact_phone?: string | null
          contact_preference?: string
          converted_volunteer_id?: string | null
          created_at?: string
          display_name: string
          id?: string
          interests?: Json
          metadata?: Json
          neighborhood?: string | null
          redacted_at?: string | null
          redacted_by?: string | null
          redacted_by_email?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewed_by_email?: string | null
          retention_reason?: string | null
          retention_status?: string
          scheduled_redaction_at?: string | null
          skills?: Json
          status?: string
        }
        Update: {
          availability?: Json
          city?: string | null
          consent_to_contact?: boolean
          consent_to_store_data?: boolean
          contact_email?: string | null
          contact_phone?: string | null
          contact_preference?: string
          converted_volunteer_id?: string | null
          created_at?: string
          display_name?: string
          id?: string
          interests?: Json
          metadata?: Json
          neighborhood?: string | null
          redacted_at?: string | null
          redacted_by?: string | null
          redacted_by_email?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewed_by_email?: string | null
          retention_reason?: string | null
          retention_status?: string
          scheduled_redaction_at?: string | null
          skills?: Json
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_volunteer_applications_converted_volunteer_id_fkey"
            columns: ["converted_volunteer_id"]
            isOneToOne: false
            referencedRelation: "campaign_volunteers"
            referencedColumns: ["id"]
          },
        ]
      }
      field_agenda_event_results: {
        Row: {
          created_at: string
          created_by: string | null
          created_by_email: string | null
          estimated_people_count: number | null
          event_id: string
          id: string
          metadata: Json
          neighborhoods_mentioned: Json
          next_steps: string | null
          result_summary: string
          topics_discussed: Json
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          created_by_email?: string | null
          estimated_people_count?: number | null
          event_id: string
          id?: string
          metadata?: Json
          neighborhoods_mentioned?: Json
          next_steps?: string | null
          result_summary: string
          topics_discussed?: Json
        }
        Update: {
          created_at?: string
          created_by?: string | null
          created_by_email?: string | null
          estimated_people_count?: number | null
          event_id?: string
          id?: string
          metadata?: Json
          neighborhoods_mentioned?: Json
          next_steps?: string | null
          result_summary?: string
          topics_discussed?: Json
        }
        Relationships: [
          {
            foreignKeyName: "field_agenda_event_results_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "field_agenda_events"
            referencedColumns: ["id"]
          },
        ]
      }
      field_agenda_event_volunteers: {
        Row: {
          created_at: string
          event_id: string
          id: string
          role: string | null
          status: string
          volunteer_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          role?: string | null
          status?: string
          volunteer_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          role?: string | null
          status?: string
          volunteer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "field_agenda_event_volunteers_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "field_agenda_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "field_agenda_event_volunteers_volunteer_id_fkey"
            columns: ["volunteer_id"]
            isOneToOne: false
            referencedRelation: "campaign_volunteers"
            referencedColumns: ["id"]
          },
        ]
      }
      field_agenda_events: {
        Row: {
          created_at: string
          created_by: string | null
          created_by_email: string | null
          description: string | null
          ends_at: string | null
          id: string
          location_text: string | null
          metadata: Json
          neighborhood: string | null
          public_url: string | null
          source_action_plan_id: string | null
          source_corrective_action_id: string | null
          source_report_id: string | null
          starts_at: string | null
          status: string
          title: string
          topic_slug: string | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          created_by_email?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          location_text?: string | null
          metadata?: Json
          neighborhood?: string | null
          public_url?: string | null
          source_action_plan_id?: string | null
          source_corrective_action_id?: string | null
          source_report_id?: string | null
          starts_at?: string | null
          status?: string
          title: string
          topic_slug?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          created_by_email?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          location_text?: string | null
          metadata?: Json
          neighborhood?: string | null
          public_url?: string | null
          source_action_plan_id?: string | null
          source_corrective_action_id?: string | null
          source_report_id?: string | null
          starts_at?: string | null
          status?: string
          title?: string
          topic_slug?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "field_agenda_events_source_action_plan_id_fkey"
            columns: ["source_action_plan_id"]
            isOneToOne: false
            referencedRelation: "action_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "field_agenda_events_source_corrective_action_id_fkey"
            columns: ["source_corrective_action_id"]
            isOneToOne: false
            referencedRelation: "silence_radar_corrective_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "field_agenda_events_source_report_id_fkey"
            columns: ["source_report_id"]
            isOneToOne: false
            referencedRelation: "mobilization_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      ig_interactions: {
        Row: {
          created_at: string
          external_id: string | null
          id: string
          instagram_interaction_id: string | null
          occurred_at: string
          person_id: string
          post_id: string | null
          raw: Json | null
          raw_payload: Json
          synced_at: string | null
          text_content: string | null
          theme: string | null
          type: Database["public"]["Enums"]["interaction_type"]
        }
        Insert: {
          created_at?: string
          external_id?: string | null
          id?: string
          instagram_interaction_id?: string | null
          occurred_at: string
          person_id: string
          post_id?: string | null
          raw?: Json | null
          raw_payload?: Json
          synced_at?: string | null
          text_content?: string | null
          theme?: string | null
          type: Database["public"]["Enums"]["interaction_type"]
        }
        Update: {
          created_at?: string
          external_id?: string | null
          id?: string
          instagram_interaction_id?: string | null
          occurred_at?: string
          person_id?: string
          post_id?: string | null
          raw?: Json | null
          raw_payload?: Json
          synced_at?: string | null
          text_content?: string | null
          theme?: string | null
          type?: Database["public"]["Enums"]["interaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "ig_interactions_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "ig_people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ig_interactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "ig_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      ig_people: {
        Row: {
          created_at: string
          display_name: string | null
          do_not_contact_reason: string | null
          id: string
          instagram_user_id: string | null
          last_interaction_at: string | null
          notes: string
          raw: Json | null
          status: Database["public"]["Enums"]["person_status"]
          synced_at: string | null
          themes: string[]
          total_interactions: number
          updated_at: string
          username: string
          responsible_id: string | null
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          do_not_contact_reason?: string | null
          id?: string
          instagram_user_id?: string | null
          last_interaction_at?: string | null
          notes?: string
          raw?: Json | null
          status?: Database["public"]["Enums"]["person_status"]
          synced_at?: string | null
          themes?: string[]
          total_interactions?: number
          updated_at?: string
          username: string
          responsible_id?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string | null
          do_not_contact_reason?: string | null
          id?: string
          instagram_user_id?: string | null
          last_interaction_at?: string | null
          notes?: string
          raw?: Json | null
          status?: Database["public"]["Enums"]["person_status"]
          synced_at?: string | null
          themes?: string[]
          total_interactions?: number
          updated_at?: string
          username?: string
          responsible_id?: string | null
        }
        Relationships: []
      }
      ig_posts: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          instagram_post_id: string
          media_type: string | null
          metrics: Json
          permalink: string | null
          published_at: string | null
          raw: Json | null
          shortcode: string | null
          synced_at: string | null
          updated_at: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          instagram_post_id: string
          media_type?: string | null
          metrics?: Json
          permalink?: string | null
          published_at?: string | null
          raw?: Json | null
          shortcode?: string | null
          synced_at?: string | null
          updated_at?: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          instagram_post_id?: string
          media_type?: string | null
          metrics?: Json
          permalink?: string | null
          published_at?: string | null
          raw?: Json | null
          shortcode?: string | null
          synced_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      interaction_topic_tags: {
        Row: {
          confidence: number | null
          created_at: string
          created_by: string | null
          id: string
          interaction_id: string
          source: string
          topic_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          interaction_id: string
          source: string
          topic_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          interaction_id?: string
          source?: string
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interaction_topic_tags_interaction_id_fkey"
            columns: ["interaction_id"]
            isOneToOne: false
            referencedRelation: "ig_interactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interaction_topic_tags_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topic_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      internal_users: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: string
          status: Database["public"]["Enums"]["internal_user_status"]
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          role?: string
          status?: Database["public"]["Enums"]["internal_user_status"]
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: string
          status?: Database["public"]["Enums"]["internal_user_status"]
          updated_at?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          company: string | null
          created_at: string
          email: string
          id: string
          message: string
          metadata: Json
          name: string
          notes: string | null
          page_url: string | null
          phone: string | null
          referrer: string | null
          status: string
          user_agent: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          id?: string
          message: string
          metadata?: Json
          name: string
          notes?: string | null
          page_url?: string | null
          phone?: string | null
          referrer?: string | null
          status?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string
          metadata?: Json
          name?: string
          notes?: string | null
          page_url?: string | null
          phone?: string | null
          referrer?: string | null
          status?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      message_templates: {
        Row: {
          active: boolean
          body: string
          category: string | null
          created_at: string
          id: string
          is_campaign_default: boolean
          name: string
          theme: string | null
          updated_at: string
          when_to_use: string | null
        }
        Insert: {
          active?: boolean
          body: string
          category?: string | null
          created_at?: string
          id?: string
          is_campaign_default?: boolean
          name: string
          theme?: string | null
          updated_at?: string
          when_to_use?: string | null
        }
        Update: {
          active?: boolean
          body?: string
          category?: string | null
          created_at?: string
          id?: string
          is_campaign_default?: boolean
          name?: string
          theme?: string | null
          updated_at?: string
          when_to_use?: string | null
        }
        Relationships: []
      }
      ig_person_referrals: {
        Row: {
          id: string
          person_id: string
          target_type: Database["public"]["Enums"]["referral_target_type"]
          target_id: string | null
          status: Database["public"]["Enums"]["referral_status"]
          notes: string
          created_at: string
          updated_at: string
          responsible_id: string | null
          external_id: string | null
          last_event_at: string | null
          last_event_type: string | null
          last_event_source: string | null
          metadata: Json
        }
        Insert: {
          id?: string
          person_id: string
          target_type: Database["public"]["Enums"]["referral_target_type"]
          target_id?: string | null
          status?: Database["public"]["Enums"]["referral_status"]
          notes?: string
          created_at?: string
          updated_at?: string
          responsible_id?: string | null
          external_id?: string | null
          last_event_at?: string | null
          last_event_type?: string | null
          last_event_source?: string | null
          metadata?: Json
        }
        Update: {
          id?: string
          person_id?: string
          target_type?: Database["public"]["Enums"]["referral_target_type"]
          target_id?: string | null
          status?: Database["public"]["Enums"]["referral_status"]
          notes?: string
          created_at?: string
          updated_at?: string
          responsible_id?: string | null
          external_id?: string | null
          last_event_at?: string | null
          last_event_type?: string | null
          last_event_source?: string | null
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "ig_person_referrals_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "ig_people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ig_person_referrals_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "field_agenda_events"
            referencedColumns: ["id"]
          }
        ]
      }
      meta_account_snapshots: {
        Row: {
          captured_at: string
          followers_count: number | null
          id: string
          media_count: number | null
          name: string | null
          raw: Json | null
          username: string | null
        }
        Insert: {
          captured_at?: string
          followers_count?: number | null
          id?: string
          media_count?: number | null
          name?: string | null
          raw?: Json | null
          username?: string | null
        }
        Update: {
          captured_at?: string
          followers_count?: number | null
          id?: string
          media_count?: number | null
          name?: string | null
          raw?: Json | null
          username?: string | null
        }
        Relationships: []
      }
      meta_reconciliation_evidence: {
        Row: {
          generated_at: string
          generated_by: string | null
          generated_by_email: string | null
          id: string
          interactions_count: number
          latest_meta_sync_at: string | null
          latest_meta_sync_status: string | null
          meta_audit_logs_count: number
          meta_sync_runs_count: number
          metadata: Json
          notes: string | null
          people_count: number
          posts_count: number
          report_hash: string
          started_runs_count: number
          status: string
          stuck_runs_count: number
        }
        Insert: {
          generated_at?: string
          generated_by?: string | null
          generated_by_email?: string | null
          id?: string
          interactions_count?: number
          latest_meta_sync_at?: string | null
          latest_meta_sync_status?: string | null
          meta_audit_logs_count?: number
          meta_sync_runs_count?: number
          metadata?: Json
          notes?: string | null
          people_count?: number
          posts_count?: number
          report_hash: string
          started_runs_count?: number
          status?: string
          stuck_runs_count?: number
        }
        Update: {
          generated_at?: string
          generated_by?: string | null
          generated_by_email?: string | null
          id?: string
          interactions_count?: number
          latest_meta_sync_at?: string | null
          latest_meta_sync_status?: string | null
          meta_audit_logs_count?: number
          meta_sync_runs_count?: number
          metadata?: Json
          notes?: string | null
          people_count?: number
          posts_count?: number
          report_hash?: string
          started_runs_count?: number
          status?: string
          stuck_runs_count?: number
        }
        Relationships: []
      }
      meta_sync_runs: {
        Row: {
          actor_email: string | null
          actor_id: string | null
          error_message: string | null
          finished_at: string | null
          id: string
          inserted_count: number
          kind: string
          metadata: Json
          skipped_count: number
          started_at: string
          status: string
          updated_count: number
        }
        Insert: {
          actor_email?: string | null
          actor_id?: string | null
          error_message?: string | null
          finished_at?: string | null
          id?: string
          inserted_count?: number
          kind: string
          metadata?: Json
          skipped_count?: number
          started_at?: string
          status: string
          updated_count?: number
        }
        Update: {
          actor_email?: string | null
          actor_id?: string | null
          error_message?: string | null
          finished_at?: string | null
          id?: string
          inserted_count?: number
          kind?: string
          metadata?: Json
          skipped_count?: number
          started_at?: string
          status?: string
          updated_count?: number
        }
        Relationships: []
      }
      meta_webhook_event_links: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          webhook_event_id: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          webhook_event_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          webhook_event_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meta_webhook_event_links_webhook_event_id_fkey"
            columns: ["webhook_event_id"]
            isOneToOne: false
            referencedRelation: "meta_webhook_events"
            referencedColumns: ["id"]
          },
        ]
      }
      meta_webhook_events: {
        Row: {
          error_message: string | null
          event_type: string | null
          external_event_id: string | null
          id: string
          metadata: Json
          object_type: string
          processed_at: string | null
          raw_payload: Json
          received_at: string
          redacted_payload: Json
          signature_valid: boolean
          source: string
          status: string
        }
        Insert: {
          error_message?: string | null
          event_type?: string | null
          external_event_id?: string | null
          id?: string
          metadata?: Json
          object_type: string
          processed_at?: string | null
          raw_payload?: Json
          received_at?: string
          redacted_payload?: Json
          signature_valid?: boolean
          source?: string
          status?: string
        }
        Update: {
          error_message?: string | null
          event_type?: string | null
          external_event_id?: string | null
          id?: string
          metadata?: Json
          object_type?: string
          processed_at?: string | null
          raw_payload?: Json
          received_at?: string
          redacted_payload?: Json
          signature_valid?: boolean
          source?: string
          status?: string
        }
        Relationships: []
      }
      mobilization_report_topics: {
        Row: {
          created_at: string
          id: string
          interaction_count: number
          people_count: number
          post_count: number
          report_id: string
          summary: string | null
          topic_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          interaction_count?: number
          people_count?: number
          post_count?: number
          report_id: string
          summary?: string | null
          topic_id: string
        }
        Update: {
          created_at?: string
          id?: string
          interaction_count?: number
          people_count?: number
          post_count?: number
          report_id?: string
          summary?: string | null
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mobilization_report_topics_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "mobilization_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mobilization_report_topics_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topic_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      mobilization_reports: {
        Row: {
          created_at: string
          created_by: string | null
          created_by_email: string | null
          description: string | null
          filters: Json
          generated_at: string | null
          id: string
          period_end: string | null
          period_start: string | null
          snapshot: Json
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          created_by_email?: string | null
          description?: string | null
          filters?: Json
          generated_at?: string | null
          id?: string
          period_end?: string | null
          period_start?: string | null
          snapshot?: Json
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          created_by_email?: string | null
          description?: string | null
          filters?: Json
          generated_at?: string | null
          id?: string
          period_end?: string | null
          period_start?: string | null
          snapshot?: Json
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      operational_incidents: {
        Row: {
          acknowledged_at: string | null
          actor_email: string | null
          created_at: string
          description: string | null
          id: string
          kind: string
          metadata: Json
          related_entity_id: string | null
          related_entity_type: string | null
          resolved_at: string | null
          severity: string
          status: string
          title: string
        }
        Insert: {
          acknowledged_at?: string | null
          actor_email?: string | null
          created_at?: string
          description?: string | null
          id?: string
          kind: string
          metadata?: Json
          related_entity_id?: string | null
          related_entity_type?: string | null
          resolved_at?: string | null
          severity: string
          status?: string
          title: string
        }
        Update: {
          acknowledged_at?: string | null
          actor_email?: string | null
          created_at?: string
          description?: string | null
          id?: string
          kind?: string
          metadata?: Json
          related_entity_id?: string | null
          related_entity_type?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
          title?: string
        }
        Relationships: []
      }
      operational_retention_policies: {
        Row: {
          created_at: string
          enabled: boolean
          entity: string
          id: string
          retention_days: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          entity: string
          id?: string
          retention_days: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          entity?: string
          id?: string
          retention_days?: number
          updated_at?: string
        }
        Relationships: []
      }
      outreach_tasks: {
        Row: {
          column_key: string
          completed_at: string | null
          created_at: string
          due_at: string | null
          id: string
          notes: string
          person_id: string
          title: string
          updated_at: string
          responsible_id: string | null
        }
        Insert: {
          column_key: string
          completed_at?: string | null
          created_at?: string
          due_at?: string | null
          id?: string
          notes?: string
          person_id: string
          title: string
          updated_at?: string
          responsible_id?: string | null
        }
        Update: {
          column_key?: string
          completed_at?: string | null
          created_at?: string
          due_at?: string | null
          id?: string
          notes?: string
          person_id?: string
          title?: string
          updated_at?: string
          responsible_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "outreach_tasks_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "ig_people"
            referencedColumns: ["id"]
          },
        ]
      }
      post_topic_tags: {
        Row: {
          confidence: number | null
          created_at: string
          created_by: string | null
          id: string
          post_id: string
          source: string
          topic_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          post_id: string
          source: string
          topic_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          post_id?: string
          source?: string
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_topic_tags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "ig_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_topic_tags_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topic_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      public_devolution_publications: {
        Row: {
          action_plan_id: string | null
          created_at: string
          created_by: string | null
          created_by_email: string | null
          id: string
          instagram_post_url: string | null
          metadata: Json
          published_at: string | null
          published_url: string | null
          report_id: string
          status: string
          updated_at: string
          whatsapp_shared: boolean
        }
        Insert: {
          action_plan_id?: string | null
          created_at?: string
          created_by?: string | null
          created_by_email?: string | null
          id?: string
          instagram_post_url?: string | null
          metadata?: Json
          published_at?: string | null
          published_url?: string | null
          report_id: string
          status?: string
          updated_at?: string
          whatsapp_shared?: boolean
        }
        Update: {
          action_plan_id?: string | null
          created_at?: string
          created_by?: string | null
          created_by_email?: string | null
          id?: string
          instagram_post_url?: string | null
          metadata?: Json
          published_at?: string | null
          published_url?: string | null
          report_id?: string
          status?: string
          updated_at?: string
          whatsapp_shared?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "public_devolution_publications_action_plan_id_fkey"
            columns: ["action_plan_id"]
            isOneToOne: false
            referencedRelation: "action_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_devolution_publications_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: true
            referencedRelation: "mobilization_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      public_receipt_distribution_cycles: {
        Row: {
          created_at: string
          created_by: string | null
          created_by_email: string | null
          ends_at: string | null
          id: string
          metadata: Json
          starts_at: string | null
          status: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          created_by_email?: string | null
          ends_at?: string | null
          id?: string
          metadata?: Json
          starts_at?: string | null
          status?: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          created_by_email?: string | null
          ends_at?: string | null
          id?: string
          metadata?: Json
          starts_at?: string | null
          status?: string
          title?: string
        }
        Relationships: []
      }
      public_receipt_distribution_logs: {
        Row: {
          channel: string
          created_at: string
          created_by: string | null
          created_by_email: string | null
          cycle_id: string | null
          format: string
          id: string
          metadata: Json
          notes: string | null
          public_url: string | null
          shared_at: string | null
          status: string
        }
        Insert: {
          channel: string
          created_at?: string
          created_by?: string | null
          created_by_email?: string | null
          cycle_id?: string | null
          format: string
          id?: string
          metadata?: Json
          notes?: string | null
          public_url?: string | null
          shared_at?: string | null
          status?: string
        }
        Update: {
          channel?: string
          created_at?: string
          created_by?: string | null
          created_by_email?: string | null
          cycle_id?: string | null
          format?: string
          id?: string
          metadata?: Json
          notes?: string | null
          public_url?: string | null
          shared_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_receipt_distribution_logs_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "public_receipt_distribution_cycles"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          price_label: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          price_label?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          price_label?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      silence_radar_corrective_actions: {
        Row: {
          action_plan_item_id: string | null
          baseline_snapshot: Json
          baseline_value: number | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          created_by_email: string | null
          id: string
          kind: string
          metadata: Json
          source_metric: string
          status: string
          target_label: string
          target_type: string
        }
        Insert: {
          action_plan_item_id?: string | null
          baseline_snapshot?: Json
          baseline_value?: number | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          created_by_email?: string | null
          id?: string
          kind: string
          metadata?: Json
          source_metric: string
          status?: string
          target_label: string
          target_type: string
        }
        Update: {
          action_plan_item_id?: string | null
          baseline_snapshot?: Json
          baseline_value?: number | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          created_by_email?: string | null
          id?: string
          kind?: string
          metadata?: Json
          source_metric?: string
          status?: string
          target_label?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "silence_radar_corrective_actions_action_plan_item_id_fkey"
            columns: ["action_plan_item_id"]
            isOneToOne: false
            referencedRelation: "action_plan_items"
            referencedColumns: ["id"]
          },
        ]
      }
      strategic_memories: {
        Row: {
          archived_at: string | null
          created_at: string
          created_by: string | null
          created_by_email: string | null
          id: string
          metadata: Json
          period_end: string | null
          period_start: string | null
          status: string
          summary: string
          territory: string | null
          title: string
          topic_id: string | null
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          created_by_email?: string | null
          id?: string
          metadata?: Json
          period_end?: string | null
          period_start?: string | null
          status?: string
          summary: string
          territory?: string | null
          title: string
          topic_id?: string | null
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          created_by_email?: string | null
          id?: string
          metadata?: Json
          period_end?: string | null
          period_start?: string | null
          status?: string
          summary?: string
          territory?: string | null
          title?: string
          topic_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "strategic_memories_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "internal_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strategic_memories_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topic_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      strategic_memory_links: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          memory_id: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          memory_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          memory_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "strategic_memory_links_memory_id_fkey"
            columns: ["memory_id"]
            isOneToOne: false
            referencedRelation: "strategic_memories"
            referencedColumns: ["id"]
          },
        ]
      }
      territorial_listening_daily_snapshots: {
        Row: {
          archived_count: number
          forwarded_count: number
          generated_at: string
          generated_by: string | null
          generated_by_email: string | null
          id: string
          metadata: Json
          neighborhoods_count: number
          notes: string | null
          pending_review_count: number
          reviewed_count: number
          snapshot_date: string
          status: string
          top_neighborhoods: Json
          top_topics: Json
          topics_count: number
          total_reports: number
          total_with_contact_consent: number
          total_without_contact_consent: number
          window_id: string
        }
        Insert: {
          archived_count?: number
          forwarded_count?: number
          generated_at?: string
          generated_by?: string | null
          generated_by_email?: string | null
          id?: string
          metadata?: Json
          neighborhoods_count?: number
          notes?: string | null
          pending_review_count?: number
          reviewed_count?: number
          snapshot_date: string
          status?: string
          top_neighborhoods?: Json
          top_topics?: Json
          topics_count?: number
          total_reports?: number
          total_with_contact_consent?: number
          total_without_contact_consent?: number
          window_id: string
        }
        Update: {
          archived_count?: number
          forwarded_count?: number
          generated_at?: string
          generated_by?: string | null
          generated_by_email?: string | null
          id?: string
          metadata?: Json
          neighborhoods_count?: number
          notes?: string | null
          pending_review_count?: number
          reviewed_count?: number
          snapshot_date?: string
          status?: string
          top_neighborhoods?: Json
          top_topics?: Json
          topics_count?: number
          total_reports?: number
          total_with_contact_consent?: number
          total_without_contact_consent?: number
          window_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "territorial_listening_daily_snapshots_window_id_fkey"
            columns: ["window_id"]
            isOneToOne: false
            referencedRelation: "territorial_listening_windows"
            referencedColumns: ["id"]
          },
        ]
      }
      territorial_listening_outreach_logs: {
        Row: {
          channel: string
          created_at: string
          created_by: string | null
          created_by_email: string | null
          id: string
          metadata: Json
          notes: string | null
          public_url: string | null
          shared_at: string | null
          status: string
          window_id: string
        }
        Insert: {
          channel: string
          created_at?: string
          created_by?: string | null
          created_by_email?: string | null
          id?: string
          metadata?: Json
          notes?: string | null
          public_url?: string | null
          shared_at?: string | null
          status?: string
          window_id: string
        }
        Update: {
          channel?: string
          created_at?: string
          created_by?: string | null
          created_by_email?: string | null
          id?: string
          metadata?: Json
          notes?: string | null
          public_url?: string | null
          shared_at?: string | null
          status?: string
          window_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "territorial_listening_outreach_logs_window_id_fkey"
            columns: ["window_id"]
            isOneToOne: false
            referencedRelation: "territorial_listening_windows"
            referencedColumns: ["id"]
          },
        ]
      }
      territorial_listening_windows: {
        Row: {
          action_plan_id: string | null
          created_at: string
          created_by: string | null
          created_by_email: string | null
          ends_at: string
          id: string
          metadata: Json
          source_report_id: string
          starts_at: string
          status: string
        }
        Insert: {
          action_plan_id?: string | null
          created_at?: string
          created_by?: string | null
          created_by_email?: string | null
          ends_at: string
          id?: string
          metadata?: Json
          source_report_id: string
          starts_at: string
          status?: string
        }
        Update: {
          action_plan_id?: string | null
          created_at?: string
          created_by?: string | null
          created_by_email?: string | null
          ends_at?: string
          id?: string
          metadata?: Json
          source_report_id?: string
          starts_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "territorial_listening_windows_action_plan_id_fkey"
            columns: ["action_plan_id"]
            isOneToOne: false
            referencedRelation: "action_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "territorial_listening_windows_source_report_id_fkey"
            columns: ["source_report_id"]
            isOneToOne: true
            referencedRelation: "mobilization_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonials: {
        Row: {
          author_company: string | null
          author_name: string
          author_role: string | null
          avatar_url: string | null
          created_at: string
          id: string
          is_published: boolean
          quote: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          author_company?: string | null
          author_name: string
          author_role?: string | null
          avatar_url?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          quote: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          author_company?: string | null
          author_name?: string
          author_role?: string | null
          avatar_url?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          quote?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      volunteer_review_rounds: {
        Row: {
          approved_count: number
          archived_count: number
          completed_at: string | null
          created_at: string
          created_by: string | null
          created_by_email: string | null
          id: string
          metadata: Json
          notes: string | null
          redacted_count: number
          rejected_count: number
          retained_count: number
          reviewed_pending_count: number
          status: string
          title: string
        }
        Insert: {
          approved_count?: number
          archived_count?: number
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          created_by_email?: string | null
          id?: string
          metadata?: Json
          notes?: string | null
          redacted_count?: number
          rejected_count?: number
          retained_count?: number
          reviewed_pending_count?: number
          status?: string
          title: string
        }
        Update: {
          approved_count?: number
          archived_count?: number
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          created_by_email?: string | null
          id?: string
          metadata?: Json
          notes?: string | null
          redacted_count?: number
          rejected_count?: number
          retained_count?: number
          reviewed_pending_count?: number
          status?: string
          title?: string
        }
        Relationships: []
      }
      topic_categories: {
        Row: {
          active: boolean
          color: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          created_at: string
          event_type: string
          external_event_id: string
          id: string
          payload: Json
          processed_at: string
          provider: string
        }
        Insert: {
          created_at?: string
          event_type: string
          external_event_id: string
          id?: string
          payload?: Json
          processed_at?: string
          provider: string
        }
        Update: {
          created_at?: string
          event_type?: string
          external_event_id?: string
          id?: string
          payload?: Json
          processed_at?: string
          provider?: string
        }
        Relationships: []
      }
      works: {
        Row: {
          content_warning: string | null
          cover_image_url: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          id: string
          is_published: boolean
          project_url: string | null
          slug: string
          source_hash: string | null
          title: string
          type: Database["public"]["Enums"]["work_type"]
          updated_at: string
        }
        Insert: {
          content_warning?: string | null
          cover_image_url?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          project_url?: string | null
          slug: string
          source_hash?: string | null
          title: string
          type: Database["public"]["Enums"]["work_type"]
          updated_at?: string
        }
        Update: {
          content_warning?: string | null
          cover_image_url?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          project_url?: string | null
          slug?: string
          source_hash?: string | null
          title?: string
          type?: Database["public"]["Enums"]["work_type"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_current_internal_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      consent_status: "pending" | "confirmed" | "revoked"
      referral_target_type:
        | "evento_campo"
        | "voluntariado"
        | "grupo_lista"
        | "missao_eluta"
        | "missao_simples"
        | "revisar_depois"
        | "nao_abordar"
      referral_status:
        | "recomendado"
        | "convidado"
        | "respondeu"
        | "confirmou"
        | "compareceu"
        | "ajudou"
        | "recusou"
        | "interessado"
        | "em_revisao"
        | "concluido"
        | "recebeu_link"
        | "acessou"
        | "fez_primeira_missao"
        | "colaborador"
        | "pode_puxar_missao"
      interaction_type:
        | "comentario"
        | "curtida"
        | "resposta_story"
        | "dm_manual"
        | "mencao"
      internal_user_status: "pending" | "active" | "disabled"
      person_status:
        | "novo"
        | "responder"
        | "abordado"
        | "respondeu"
        | "contato_confirmado"
        | "nao_abordar"
      work_type:
        | "branding"
        | "social_media"
        | "website"
        | "video"
        | "other"
        | "charge"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      consent_status: ["pending", "confirmed", "revoked"],
      referral_target_type: [
        "evento_campo",
        "voluntariado",
        "grupo_lista",
        "missao_eluta",
        "missao_simples",
        "revisar_depois",
        "nao_abordar",
      ],
      referral_status: [
        "recomendado",
        "convidado",
        "respondeu",
        "confirmou",
        "compareceu",
        "ajudou",
        "recusou",
        "interessado",
        "em_revisao",
        "concluido",
        "recebeu_link",
        "acessou",
        "fez_primeira_missao",
        "colaborador",
        "pode_puxar_missao",
      ],
      interaction_type: [
        "comentario",
        "curtida",
        "resposta_story",
        "dm_manual",
        "mencao",
      ],
      internal_user_status: ["pending", "active", "disabled"],
      person_status: [
        "novo",
        "responder",
        "abordado",
        "respondeu",
        "contato_confirmado",
        "nao_abordar",
      ],
      work_type: [
        "branding",
        "social_media",
        "website",
        "video",
        "other",
        "charge",
      ],
    },
  },
} as const

// Backward compatibility aliases
export type TableRow<T extends keyof Database["public"]["Tables"]> = Tables<T>;
export type TableInsert<T extends keyof Database["public"]["Tables"]> = TablesInsert<T>;
export type TableUpdate<T extends keyof Database["public"]["Tables"]> = TablesUpdate<T>;
