export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.17";
  };
  public: {
    Tables: {
      activities: {
        Row: {
          activity_type: string;
          contact_id: string | null;
          created_at: string;
          description: string | null;
          enrollment_open: boolean;
          forms_url: string | null;
          gender: string | null;
          grades: string | null;
          id: string;
          image_url: string | null;
          location: string | null;
          name: string;
          official_url: string | null;
          registration_info: string | null;
          requirements: string | null;
          schedule: string | null;
          school_id: string | null;
          school_level: string | null;
          season: string | null;
          source_fetched_at: string | null;
          source_id: string | null;
          status: Database["public"]["Enums"]["content_status"];
          updated_at: string;
          verification_status: string;
          verified_at: string | null;
          verified_by: string | null;
        };
        Insert: {
          activity_type?: string;
          contact_id?: string | null;
          created_at?: string;
          description?: string | null;
          enrollment_open?: boolean;
          forms_url?: string | null;
          gender?: string | null;
          grades?: string | null;
          id: string;
          image_url?: string | null;
          location?: string | null;
          name: string;
          official_url?: string | null;
          registration_info?: string | null;
          requirements?: string | null;
          schedule?: string | null;
          school_id?: string | null;
          school_level?: string | null;
          season?: string | null;
          source_fetched_at?: string | null;
          source_id?: string | null;
          status?: Database["public"]["Enums"]["content_status"];
          updated_at?: string;
          verification_status?: string;
          verified_at?: string | null;
          verified_by?: string | null;
        };
        Update: {
          activity_type?: string;
          contact_id?: string | null;
          created_at?: string;
          description?: string | null;
          enrollment_open?: boolean;
          forms_url?: string | null;
          gender?: string | null;
          grades?: string | null;
          id?: string;
          image_url?: string | null;
          location?: string | null;
          name?: string;
          official_url?: string | null;
          registration_info?: string | null;
          requirements?: string | null;
          schedule?: string | null;
          school_id?: string | null;
          school_level?: string | null;
          season?: string | null;
          source_fetched_at?: string | null;
          source_id?: string | null;
          status?: Database["public"]["Enums"]["content_status"];
          updated_at?: string;
          verification_status?: string;
          verified_at?: string | null;
          verified_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "activities_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activities_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activities_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "official_sources";
            referencedColumns: ["id"];
          },
        ];
      };
      activity_translations: {
        Row: {
          activity_id: string;
          description: string | null;
          id: string;
          language_code: string;
          name: string;
        };
        Insert: {
          activity_id: string;
          description?: string | null;
          id: string;
          language_code: string;
          name: string;
        };
        Update: {
          activity_id?: string;
          description?: string | null;
          id?: string;
          language_code?: string;
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "activity_translations_activity_id_fkey";
            columns: ["activity_id"];
            isOneToOne: false;
            referencedRelation: "activities";
            referencedColumns: ["id"];
          },
        ];
      };
      admin_invitations: {
        Row: {
          accepted_at: string | null;
          accepted_by: string | null;
          created_at: string;
          email: string;
          expires_at: string;
          full_name: string | null;
          id: string;
          invited_by: string | null;
          notes: string | null;
          permissions: Json;
          role: Database["public"]["Enums"]["app_role"];
          status: string;
          token: string;
          updated_at: string;
        };
        Insert: {
          accepted_at?: string | null;
          accepted_by?: string | null;
          created_at?: string;
          email: string;
          expires_at?: string;
          full_name?: string | null;
          id?: string;
          invited_by?: string | null;
          notes?: string | null;
          permissions?: Json;
          role?: Database["public"]["Enums"]["app_role"];
          status?: string;
          token?: string;
          updated_at?: string;
        };
        Update: {
          accepted_at?: string | null;
          accepted_by?: string | null;
          created_at?: string;
          email?: string;
          expires_at?: string;
          full_name?: string | null;
          id?: string;
          invited_by?: string | null;
          notes?: string | null;
          permissions?: Json;
          role?: Database["public"]["Enums"]["app_role"];
          status?: string;
          token?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      ai_actions: {
        Row: {
          confirmed: boolean;
          conversation_id: string | null;
          created_at: string;
          error_message: string | null;
          id: string;
          input: Json | null;
          instruction: string | null;
          result: Json | null;
          school_id: string | null;
          status: string;
          target_id: string | null;
          target_table: string | null;
          tool_name: string;
          user_id: string;
        };
        Insert: {
          confirmed?: boolean;
          conversation_id?: string | null;
          created_at?: string;
          error_message?: string | null;
          id?: string;
          input?: Json | null;
          instruction?: string | null;
          result?: Json | null;
          school_id?: string | null;
          status?: string;
          target_id?: string | null;
          target_table?: string | null;
          tool_name: string;
          user_id: string;
        };
        Update: {
          confirmed?: boolean;
          conversation_id?: string | null;
          created_at?: string;
          error_message?: string | null;
          id?: string;
          input?: Json | null;
          instruction?: string | null;
          result?: Json | null;
          school_id?: string | null;
          status?: string;
          target_id?: string | null;
          target_table?: string | null;
          tool_name?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_actions_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "ai_conversations";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_conversations: {
        Row: {
          created_at: string;
          id: string;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          title?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      ai_messages: {
        Row: {
          conversation_id: string;
          created_at: string;
          id: string;
          message: Json;
          role: string;
          user_id: string;
        };
        Insert: {
          conversation_id: string;
          created_at?: string;
          id?: string;
          message: Json;
          role: string;
          user_id: string;
        };
        Update: {
          conversation_id?: string;
          created_at?: string;
          id?: string;
          message?: Json;
          role?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "ai_conversations";
            referencedColumns: ["id"];
          },
        ];
      };
      announcement_translations: {
        Row: {
          announcement_id: string;
          id: string;
          language_code: string;
          message: string;
          title: string;
        };
        Insert: {
          announcement_id: string;
          id: string;
          language_code: string;
          message: string;
          title: string;
        };
        Update: {
          announcement_id?: string;
          id?: string;
          language_code?: string;
          message?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "announcement_translations_announcement_id_fkey";
            columns: ["announcement_id"];
            isOneToOne: false;
            referencedRelation: "announcements";
            referencedColumns: ["id"];
          },
        ];
      };
      announcements: {
        Row: {
          category_ids: string[];
          created_at: string;
          created_by: string | null;
          expires_at: string | null;
          id: string;
          is_pinned: boolean;
          level: Database["public"]["Enums"]["announcement_level"];
          link_url: string | null;
          school_id: string | null;
          show_on_home: boolean;
          sms_sent_at: string | null;
          starts_at: string;
          status: Database["public"]["Enums"]["content_status"];
          updated_at: string;
        };
        Insert: {
          category_ids?: string[];
          created_at?: string;
          created_by?: string | null;
          expires_at?: string | null;
          id: string;
          is_pinned?: boolean;
          level?: Database["public"]["Enums"]["announcement_level"];
          link_url?: string | null;
          school_id?: string | null;
          show_on_home?: boolean;
          sms_sent_at?: string | null;
          starts_at?: string;
          status?: Database["public"]["Enums"]["content_status"];
          updated_at?: string;
        };
        Update: {
          category_ids?: string[];
          created_at?: string;
          created_by?: string | null;
          expires_at?: string | null;
          id?: string;
          is_pinned?: boolean;
          level?: Database["public"]["Enums"]["announcement_level"];
          link_url?: string | null;
          school_id?: string | null;
          show_on_home?: boolean;
          sms_sent_at?: string | null;
          starts_at?: string;
          status?: Database["public"]["Enums"]["content_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "announcements_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
        ];
      };
      appearance_settings: {
        Row: {
          dark_theme: Json;
          favicon_url: string | null;
          pwa_icon_url: string | null;
          application_logo_storage_path: string | null;
          favicon_storage_path: string | null;
          pwa_icon_storage_path: string | null;
          branding_version: string | null;
          id: string;
          settings: Json;
          site_title: string | null;
          site_tagline: string | null;
          primary_color: string | null;
          accent_color: string | null;
          neutral_color: string | null;
          font_family: string | null;
          header_bg: string | null;
          footer_bg: string | null;
          light_theme: Json;
          logo_alt: string | null;
          logo_dark_url: string | null;
          logo_height: number;
          logo_light_url: string | null;
          logo_url: string | null;
          previous_settings: Json | null;
          show_wordmark: boolean;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          dark_theme?: Json;
          favicon_url?: string | null;
          pwa_icon_url?: string | null;
          application_logo_storage_path?: string | null;
          favicon_storage_path?: string | null;
          pwa_icon_storage_path?: string | null;
          branding_version?: string | null;
          id: string;
          settings?: Json;
          site_title?: string | null;
          site_tagline?: string | null;
          primary_color?: string | null;
          accent_color?: string | null;
          neutral_color?: string | null;
          font_family?: string | null;
          header_bg?: string | null;
          footer_bg?: string | null;
          light_theme?: Json;
          logo_alt?: string | null;
          logo_dark_url?: string | null;
          logo_height?: number;
          logo_light_url?: string | null;
          logo_url?: string | null;
          previous_settings?: Json | null;
          show_wordmark?: boolean;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          dark_theme?: Json;
          favicon_url?: string | null;
          pwa_icon_url?: string | null;
          application_logo_storage_path?: string | null;
          favicon_storage_path?: string | null;
          pwa_icon_storage_path?: string | null;
          branding_version?: string | null;
          id?: string;
          settings?: Json;
          site_title?: string | null;
          site_tagline?: string | null;
          primary_color?: string | null;
          accent_color?: string | null;
          neutral_color?: string | null;
          font_family?: string | null;
          header_bg?: string | null;
          footer_bg?: string | null;
          light_theme?: Json;
          logo_alt?: string | null;
          logo_dark_url?: string | null;
          logo_height?: number;
          logo_light_url?: string | null;
          logo_url?: string | null;
          previous_settings?: Json | null;
          show_wordmark?: boolean;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      article_relations: {
        Row: {
          article_id: string;
          id: string;
          related_article_id: string;
        };
        Insert: {
          article_id: string;
          id: string;
          related_article_id: string;
        };
        Update: {
          article_id?: string;
          id?: string;
          related_article_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "article_relations_article_id_fkey";
            columns: ["article_id"];
            isOneToOne: false;
            referencedRelation: "articles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "article_relations_related_article_id_fkey";
            columns: ["related_article_id"];
            isOneToOne: false;
            referencedRelation: "articles";
            referencedColumns: ["id"];
          },
        ];
      };
      article_tags: {
        Row: {
          article_id: string;
          id: string;
          tag_id: string;
        };
        Insert: {
          article_id: string;
          id: string;
          tag_id: string;
        };
        Update: {
          article_id?: string;
          id?: string;
          tag_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "article_tags_article_id_fkey";
            columns: ["article_id"];
            isOneToOne: false;
            referencedRelation: "articles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "article_tags_tag_id_fkey";
            columns: ["tag_id"];
            isOneToOne: false;
            referencedRelation: "tags";
            referencedColumns: ["id"];
          },
        ];
      };
      article_translations: {
        Row: {
          article_id: string;
          content_blocks: Json;
          id: string;
          keywords: string | null;
          language_code: string;
          seo_description: string | null;
          seo_title: string | null;
          summary: string | null;
          title: string;
          translation_status: string;
          updated_at: string;
        };
        Insert: {
          article_id: string;
          content_blocks?: Json;
          id: string;
          keywords?: string | null;
          language_code: string;
          seo_description?: string | null;
          seo_title?: string | null;
          summary?: string | null;
          title: string;
          translation_status?: string;
          updated_at?: string;
        };
        Update: {
          article_id?: string;
          content_blocks?: Json;
          id?: string;
          keywords?: string | null;
          language_code?: string;
          seo_description?: string | null;
          seo_title?: string | null;
          summary?: string | null;
          title?: string;
          translation_status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "article_translations_article_id_fkey";
            columns: ["article_id"];
            isOneToOne: false;
            referencedRelation: "articles";
            referencedColumns: ["id"];
          },
        ];
      };
      articles: {
        Row: {
          id: string;
          slug: string;
          title: string | null;
          summary: string | null;
          content: string | null;
          status: Database["public"]["Enums"]["content_status"];
          category_id: string | null;
          school_id: string | null;
          is_featured: boolean;
          verification_status: string;
          verification_details: string | null;
          verified_at: string | null;
          verified_by: string | null;
          author_id: string | null;
          contact_id: string | null;
          source_authority: string | null;
          source_url: string | null;
          source_name: string | null;
          source_id: string | null;
          source_fetched_at: string | null;
          read_time_minutes: number;
          featured_image_url: string | null;
          card_banner_url: string | null;
          card_banners: Json;
          featured_images: Json;
          card_bg: string | null;
          image_alt: string | null;
          bottom_nav: Json;
          official_url: string | null;
          admin_note: string | null;
          starts_at: string | null;
          ends_at: string | null;
          published_at: string | null;
          scheduled_at: string | null;
          review_date: string | null;
          is_demo: boolean;
          last_verified_at: string | null;
          view_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          slug: string;
          title?: string | null;
          summary?: string | null;
          content?: string | null;
          status?: Database["public"]["Enums"]["content_status"];
          category_id?: string | null;
          school_id?: string | null;
          is_featured?: boolean;
          verification_status?: string;
          verification_details?: string | null;
          verified_at?: string | null;
          verified_by?: string | null;
          author_id?: string | null;
          contact_id?: string | null;
          source_authority?: string | null;
          source_url?: string | null;
          source_name?: string | null;
          source_id?: string | null;
          source_fetched_at?: string | null;
          read_time_minutes?: number;
          featured_image_url?: string | null;
          card_banner_url?: string | null;
          card_banners?: Json;
          featured_images?: Json;
          card_bg?: string | null;
          image_alt?: string | null;
          bottom_nav?: Json;
          official_url?: string | null;
          admin_note?: string | null;
          starts_at?: string | null;
          ends_at?: string | null;
          published_at?: string | null;
          scheduled_at?: string | null;
          review_date?: string | null;
          is_demo?: boolean;
          last_verified_at?: string | null;
          view_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string | null;
          summary?: string | null;
          content?: string | null;
          status?: Database["public"]["Enums"]["content_status"];
          category_id?: string | null;
          school_id?: string | null;
          is_featured?: boolean;
          verification_status?: string;
          verification_details?: string | null;
          verified_at?: string | null;
          verified_by?: string | null;
          author_id?: string | null;
          contact_id?: string | null;
          source_authority?: string | null;
          source_url?: string | null;
          source_name?: string | null;
          source_id?: string | null;
          source_fetched_at?: string | null;
          read_time_minutes?: number;
          featured_image_url?: string | null;
          card_banner_url?: string | null;
          card_banners?: Json;
          featured_images?: Json;
          card_bg?: string | null;
          image_alt?: string | null;
          bottom_nav?: Json;
          official_url?: string | null;
          admin_note?: string | null;
          starts_at?: string | null;
          ends_at?: string | null;
          published_at?: string | null;
          scheduled_at?: string | null;
          review_date?: string | null;
          is_demo?: boolean;
          last_verified_at?: string | null;
          view_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "articles_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "articles_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_logs: {
        Row: {
          action: string;
          change_summary: string | null;
          created_at: string;
          entity_id: string | null;
          entity_type: string | null;
          id: string;
          user_id: string | null;
        };
        Insert: {
          action: string;
          change_summary?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string | null;
          id?: string;
          user_id?: string | null;
        };
        Update: {
          action?: string;
          change_summary?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string | null;
          id?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      broken_link_reports: {
        Row: {
          created_at: string;
          entity_id: string | null;
          entity_type: string | null;
          id: string;
          message: string | null;
          status: string;
          updated_at: string;
          url: string;
        };
        Insert: {
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string | null;
          id?: string;
          message?: string | null;
          status?: string;
          updated_at?: string;
          url: string;
        };
        Update: {
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string | null;
          id?: string;
          message?: string | null;
          status?: string;
          updated_at?: string;
          url?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          cover_image_url: string | null;
          created_at: string;
          description: string | null;
          display_order: number;
          full_description: string | null;
          icon: string;
          id: string;
          is_featured: boolean;
          is_visible: boolean;
          last_reviewed_at: string | null;
          name: string;
          parent_id: string | null;
          slug: string;
          source_id: string | null;
          updated_at: string;
        };
        Insert: {
          cover_image_url?: string | null;
          created_at?: string;
          description?: string | null;
          display_order?: number;
          full_description?: string | null;
          icon?: string;
          id: string;
          is_featured?: boolean;
          is_visible?: boolean;
          last_reviewed_at?: string | null;
          name: string;
          parent_id?: string | null;
          slug: string;
          source_id?: string | null;
          updated_at?: string;
        };
        Update: {
          cover_image_url?: string | null;
          created_at?: string;
          description?: string | null;
          display_order?: number;
          full_description?: string | null;
          icon?: string;
          id?: string;
          is_featured?: boolean;
          is_visible?: boolean;
          last_reviewed_at?: string | null;
          name?: string;
          parent_id?: string | null;
          slug?: string;
          source_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "categories_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "official_sources";
            referencedColumns: ["id"];
          },
        ];
      };
      category_translations: {
        Row: {
          category_id: string;
          description: string | null;
          id: string;
          language_code: string;
          name: string;
        };
        Insert: {
          category_id: string;
          description?: string | null;
          id: string;
          language_code: string;
          name: string;
        };
        Update: {
          category_id?: string;
          description?: string | null;
          id?: string;
          language_code?: string;
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "category_translations_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      contacts: {
        Row: {
          address: string | null;
          category_ids: string[];
          created_at: string;
          department: string;
          display_order: number;
          email: string | null;
          extension: string | null;
          hours: string | null;
          id: string;
          is_emergency: boolean;
          is_visible: boolean;
          job_title: string | null;
          languages: string[];
          person_name: string | null;
          phone: string | null;
          role_title: string | null;
          school_id: string | null;
          source_fetched_at: string | null;
          source_id: string | null;
          updated_at: string;
          verification_status: string;
          verified_at: string | null;
          verified_by: string | null;
        };
        Insert: {
          address?: string | null;
          category_ids?: string[];
          created_at?: string;
          department: string;
          display_order?: number;
          email?: string | null;
          extension?: string | null;
          hours?: string | null;
          id: string;
          is_emergency?: boolean;
          is_visible?: boolean;
          job_title?: string | null;
          languages?: string[];
          person_name?: string | null;
          phone?: string | null;
          role_title?: string | null;
          school_id?: string | null;
          source_fetched_at?: string | null;
          source_id?: string | null;
          updated_at?: string;
          verification_status?: string;
          verified_at?: string | null;
          verified_by?: string | null;
        };
        Update: {
          address?: string | null;
          category_ids?: string[];
          created_at?: string;
          department?: string;
          display_order?: number;
          email?: string | null;
          extension?: string | null;
          hours?: string | null;
          id?: string;
          is_emergency?: boolean;
          is_visible?: boolean;
          job_title?: string | null;
          languages?: string[];
          person_name?: string | null;
          phone?: string | null;
          role_title?: string | null;
          school_id?: string | null;
          source_fetched_at?: string | null;
          source_id?: string | null;
          updated_at?: string;
          verification_status?: string;
          verified_at?: string | null;
          verified_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "contacts_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contacts_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "official_sources";
            referencedColumns: ["id"];
          },
        ];
      };
      dart_calendar_dates: {
        Row: {
          date: string;
          exception_type: number;
          id: number;
          service_id: string;
        };
        Insert: {
          date: string;
          exception_type: number;
          id?: number;
          service_id: string;
        };
        Update: {
          date?: string;
          exception_type?: number;
          id?: number;
          service_id?: string;
        };
        Relationships: [];
      };
      dart_feed_status: {
        Row: {
          configured: boolean;
          connected: boolean;
          content_hash: string | null;
          feed_key: string;
          last_attempt_at: string | null;
          last_error: string | null;
          last_feed_timestamp: string | null;
          last_success_at: string | null;
          record_count: number;
          updated_at: string;
        };
        Insert: {
          configured?: boolean;
          connected?: boolean;
          content_hash?: string | null;
          feed_key: string;
          last_attempt_at?: string | null;
          last_error?: string | null;
          last_feed_timestamp?: string | null;
          last_success_at?: string | null;
          record_count?: number;
          updated_at?: string;
        };
        Update: {
          configured?: boolean;
          connected?: boolean;
          content_hash?: string | null;
          feed_key?: string;
          last_attempt_at?: string | null;
          last_error?: string | null;
          last_feed_timestamp?: string | null;
          last_success_at?: string | null;
          record_count?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      dart_geocode_cache: {
        Row: {
          created_at: string;
          display_name: string;
          hit_count: number;
          id: number;
          latitude: number;
          longitude: number;
          query_key: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          display_name: string;
          hit_count?: number;
          id?: number;
          latitude: number;
          longitude: number;
          query_key: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          display_name?: string;
          hit_count?: number;
          id?: number;
          latitude?: number;
          longitude?: number;
          query_key?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      dart_routes: {
        Row: {
          agency_id: string | null;
          created_at: string;
          route_color: string | null;
          route_desc: string | null;
          route_id: string;
          route_long_name: string | null;
          route_short_name: string | null;
          route_text_color: string | null;
          route_type: number | null;
          route_url: string | null;
          sort_order: number | null;
          updated_at: string;
        };
        Insert: {
          agency_id?: string | null;
          created_at?: string;
          route_color?: string | null;
          route_desc?: string | null;
          route_id: string;
          route_long_name?: string | null;
          route_short_name?: string | null;
          route_text_color?: string | null;
          route_type?: number | null;
          route_url?: string | null;
          sort_order?: number | null;
          updated_at?: string;
        };
        Update: {
          agency_id?: string | null;
          created_at?: string;
          route_color?: string | null;
          route_desc?: string | null;
          route_id?: string;
          route_long_name?: string | null;
          route_short_name?: string | null;
          route_text_color?: string | null;
          route_type?: number | null;
          route_url?: string | null;
          sort_order?: number | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      dart_service_alerts: {
        Row: {
          active_from: string | null;
          active_until: string | null;
          alert_id: string;
          cause: string | null;
          description_text: string | null;
          effect: string | null;
          feed_timestamp: string | null;
          header_text: string | null;
          informed_routes: string[];
          informed_stops: string[];
          informed_trips: string[];
          recorded_at: string;
          severity_level: string | null;
          url: string | null;
        };
        Insert: {
          active_from?: string | null;
          active_until?: string | null;
          alert_id: string;
          cause?: string | null;
          description_text?: string | null;
          effect?: string | null;
          feed_timestamp?: string | null;
          header_text?: string | null;
          informed_routes?: string[];
          informed_stops?: string[];
          informed_trips?: string[];
          recorded_at?: string;
          severity_level?: string | null;
          url?: string | null;
        };
        Update: {
          active_from?: string | null;
          active_until?: string | null;
          alert_id?: string;
          cause?: string | null;
          description_text?: string | null;
          effect?: string | null;
          feed_timestamp?: string | null;
          header_text?: string | null;
          informed_routes?: string[];
          informed_stops?: string[];
          informed_trips?: string[];
          recorded_at?: string;
          severity_level?: string | null;
          url?: string | null;
        };
        Relationships: [];
      };
      dart_service_calendars: {
        Row: {
          end_date: string;
          friday: boolean;
          monday: boolean;
          saturday: boolean;
          service_id: string;
          start_date: string;
          sunday: boolean;
          thursday: boolean;
          tuesday: boolean;
          wednesday: boolean;
        };
        Insert: {
          end_date: string;
          friday?: boolean;
          monday?: boolean;
          saturday?: boolean;
          service_id: string;
          start_date: string;
          sunday?: boolean;
          thursday?: boolean;
          tuesday?: boolean;
          wednesday?: boolean;
        };
        Update: {
          end_date?: string;
          friday?: boolean;
          monday?: boolean;
          saturday?: boolean;
          service_id?: string;
          start_date?: string;
          sunday?: boolean;
          thursday?: boolean;
          tuesday?: boolean;
          wednesday?: boolean;
        };
        Relationships: [];
      };
      dart_shapes: {
        Row: {
          points: Json;
          shape_id: string;
        };
        Insert: {
          points?: Json;
          shape_id: string;
        };
        Update: {
          points?: Json;
          shape_id?: string;
        };
        Relationships: [];
      };
      dart_stop_times: {
        Row: {
          arrival_seconds: number | null;
          departure_seconds: number | null;
          drop_off_type: number | null;
          id: number;
          pickup_type: number | null;
          shape_dist_traveled: number | null;
          stop_headsign: string | null;
          stop_id: string;
          stop_sequence: number;
          trip_id: string;
        };
        Insert: {
          arrival_seconds?: number | null;
          departure_seconds?: number | null;
          drop_off_type?: number | null;
          id?: number;
          pickup_type?: number | null;
          shape_dist_traveled?: number | null;
          stop_headsign?: string | null;
          stop_id: string;
          stop_sequence: number;
          trip_id: string;
        };
        Update: {
          arrival_seconds?: number | null;
          departure_seconds?: number | null;
          drop_off_type?: number | null;
          id?: number;
          pickup_type?: number | null;
          shape_dist_traveled?: number | null;
          stop_headsign?: string | null;
          stop_id?: string;
          stop_sequence?: number;
          trip_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "dart_stop_times_stop_id_fkey";
            columns: ["stop_id"];
            isOneToOne: false;
            referencedRelation: "dart_stops";
            referencedColumns: ["stop_id"];
          },
          {
            foreignKeyName: "dart_stop_times_trip_id_fkey";
            columns: ["trip_id"];
            isOneToOne: false;
            referencedRelation: "dart_trips";
            referencedColumns: ["trip_id"];
          },
        ];
      };
      dart_stops: {
        Row: {
          created_at: string;
          location_type: number;
          parent_station: string | null;
          stop_code: string | null;
          stop_desc: string | null;
          stop_id: string;
          stop_lat: number | null;
          stop_lon: number | null;
          stop_name: string;
          updated_at: string;
          wheelchair_boarding: number | null;
          zone_id: string | null;
        };
        Insert: {
          created_at?: string;
          location_type?: number;
          parent_station?: string | null;
          stop_code?: string | null;
          stop_desc?: string | null;
          stop_id: string;
          stop_lat?: number | null;
          stop_lon?: number | null;
          stop_name: string;
          updated_at?: string;
          wheelchair_boarding?: number | null;
          zone_id?: string | null;
        };
        Update: {
          created_at?: string;
          location_type?: number;
          parent_station?: string | null;
          stop_code?: string | null;
          stop_desc?: string | null;
          stop_id?: string;
          stop_lat?: number | null;
          stop_lon?: number | null;
          stop_name?: string;
          updated_at?: string;
          wheelchair_boarding?: number | null;
          zone_id?: string | null;
        };
        Relationships: [];
      };
      dart_sync_logs: {
        Row: {
          created_at: string;
          duration_ms: number | null;
          feed_key: string;
          id: number;
          message: string | null;
          records_processed: number;
          status: string;
          triggered_by: string | null;
        };
        Insert: {
          created_at?: string;
          duration_ms?: number | null;
          feed_key: string;
          id?: number;
          message?: string | null;
          records_processed?: number;
          status: string;
          triggered_by?: string | null;
        };
        Update: {
          created_at?: string;
          duration_ms?: number | null;
          feed_key?: string;
          id?: number;
          message?: string | null;
          records_processed?: number;
          status?: string;
          triggered_by?: string | null;
        };
        Relationships: [];
      };
      dart_trip_updates: {
        Row: {
          arrival_time: string | null;
          delay_seconds: number | null;
          departure_time: string | null;
          feed_timestamp: string | null;
          id: number;
          recorded_at: string;
          route_id: string | null;
          schedule_relationship: string | null;
          stop_id: string;
          stop_sequence: number | null;
          trip_id: string;
          vehicle_id: string | null;
        };
        Insert: {
          arrival_time?: string | null;
          delay_seconds?: number | null;
          departure_time?: string | null;
          feed_timestamp?: string | null;
          id?: number;
          recorded_at?: string;
          route_id?: string | null;
          schedule_relationship?: string | null;
          stop_id: string;
          stop_sequence?: number | null;
          trip_id: string;
          vehicle_id?: string | null;
        };
        Update: {
          arrival_time?: string | null;
          delay_seconds?: number | null;
          departure_time?: string | null;
          feed_timestamp?: string | null;
          id?: number;
          recorded_at?: string;
          route_id?: string | null;
          schedule_relationship?: string | null;
          stop_id?: string;
          stop_sequence?: number | null;
          trip_id?: string;
          vehicle_id?: string | null;
        };
        Relationships: [];
      };
      dart_trips: {
        Row: {
          bikes_allowed: number | null;
          block_id: string | null;
          direction_id: number | null;
          route_id: string;
          service_id: string;
          shape_id: string | null;
          trip_headsign: string | null;
          trip_id: string;
          trip_short_name: string | null;
          wheelchair_accessible: number | null;
        };
        Insert: {
          bikes_allowed?: number | null;
          block_id?: string | null;
          direction_id?: number | null;
          route_id: string;
          service_id: string;
          shape_id?: string | null;
          trip_headsign?: string | null;
          trip_id: string;
          trip_short_name?: string | null;
          wheelchair_accessible?: number | null;
        };
        Update: {
          bikes_allowed?: number | null;
          block_id?: string | null;
          direction_id?: number | null;
          route_id?: string;
          service_id?: string;
          shape_id?: string | null;
          trip_headsign?: string | null;
          trip_id?: string;
          trip_short_name?: string | null;
          wheelchair_accessible?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "dart_trips_route_id_fkey";
            columns: ["route_id"];
            isOneToOne: false;
            referencedRelation: "dart_routes";
            referencedColumns: ["route_id"];
          },
        ];
      };
      dart_vehicle_positions: {
        Row: {
          bearing: number | null;
          current_status: string | null;
          direction_id: number | null;
          feed_timestamp: string | null;
          id: number;
          latitude: number | null;
          longitude: number | null;
          occupancy_status: string | null;
          recorded_at: string;
          route_id: string | null;
          speed: number | null;
          stop_id: string | null;
          trip_id: string | null;
          vehicle_id: string;
          vehicle_label: string | null;
        };
        Insert: {
          bearing?: number | null;
          current_status?: string | null;
          direction_id?: number | null;
          feed_timestamp?: string | null;
          id?: number;
          latitude?: number | null;
          longitude?: number | null;
          occupancy_status?: string | null;
          recorded_at?: string;
          route_id?: string | null;
          speed?: number | null;
          stop_id?: string | null;
          trip_id?: string | null;
          vehicle_id: string;
          vehicle_label?: string | null;
        };
        Update: {
          bearing?: number | null;
          current_status?: string | null;
          direction_id?: number | null;
          feed_timestamp?: string | null;
          id?: number;
          latitude?: number | null;
          longitude?: number | null;
          occupancy_status?: string | null;
          recorded_at?: string;
          route_id?: string | null;
          speed?: number | null;
          stop_id?: string | null;
          trip_id?: string | null;
          vehicle_id?: string;
          vehicle_label?: string | null;
        };
        Relationships: [];
      };
      event_translations: {
        Row: {
          description: string | null;
          event_id: string;
          id: string;
          language_code: string;
          title: string;
        };
        Insert: {
          description?: string | null;
          event_id: string;
          id: string;
          language_code: string;
          title: string;
        };
        Update: {
          description?: string | null;
          event_id?: string;
          id?: string;
          language_code?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "event_translations_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      events: {
        Row: {
          all_day: boolean;
          category_id: string | null;
          contact_id: string | null;
          created_at: string;
          description: string | null;
          end_date: string | null;
          end_time: string | null;
          event_type: string;
          id: string;
          image_url: string | null;
          is_cancelled: boolean;
          is_featured: boolean;
          location: string | null;
          official_url: string | null;
          published_at: string | null;
          recurrence_rule: string | null;
          school_id: string | null;
          slug: string;
          source_fetched_at: string | null;
          source_id: string | null;
          start_date: string;
          start_time: string | null;
          status: Database["public"]["Enums"]["content_status"];
          title: string;
          updated_at: string;
          verification_status: string;
          verified_at: string | null;
          verified_by: string | null;
        };
        Insert: {
          all_day?: boolean;
          category_id?: string | null;
          contact_id?: string | null;
          created_at?: string;
          description?: string | null;
          end_date?: string | null;
          end_time?: string | null;
          event_type?: string;
          id: string;
          image_url?: string | null;
          is_cancelled?: boolean;
          is_featured?: boolean;
          location?: string | null;
          official_url?: string | null;
          published_at?: string | null;
          recurrence_rule?: string | null;
          school_id?: string | null;
          slug: string;
          source_fetched_at?: string | null;
          source_id?: string | null;
          start_date: string;
          start_time?: string | null;
          status?: Database["public"]["Enums"]["content_status"];
          title: string;
          updated_at?: string;
          verification_status?: string;
          verified_at?: string | null;
          verified_by?: string | null;
        };
        Update: {
          all_day?: boolean;
          category_id?: string | null;
          contact_id?: string | null;
          created_at?: string;
          description?: string | null;
          end_date?: string | null;
          end_time?: string | null;
          event_type?: string;
          id?: string;
          image_url?: string | null;
          is_cancelled?: boolean;
          is_featured?: boolean;
          location?: string | null;
          official_url?: string | null;
          published_at?: string | null;
          recurrence_rule?: string | null;
          school_id?: string | null;
          slug?: string;
          source_fetched_at?: string | null;
          source_id?: string | null;
          start_date?: string;
          start_time?: string | null;
          status?: Database["public"]["Enums"]["content_status"];
          title?: string;
          updated_at?: string;
          verification_status?: string;
          verified_at?: string | null;
          verified_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "events_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "events_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "events_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "events_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "official_sources";
            referencedColumns: ["id"];
          },
        ];
      };
      faq_translations: {
        Row: {
          answer: string;
          faq_id: string;
          id: string;
          language_code: string;
          question: string;
        };
        Insert: {
          answer: string;
          faq_id: string;
          id: string;
          language_code: string;
          question: string;
        };
        Update: {
          answer?: string;
          faq_id?: string;
          id?: string;
          language_code?: string;
          question?: string;
        };
        Relationships: [
          {
            foreignKeyName: "faq_translations_faq_id_fkey";
            columns: ["faq_id"];
            isOneToOne: false;
            referencedRelation: "faqs";
            referencedColumns: ["id"];
          },
        ];
      };
      faqs: {
        Row: {
          article_id: string | null;
          category_id: string | null;
          created_at: string;
          display_order: number;
          id: string;
          school_id: string | null;
          status: Database["public"]["Enums"]["content_status"];
          updated_at: string;
        };
        Insert: {
          article_id?: string | null;
          category_id?: string | null;
          created_at?: string;
          display_order?: number;
          id: string;
          school_id?: string | null;
          status?: Database["public"]["Enums"]["content_status"];
          updated_at?: string;
        };
        Update: {
          article_id?: string | null;
          category_id?: string | null;
          created_at?: string;
          display_order?: number;
          id?: string;
          school_id?: string | null;
          status?: Database["public"]["Enums"]["content_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "faqs_article_id_fkey";
            columns: ["article_id"];
            isOneToOne: false;
            referencedRelation: "articles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "faqs_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "faqs_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
        ];
      };
      feedback: {
        Row: {
          anonymous_session_id: string | null;
          article_id: string | null;
          created_at: string;
          id: string;
          was_helpful: boolean;
        };
        Insert: {
          anonymous_session_id?: string | null;
          article_id?: string | null;
          created_at?: string;
          id?: string;
          was_helpful: boolean;
        };
        Update: {
          anonymous_session_id?: string | null;
          article_id?: string | null;
          created_at?: string;
          id?: string;
          was_helpful?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "feedback_article_id_fkey";
            columns: ["article_id"];
            isOneToOne: false;
            referencedRelation: "articles";
            referencedColumns: ["id"];
          },
        ];
      };
      help_answers: {
        Row: {
          answer: string;
          category_id: string | null;
          display_order: number;
          expires_at: string | null;
          id: string;
          internal_url: string | null;
          is_active: boolean;
          is_approved: boolean;
          keywords: string[];
          language_code: string;
          official_source_url: string | null;
          question: string;
          school_id: string | null;
          steps: string[];
          updated_at: string;
          verified_at: string | null;
        };
        Insert: {
          answer: string;
          category_id?: string | null;
          display_order?: number;
          expires_at?: string | null;
          id: string;
          internal_url?: string | null;
          is_active?: boolean;
          is_approved?: boolean;
          keywords?: string[];
          language_code?: string;
          official_source_url?: string | null;
          question: string;
          school_id?: string | null;
          steps?: string[];
          updated_at?: string;
          verified_at?: string | null;
        };
        Update: {
          answer?: string;
          category_id?: string | null;
          display_order?: number;
          expires_at?: string | null;
          id?: string;
          internal_url?: string | null;
          is_active?: boolean;
          is_approved?: boolean;
          keywords?: string[];
          language_code?: string;
          official_source_url?: string | null;
          question?: string;
          school_id?: string | null;
          steps?: string[];
          updated_at?: string;
          verified_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "help_answers_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "help_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "help_answers_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "help_schools";
            referencedColumns: ["id"];
          },
        ];
      };
      help_bfl_contacts: {
        Row: {
          display_order: number;
          email: string | null;
          id: string;
          is_verified: boolean;
          is_visible: boolean;
          languages: string[];
          office: string | null;
          official_source_url: string | null;
          person_name: string;
          phone: string | null;
          public_hours: string | null;
          public_role: string | null;
          school_id: string | null;
          updated_at: string;
          verified_at: string | null;
        };
        Insert: {
          display_order?: number;
          email?: string | null;
          id: string;
          is_verified?: boolean;
          is_visible?: boolean;
          languages?: string[];
          office?: string | null;
          official_source_url?: string | null;
          person_name: string;
          phone?: string | null;
          public_hours?: string | null;
          public_role?: string | null;
          school_id?: string | null;
          updated_at?: string;
          verified_at?: string | null;
        };
        Update: {
          display_order?: number;
          email?: string | null;
          id?: string;
          is_verified?: boolean;
          is_visible?: boolean;
          languages?: string[];
          office?: string | null;
          official_source_url?: string | null;
          person_name?: string;
          phone?: string | null;
          public_hours?: string | null;
          public_role?: string | null;
          school_id?: string | null;
          updated_at?: string;
          verified_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "help_bfl_contacts_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "help_schools";
            referencedColumns: ["id"];
          },
        ];
      };
      help_categories: {
        Row: {
          display_order: number;
          icon: string;
          id: string;
          internal_url: string | null;
          is_active: boolean;
          name: string;
          name_en: string | null;
          school_id: string | null;
          search_terms: string[];
          updated_at: string;
        };
        Insert: {
          display_order?: number;
          icon?: string;
          id: string;
          internal_url?: string | null;
          is_active?: boolean;
          name: string;
          name_en?: string | null;
          school_id?: string | null;
          search_terms?: string[];
          updated_at?: string;
        };
        Update: {
          display_order?: number;
          icon?: string;
          id?: string;
          internal_url?: string | null;
          is_active?: boolean;
          name?: string;
          name_en?: string | null;
          school_id?: string | null;
          search_terms?: string[];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "help_categories_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "help_schools";
            referencedColumns: ["id"];
          },
        ];
      };
      help_feedback: {
        Row: {
          answer_id: string | null;
          category_id: string | null;
          created_at: string;
          helpful_rating: string | null;
          id: string;
          sanitized_comment: string | null;
          school_id: string | null;
          star_rating: number | null;
        };
        Insert: {
          answer_id?: string | null;
          category_id?: string | null;
          created_at?: string;
          helpful_rating?: string | null;
          id?: string;
          sanitized_comment?: string | null;
          school_id?: string | null;
          star_rating?: number | null;
        };
        Update: {
          answer_id?: string | null;
          category_id?: string | null;
          created_at?: string;
          helpful_rating?: string | null;
          id?: string;
          sanitized_comment?: string | null;
          school_id?: string | null;
          star_rating?: number | null;
        };
        Relationships: [];
      };
      help_schools: {
        Row: {
          display_order: number;
          id: string;
          is_active: boolean;
          name: string;
          official_contact_url: string | null;
          short_name: string;
          slug: string;
          updated_at: string;
        };
        Insert: {
          display_order?: number;
          id: string;
          is_active?: boolean;
          name: string;
          official_contact_url?: string | null;
          short_name: string;
          slug: string;
          updated_at?: string;
        };
        Update: {
          display_order?: number;
          id?: string;
          is_active?: boolean;
          name?: string;
          official_contact_url?: string | null;
          short_name?: string;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      help_settings: {
        Row: {
          id: string;
          is_public: boolean;
          setting_key: string;
          setting_value: string | null;
          updated_at: string;
        };
        Insert: {
          id: string;
          is_public?: boolean;
          setting_key: string;
          setting_value?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          is_public?: boolean;
          setting_key?: string;
          setting_value?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      help_synonyms: {
        Row: {
          id: string;
          is_approved: boolean;
          language_code: string;
          primary_term: string;
          related_terms: string[];
          updated_at: string;
        };
        Insert: {
          id: string;
          is_approved?: boolean;
          language_code?: string;
          primary_term: string;
          related_terms?: string[];
          updated_at?: string;
        };
        Update: {
          id?: string;
          is_approved?: boolean;
          language_code?: string;
          primary_term?: string;
          related_terms?: string[];
          updated_at?: string;
        };
        Relationships: [];
      };
      help_unanswered_searches: {
        Row: {
          category_id: string | null;
          first_searched_at: string;
          id: string;
          language_code: string;
          last_searched_at: string;
          normalized_query: string;
          occurrence_count: number;
          review_status: string;
          sanitized_query: string;
          school_id: string | null;
        };
        Insert: {
          category_id?: string | null;
          first_searched_at?: string;
          id?: string;
          language_code?: string;
          last_searched_at?: string;
          normalized_query: string;
          occurrence_count?: number;
          review_status?: string;
          sanitized_query: string;
          school_id?: string | null;
        };
        Update: {
          category_id?: string | null;
          first_searched_at?: string;
          id?: string;
          language_code?: string;
          last_searched_at?: string;
          normalized_query?: string;
          occurrence_count?: number;
          review_status?: string;
          sanitized_query?: string;
          school_id?: string | null;
        };
        Relationships: [];
      };
      media_files: {
        Row: {
          alt_text: string | null;
          created_at: string;
          file_name: string;
          file_size: number | null;
          file_type: string | null;
          file_url: string;
          id: string;
          uploaded_by: string | null;
        };
        Insert: {
          alt_text?: string | null;
          created_at?: string;
          file_name: string;
          file_size?: number | null;
          file_type?: string | null;
          file_url: string;
          id?: string;
          uploaded_by?: string | null;
        };
        Update: {
          alt_text?: string | null;
          created_at?: string;
          file_name?: string;
          file_size?: number | null;
          file_type?: string | null;
          file_url?: string;
          id?: string;
          uploaded_by?: string | null;
        };
        Relationships: [];
      };
      media_permissions: {
        Row: {
          alt_text: string | null;
          category_id: string | null;
          created_at: string;
          description: string | null;
          fetched_at: string;
          file_url: string | null;
          id: string;
          owner: string | null;
          reviewed_by: string | null;
          source_url: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          alt_text?: string | null;
          category_id?: string | null;
          created_at?: string;
          description?: string | null;
          fetched_at?: string;
          file_url?: string | null;
          id?: string;
          owner?: string | null;
          reviewed_by?: string | null;
          source_url?: string | null;
          status?: string;
          updated_at?: string;
        };
        Update: {
          alt_text?: string | null;
          category_id?: string | null;
          created_at?: string;
          description?: string | null;
          fetched_at?: string;
          file_url?: string | null;
          id?: string;
          owner?: string | null;
          reviewed_by?: string | null;
          source_url?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "media_permissions_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      official_sources: {
        Row: {
          approved_at: string | null;
          approved_by: string | null;
          category_id: string | null;
          check_frequency_minutes: number;
          content_hash: string | null;
          created_at: string;
          data_category: string | null;
          id: string;
          images_allowed: boolean;
          is_verified: boolean;
          last_change_at: string | null;
          last_checked_at: string | null;
          last_reviewed_at: string | null;
          link_status: string;
          name: string;
          notes: string | null;
          responsible_user_id: string | null;
          review_state: string;
          source_type: string;
          updated_at: string;
          url: string;
        };
        Insert: {
          approved_at?: string | null;
          approved_by?: string | null;
          category_id?: string | null;
          check_frequency_minutes?: number;
          content_hash?: string | null;
          created_at?: string;
          data_category?: string | null;
          id: string;
          images_allowed?: boolean;
          is_verified?: boolean;
          last_change_at?: string | null;
          last_checked_at?: string | null;
          last_reviewed_at?: string | null;
          link_status?: string;
          name: string;
          notes?: string | null;
          responsible_user_id?: string | null;
          review_state?: string;
          source_type?: string;
          updated_at?: string;
          url: string;
        };
        Update: {
          approved_at?: string | null;
          approved_by?: string | null;
          category_id?: string | null;
          check_frequency_minutes?: number;
          content_hash?: string | null;
          created_at?: string;
          data_category?: string | null;
          id?: string;
          images_allowed?: boolean;
          is_verified?: boolean;
          last_change_at?: string | null;
          last_checked_at?: string | null;
          last_reviewed_at?: string | null;
          link_status?: string;
          name?: string;
          notes?: string | null;
          responsible_user_id?: string | null;
          review_state?: string;
          source_type?: string;
          updated_at?: string;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "official_sources_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      page_views: {
        Row: {
          article_id: string | null;
          category_id: string | null;
          created_at: string;
          id: string;
          language_code: string | null;
        };
        Insert: {
          article_id?: string | null;
          category_id?: string | null;
          created_at?: string;
          id?: string;
          language_code?: string | null;
        };
        Update: {
          article_id?: string | null;
          category_id?: string | null;
          created_at?: string;
          id?: string;
          language_code?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "page_views_article_id_fkey";
            columns: ["article_id"];
            isOneToOne: false;
            referencedRelation: "articles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "page_views_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      podcasts: {
        Row: {
          banner_storage_path: string | null;
          banner_url: string | null;
          cover_storage_path: string | null;
          cover_url: string | null;
          created_at: string;
          description: string | null;
          id: string;
          language: string;
          logo_storage_path: string | null;
          logo_url: string | null;
          metadata: Json;
          name: string;
          school_id: string | null;
          slug: string;
          status: Database["public"]["Enums"]["content_status"];
          updated_at: string;
        };
        Insert: {
          banner_storage_path?: string | null;
          banner_url?: string | null;
          cover_storage_path?: string | null;
          cover_url?: string | null;
          created_at?: string;
          description?: string | null;
          id: string;
          language?: string;
          logo_storage_path?: string | null;
          logo_url?: string | null;
          metadata?: Json;
          name: string;
          school_id?: string | null;
          slug: string;
          status?: Database["public"]["Enums"]["content_status"];
          updated_at?: string;
        };
        Update: {
          banner_storage_path?: string | null;
          banner_url?: string | null;
          cover_storage_path?: string | null;
          cover_url?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          language?: string;
          logo_storage_path?: string | null;
          logo_url?: string | null;
          metadata?: Json;
          name?: string;
          school_id?: string | null;
          slug?: string;
          status?: Database["public"]["Enums"]["content_status"];
          updated_at?: string;
        };
        Relationships: [];
      };
      podcast_episodes: {
        Row: {
          audio_mime_type: string | null;
          audio_size_bytes: number | null;
          audio_storage_path: string | null;
          audio_url: string | null;
          cover_storage_path: string | null;
          cover_url: string | null;
          created_at: string;
          description: string | null;
          duration_seconds: number;
          episode_number: number;
          id: string;
          language: string;
          metadata: Json;
          podcast_id: string;
          published_at: string | null;
          season_number: number;
          slug: string;
          status: Database["public"]["Enums"]["content_status"];
          title: string;
          transcript_status: string;
          updated_at: string;
          video_mime_type: string | null;
          video_size_bytes: number | null;
          video_storage_path: string | null;
          video_url: string | null;
        };
        Insert: {
          audio_mime_type?: string | null;
          audio_size_bytes?: number | null;
          audio_storage_path?: string | null;
          audio_url?: string | null;
          cover_storage_path?: string | null;
          cover_url?: string | null;
          created_at?: string;
          description?: string | null;
          duration_seconds?: number;
          episode_number?: number;
          id: string;
          language?: string;
          metadata?: Json;
          podcast_id: string;
          published_at?: string | null;
          season_number?: number;
          slug: string;
          status?: Database["public"]["Enums"]["content_status"];
          title: string;
          transcript_status?: string;
          updated_at?: string;
          video_mime_type?: string | null;
          video_size_bytes?: number | null;
          video_storage_path?: string | null;
          video_url?: string | null;
        };
        Update: {
          audio_mime_type?: string | null;
          audio_size_bytes?: number | null;
          audio_storage_path?: string | null;
          audio_url?: string | null;
          cover_storage_path?: string | null;
          cover_url?: string | null;
          created_at?: string;
          description?: string | null;
          duration_seconds?: number;
          episode_number?: number;
          id?: string;
          language?: string;
          metadata?: Json;
          podcast_id?: string;
          published_at?: string | null;
          season_number?: number;
          slug?: string;
          status?: Database["public"]["Enums"]["content_status"];
          title?: string;
          transcript_status?: string;
          updated_at?: string;
          video_mime_type?: string | null;
          video_size_bytes?: number | null;
          video_storage_path?: string | null;
          video_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "podcast_episodes_podcast_id_fkey";
            columns: ["podcast_id"];
            isOneToOne: false;
            referencedRelation: "podcasts";
            referencedColumns: ["id"];
          },
        ];
      };
      podcast_transcripts: {
        Row: {
          created_at: string;
          episode_id: string;
          full_text: string;
          generated_at: string | null;
          id: string;
          language: string;
          provider: string | null;
          published_at: string | null;
          reviewed_at: string | null;
          segments: Json;
          status: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          episode_id: string;
          full_text?: string;
          generated_at?: string | null;
          id: string;
          language?: string;
          provider?: string | null;
          published_at?: string | null;
          reviewed_at?: string | null;
          segments?: Json;
          status?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          episode_id?: string;
          full_text?: string;
          generated_at?: string | null;
          id?: string;
          language?: string;
          provider?: string | null;
          published_at?: string | null;
          reviewed_at?: string | null;
          segments?: Json;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "podcast_transcripts_episode_id_fkey";
            columns: ["episode_id"];
            isOneToOne: true;
            referencedRelation: "podcast_episodes";
            referencedColumns: ["id"];
          },
        ];
      };
      podcast_analytics_events: {
        Row: {
          anonymous_id: string;
          completion_percent: number;
          created_at: string;
          device_type: string | null;
          duration_seconds: number;
          episode_id: string;
          event_type: string;
          id: string;
          is_pwa: boolean;
          language: string | null;
          listened_seconds: number;
          playback_mode: string;
          playback_rate: number;
          podcast_id: string;
          position_seconds: number;
          session_id: string | null;
        };
        Insert: {
          anonymous_id: string;
          completion_percent?: number;
          created_at?: string;
          device_type?: string | null;
          duration_seconds?: number;
          episode_id: string;
          event_type: string;
          id?: string;
          is_pwa?: boolean;
          language?: string | null;
          listened_seconds?: number;
          playback_mode?: string;
          playback_rate?: number;
          podcast_id: string;
          position_seconds?: number;
          session_id?: string | null;
        };
        Update: {
          anonymous_id?: string;
          completion_percent?: number;
          created_at?: string;
          device_type?: string | null;
          duration_seconds?: number;
          episode_id?: string;
          event_type?: string;
          id?: string;
          is_pwa?: boolean;
          language?: string | null;
          listened_seconds?: number;
          playback_mode?: string;
          playback_rate?: number;
          podcast_id?: string;
          position_seconds?: number;
          session_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "podcast_analytics_events_episode_id_fkey";
            columns: ["episode_id"];
            isOneToOne: false;
            referencedRelation: "podcast_episodes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "podcast_analytics_events_podcast_id_fkey";
            columns: ["podcast_id"];
            isOneToOne: false;
            referencedRelation: "podcasts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "podcast_analytics_events_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "dmps_analytics_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          email: string | null;
          full_name: string | null;
          id: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      program_schools: {
        Row: {
          id: string;
          program_id: string;
          school_id: string;
        };
        Insert: {
          id: string;
          program_id: string;
          school_id: string;
        };
        Update: {
          id?: string;
          program_id?: string;
          school_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "program_schools_program_id_fkey";
            columns: ["program_id"];
            isOneToOne: false;
            referencedRelation: "programs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "program_schools_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
        ];
      };
      program_translations: {
        Row: {
          description: string | null;
          id: string;
          language_code: string;
          name: string;
          program_id: string;
          summary: string | null;
        };
        Insert: {
          description?: string | null;
          id: string;
          language_code: string;
          name: string;
          program_id: string;
          summary?: string | null;
        };
        Update: {
          description?: string | null;
          id?: string;
          language_code?: string;
          name?: string;
          program_id?: string;
          summary?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "program_translations_program_id_fkey";
            columns: ["program_id"];
            isOneToOne: false;
            referencedRelation: "programs";
            referencedColumns: ["id"];
          },
        ];
      };
      programs: {
        Row: {
          application_process: string | null;
          category_id: string | null;
          contact_id: string | null;
          cost: string | null;
          created_at: string;
          description: string | null;
          documents: Json;
          end_date: string | null;
          enrollment_open: boolean;
          grades: string | null;
          id: string;
          image_url: string | null;
          is_free: boolean;
          languages: string[];
          max_grade: number | null;
          min_grade: number | null;
          name: string;
          official_url: string | null;
          program_type: string;
          requirements: string | null;
          school_id: string | null;
          school_level: string | null;
          slug: string;
          source_fetched_at: string | null;
          source_id: string | null;
          start_date: string | null;
          status: Database["public"]["Enums"]["content_status"];
          summary: string | null;
          updated_at: string;
          verification_status: string;
          verified_at: string | null;
          verified_by: string | null;
          video_url: string | null;
        };
        Insert: {
          application_process?: string | null;
          category_id?: string | null;
          contact_id?: string | null;
          cost?: string | null;
          created_at?: string;
          description?: string | null;
          documents?: Json;
          end_date?: string | null;
          enrollment_open?: boolean;
          grades?: string | null;
          id: string;
          image_url?: string | null;
          is_free?: boolean;
          languages?: string[];
          max_grade?: number | null;
          min_grade?: number | null;
          name: string;
          official_url?: string | null;
          program_type?: string;
          requirements?: string | null;
          school_id?: string | null;
          school_level?: string | null;
          slug: string;
          source_fetched_at?: string | null;
          source_id?: string | null;
          start_date?: string | null;
          status?: Database["public"]["Enums"]["content_status"];
          summary?: string | null;
          updated_at?: string;
          verification_status?: string;
          verified_at?: string | null;
          verified_by?: string | null;
          video_url?: string | null;
        };
        Update: {
          application_process?: string | null;
          category_id?: string | null;
          contact_id?: string | null;
          cost?: string | null;
          created_at?: string;
          description?: string | null;
          documents?: Json;
          end_date?: string | null;
          enrollment_open?: boolean;
          grades?: string | null;
          id?: string;
          image_url?: string | null;
          is_free?: boolean;
          languages?: string[];
          max_grade?: number | null;
          min_grade?: number | null;
          name?: string;
          official_url?: string | null;
          program_type?: string;
          requirements?: string | null;
          school_id?: string | null;
          school_level?: string | null;
          slug?: string;
          source_fetched_at?: string | null;
          source_id?: string | null;
          start_date?: string | null;
          status?: Database["public"]["Enums"]["content_status"];
          summary?: string | null;
          updated_at?: string;
          verification_status?: string;
          verified_at?: string | null;
          verified_by?: string | null;
          video_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "programs_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "programs_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "programs_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "programs_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "official_sources";
            referencedColumns: ["id"];
          },
        ];
      };
      public_review_events: {
        Row: {
          created_at: string;
          event_name: string;
          id: string;
          provider: string | null;
          school_id: string | null;
          surface: string | null;
        };
        Insert: {
          created_at?: string;
          event_name?: string;
          id?: string;
          provider?: string | null;
          school_id?: string | null;
          surface?: string | null;
        };
        Update: {
          created_at?: string;
          event_name?: string;
          id?: string;
          provider?: string | null;
          school_id?: string | null;
          surface?: string | null;
        };
        Relationships: [];
      };
      school_translations: {
        Row: {
          description: string | null;
          id: string;
          language_code: string;
          name: string;
          school_id: string;
        };
        Insert: {
          description?: string | null;
          id: string;
          language_code: string;
          name: string;
          school_id: string;
        };
        Update: {
          description?: string | null;
          id?: string;
          language_code?: string;
          name?: string;
          school_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "school_translations_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
        ];
      };
      schools: {
        Row: {
          address: string | null;
          city: string | null;
          created_at: string;
          description: string | null;
          display_order: number;
          hours: string | null;
          id: string;
          image_url: string | null;
          is_primary: boolean;
          is_visible: boolean;
          latitude: number | null;
          level: string;
          longitude: number | null;
          name: string;
          phone: string | null;
          postal_code: string | null;
          slug: string;
          source_fetched_at: string | null;
          source_id: string | null;
          state: string | null;
          updated_at: string;
          verification_status: string;
          verified_at: string | null;
          verified_by: string | null;
          website_url: string | null;
        };
        Insert: {
          address?: string | null;
          city?: string | null;
          created_at?: string;
          description?: string | null;
          display_order?: number;
          hours?: string | null;
          id: string;
          image_url?: string | null;
          is_primary?: boolean;
          is_visible?: boolean;
          latitude?: number | null;
          level?: string;
          longitude?: number | null;
          name: string;
          phone?: string | null;
          postal_code?: string | null;
          slug: string;
          source_fetched_at?: string | null;
          source_id?: string | null;
          state?: string | null;
          updated_at?: string;
          verification_status?: string;
          verified_at?: string | null;
          verified_by?: string | null;
          website_url?: string | null;
        };
        Update: {
          address?: string | null;
          city?: string | null;
          created_at?: string;
          description?: string | null;
          display_order?: number;
          hours?: string | null;
          id?: string;
          image_url?: string | null;
          is_primary?: boolean;
          is_visible?: boolean;
          latitude?: number | null;
          level?: string;
          longitude?: number | null;
          name?: string;
          phone?: string | null;
          postal_code?: string | null;
          slug?: string;
          source_fetched_at?: string | null;
          source_id?: string | null;
          state?: string | null;
          updated_at?: string;
          verification_status?: string;
          verified_at?: string | null;
          verified_by?: string | null;
          website_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "schools_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "official_sources";
            referencedColumns: ["id"];
          },
        ];
      };
      search_analytics: {
        Row: {
          anonymous_query: string;
          created_at: string;
          id: string;
          language_code: string | null;
          results_count: number;
        };
        Insert: {
          anonymous_query: string;
          created_at?: string;
          id?: string;
          language_code?: string | null;
          results_count?: number;
        };
        Update: {
          anonymous_query?: string;
          created_at?: string;
          id?: string;
          language_code?: string | null;
          results_count?: number;
        };
        Relationships: [];
      };
      site_settings: {
        Row: {
          key: string;
          id: string;
          value: Json;
          site_name: string;
          district_name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          key: string;
          id?: string;
          value?: Json;
          site_name?: string;
          district_name?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          key?: string;
          id?: string;
          value?: Json;
          site_name?: string;
          district_name?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      source_reviews: {
        Row: {
          approved_at: string | null;
          approved_by: string | null;
          change_type: string;
          created_at: string;
          diff_summary: string | null;
          fetched_at: string;
          id: string;
          payload: Json;
          previous_payload: Json;
          rejection_reason: string | null;
          reviewed_by: string | null;
          source_id: string | null;
          status: string;
          summary: string | null;
          title: string | null;
          updated_at: string;
          url: string | null;
        };
        Insert: {
          approved_at?: string | null;
          approved_by?: string | null;
          change_type?: string;
          created_at?: string;
          diff_summary?: string | null;
          fetched_at?: string;
          id?: string;
          payload?: Json;
          previous_payload?: Json;
          rejection_reason?: string | null;
          reviewed_by?: string | null;
          source_id?: string | null;
          status?: string;
          summary?: string | null;
          title?: string | null;
          updated_at?: string;
          url?: string | null;
        };
        Update: {
          approved_at?: string | null;
          approved_by?: string | null;
          change_type?: string;
          created_at?: string;
          diff_summary?: string | null;
          fetched_at?: string;
          id?: string;
          payload?: Json;
          previous_payload?: Json;
          rejection_reason?: string | null;
          reviewed_by?: string | null;
          source_id?: string | null;
          status?: string;
          summary?: string | null;
          title?: string | null;
          updated_at?: string;
          url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "source_reviews_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "official_sources";
            referencedColumns: ["id"];
          },
        ];
      };
      student_programs: {
        Row: {
          address: string | null;
          audience: string | null;
          audience_en: string | null;
          categories: string;
          cost: string | null;
          cost_en: string | null;
          created_at: string;
          description_en: string | null;
          description_es: string;
          display_order: number;
          email: string | null;
          enrollment_note: string | null;
          enrollment_status: string;
          extra_links: string | null;
          how_to_participate: string | null;
          how_to_participate_en: string | null;
          id: string;
          is_featured: boolean;
          is_visible: boolean;
          name: string;
          name_en: string | null;
          official_url: string | null;
          phone: string | null;
          requirements: string | null;
          requirements_en: string | null;
          school_id: string;
          updated_at: string;
          verified_at: string | null;
        };
        Insert: {
          address?: string | null;
          audience?: string | null;
          audience_en?: string | null;
          categories?: string;
          cost?: string | null;
          cost_en?: string | null;
          created_at?: string;
          description_en?: string | null;
          description_es: string;
          display_order?: number;
          email?: string | null;
          enrollment_note?: string | null;
          enrollment_status?: string;
          extra_links?: string | null;
          how_to_participate?: string | null;
          how_to_participate_en?: string | null;
          id: string;
          is_featured?: boolean;
          is_visible?: boolean;
          name: string;
          name_en?: string | null;
          official_url?: string | null;
          phone?: string | null;
          requirements?: string | null;
          requirements_en?: string | null;
          school_id: string;
          updated_at?: string;
          verified_at?: string | null;
        };
        Update: {
          address?: string | null;
          audience?: string | null;
          audience_en?: string | null;
          categories?: string;
          cost?: string | null;
          cost_en?: string | null;
          created_at?: string;
          description_en?: string | null;
          description_es?: string;
          display_order?: number;
          email?: string | null;
          enrollment_note?: string | null;
          enrollment_status?: string;
          extra_links?: string | null;
          how_to_participate?: string | null;
          how_to_participate_en?: string | null;
          id?: string;
          is_featured?: boolean;
          is_visible?: boolean;
          name?: string;
          name_en?: string | null;
          official_url?: string | null;
          phone?: string | null;
          requirements?: string | null;
          requirements_en?: string | null;
          school_id?: string;
          updated_at?: string;
          verified_at?: string | null;
        };
        Relationships: [];
      };
      tags: {
        Row: {
          id: string;
          name: string;
          slug: string;
        };
        Insert: {
          id: string;
          name: string;
          slug: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
        };
        Relationships: [];
      };
      update_requests: {
        Row: {
          created_at: string;
          entity_id: string | null;
          entity_type: string | null;
          id: string;
          kind: string;
          message: string;
          page_url: string | null;
          reporter_email: string | null;
          resolution_note: string | null;
          resolved_by: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string | null;
          id?: string;
          kind?: string;
          message: string;
          page_url?: string | null;
          reporter_email?: string | null;
          resolution_note?: string | null;
          resolved_by?: string | null;
          status?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string | null;
          id?: string;
          kind?: string;
          message?: string;
          page_url?: string | null;
          reporter_email?: string | null;
          resolution_note?: string | null;
          resolved_by?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          permissions: Json;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          permissions?: Json;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          permissions?: Json;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
      resources: {
        Row: {
          category_id: string | null;
          created_at: string;
          display_order: number;
          icon: string | null;
          id: string;
          is_featured: boolean;
          is_visible: boolean;
          school_id: string | null;
          source_fetched_at: string | null;
          source_id: string | null;
          updated_at: string;
          url: string;
          verification_status: string;
          verified_at: string | null;
          verified_by: string | null;
        };
        Insert: {
          category_id?: string | null;
          created_at?: string;
          display_order?: number;
          icon?: string | null;
          id: string;
          is_featured?: boolean;
          is_visible?: boolean;
          school_id?: string | null;
          source_fetched_at?: string | null;
          source_id?: string | null;
          updated_at?: string;
          url: string;
          verification_status?: string;
          verified_at?: string | null;
          verified_by?: string | null;
        };
        Update: {
          category_id?: string | null;
          created_at?: string;
          display_order?: number;
          icon?: string | null;
          id?: string;
          is_featured?: boolean;
          is_visible?: boolean;
          school_id?: string | null;
          source_fetched_at?: string | null;
          source_id?: string | null;
          updated_at?: string;
          url?: string;
          verification_status?: string;
          verified_at?: string | null;
          verified_by?: string | null;
        };
        Relationships: [];
      };
      resource_translations: {
        Row: {
          description: string | null;
          id: string;
          language_code: string;
          resource_id: string;
          title: string;
        };
        Insert: {
          description?: string | null;
          id?: string;
          language_code: string;
          resource_id: string;
          title: string;
        };
        Update: {
          description?: string | null;
          id?: string;
          language_code?: string;
          resource_id?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "resource_translations_resource_id_fkey";
            columns: ["resource_id"];
            isOneToOne: false;
            referencedRelation: "resources";
            referencedColumns: ["id"];
          },
        ];
      };
      social_media_channels: {
        Row: {
          brand_color: string | null;
          created_at?: string;
          display_order: number;
          handle: string | null;
          id: string;
          is_active: boolean;
          name: string;
          platform: string;
          updated_at: string;
          url: string;
        };
        Insert: {
          brand_color?: string | null;
          created_at?: string;
          display_order?: number;
          handle?: string | null;
          id: string;
          is_active?: boolean;
          name: string;
          platform: string;
          updated_at?: string;
          url: string;
        };
        Update: {
          brand_color?: string | null;
          created_at?: string;
          display_order?: number;
          handle?: string | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          platform?: string;
          updated_at?: string;
          url?: string;
        };
        Relationships: [];
      };
      social_media_posts: {
        Row: {
          author_handle: string | null;
          author_name: string | null;
          comments_count?: number;
          created_at?: string;
          description: string | null;
          embed_url: string | null;
          id: string;
          is_pinned: boolean;
          is_visible: boolean;
          likes_count?: number;
          media_type: string;
          platform: string;
          published_at: string;
          school_id: string;
          thumbnail_url?: string | null;
          title: string;
          updated_at: string;
          url: string;
        };
        Insert: {
          author_handle?: string | null;
          author_name?: string | null;
          comments_count?: number;
          created_at?: string;
          description?: string | null;
          embed_url?: string | null;
          id: string;
          is_pinned?: boolean;
          is_visible?: boolean;
          likes_count?: number;
          media_type?: string;
          platform: string;
          published_at?: string;
          school_id?: string;
          thumbnail_url?: string | null;
          title: string;
          updated_at?: string;
          url: string;
        };
        Update: {
          author_handle?: string | null;
          author_name?: string | null;
          comments_count?: number;
          created_at?: string;
          description?: string | null;
          embed_url?: string | null;
          id?: string;
          is_pinned?: boolean;
          is_visible?: boolean;
          likes_count?: number;
          media_type?: string;
          platform?: string;
          published_at?: string;
          school_id?: string;
          thumbnail_url?: string | null;
          title?: string;
          updated_at?: string;
          url?: string;
        };
        Relationships: [];
      };
      dmps_analytics_config: {
        Row: {
          created_at: string;
          enabled: boolean;
          id: string;
          presence_timeout_seconds: number;
          retention_days: number;
          track_browser: boolean;
          track_country: boolean;
          track_device: boolean;
          track_events: boolean;
          track_language: boolean;
          track_os: boolean;
          track_page_views: boolean;
          track_pwa: boolean;
          track_referrer: boolean;
          track_searches: boolean;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          enabled?: boolean;
          id?: string;
          presence_timeout_seconds?: number;
          retention_days?: number;
          track_browser?: boolean;
          track_country?: boolean;
          track_device?: boolean;
          track_events?: boolean;
          track_language?: boolean;
          track_os?: boolean;
          track_page_views?: boolean;
          track_pwa?: boolean;
          track_referrer?: boolean;
          track_searches?: boolean;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          enabled?: boolean;
          id?: string;
          presence_timeout_seconds?: number;
          retention_days?: number;
          track_browser?: boolean;
          track_country?: boolean;
          track_device?: boolean;
          track_events?: boolean;
          track_language?: boolean;
          track_os?: boolean;
          track_page_views?: boolean;
          track_pwa?: boolean;
          track_referrer?: boolean;
          track_searches?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      dmps_analytics_sessions: {
        Row: {
          anonymous_id: string;
          browser: string | null;
          country: string | null;
          created_at: string;
          device_type: string | null;
          duration_seconds: number | null;
          ended_at: string | null;
          event_count: number;
          exit_path: string | null;
          id: string;
          is_pwa: boolean;
          landing_path: string;
          language: string | null;
          last_seen_at: string;
          operating_system: string | null;
          page_views: number;
          referrer: string | null;
          started_at: string;
          user_agent: string | null;
        };
        Insert: {
          anonymous_id: string;
          browser?: string | null;
          country?: string | null;
          created_at?: string;
          device_type?: string | null;
          duration_seconds?: number | null;
          ended_at?: string | null;
          event_count?: number;
          exit_path?: string | null;
          id?: string;
          is_pwa?: boolean;
          landing_path: string;
          language?: string | null;
          last_seen_at?: string;
          operating_system?: string | null;
          page_views?: number;
          referrer?: string | null;
          started_at?: string;
          user_agent?: string | null;
        };
        Update: {
          anonymous_id?: string;
          browser?: string | null;
          country?: string | null;
          created_at?: string;
          device_type?: string | null;
          duration_seconds?: number | null;
          ended_at?: string | null;
          event_count?: number;
          exit_path?: string | null;
          id?: string;
          is_pwa?: boolean;
          landing_path?: string;
          language?: string | null;
          last_seen_at?: string;
          operating_system?: string | null;
          page_views?: number;
          referrer?: string | null;
          started_at?: string;
          user_agent?: string | null;
        };
        Relationships: [];
      };
      dmps_analytics_page_views: {
        Row: {
          anonymous_id: string;
          browser: string | null;
          content_id: string | null;
          content_type: string | null;
          created_at: string;
          device_type: string | null;
          duration_seconds: number | null;
          entered_at: string;
          exited_at: string | null;
          id: string;
          is_pwa: boolean;
          language: string | null;
          operating_system: string | null;
          path: string;
          referrer: string | null;
          school_id: string | null;
          session_id: string;
          title: string | null;
        };
        Insert: {
          anonymous_id: string;
          browser?: string | null;
          content_id?: string | null;
          content_type?: string | null;
          created_at?: string;
          device_type?: string | null;
          duration_seconds?: number | null;
          entered_at?: string;
          exited_at?: string | null;
          id?: string;
          is_pwa?: boolean;
          language?: string | null;
          operating_system?: string | null;
          path: string;
          referrer?: string | null;
          school_id?: string | null;
          session_id: string;
          title?: string | null;
        };
        Update: {
          anonymous_id?: string;
          browser?: string | null;
          content_id?: string | null;
          content_type?: string | null;
          created_at?: string;
          device_type?: string | null;
          duration_seconds?: number | null;
          entered_at?: string;
          exited_at?: string | null;
          id?: string;
          is_pwa?: boolean;
          language?: string | null;
          operating_system?: string | null;
          path?: string;
          referrer?: string | null;
          school_id?: string | null;
          session_id?: string;
          title?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "dmps_analytics_page_views_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "dmps_analytics_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      dmps_analytics_events: {
        Row: {
          anonymous_id: string;
          content_id: string | null;
          content_type: string | null;
          created_at: string;
          event_category: string | null;
          event_name: string;
          id: string;
          language: string | null;
          metadata: Json;
          path: string | null;
          school_id: string | null;
          session_id: string;
        };
        Insert: {
          anonymous_id: string;
          content_id?: string | null;
          content_type?: string | null;
          created_at?: string;
          event_category?: string | null;
          event_name: string;
          id?: string;
          language?: string | null;
          metadata?: Json;
          path?: string | null;
          school_id?: string | null;
          session_id: string;
        };
        Update: {
          anonymous_id?: string;
          content_id?: string | null;
          content_type?: string | null;
          created_at?: string;
          event_category?: string | null;
          event_name?: string;
          id?: string;
          language?: string | null;
          metadata?: Json;
          path?: string | null;
          school_id?: string | null;
          session_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "dmps_analytics_events_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "dmps_analytics_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      dmps_analytics_presence: {
        Row: {
          anonymous_id: string;
          created_at: string;
          current_content_id: string | null;
          current_content_type: string | null;
          current_path: string | null;
          device_type: string | null;
          is_pwa: boolean;
          language: string | null;
          last_seen_at: string;
          session_id: string;
          started_at: string;
          updated_at: string;
        };
        Insert: {
          anonymous_id: string;
          created_at?: string;
          current_content_id?: string | null;
          current_content_type?: string | null;
          current_path?: string | null;
          device_type?: string | null;
          is_pwa?: boolean;
          language?: string | null;
          last_seen_at?: string;
          session_id: string;
          started_at?: string;
          updated_at?: string;
        };
        Update: {
          anonymous_id?: string;
          created_at?: string;
          current_content_id?: string | null;
          current_content_type?: string | null;
          current_path?: string | null;
          device_type?: string | null;
          is_pwa?: boolean;
          language?: string | null;
          last_seen_at?: string;
          session_id?: string;
          started_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "dmps_analytics_presence_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "dmps_analytics_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      dmps_analytics_searches: {
        Row: {
          anonymous_id: string;
          created_at: string;
          id: string;
          language: string | null;
          normalized_query: string;
          path: string | null;
          query: string;
          result_count: number;
          session_id: string;
        };
        Insert: {
          anonymous_id: string;
          created_at?: string;
          id?: string;
          language?: string | null;
          normalized_query: string;
          path?: string | null;
          query: string;
          result_count?: number;
          session_id: string;
        };
        Update: {
          anonymous_id?: string;
          created_at?: string;
          id?: string;
          language?: string | null;
          normalized_query?: string;
          path?: string | null;
          query?: string;
          result_count?: number;
          session_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "dmps_analytics_searches_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "dmps_analytics_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      dmps_analytics_pwa: {
        Row: {
          anonymous_id: string;
          browser: string | null;
          created_at: string;
          device_type: string | null;
          event_type: string;
          id: string;
          operating_system: string | null;
          platform: string | null;
          session_id: string | null;
        };
        Insert: {
          anonymous_id: string;
          browser?: string | null;
          created_at?: string;
          device_type?: string | null;
          event_type: string;
          id?: string;
          operating_system?: string | null;
          platform?: string | null;
          session_id?: string | null;
        };
        Update: {
          anonymous_id?: string;
          browser?: string | null;
          created_at?: string;
          device_type?: string | null;
          event_type?: string;
          id?: string;
          operating_system?: string | null;
          platform?: string | null;
          session_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "dmps_analytics_pwa_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "dmps_analytics_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      dmps_analytics_daily: {
        Row: {
          active_users_peak: number;
          created_at: string;
          date: string;
          events: number;
          new_visitors: number;
          page_views: number;
          pwa_installs: number;
          pwa_launches: number;
          returning_visitors: number;
          search_no_results: number;
          searches: number;
          sessions: number;
          total_engagement_seconds: number;
          unique_visitors: number;
          updated_at: string;
        };
        Insert: {
          active_users_peak?: number;
          created_at?: string;
          date: string;
          events?: number;
          new_visitors?: number;
          page_views?: number;
          pwa_installs?: number;
          pwa_launches?: number;
          returning_visitors?: number;
          search_no_results?: number;
          searches?: number;
          sessions?: number;
          total_engagement_seconds?: number;
          unique_visitors?: number;
          updated_at?: string;
        };
        Update: {
          active_users_peak?: number;
          created_at?: string;
          date?: string;
          events?: number;
          new_visitors?: number;
          page_views?: number;
          pwa_installs?: number;
          pwa_launches?: number;
          returning_visitors?: number;
          search_no_results?: number;
          searches?: number;
          sessions?: number;
          total_engagement_seconds?: number;
          unique_visitors?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      apply_dmps_analytics_retention: { Args: Record<PropertyKey, never>; Returns: Json };
      can_manage_content: { Args: { _user_id: string }; Returns: boolean };
      can_publish: { Args: { _user_id: string }; Returns: boolean };
      cleanup_dmps_analytics_presence: { Args: Record<PropertyKey, never>; Returns: number };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      heartbeat_presence: {
        Args: {
          p_anonymous_id: string;
          p_session_id: string;
          p_current_path?: string | null;
          p_current_content_type?: string | null;
          p_current_content_id?: string | null;
          p_language?: string | null;
          p_device_type?: string | null;
          p_is_pwa?: boolean;
        };
        Returns: boolean;
      };
      is_admin: { Args: { _user_id: string }; Returns: boolean };
      is_allowed_official_url: { Args: { _url: string }; Returns: boolean };
      is_staff: { Args: { _user_id: string }; Returns: boolean };
      record_event: {
        Args: {
          p_anonymous_id: string;
          p_session_id: string;
          p_event_name: string;
          p_event_category?: string | null;
          p_path?: string | null;
          p_content_type?: string | null;
          p_content_id?: string | null;
          p_school_id?: string | null;
          p_language?: string | null;
          p_metadata?: Json;
        };
        Returns: string | null;
      };
      record_page_view: {
        Args: {
          p_anonymous_id: string;
          p_session_id: string;
          p_path: string;
          p_title?: string | null;
          p_content_type?: string | null;
          p_content_id?: string | null;
          p_school_id?: string | null;
          p_language?: string | null;
          p_referrer?: string | null;
          p_device_type?: string | null;
          p_browser?: string | null;
          p_operating_system?: string | null;
          p_is_pwa?: boolean;
          p_previous_page_view_id?: string | null;
        };
        Returns: string | null;
      };
      record_pwa_event: {
        Args: {
          p_anonymous_id: string;
          p_event_type: string;
          p_session_id?: string | null;
          p_platform?: string | null;
          p_device_type?: string | null;
          p_browser?: string | null;
          p_operating_system?: string | null;
        };
        Returns: string | null;
      };
      record_search: {
        Args: {
          p_anonymous_id: string;
          p_session_id: string;
          p_query: string;
          p_normalized_query?: string | null;
          p_result_count?: number;
          p_language?: string | null;
          p_path?: string | null;
        };
        Returns: string | null;
      };
      record_session: {
        Args: {
          p_anonymous_id: string;
          p_landing_path?: string;
          p_referrer?: string | null;
          p_user_agent?: string | null;
          p_device_type?: string | null;
          p_browser?: string | null;
          p_operating_system?: string | null;
          p_language?: string | null;
          p_country?: string | null;
          p_is_pwa?: boolean;
          p_session_id?: string | null;
        };
        Returns: string;
      };
      refresh_dmps_analytics_daily: {
        Args: {
          start_date?: string;
          end_date?: string;
        };
        Returns: number;
      };
      sanitize_dmps_analytics_metadata: {
        Args: {
          p_metadata: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      announcement_level: "info" | "important" | "urgent";
      app_role:
        | "super_admin"
        | "admin"
        | "editor"
        | "translator"
        | "reviewer"
        | "content_admin"
        | "calendar_admin";
      content_status: "draft" | "in_review" | "scheduled" | "published" | "archived";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      announcement_level: ["info", "important", "urgent"],
      app_role: [
        "super_admin",
        "admin",
        "editor",
        "translator",
        "reviewer",
        "content_admin",
        "calendar_admin",
      ],
      content_status: ["draft", "in_review", "scheduled", "published", "archived"],
    },
  },
} as const;
