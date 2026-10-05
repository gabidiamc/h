-- ==============================================================================
-- Migration: 20260830000000_core_dmps_tables.sql
-- Description: Creates all 50 tables, indexes, RLS policies, Realtime publication
-- and seeds the baseline production dataset from persistent_db.json.
-- Architecture: Supabase PostgreSQL as Single Source of Truth for DMPS INFO.
-- ==============================================================================

-- 1. Create Enums idempotently
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_status') THEN
    CREATE TYPE public.content_status AS ENUM ('draft', 'published', 'archived');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'announcement_level') THEN
    CREATE TYPE public.announcement_level AS ENUM ('info', 'warning', 'urgent');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'content_admin', 'calendar_admin', 'editor', 'translator', 'reviewer');
  END IF;
END $$;

-- 2. Core Tables Definitions

-- Schools
CREATE TABLE IF NOT EXISTS public.schools (
  id text PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  short_name text,
  level text,
  address text,
  city text,
  state text,
  postal_code text,
  phone text,
  website_url text,
  official_contact_url text,
  hours text,
  description text,
  is_visible boolean DEFAULT true,
  is_active boolean DEFAULT true,
  display_order numeric DEFAULT 0,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- School Translations
CREATE TABLE IF NOT EXISTS public.school_translations (
  id text PRIMARY KEY,
  school_id text NOT NULL,
  language_code text NOT NULL,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Appearance Settings
CREATE TABLE IF NOT EXISTS public.appearance_settings (
  id text PRIMARY KEY DEFAULT 'default',
  site_title text DEFAULT 'DMPS Family Info',
  site_tagline text DEFAULT 'Portal de Información Oficial y Recursos para Familias del Distrito Escolar',
  primary_color text DEFAULT '#002D62',
  accent_color text DEFAULT '#C49A45',
  neutral_color text DEFAULT '#333333',
  font_family text DEFAULT 'DM Sans, sans-serif',
  header_bg text DEFAULT '#002D62',
  footer_bg text DEFAULT '#001A38',
  logo_url text,
  logo_light_url text,
  logo_dark_url text,
  favicon_url text,
  logo_height numeric DEFAULT 56,
  logo_alt text DEFAULT 'DMPS Connect — Des Moines Public Schools',
  show_wordmark boolean DEFAULT true,
  dark_theme jsonb DEFAULT '{}'::jsonb,
  light_theme jsonb DEFAULT '{}'::jsonb,
  previous_settings jsonb,
  updated_by text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Site Settings
CREATE TABLE IF NOT EXISTS public.site_settings (
  key text PRIMARY KEY,
  id text,
  value jsonb DEFAULT '{}'::jsonb,
  site_name text DEFAULT 'DMPS Family Info',
  district_name text DEFAULT 'Des Moines Public Schools',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Categories
CREATE TABLE IF NOT EXISTS public.categories (
  id text PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  icon text DEFAULT 'BookOpen',
  display_order numeric DEFAULT 0,
  is_featured boolean DEFAULT false,
  is_visible boolean DEFAULT true,
  school_id text DEFAULT 'lincoln',
  card_banner_url text,
  card_bg text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Category Translations
CREATE TABLE IF NOT EXISTS public.category_translations (
  id text PRIMARY KEY,
  category_id text NOT NULL,
  language_code text NOT NULL,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Articles
CREATE TABLE IF NOT EXISTS public.articles (
  id text PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  title text,
  summary text,
  content text,
  status public.content_status DEFAULT 'published',
  category_id text,
  school_id text DEFAULT 'lincoln',
  is_featured boolean DEFAULT false,
  verification_status text DEFAULT 'verified',
  verification_details text,
  verified_at timestamptz,
  verified_by text,
  author_id text,
  source_authority text,
  source_url text,
  read_time_minutes numeric DEFAULT 3,
  featured_image_url text,
  card_banner_url text,
  card_bg text,
  published_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  -- Runtime compatibility fields used by the current admin/editor UI.
  contact_id text,
  card_banners jsonb DEFAULT '{}'::jsonb,
  featured_images jsonb DEFAULT '{}'::jsonb,
  image_alt text,
  bottom_nav jsonb DEFAULT '{}'::jsonb,
  starts_at timestamptz,
  ends_at timestamptz,
  source_name text,
  official_url text,
  admin_note text,
  source_id text,
  review_date date,
  scheduled_at timestamptz,
  is_demo boolean DEFAULT false,
  last_verified_at timestamptz,
  source_fetched_at timestamptz,
  view_count integer DEFAULT 0
);

-- Article Translations
CREATE TABLE IF NOT EXISTS public.article_translations (
  id text PRIMARY KEY,
  article_id text NOT NULL,
  language_code text NOT NULL,
  title text NOT NULL,
  summary text,
  content_blocks jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tags
CREATE TABLE IF NOT EXISTS public.tags (
  id text PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  category_id text,
  is_visible boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Article Tags
CREATE TABLE IF NOT EXISTS public.article_tags (
  id text PRIMARY KEY,
  article_id text NOT NULL,
  tag_id text NOT NULL
);

-- Article Relations
CREATE TABLE IF NOT EXISTS public.article_relations (
  id text PRIMARY KEY,
  article_id text NOT NULL,
  related_article_id text NOT NULL
);

-- Contacts
CREATE TABLE IF NOT EXISTS public.contacts (
  id text PRIMARY KEY,
  school_id text DEFAULT 'lincoln',
  person_name text,
  role_title text DEFAULT 'Personal de contacto',
  job_title text,
  department text,
  email text,
  phone text,
  extension text,
  address text,
  hours text,
  category_ids text[] DEFAULT '{}'::text[],
  languages text[] DEFAULT '{es,en}'::text[],
  is_visible boolean DEFAULT true,
  is_emergency boolean DEFAULT false,
  display_order numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Resources
CREATE TABLE IF NOT EXISTS public.resources (
  id text PRIMARY KEY,
  school_id text DEFAULT 'lincoln',
  category_id text,
  title text NOT NULL,
  slug text NOT NULL,
  resource_type text DEFAULT 'link',
  url text,
  description text,
  icon text DEFAULT 'GraduationCap',
  is_visible boolean DEFAULT true,
  display_order numeric DEFAULT 0,
  status text DEFAULT 'published',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Social Media Channels
CREATE TABLE IF NOT EXISTS public.social_media_channels (
  id text PRIMARY KEY,
  platform text NOT NULL,
  name text NOT NULL,
  handle text,
  url text,
  is_active boolean DEFAULT true,
  brand_color text,
  display_order numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Social Media Posts
CREATE TABLE IF NOT EXISTS public.social_media_posts (
  id text PRIMARY KEY,
  platform text NOT NULL,
  title text NOT NULL,
  description text,
  url text,
  embed_url text,
  media_type text DEFAULT 'video',
  author_name text,
  author_handle text,
  thumbnail_url text,
  school_id text DEFAULT 'all',
  is_pinned boolean DEFAULT false,
  is_visible boolean DEFAULT true,
  likes_count numeric DEFAULT 0,
  comments_count numeric DEFAULT 0,
  published_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Announcements
CREATE TABLE IF NOT EXISTS public.announcements (
  id text PRIMARY KEY,
  school_id text,
  level public.announcement_level DEFAULT 'info',
  priority text DEFAULT 'medium',
  show_on_home boolean DEFAULT true,
  is_pinned boolean DEFAULT false,
  link_url text,
  status public.content_status DEFAULT 'published',
  category_ids text[] DEFAULT '{}'::text[],
  created_by text,
  starts_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  published_at timestamptz DEFAULT now(),
  sms_sent_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Announcement Translations
CREATE TABLE IF NOT EXISTS public.announcement_translations (
  id text PRIMARY KEY,
  announcement_id text NOT NULL,
  language_code text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Events
CREATE TABLE IF NOT EXISTS public.events (
  id text PRIMARY KEY,
  school_id text,
  title text,
  description text,
  event_type text DEFAULT 'academic',
  location text,
  category_id text,
  contact_id text,
  all_day boolean DEFAULT false,
  is_cancelled boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  image_url text,
  starts_at timestamptz DEFAULT now(),
  start_time text,
  end_date timestamptz,
  end_time text,
  status public.content_status DEFAULT 'published',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Event Translations
CREATE TABLE IF NOT EXISTS public.event_translations (
  id text PRIMARY KEY,
  event_id text NOT NULL,
  language_code text NOT NULL,
  title text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Programs
CREATE TABLE IF NOT EXISTS public.programs (
  id text PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name text,
  description text,
  summary text,
  category_id text,
  contact_id text,
  grades text,
  is_free boolean DEFAULT true,
  cost text,
  enrollment_open boolean DEFAULT true,
  application_process text,
  documents jsonb DEFAULT '[]'::jsonb,
  image_url text,
  start_date timestamptz,
  end_date timestamptz,
  status public.content_status DEFAULT 'published',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Program Translations
CREATE TABLE IF NOT EXISTS public.program_translations (
  id text PRIMARY KEY,
  program_id text NOT NULL,
  language_code text NOT NULL,
  name text NOT NULL,
  summary text,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Program Schools
CREATE TABLE IF NOT EXISTS public.program_schools (
  id text PRIMARY KEY,
  program_id text NOT NULL,
  school_id text NOT NULL
);

-- Student Programs
CREATE TABLE IF NOT EXISTS public.student_programs (
  id text PRIMARY KEY,
  slug text NOT NULL,
  school_id text NOT NULL DEFAULT 'lincoln',
  name_es text NOT NULL,
  name_en text,
  description_es text NOT NULL,
  description_en text,
  categories text DEFAULT 'general',
  requirements text,
  requirements_en text,
  how_to_participate text,
  how_to_participate_en text,
  audience text,
  audience_en text,
  cost text,
  cost_en text,
  location text,
  address text,
  hours text,
  phone text,
  email text,
  url text,
  image_url text,
  is_active boolean DEFAULT true,
  display_order numeric DEFAULT 0,
  enrollment_status text DEFAULT 'open',
  enrollment_note text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activities
CREATE TABLE IF NOT EXISTS public.activities (
  id text PRIMARY KEY,
  school_id text,
  name text NOT NULL,
  activity_type text DEFAULT 'athletics',
  description text,
  grades text,
  gender text,
  season text,
  location text,
  official_url text,
  forms_url text,
  schedule_url text,
  image_url text,
  contact_id text,
  enrollment_open boolean DEFAULT true,
  status public.content_status DEFAULT 'published',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activity Translations
CREATE TABLE IF NOT EXISTS public.activity_translations (
  id text PRIMARY KEY,
  activity_id text NOT NULL,
  language_code text NOT NULL,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- FAQs
CREATE TABLE IF NOT EXISTS public.faqs (
  id text PRIMARY KEY,
  school_id text,
  category_id text,
  article_id text,
  display_order numeric DEFAULT 0,
  status public.content_status DEFAULT 'published',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- FAQ Translations
CREATE TABLE IF NOT EXISTS public.faq_translations (
  id text PRIMARY KEY,
  faq_id text NOT NULL,
  language_code text NOT NULL,
  question text NOT NULL,
  answer text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User Roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  role public.app_role NOT NULL DEFAULT 'admin',
  permissions jsonb DEFAULT '{}'::jsonb,
  school_id text DEFAULT 'all',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Admin Invitations
CREATE TABLE IF NOT EXISTS public.admin_invitations (
  id text PRIMARY KEY,
  email text NOT NULL,
  role public.app_role NOT NULL DEFAULT 'editor',
  token text NOT NULL,
  status text DEFAULT 'pending',
  invited_by text,
  accepted_by text,
  full_name text,
  notes text,
  permissions jsonb DEFAULT '{}'::jsonb,
  expires_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id text PRIMARY KEY,
  user_id text,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  change_summary text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Broken Link Reports
CREATE TABLE IF NOT EXISTS public.broken_link_reports (
  id text PRIMARY KEY,
  url text NOT NULL,
  entity_type text,
  entity_id text,
  message text,
  status text DEFAULT 'open',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Feedback
CREATE TABLE IF NOT EXISTS public.feedback (
  id text PRIMARY KEY,
  article_id text,
  was_helpful boolean NOT NULL,
  anonymous_session_id text,
  comment text,
  created_at timestamptz DEFAULT now()
);

-- Help Unanswered Searches
CREATE TABLE IF NOT EXISTS public.help_unanswered_searches (
  id text PRIMARY KEY,
  normalized_query text NOT NULL,
  sanitized_query text NOT NULL,
  language_code text DEFAULT 'es',
  occurrence_count numeric DEFAULT 1,
  school_id text,
  category_id text,
  review_status text DEFAULT 'pending',
  first_searched_at timestamptz DEFAULT now(),
  last_searched_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Help Settings
CREATE TABLE IF NOT EXISTS public.help_settings (
  id text PRIMARY KEY,
  setting_key text NOT NULL UNIQUE,
  setting_value text,
  is_public boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Page Views
CREATE TABLE IF NOT EXISTS public.page_views (
  id text PRIMARY KEY,
  article_id text,
  category_id text,
  language_code text,
  created_at timestamptz DEFAULT now()
);

-- Search Analytics
CREATE TABLE IF NOT EXISTS public.search_analytics (
  id text PRIMARY KEY,
  anonymous_query text NOT NULL,
  results_count numeric DEFAULT 0,
  language_code text,
  created_at timestamptz DEFAULT now()
);

-- Update Requests
CREATE TABLE IF NOT EXISTS public.update_requests (
  id text PRIMARY KEY,
  kind text NOT NULL,
  message text NOT NULL,
  page_url text,
  entity_type text,
  entity_id text,
  reporter_email text,
  status text DEFAULT 'open',
  resolution_note text,
  resolved_by text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- DART Transit Tables
CREATE TABLE IF NOT EXISTS public.dart_feed_status (
  feed_key text PRIMARY KEY,
  is_active boolean DEFAULT true,
  last_status text,
  last_success_at timestamptz,
  last_attempt_at timestamptz,
  error_message text,
  record_count numeric,
  duration_ms numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.dart_routes (
  route_id text PRIMARY KEY,
  route_short_name text,
  route_long_name text,
  route_desc text,
  route_type numeric,
  route_url text,
  route_color text,
  route_text_color text,
  continuous_pickup numeric,
  continuous_drop_off numeric,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.dart_stops (
  stop_id text PRIMARY KEY,
  stop_code text,
  stop_name text NOT NULL,
  stop_desc text,
  stop_lat numeric,
  stop_lon numeric,
  zone_id text,
  stop_url text,
  location_type numeric,
  parent_station text,
  wheelchair_boarding numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.dart_trips (
  trip_id text PRIMARY KEY,
  route_id text NOT NULL,
  service_id text NOT NULL,
  trip_headsign text,
  trip_short_name text,
  direction_id numeric,
  block_id text,
  shape_id text,
  wheelchair_accessible numeric,
  bikes_allowed numeric
);

CREATE TABLE IF NOT EXISTS public.dart_stop_times (
  id bigserial PRIMARY KEY,
  trip_id text NOT NULL,
  arrival_seconds numeric,
  departure_seconds numeric,
  stop_id text NOT NULL,
  stop_sequence numeric NOT NULL,
  stop_headsign text,
  pickup_type numeric,
  drop_off_type numeric,
  shape_dist_traveled numeric
);

CREATE TABLE IF NOT EXISTS public.dart_shapes (
  shape_id text PRIMARY KEY,
  points jsonb NOT NULL
);

CREATE TABLE IF NOT EXISTS public.dart_service_calendars (
  service_id text PRIMARY KEY,
  monday boolean DEFAULT false,
  tuesday boolean DEFAULT false,
  wednesday boolean DEFAULT false,
  thursday boolean DEFAULT false,
  friday boolean DEFAULT false,
  saturday boolean DEFAULT false,
  sunday boolean DEFAULT false,
  start_date text NOT NULL,
  end_date text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.dart_calendar_dates (
  id bigserial PRIMARY KEY,
  service_id text NOT NULL,
  date text NOT NULL,
  exception_type numeric NOT NULL
);

CREATE TABLE IF NOT EXISTS public.dart_service_alerts (
  alert_id text PRIMARY KEY,
  cause text,
  effect text,
  header_text text,
  description_text text,
  url text,
  severity_level text,
  informed_routes text[] DEFAULT '{}'::text[],
  informed_stops text[] DEFAULT '{}'::text[],
  informed_trips text[] DEFAULT '{}'::text[],
  active_from timestamptz,
  active_until timestamptz,
  feed_timestamp timestamptz,
  recorded_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.dart_vehicle_positions (
  id bigserial PRIMARY KEY,
  vehicle_id text NOT NULL,
  vehicle_label text,
  trip_id text,
  route_id text,
  direction_id numeric,
  latitude numeric,
  longitude numeric,
  bearing numeric,
  speed numeric,
  current_status text,
  stop_id text,
  occupancy_status text,
  feed_timestamp timestamptz,
  recorded_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.dart_trip_updates (
  id bigserial PRIMARY KEY,
  trip_id text NOT NULL,
  route_id text,
  vehicle_id text,
  stop_sequence numeric,
  stop_id text NOT NULL,
  arrival_time timestamptz,
  departure_time timestamptz,
  delay_seconds numeric,
  schedule_relationship text,
  feed_timestamp timestamptz,
  recorded_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.dart_sync_logs (
  id bigserial PRIMARY KEY,
  feed_key text NOT NULL,
  status text NOT NULL,
  records_processed numeric DEFAULT 0,
  duration_ms numeric,
  message text,
  triggered_by text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.dart_geocode_cache (
  id bigserial PRIMARY KEY,
  query_key text NOT NULL UNIQUE,
  display_name text NOT NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  hit_count numeric DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ==============================================================================
-- 2.1. Idempotent Patch for existing public.appearance_settings table
-- Preserves existing 'settings' column and existing 'default' row while ensuring
-- all columns required by the modern application exist with proper defaults.
-- ==============================================================================
ALTER TABLE public.appearance_settings ADD COLUMN IF NOT EXISTS settings jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.appearance_settings ADD COLUMN IF NOT EXISTS site_title text DEFAULT 'DMPS Family Info';
ALTER TABLE public.appearance_settings ADD COLUMN IF NOT EXISTS site_tagline text DEFAULT 'Portal de Información Oficial y Recursos para Familias del Distrito Escolar';
ALTER TABLE public.appearance_settings ADD COLUMN IF NOT EXISTS primary_color text DEFAULT '#002D62';
ALTER TABLE public.appearance_settings ADD COLUMN IF NOT EXISTS accent_color text DEFAULT '#C49A45';
ALTER TABLE public.appearance_settings ADD COLUMN IF NOT EXISTS neutral_color text DEFAULT '#333333';
ALTER TABLE public.appearance_settings ADD COLUMN IF NOT EXISTS font_family text DEFAULT 'DM Sans, sans-serif';
ALTER TABLE public.appearance_settings ADD COLUMN IF NOT EXISTS header_bg text DEFAULT '#002D62';
ALTER TABLE public.appearance_settings ADD COLUMN IF NOT EXISTS footer_bg text DEFAULT '#001A38';
ALTER TABLE public.appearance_settings ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE public.appearance_settings ADD COLUMN IF NOT EXISTS logo_light_url text;
ALTER TABLE public.appearance_settings ADD COLUMN IF NOT EXISTS logo_dark_url text;
ALTER TABLE public.appearance_settings ADD COLUMN IF NOT EXISTS favicon_url text;
ALTER TABLE public.appearance_settings ADD COLUMN IF NOT EXISTS logo_height numeric DEFAULT 56;
ALTER TABLE public.appearance_settings ADD COLUMN IF NOT EXISTS logo_alt text DEFAULT 'DMPS Connect — Des Moines Public Schools';
ALTER TABLE public.appearance_settings ADD COLUMN IF NOT EXISTS show_wordmark boolean DEFAULT true;
ALTER TABLE public.appearance_settings ADD COLUMN IF NOT EXISTS dark_theme jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.appearance_settings ADD COLUMN IF NOT EXISTS light_theme jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.appearance_settings ADD COLUMN IF NOT EXISTS previous_settings jsonb;
ALTER TABLE public.appearance_settings ADD COLUMN IF NOT EXISTS updated_by text;
ALTER TABLE public.appearance_settings ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.appearance_settings ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS summary text;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS content text;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS card_banner_url text;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS card_bg text;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS contact_id text;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS card_banners jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS featured_images jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS image_alt text;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS bottom_nav jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS starts_at timestamptz;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS ends_at timestamptz;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS source_name text;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS official_url text;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS admin_note text;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS source_id text;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS review_date date;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS scheduled_at timestamptz;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS is_demo boolean DEFAULT false;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS last_verified_at timestamptz;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS source_fetched_at timestamptz;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0;

-- ==============================================================================
-- 2.2. Performance Secondary Indexes
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_articles_slug ON public.articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_school_id ON public.articles(school_id);
CREATE INDEX IF NOT EXISTS idx_articles_category_id ON public.articles(category_id);
CREATE INDEX IF NOT EXISTS idx_articles_status ON public.articles(status);
CREATE INDEX IF NOT EXISTS idx_article_translations_article_id ON public.article_translations(article_id);
CREATE INDEX IF NOT EXISTS idx_article_translations_lookup ON public.article_translations(article_id, language_code);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_category_translations_lookup ON public.category_translations(category_id, language_code);
CREATE INDEX IF NOT EXISTS idx_schools_slug ON public.schools(slug);
CREATE INDEX IF NOT EXISTS idx_school_translations_lookup ON public.school_translations(school_id, language_code);
CREATE INDEX IF NOT EXISTS idx_events_school_id ON public.events(school_id);
CREATE INDEX IF NOT EXISTS idx_announcements_school_id ON public.announcements(school_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);

-- ==============================================================================
-- ==============================================================================
-- ==============================================================================
-- ==============================================================================
-- 3. Security Definer Helper Functions (Strict Hardening & Anti-Recursion)
-- All functions use SET search_path = '' and fully qualified object references.
-- ==============================================================================

-- Base authorization evaluator:
CREATE OR REPLACE FUNCTION public.has_role(allowed_roles text[])
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
DECLARE
  current_user_id text;
  has_match boolean;
BEGIN
  current_user_id := (auth.uid())::text;
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = current_user_id
      AND (ur.role)::text = ANY(allowed_roles)
  ) INTO has_match;

  RETURN COALESCE(has_match, false);
END;
$$;

ALTER FUNCTION public.has_role(text[]) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.has_role(text[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_role(text[]) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(text[]) TO authenticated, service_role;

-- 1. Full Administrator: super_admin, admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT public.has_role(ARRAY['super_admin', 'admin']);
$$;

ALTER FUNCTION public.is_admin() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_admin() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

-- 2. Content Management: super_admin, admin, content_admin, editor
CREATE OR REPLACE FUNCTION public.can_manage_content()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT public.has_role(ARRAY['super_admin', 'admin', 'content_admin', 'editor']);
$$;

ALTER FUNCTION public.can_manage_content() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.can_manage_content() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_manage_content() FROM anon;
GRANT EXECUTE ON FUNCTION public.can_manage_content() TO authenticated, service_role;

-- 3. Translations: super_admin, admin, content_admin, editor, translator
CREATE OR REPLACE FUNCTION public.can_translate()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT public.has_role(ARRAY['super_admin', 'admin', 'content_admin', 'editor', 'translator']);
$$;

ALTER FUNCTION public.can_translate() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.can_translate() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_translate() FROM anon;
GRANT EXECUTE ON FUNCTION public.can_translate() TO authenticated, service_role;

-- 4. Calendar Management: super_admin, admin, content_admin, calendar_admin, editor
CREATE OR REPLACE FUNCTION public.can_manage_calendar()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT public.has_role(ARRAY['super_admin', 'admin', 'content_admin', 'calendar_admin', 'editor']);
$$;

ALTER FUNCTION public.can_manage_calendar() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.can_manage_calendar() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_manage_calendar() FROM anon;
GRANT EXECUTE ON FUNCTION public.can_manage_calendar() TO authenticated, service_role;

-- 5. User Management: super_admin, admin
CREATE OR REPLACE FUNCTION public.can_manage_users()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT public.has_role(ARRAY['super_admin', 'admin']);
$$;

ALTER FUNCTION public.can_manage_users() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.can_manage_users() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_manage_users() FROM anon;
GRANT EXECUTE ON FUNCTION public.can_manage_users() TO authenticated, service_role;

-- ==============================================================================
-- 4. Row Level Security & Comprehensive Policy Audit
-- ==============================================================================

-- 4.1. Audit pg_policies dynamically: Drops ALL legacy, rogue or inherited policies
-- across every public table to guarantee zero lingering permissive write policies.
DO $$
DECLARE
  pol RECORD;
  t text;
  all_tables text[] := ARRAY[
    'schools', 'school_translations', 'appearance_settings', 'site_settings',
    'categories', 'category_translations', 'articles', 'article_translations',
    'tags', 'article_tags', 'article_relations', 'contacts', 'resources',
    'social_media_channels', 'social_media_posts', 'announcements',
    'announcement_translations', 'events', 'event_translations', 'programs',
    'program_translations', 'program_schools', 'student_programs', 'activities',
    'activity_translations', 'faqs', 'faq_translations', 'user_roles',
    'admin_invitations', 'audit_logs', 'broken_link_reports', 'feedback',
    'help_unanswered_searches', 'help_settings', 'page_views', 'search_analytics',
    'update_requests', 'dart_feed_status', 'dart_routes', 'dart_stops',
    'dart_trips', 'dart_stop_times', 'dart_shapes', 'dart_service_calendars',
    'dart_calendar_dates', 'dart_service_alerts', 'dart_vehicle_positions',
    'dart_trip_updates', 'dart_sync_logs', 'dart_geocode_cache'
  ];
BEGIN
  -- Enable RLS on all 50 tables
  FOREACH t IN ARRAY all_tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
  END LOOP;

  -- Dynamic policy purge from pg_policies to eliminate any legacy or rogue policies
  FOR pol IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I;', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;

-- 4.2. Core Content Tables (articles, tags, categories, schools, resources, programs, activities, faqs)
-- SELECT: public (anon + authenticated)
-- WRITE: authorized content staff only (can_manage_content)
DO $$
DECLARE
  t text;
  content_tables text[] := ARRAY[
    'articles', 'tags', 'article_tags', 'article_relations',
    'categories', 'schools', 'resources', 'programs', 'program_schools',
    'student_programs', 'activities', 'faqs'
  ];
BEGIN
  FOREACH t IN ARRAY content_tables LOOP
    EXECUTE format('CREATE POLICY public_read ON public.%I FOR SELECT TO anon, authenticated USING (true);', t);
    EXECUTE format('CREATE POLICY content_manage ON public.%I FOR ALL TO authenticated USING (public.can_manage_content()) WITH CHECK (public.can_manage_content());', t);
  END LOOP;
END $$;

-- 4.3. Translations Tables (article_translations, category_translations, etc.)
-- SELECT: public (anon + authenticated)
-- WRITE: translators, editors, and admins (can_translate)
DO $$
DECLARE
  t text;
  translation_tables text[] := ARRAY[
    'article_translations', 'category_translations', 'school_translations',
    'announcement_translations', 'event_translations', 'program_translations',
    'activity_translations', 'faq_translations'
  ];
BEGIN
  FOREACH t IN ARRAY translation_tables LOOP
    EXECUTE format('CREATE POLICY public_read ON public.%I FOR SELECT TO anon, authenticated USING (true);', t);
    EXECUTE format('CREATE POLICY translation_manage ON public.%I FOR ALL TO authenticated USING (public.can_translate()) WITH CHECK (public.can_translate());', t);
  END LOOP;
END $$;

-- 4.4. Calendar & Announcements Tables (events, announcements)
-- SELECT: public (anon + authenticated)
-- WRITE: calendar_admin, editors, content_admin, admins (can_manage_calendar)
DO $$
DECLARE
  t text;
  calendar_tables text[] := ARRAY[
    'events', 'announcements'
  ];
BEGIN
  FOREACH t IN ARRAY calendar_tables LOOP
    EXECUTE format('CREATE POLICY public_read ON public.%I FOR SELECT TO anon, authenticated USING (true);', t);
    EXECUTE format('CREATE POLICY calendar_manage ON public.%I FOR ALL TO authenticated USING (public.can_manage_calendar()) WITH CHECK (public.can_manage_calendar());', t);
  END LOOP;
END $$;

-- 4.5. Branding, System Settings & Public Transport Data
-- SELECT: public (anon + authenticated)
-- WRITE: full administrators only (is_admin)
DO $$
DECLARE
  t text;
  system_tables text[] := ARRAY[
    'appearance_settings', 'site_settings', 'contacts',
    'social_media_channels', 'social_media_posts',
    'dart_feed_status', 'dart_routes', 'dart_stops', 'dart_trips',
    'dart_stop_times', 'dart_shapes', 'dart_service_calendars',
    'dart_calendar_dates', 'dart_service_alerts', 'dart_vehicle_positions',
    'dart_trip_updates', 'dart_geocode_cache'
  ];
BEGIN
  FOREACH t IN ARRAY system_tables LOOP
    EXECUTE format('CREATE POLICY public_read ON public.%I FOR SELECT TO anon, authenticated USING (true);', t);
    EXECUTE format('CREATE POLICY system_manage ON public.%I FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());', t);
  END LOOP;
END $$;

-- 4.6. Citizen Submissions (feedback, broken links, analytics, requests)
-- INSERT: public (anon + authenticated) to submit forms/reports
-- SELECT/UPDATE/DELETE: authorized content staff only
DO $$
DECLARE
  t text;
  submission_tables text[] := ARRAY[
    'feedback', 'broken_link_reports', 'page_views', 'search_analytics',
    'help_unanswered_searches', 'update_requests'
  ];
BEGIN
  FOREACH t IN ARRAY submission_tables LOOP
    EXECUTE format('CREATE POLICY public_insert ON public.%I FOR INSERT TO anon, authenticated WITH CHECK (true);', t);
    EXECUTE format('CREATE POLICY admin_manage ON public.%I FOR ALL TO authenticated USING (public.can_manage_content()) WITH CHECK (public.can_manage_content());', t);
  END LOOP;
END $$;

-- 4.7. User Roles & Admin Staff Security
-- Strict security: anonymous users have ZERO access to user_roles.
-- Only authenticated admins can view and manage roles. An authenticated user can only view their own assigned role.
CREATE POLICY user_roles_read ON public.user_roles
  FOR SELECT TO authenticated
  USING (public.is_admin() OR user_id = (auth.uid())::text);

CREATE POLICY user_roles_insert ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY user_roles_update ON public.user_roles
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY user_roles_delete ON public.user_roles
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- admin_invitations: only super_admin/admin can manage invitations
CREATE POLICY admin_invitations_all ON public.admin_invitations
  FOR ALL TO authenticated
  USING (public.can_manage_users())
  WITH CHECK (public.can_manage_users());

-- audit_logs: SELECT for admins, INSERT strictly for authorized staff recording their own actions
CREATE POLICY audit_logs_read ON public.audit_logs
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY audit_logs_insert ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (auth.uid())::text
    AND (public.can_manage_content() OR public.can_manage_calendar() OR public.is_admin())
  );

-- help_settings & dart_sync_logs: strictly admins
CREATE POLICY help_settings_admin ON public.help_settings
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY dart_sync_logs_admin ON public.dart_sync_logs
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ==============================================================================
-- 5. Supabase Realtime Publication Setup
-- Clean, robust subscription with explicit table existence check (no exception swallowing).
-- ==============================================================================
DO $$
DECLARE
  t text;
  realtime_tables text[] := ARRAY[
    'articles', 'article_translations', 'article_tags', 'article_relations', 'tags',
    'categories', 'category_translations', 'announcements', 'announcement_translations',
    'faqs', 'faq_translations', 'schools', 'school_translations', 'programs',
    'program_translations', 'program_schools', 'events', 'event_translations',
    'contacts', 'activities', 'activity_translations', 'appearance_settings',
    'site_settings', 'social_media_channels', 'social_media_posts', 'resources',
    'update_requests', 'broken_link_reports'
  ];
BEGIN
  FOREACH t IN ARRAY realtime_tables LOOP
    -- Set replica identity to full for change tracking
    EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL;', t);

    -- Check explicitly if the table is already published before adding
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I;', t);
    END IF;
  END LOOP;
END $$;
