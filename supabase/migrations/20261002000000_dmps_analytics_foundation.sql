-- ==============================================================================
-- Migration: 20261002000000_dmps_analytics_foundation.sql
-- Description: DMPS INFO — Analytics System (Stage 1: Database Foundation)
-- Architecture: Privacy-first, real-time capable, RPC-hardened analytics schema
--               using Supabase PostgreSQL as the single source of truth.
-- Safety: Strictly non-destructive and idempotent. Preserves all existing
--         tables, columns, policies, and application content.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Ensure Core Role Helpers Exist (Non-destructive, preserves existing auth)
-- ------------------------------------------------------------------------------
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
    WHERE (ur.user_id)::text = current_user_id
      AND (ur.role)::text = ANY(allowed_roles)
  ) INTO has_match;

  RETURN COALESCE(has_match, false);
END;
$$;

ALTER FUNCTION public.has_role(text[]) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.has_role(text[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_role(text[]) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(text[]) TO authenticated, service_role;

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

-- ------------------------------------------------------------------------------
-- 2. Table: public.dmps_analytics_config
-- Global configuration for the DMPS INFO analytics system.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dmps_analytics_config (
  id text PRIMARY KEY DEFAULT 'default',
  enabled boolean NOT NULL DEFAULT true,
  retention_days integer NOT NULL DEFAULT 365 CHECK (retention_days >= 1 AND retention_days <= 3650),
  presence_timeout_seconds integer NOT NULL DEFAULT 60 CHECK (presence_timeout_seconds >= 10 AND presence_timeout_seconds <= 3600),
  track_page_views boolean NOT NULL DEFAULT true,
  track_searches boolean NOT NULL DEFAULT true,
  track_events boolean NOT NULL DEFAULT true,
  track_pwa boolean NOT NULL DEFAULT true,
  track_referrer boolean NOT NULL DEFAULT true,
  track_device boolean NOT NULL DEFAULT true,
  track_browser boolean NOT NULL DEFAULT true,
  track_os boolean NOT NULL DEFAULT true,
  track_language boolean NOT NULL DEFAULT true,
  track_country boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed only the default configuration row (not analytics traffic data)
INSERT INTO public.dmps_analytics_config (
  id,
  enabled,
  retention_days,
  presence_timeout_seconds,
  track_page_views,
  track_searches,
  track_events,
  track_pwa,
  track_referrer,
  track_device,
  track_browser,
  track_os,
  track_language,
  track_country
)
VALUES (
  'default',
  true,
  365,
  60,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true
)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 3. Table: public.dmps_analytics_sessions
-- Anonymous browser/device sessions (zero PII).
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dmps_analytics_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_id uuid NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  landing_path text NOT NULL,
  exit_path text,
  referrer text,
  user_agent text,
  device_type text,
  browser text,
  operating_system text,
  language text,
  country text,
  is_pwa boolean NOT NULL DEFAULT false,
  page_views integer NOT NULL DEFAULT 0 CHECK (page_views >= 0),
  event_count integer NOT NULL DEFAULT 0 CHECK (event_count >= 0),
  duration_seconds integer CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 4. Table: public.dmps_analytics_page_views
-- Individual page view records linked to anonymous sessions.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dmps_analytics_page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_id uuid NOT NULL,
  session_id uuid NOT NULL REFERENCES public.dmps_analytics_sessions(id) ON DELETE CASCADE,
  path text NOT NULL,
  title text,
  content_type text,
  content_id text,
  school_id text,
  language text,
  entered_at timestamptz NOT NULL DEFAULT now(),
  exited_at timestamptz,
  duration_seconds integer CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
  referrer text,
  device_type text,
  browser text,
  operating_system text,
  is_pwa boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 5. Table: public.dmps_analytics_events
-- Extensible interaction and lifecycle events (metadata sanitized against PII).
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dmps_analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_id uuid NOT NULL,
  session_id uuid NOT NULL REFERENCES public.dmps_analytics_sessions(id) ON DELETE CASCADE,
  event_name text NOT NULL CHECK (char_length(btrim(event_name)) > 0 AND char_length(event_name) <= 100),
  event_category text,
  path text,
  content_type text,
  content_id text,
  school_id text,
  language text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 6. Table: public.dmps_analytics_presence
-- Real-time active visitor state ("Personas activas ahora").
-- Active condition: last_seen_at >= now() - presence_timeout_seconds
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dmps_analytics_presence (
  anonymous_id uuid PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES public.dmps_analytics_sessions(id) ON DELETE CASCADE,
  current_path text,
  current_content_type text,
  current_content_id text,
  language text,
  device_type text,
  is_pwa boolean NOT NULL DEFAULT false,
  started_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 7. Table: public.dmps_analytics_searches
-- Anonymous search queries and result counts.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dmps_analytics_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_id uuid NOT NULL,
  session_id uuid NOT NULL REFERENCES public.dmps_analytics_sessions(id) ON DELETE CASCADE,
  query text NOT NULL,
  normalized_query text NOT NULL,
  result_count integer NOT NULL DEFAULT 0 CHECK (result_count >= 0),
  language text,
  path text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 8. Table: public.dmps_analytics_pwa
-- Progressive Web App installation and launch telemetry.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dmps_analytics_pwa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_id uuid NOT NULL,
  session_id uuid REFERENCES public.dmps_analytics_sessions(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (char_length(btrim(event_type)) > 0 AND char_length(event_type) <= 64),
  platform text,
  device_type text,
  browser text,
  operating_system text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 9. Table: public.dmps_analytics_daily
-- Pre-aggregated daily metrics calculated strictly from real analytics records.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dmps_analytics_daily (
  date date PRIMARY KEY,
  unique_visitors integer NOT NULL DEFAULT 0 CHECK (unique_visitors >= 0),
  new_visitors integer NOT NULL DEFAULT 0 CHECK (new_visitors >= 0),
  returning_visitors integer NOT NULL DEFAULT 0 CHECK (returning_visitors >= 0),
  sessions integer NOT NULL DEFAULT 0 CHECK (sessions >= 0),
  page_views integer NOT NULL DEFAULT 0 CHECK (page_views >= 0),
  active_users_peak integer NOT NULL DEFAULT 0 CHECK (active_users_peak >= 0),
  searches integer NOT NULL DEFAULT 0 CHECK (searches >= 0),
  search_no_results integer NOT NULL DEFAULT 0 CHECK (search_no_results >= 0),
  pwa_installs integer NOT NULL DEFAULT 0 CHECK (pwa_installs >= 0),
  pwa_launches integer NOT NULL DEFAULT 0 CHECK (pwa_launches >= 0),
  events integer NOT NULL DEFAULT 0 CHECK (events >= 0),
  total_engagement_seconds bigint NOT NULL DEFAULT 0 CHECK (total_engagement_seconds >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 10. Indexes for Real Query Workloads
-- ------------------------------------------------------------------------------
-- dmps_analytics_sessions
CREATE INDEX IF NOT EXISTS idx_dmps_analytics_sessions_anonymous_id
  ON public.dmps_analytics_sessions(anonymous_id);
CREATE INDEX IF NOT EXISTS idx_dmps_analytics_sessions_started_at
  ON public.dmps_analytics_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_dmps_analytics_sessions_last_seen_at
  ON public.dmps_analytics_sessions(last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_dmps_analytics_sessions_is_pwa
  ON public.dmps_analytics_sessions(is_pwa);

-- dmps_analytics_page_views
CREATE INDEX IF NOT EXISTS idx_dmps_analytics_page_views_session_id
  ON public.dmps_analytics_page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_dmps_analytics_page_views_anonymous_id
  ON public.dmps_analytics_page_views(anonymous_id);
CREATE INDEX IF NOT EXISTS idx_dmps_analytics_page_views_path
  ON public.dmps_analytics_page_views(path);
CREATE INDEX IF NOT EXISTS idx_dmps_analytics_page_views_content_id
  ON public.dmps_analytics_page_views(content_id);
CREATE INDEX IF NOT EXISTS idx_dmps_analytics_page_views_school_id
  ON public.dmps_analytics_page_views(school_id);
CREATE INDEX IF NOT EXISTS idx_dmps_analytics_page_views_entered_at
  ON public.dmps_analytics_page_views(entered_at DESC);
CREATE INDEX IF NOT EXISTS idx_dmps_analytics_page_views_created_at
  ON public.dmps_analytics_page_views(created_at DESC);

-- dmps_analytics_events
CREATE INDEX IF NOT EXISTS idx_dmps_analytics_events_anonymous_id
  ON public.dmps_analytics_events(anonymous_id);
CREATE INDEX IF NOT EXISTS idx_dmps_analytics_events_session_id
  ON public.dmps_analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_dmps_analytics_events_event_name
  ON public.dmps_analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_dmps_analytics_events_event_category
  ON public.dmps_analytics_events(event_category);
CREATE INDEX IF NOT EXISTS idx_dmps_analytics_events_path
  ON public.dmps_analytics_events(path);
CREATE INDEX IF NOT EXISTS idx_dmps_analytics_events_content_id
  ON public.dmps_analytics_events(content_id);
CREATE INDEX IF NOT EXISTS idx_dmps_analytics_events_school_id
  ON public.dmps_analytics_events(school_id);
CREATE INDEX IF NOT EXISTS idx_dmps_analytics_events_created_at
  ON public.dmps_analytics_events(created_at DESC);

-- dmps_analytics_presence
CREATE INDEX IF NOT EXISTS idx_dmps_analytics_presence_last_seen_at
  ON public.dmps_analytics_presence(last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_dmps_analytics_presence_session_id
  ON public.dmps_analytics_presence(session_id);

-- dmps_analytics_searches
CREATE INDEX IF NOT EXISTS idx_dmps_analytics_searches_normalized_query
  ON public.dmps_analytics_searches(normalized_query);
CREATE INDEX IF NOT EXISTS idx_dmps_analytics_searches_anonymous_id
  ON public.dmps_analytics_searches(anonymous_id);
CREATE INDEX IF NOT EXISTS idx_dmps_analytics_searches_created_at
  ON public.dmps_analytics_searches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dmps_analytics_searches_result_count
  ON public.dmps_analytics_searches(result_count);

-- dmps_analytics_pwa
CREATE INDEX IF NOT EXISTS idx_dmps_analytics_pwa_anonymous_id
  ON public.dmps_analytics_pwa(anonymous_id);
CREATE INDEX IF NOT EXISTS idx_dmps_analytics_pwa_event_type
  ON public.dmps_analytics_pwa(event_type);
CREATE INDEX IF NOT EXISTS idx_dmps_analytics_pwa_created_at
  ON public.dmps_analytics_pwa(created_at DESC);

-- dmps_analytics_daily
CREATE INDEX IF NOT EXISTS idx_dmps_analytics_daily_date
  ON public.dmps_analytics_daily(date DESC);

-- ------------------------------------------------------------------------------
-- 11. Row Level Security (RLS) & Strict Admin-Only Policies
-- Public/anonymous visitors have ZERO direct SELECT or INSERT table access.
-- All visitor telemetry writes go exclusively through hardened SECURITY DEFINER RPCs.
-- Only authorized administrators (super_admin, admin) can read analytics or
-- update dmps_analytics_config.
-- ------------------------------------------------------------------------------
ALTER TABLE public.dmps_analytics_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dmps_analytics_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dmps_analytics_page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dmps_analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dmps_analytics_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dmps_analytics_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dmps_analytics_pwa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dmps_analytics_daily ENABLE ROW LEVEL SECURITY;

-- dmps_analytics_config policies (Admin SELECT, INSERT, UPDATE)
DROP POLICY IF EXISTS dmps_analytics_config_admin_select ON public.dmps_analytics_config;
CREATE POLICY dmps_analytics_config_admin_select
  ON public.dmps_analytics_config
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS dmps_analytics_config_admin_insert ON public.dmps_analytics_config;
CREATE POLICY dmps_analytics_config_admin_insert
  ON public.dmps_analytics_config
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS dmps_analytics_config_admin_update ON public.dmps_analytics_config;
CREATE POLICY dmps_analytics_config_admin_update
  ON public.dmps_analytics_config
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- dmps_analytics_sessions policies (Admin SELECT only)
DROP POLICY IF EXISTS dmps_analytics_sessions_admin_select ON public.dmps_analytics_sessions;
CREATE POLICY dmps_analytics_sessions_admin_select
  ON public.dmps_analytics_sessions
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- dmps_analytics_page_views policies (Admin SELECT only)
DROP POLICY IF EXISTS dmps_analytics_page_views_admin_select ON public.dmps_analytics_page_views;
CREATE POLICY dmps_analytics_page_views_admin_select
  ON public.dmps_analytics_page_views
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- dmps_analytics_events policies (Admin SELECT only)
DROP POLICY IF EXISTS dmps_analytics_events_admin_select ON public.dmps_analytics_events;
CREATE POLICY dmps_analytics_events_admin_select
  ON public.dmps_analytics_events
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- dmps_analytics_presence policies (Admin SELECT only)
DROP POLICY IF EXISTS dmps_analytics_presence_admin_select ON public.dmps_analytics_presence;
CREATE POLICY dmps_analytics_presence_admin_select
  ON public.dmps_analytics_presence
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- dmps_analytics_searches policies (Admin SELECT only)
DROP POLICY IF EXISTS dmps_analytics_searches_admin_select ON public.dmps_analytics_searches;
CREATE POLICY dmps_analytics_searches_admin_select
  ON public.dmps_analytics_searches
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- dmps_analytics_pwa policies (Admin SELECT only)
DROP POLICY IF EXISTS dmps_analytics_pwa_admin_select ON public.dmps_analytics_pwa;
CREATE POLICY dmps_analytics_pwa_admin_select
  ON public.dmps_analytics_pwa
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- dmps_analytics_daily policies (Admin SELECT only)
DROP POLICY IF EXISTS dmps_analytics_daily_admin_select ON public.dmps_analytics_daily;
CREATE POLICY dmps_analytics_daily_admin_select
  ON public.dmps_analytics_daily
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Explicitly revoke direct table mutations from anon
REVOKE ALL ON TABLE public.dmps_analytics_config FROM anon;
REVOKE ALL ON TABLE public.dmps_analytics_sessions FROM anon;
REVOKE ALL ON TABLE public.dmps_analytics_page_views FROM anon;
REVOKE ALL ON TABLE public.dmps_analytics_events FROM anon;
REVOKE ALL ON TABLE public.dmps_analytics_presence FROM anon;
REVOKE ALL ON TABLE public.dmps_analytics_searches FROM anon;
REVOKE ALL ON TABLE public.dmps_analytics_pwa FROM anon;
REVOKE ALL ON TABLE public.dmps_analytics_daily FROM anon;

-- ------------------------------------------------------------------------------
-- 12. Internal Helper Function: Sanitize Event Metadata (Strips PII & Enforces Size)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sanitize_dmps_analytics_metadata(p_metadata jsonb)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
SET search_path = ''
AS $$
DECLARE
  v_clean jsonb;
BEGIN
  IF p_metadata IS NULL OR jsonb_typeof(p_metadata) <> 'object' THEN
    RETURN '{}'::jsonb;
  END IF;

  -- Remove any potential PII or sensitive keys at the top level
  v_clean := p_metadata
    - 'email'
    - 'e-mail'
    - 'mail'
    - 'phone'
    - 'telefono'
    - 'tel'
    - 'name'
    - 'full_name'
    - 'first_name'
    - 'last_name'
    - 'nombre'
    - 'apellido'
    - 'address'
    - 'direccion'
    - 'password'
    - 'pass'
    - 'token'
    - 'access_token'
    - 'refresh_token'
    - 'secret'
    - 'cookie'
    - 'ip'
    - 'ip_address'
    - 'gps'
    - 'lat'
    - 'lng'
    - 'latitude'
    - 'longitude'
    - 'ssn'
    - 'medical'
    - 'financial';

  -- Enforce maximum payload size (4 KB) to prevent abuse
  IF octet_length(v_clean::text) > 4096 THEN
    RETURN jsonb_build_object('truncated', true);
  END IF;

  RETURN v_clean;
END;
$$;

ALTER FUNCTION public.sanitize_dmps_analytics_metadata(jsonb) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.sanitize_dmps_analytics_metadata(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sanitize_dmps_analytics_metadata(jsonb) TO anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 13. RPC Function: public.record_session
-- Starts or resumes an anonymous session using server-side timestamps.
-- Returns session_id (uuid).
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_session(
  p_anonymous_id uuid,
  p_landing_path text DEFAULT '/',
  p_referrer text DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_device_type text DEFAULT NULL,
  p_browser text DEFAULT NULL,
  p_operating_system text DEFAULT NULL,
  p_language text DEFAULT NULL,
  p_country text DEFAULT NULL,
  p_is_pwa boolean DEFAULT false,
  p_session_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_cfg public.dmps_analytics_config%ROWTYPE;
  v_now timestamptz := now();
  v_session_id uuid;
  v_landing_path text;
  v_referrer text;
  v_user_agent text;
  v_device_type text;
  v_browser text;
  v_os text;
  v_language text;
  v_country text;
  v_is_pwa boolean;
BEGIN
  IF p_anonymous_id IS NULL THEN
    RAISE EXCEPTION 'anonymous_id is required';
  END IF;

  SELECT * INTO v_cfg
  FROM public.dmps_analytics_config
  WHERE id = 'default'
  LIMIT 1;

  IF FOUND AND NOT v_cfg.enabled THEN
    RETURN COALESCE(p_session_id, gen_random_uuid());
  END IF;

  v_landing_path := COALESCE(NULLIF(left(btrim(p_landing_path), 512), ''), '/');
  v_referrer := CASE WHEN COALESCE(v_cfg.track_referrer, true) THEN NULLIF(left(btrim(p_referrer), 512), '') ELSE NULL END;
  v_user_agent := NULLIF(left(btrim(p_user_agent), 512), '');
  v_device_type := CASE WHEN COALESCE(v_cfg.track_device, true) THEN NULLIF(left(btrim(p_device_type), 64), '') ELSE NULL END;
  v_browser := CASE WHEN COALESCE(v_cfg.track_browser, true) THEN NULLIF(left(btrim(p_browser), 64), '') ELSE NULL END;
  v_os := CASE WHEN COALESCE(v_cfg.track_os, true) THEN NULLIF(left(btrim(p_operating_system), 64), '') ELSE NULL END;
  v_language := CASE WHEN COALESCE(v_cfg.track_language, true) THEN NULLIF(left(btrim(p_language), 32), '') ELSE NULL END;
  v_country := CASE WHEN COALESCE(v_cfg.track_country, true) THEN NULLIF(left(btrim(p_country), 64), '') ELSE NULL END;
  v_is_pwa := CASE WHEN COALESCE(v_cfg.track_pwa, true) THEN COALESCE(p_is_pwa, false) ELSE false END;

  -- If an existing session_id belonging to the same anonymous_id is passed, update its heartbeat
  IF p_session_id IS NOT NULL THEN
    UPDATE public.dmps_analytics_sessions
    SET
      last_seen_at = v_now,
      exit_path = COALESCE(v_landing_path, exit_path),
      duration_seconds = GREATEST(0, EXTRACT(EPOCH FROM (v_now - started_at))::integer)
    WHERE id = p_session_id
      AND anonymous_id = p_anonymous_id
    RETURNING id INTO v_session_id;

    IF v_session_id IS NOT NULL THEN
      RETURN v_session_id;
    END IF;
  END IF;

  v_session_id := gen_random_uuid();

  INSERT INTO public.dmps_analytics_sessions (
    id,
    anonymous_id,
    started_at,
    last_seen_at,
    ended_at,
    landing_path,
    exit_path,
    referrer,
    user_agent,
    device_type,
    browser,
    operating_system,
    language,
    country,
    is_pwa,
    page_views,
    event_count,
    duration_seconds,
    created_at
  )
  VALUES (
    v_session_id,
    p_anonymous_id,
    v_now,
    v_now,
    NULL,
    v_landing_path,
    v_landing_path,
    v_referrer,
    v_user_agent,
    v_device_type,
    v_browser,
    v_os,
    v_language,
    v_country,
    v_is_pwa,
    0,
    0,
    0,
    v_now
  );

  RETURN v_session_id;
END;
$$;

ALTER FUNCTION public.record_session(uuid, text, text, text, text, text, text, text, text, boolean, uuid) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.record_session(uuid, text, text, text, text, text, text, text, text, boolean, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_session(uuid, text, text, text, text, text, text, text, text, boolean, uuid) TO anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 14. RPC Function: public.heartbeat_presence
-- Updates real-time visitor presence and session activity timestamp.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.heartbeat_presence(
  p_anonymous_id uuid,
  p_session_id uuid,
  p_current_path text DEFAULT NULL,
  p_current_content_type text DEFAULT NULL,
  p_current_content_id text DEFAULT NULL,
  p_language text DEFAULT NULL,
  p_device_type text DEFAULT NULL,
  p_is_pwa boolean DEFAULT false
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_cfg public.dmps_analytics_config%ROWTYPE;
  v_now timestamptz := now();
  v_path text;
  v_content_type text;
  v_content_id text;
  v_language text;
  v_device_type text;
  v_is_pwa boolean;
  v_session_exists boolean;
BEGIN
  IF p_anonymous_id IS NULL OR p_session_id IS NULL THEN
    RAISE EXCEPTION 'anonymous_id and session_id are required';
  END IF;

  SELECT * INTO v_cfg
  FROM public.dmps_analytics_config
  WHERE id = 'default'
  LIMIT 1;

  IF FOUND AND NOT v_cfg.enabled THEN
    RETURN false;
  END IF;

  v_path := NULLIF(left(btrim(p_current_path), 512), '');
  v_content_type := NULLIF(left(btrim(p_current_content_type), 64), '');
  v_content_id := NULLIF(left(btrim(p_current_content_id), 128), '');
  v_language := CASE WHEN COALESCE(v_cfg.track_language, true) THEN NULLIF(left(btrim(p_language), 32), '') ELSE NULL END;
  v_device_type := CASE WHEN COALESCE(v_cfg.track_device, true) THEN NULLIF(left(btrim(p_device_type), 64), '') ELSE NULL END;
  v_is_pwa := CASE WHEN COALESCE(v_cfg.track_pwa, true) THEN COALESCE(p_is_pwa, false) ELSE false END;

  -- Ensure parent session exists and update its last_seen_at / duration_seconds
  UPDATE public.dmps_analytics_sessions
  SET
    last_seen_at = v_now,
    exit_path = COALESCE(v_path, exit_path),
    duration_seconds = GREATEST(0, EXTRACT(EPOCH FROM (v_now - started_at))::integer)
  WHERE id = p_session_id
    AND anonymous_id = p_anonymous_id;

  v_session_exists := FOUND;

  IF NOT v_session_exists THEN
    INSERT INTO public.dmps_analytics_sessions (
      id,
      anonymous_id,
      started_at,
      last_seen_at,
      landing_path,
      exit_path,
      device_type,
      language,
      is_pwa,
      page_views,
      event_count,
      duration_seconds,
      created_at
    )
    VALUES (
      p_session_id,
      p_anonymous_id,
      v_now,
      v_now,
      COALESCE(v_path, '/'),
      COALESCE(v_path, '/'),
      v_device_type,
      v_language,
      v_is_pwa,
      0,
      0,
      0,
      v_now
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;

  INSERT INTO public.dmps_analytics_presence (
    anonymous_id,
    session_id,
    current_path,
    current_content_type,
    current_content_id,
    language,
    device_type,
    is_pwa,
    started_at,
    last_seen_at,
    created_at,
    updated_at
  )
  VALUES (
    p_anonymous_id,
    p_session_id,
    v_path,
    v_content_type,
    v_content_id,
    v_language,
    v_device_type,
    v_is_pwa,
    v_now,
    v_now,
    v_now,
    v_now
  )
  ON CONFLICT (anonymous_id) DO UPDATE
  SET
    session_id = EXCLUDED.session_id,
    current_path = COALESCE(EXCLUDED.current_path, public.dmps_analytics_presence.current_path),
    current_content_type = EXCLUDED.current_content_type,
    current_content_id = EXCLUDED.current_content_id,
    language = COALESCE(EXCLUDED.language, public.dmps_analytics_presence.language),
    device_type = COALESCE(EXCLUDED.device_type, public.dmps_analytics_presence.device_type),
    is_pwa = EXCLUDED.is_pwa,
    started_at = CASE
      WHEN public.dmps_analytics_presence.session_id <> EXCLUDED.session_id THEN v_now
      ELSE public.dmps_analytics_presence.started_at
    END,
    last_seen_at = v_now,
    updated_at = v_now;

  RETURN true;
END;
$$;

ALTER FUNCTION public.heartbeat_presence(uuid, uuid, text, text, text, text, text, boolean) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.heartbeat_presence(uuid, uuid, text, text, text, text, text, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.heartbeat_presence(uuid, uuid, text, text, text, text, text, boolean) TO anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 15. RPC Function: public.record_page_view
-- Records a page view with server-generated timestamps and updates session counters.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_page_view(
  p_anonymous_id uuid,
  p_session_id uuid,
  p_path text,
  p_title text DEFAULT NULL,
  p_content_type text DEFAULT NULL,
  p_content_id text DEFAULT NULL,
  p_school_id text DEFAULT NULL,
  p_language text DEFAULT NULL,
  p_referrer text DEFAULT NULL,
  p_device_type text DEFAULT NULL,
  p_browser text DEFAULT NULL,
  p_operating_system text DEFAULT NULL,
  p_is_pwa boolean DEFAULT false,
  p_previous_page_view_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_cfg public.dmps_analytics_config%ROWTYPE;
  v_now timestamptz := now();
  v_page_view_id uuid;
  v_path text;
  v_title text;
  v_content_type text;
  v_content_id text;
  v_school_id text;
  v_language text;
  v_referrer text;
  v_device_type text;
  v_browser text;
  v_os text;
  v_is_pwa boolean;
BEGIN
  IF p_anonymous_id IS NULL OR p_session_id IS NULL THEN
    RAISE EXCEPTION 'anonymous_id and session_id are required';
  END IF;

  v_path := NULLIF(left(btrim(p_path), 512), '');
  IF v_path IS NULL THEN
    RAISE EXCEPTION 'path is required';
  END IF;

  SELECT * INTO v_cfg
  FROM public.dmps_analytics_config
  WHERE id = 'default'
  LIMIT 1;

  IF FOUND AND (NOT v_cfg.enabled OR NOT v_cfg.track_page_views) THEN
    RETURN NULL;
  END IF;

  v_title := NULLIF(left(btrim(p_title), 300), '');
  v_content_type := NULLIF(left(btrim(p_content_type), 64), '');
  v_content_id := NULLIF(left(btrim(p_content_id), 128), '');
  v_school_id := NULLIF(left(btrim(p_school_id), 64), '');
  v_language := CASE WHEN COALESCE(v_cfg.track_language, true) THEN NULLIF(left(btrim(p_language), 32), '') ELSE NULL END;
  v_referrer := CASE WHEN COALESCE(v_cfg.track_referrer, true) THEN NULLIF(left(btrim(p_referrer), 512), '') ELSE NULL END;
  v_device_type := CASE WHEN COALESCE(v_cfg.track_device, true) THEN NULLIF(left(btrim(p_device_type), 64), '') ELSE NULL END;
  v_browser := CASE WHEN COALESCE(v_cfg.track_browser, true) THEN NULLIF(left(btrim(p_browser), 64), '') ELSE NULL END;
  v_os := CASE WHEN COALESCE(v_cfg.track_os, true) THEN NULLIF(left(btrim(p_operating_system), 64), '') ELSE NULL END;
  v_is_pwa := CASE WHEN COALESCE(v_cfg.track_pwa, true) THEN COALESCE(p_is_pwa, false) ELSE false END;

  -- Close previous page view if provided by the same anonymous visitor/session
  IF p_previous_page_view_id IS NOT NULL THEN
    UPDATE public.dmps_analytics_page_views
    SET
      exited_at = v_now,
      duration_seconds = GREATEST(0, EXTRACT(EPOCH FROM (v_now - entered_at))::integer)
    WHERE id = p_previous_page_view_id
      AND anonymous_id = p_anonymous_id
      AND session_id = p_session_id
      AND exited_at IS NULL;
  END IF;

  -- Ensure session exists and increment page_views counter
  UPDATE public.dmps_analytics_sessions
  SET
    last_seen_at = v_now,
    exit_path = v_path,
    page_views = page_views + 1,
    duration_seconds = GREATEST(0, EXTRACT(EPOCH FROM (v_now - started_at))::integer)
  WHERE id = p_session_id
    AND anonymous_id = p_anonymous_id;

  IF NOT FOUND THEN
    INSERT INTO public.dmps_analytics_sessions (
      id,
      anonymous_id,
      started_at,
      last_seen_at,
      landing_path,
      exit_path,
      referrer,
      device_type,
      browser,
      operating_system,
      language,
      is_pwa,
      page_views,
      event_count,
      duration_seconds,
      created_at
    )
    VALUES (
      p_session_id,
      p_anonymous_id,
      v_now,
      v_now,
      v_path,
      v_path,
      v_referrer,
      v_device_type,
      v_browser,
      v_os,
      v_language,
      v_is_pwa,
      1,
      0,
      0,
      v_now
    )
    ON CONFLICT (id) DO UPDATE
    SET
      last_seen_at = v_now,
      exit_path = v_path,
      page_views = public.dmps_analytics_sessions.page_views + 1,
      duration_seconds = GREATEST(0, EXTRACT(EPOCH FROM (v_now - public.dmps_analytics_sessions.started_at))::integer);
  END IF;

  v_page_view_id := gen_random_uuid();

  INSERT INTO public.dmps_analytics_page_views (
    id,
    anonymous_id,
    session_id,
    path,
    title,
    content_type,
    content_id,
    school_id,
    language,
    entered_at,
    exited_at,
    duration_seconds,
    referrer,
    device_type,
    browser,
    operating_system,
    is_pwa,
    created_at
  )
  VALUES (
    v_page_view_id,
    p_anonymous_id,
    p_session_id,
    v_path,
    v_title,
    v_content_type,
    v_content_id,
    v_school_id,
    v_language,
    v_now,
    NULL,
    NULL,
    v_referrer,
    v_device_type,
    v_browser,
    v_os,
    v_is_pwa,
    v_now
  );

  RETURN v_page_view_id;
END;
$$;

ALTER FUNCTION public.record_page_view(uuid, uuid, text, text, text, text, text, text, text, text, text, text, boolean, uuid) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.record_page_view(uuid, uuid, text, text, text, text, text, text, text, text, text, text, boolean, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_page_view(uuid, uuid, text, text, text, text, text, text, text, text, text, text, boolean, uuid) TO anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 16. RPC Function: public.record_event
-- Records an interaction or lifecycle event with PII-sanitized JSONB metadata.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_event(
  p_anonymous_id uuid,
  p_session_id uuid,
  p_event_name text,
  p_event_category text DEFAULT NULL,
  p_path text DEFAULT NULL,
  p_content_type text DEFAULT NULL,
  p_content_id text DEFAULT NULL,
  p_school_id text DEFAULT NULL,
  p_language text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_cfg public.dmps_analytics_config%ROWTYPE;
  v_now timestamptz := now();
  v_event_id uuid;
  v_event_name text;
  v_event_category text;
  v_path text;
  v_content_type text;
  v_content_id text;
  v_school_id text;
  v_language text;
  v_metadata jsonb;
  v_target_pv_id uuid;
BEGIN
  IF p_anonymous_id IS NULL OR p_session_id IS NULL THEN
    RAISE EXCEPTION 'anonymous_id and session_id are required';
  END IF;

  v_event_name := NULLIF(left(btrim(p_event_name), 100), '');
  IF v_event_name IS NULL THEN
    RAISE EXCEPTION 'event_name must not be empty';
  END IF;

  SELECT * INTO v_cfg
  FROM public.dmps_analytics_config
  WHERE id = 'default'
  LIMIT 1;

  IF FOUND AND (NOT v_cfg.enabled OR NOT v_cfg.track_events) THEN
    RETURN NULL;
  END IF;

  v_event_category := NULLIF(left(btrim(p_event_category), 64), '');
  v_path := NULLIF(left(btrim(p_path), 512), '');
  v_content_type := NULLIF(left(btrim(p_content_type), 64), '');
  v_content_id := NULLIF(left(btrim(p_content_id), 128), '');
  v_school_id := NULLIF(left(btrim(p_school_id), 64), '');
  v_language := CASE WHEN COALESCE(v_cfg.track_language, true) THEN NULLIF(left(btrim(p_language), 32), '') ELSE NULL END;
  v_metadata := public.sanitize_dmps_analytics_metadata(p_metadata);

  -- Ensure session exists and increment event_count
  UPDATE public.dmps_analytics_sessions
  SET
    last_seen_at = v_now,
    exit_path = COALESCE(v_path, exit_path),
    ended_at = CASE WHEN v_event_name = 'session_end' THEN v_now ELSE ended_at END,
    event_count = event_count + 1,
    duration_seconds = GREATEST(0, EXTRACT(EPOCH FROM (v_now - started_at))::integer)
  WHERE id = p_session_id
    AND anonymous_id = p_anonymous_id;

  IF NOT FOUND THEN
    INSERT INTO public.dmps_analytics_sessions (
      id,
      anonymous_id,
      started_at,
      last_seen_at,
      ended_at,
      landing_path,
      exit_path,
      language,
      is_pwa,
      page_views,
      event_count,
      duration_seconds,
      created_at
    )
    VALUES (
      p_session_id,
      p_anonymous_id,
      v_now,
      v_now,
      CASE WHEN v_event_name = 'session_end' THEN v_now ELSE NULL END,
      COALESCE(v_path, '/'),
      COALESCE(v_path, '/'),
      v_language,
      false,
      0,
      1,
      0,
      v_now
    )
    ON CONFLICT (id) DO UPDATE
    SET
      last_seen_at = v_now,
      event_count = public.dmps_analytics_sessions.event_count + 1,
      duration_seconds = GREATEST(0, EXTRACT(EPOCH FROM (v_now - public.dmps_analytics_sessions.started_at))::integer);
  END IF;

  -- If page_exit event includes a valid page_view_id, close out that page view duration
  IF v_event_name = 'page_exit' AND (v_metadata ? 'page_view_id') THEN
    BEGIN
      v_target_pv_id := (v_metadata->>'page_view_id')::uuid;
      UPDATE public.dmps_analytics_page_views
      SET
        exited_at = v_now,
        duration_seconds = GREATEST(0, EXTRACT(EPOCH FROM (v_now - entered_at))::integer)
      WHERE id = v_target_pv_id
        AND anonymous_id = p_anonymous_id
        AND session_id = p_session_id
        AND exited_at IS NULL;
    EXCEPTION WHEN invalid_text_representation THEN
      NULL;
    END;
  END IF;

  v_event_id := gen_random_uuid();

  INSERT INTO public.dmps_analytics_events (
    id,
    anonymous_id,
    session_id,
    event_name,
    event_category,
    path,
    content_type,
    content_id,
    school_id,
    language,
    metadata,
    created_at
  )
  VALUES (
    v_event_id,
    p_anonymous_id,
    p_session_id,
    v_event_name,
    v_event_category,
    v_path,
    v_content_type,
    v_content_id,
    v_school_id,
    v_language,
    v_metadata,
    v_now
  );

  RETURN v_event_id;
END;
$$;

ALTER FUNCTION public.record_event(uuid, uuid, text, text, text, text, text, text, text, jsonb) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.record_event(uuid, uuid, text, text, text, text, text, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_event(uuid, uuid, text, text, text, text, text, text, text, jsonb) TO anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 17. RPC Function: public.record_search
-- Records an anonymous search query with length bounds and PII redaction.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_search(
  p_anonymous_id uuid,
  p_session_id uuid,
  p_query text,
  p_normalized_query text DEFAULT NULL,
  p_result_count integer DEFAULT 0,
  p_language text DEFAULT NULL,
  p_path text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_cfg public.dmps_analytics_config%ROWTYPE;
  v_now timestamptz := now();
  v_search_id uuid;
  v_query text;
  v_norm text;
  v_result_count integer;
  v_language text;
  v_path text;
BEGIN
  IF p_anonymous_id IS NULL OR p_session_id IS NULL THEN
    RAISE EXCEPTION 'anonymous_id and session_id are required';
  END IF;

  v_query := NULLIF(left(btrim(p_query), 200), '');
  IF v_query IS NULL THEN
    RAISE EXCEPTION 'query must not be empty';
  END IF;

  SELECT * INTO v_cfg
  FROM public.dmps_analytics_config
  WHERE id = 'default'
  LIMIT 1;

  IF FOUND AND (NOT v_cfg.enabled OR NOT v_cfg.track_searches) THEN
    RETURN NULL;
  END IF;

  -- Redact accidental email addresses or 10-digit phone numbers from search text
  v_query := regexp_replace(v_query, '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}', '[redacted-email]', 'g');
  v_query := regexp_replace(v_query, '\m\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\M', '[redacted-phone]', 'g');

  v_norm := NULLIF(left(lower(btrim(COALESCE(p_normalized_query, v_query))), 200), '');
  v_norm := regexp_replace(v_norm, '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}', '[redacted-email]', 'g');
  v_norm := regexp_replace(v_norm, '\m\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\M', '[redacted-phone]', 'g');

  v_result_count := GREATEST(0, COALESCE(p_result_count, 0));
  v_language := CASE WHEN COALESCE(v_cfg.track_language, true) THEN NULLIF(left(btrim(p_language), 32), '') ELSE NULL END;
  v_path := NULLIF(left(btrim(p_path), 512), '');

  -- Ensure parent session exists
  UPDATE public.dmps_analytics_sessions
  SET
    last_seen_at = v_now,
    duration_seconds = GREATEST(0, EXTRACT(EPOCH FROM (v_now - started_at))::integer)
  WHERE id = p_session_id
    AND anonymous_id = p_anonymous_id;

  IF NOT FOUND THEN
    INSERT INTO public.dmps_analytics_sessions (
      id,
      anonymous_id,
      started_at,
      last_seen_at,
      landing_path,
      exit_path,
      language,
      is_pwa,
      page_views,
      event_count,
      duration_seconds,
      created_at
    )
    VALUES (
      p_session_id,
      p_anonymous_id,
      v_now,
      v_now,
      COALESCE(v_path, '/'),
      COALESCE(v_path, '/'),
      v_language,
      false,
      0,
      0,
      0,
      v_now
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;

  v_search_id := gen_random_uuid();

  INSERT INTO public.dmps_analytics_searches (
    id,
    anonymous_id,
    session_id,
    query,
    normalized_query,
    result_count,
    language,
    path,
    created_at
  )
  VALUES (
    v_search_id,
    p_anonymous_id,
    p_session_id,
    v_query,
    COALESCE(v_norm, lower(v_query)),
    v_result_count,
    v_language,
    v_path,
    v_now
  );

  RETURN v_search_id;
END;
$$;

ALTER FUNCTION public.record_search(uuid, uuid, text, text, integer, text, text) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.record_search(uuid, uuid, text, text, integer, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_search(uuid, uuid, text, text, integer, text, text) TO anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 18. RPC Function: public.record_pwa_event
-- Records pwa_install, pwa_launch, and future PWA lifecycle events.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_pwa_event(
  p_anonymous_id uuid,
  p_event_type text,
  p_session_id uuid DEFAULT NULL,
  p_platform text DEFAULT NULL,
  p_device_type text DEFAULT NULL,
  p_browser text DEFAULT NULL,
  p_operating_system text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_cfg public.dmps_analytics_config%ROWTYPE;
  v_now timestamptz := now();
  v_pwa_id uuid;
  v_event_type text;
  v_session_id uuid;
  v_platform text;
  v_device_type text;
  v_browser text;
  v_os text;
BEGIN
  IF p_anonymous_id IS NULL THEN
    RAISE EXCEPTION 'anonymous_id is required';
  END IF;

  v_event_type := NULLIF(left(btrim(p_event_type), 64), '');
  IF v_event_type IS NULL THEN
    RAISE EXCEPTION 'event_type must not be empty';
  END IF;

  SELECT * INTO v_cfg
  FROM public.dmps_analytics_config
  WHERE id = 'default'
  LIMIT 1;

  IF FOUND AND (NOT v_cfg.enabled OR NOT v_cfg.track_pwa) THEN
    RETURN NULL;
  END IF;

  v_platform := NULLIF(left(btrim(p_platform), 64), '');
  v_device_type := CASE WHEN COALESCE(v_cfg.track_device, true) THEN NULLIF(left(btrim(p_device_type), 64), '') ELSE NULL END;
  v_browser := CASE WHEN COALESCE(v_cfg.track_browser, true) THEN NULLIF(left(btrim(p_browser), 64), '') ELSE NULL END;
  v_os := CASE WHEN COALESCE(v_cfg.track_os, true) THEN NULLIF(left(btrim(p_operating_system), 64), '') ELSE NULL END;

  IF p_session_id IS NOT NULL THEN
    SELECT id INTO v_session_id
    FROM public.dmps_analytics_sessions
    WHERE id = p_session_id
      AND anonymous_id = p_anonymous_id
    LIMIT 1;
  END IF;

  v_pwa_id := gen_random_uuid();

  INSERT INTO public.dmps_analytics_pwa (
    id,
    anonymous_id,
    session_id,
    event_type,
    platform,
    device_type,
    browser,
    operating_system,
    created_at
  )
  VALUES (
    v_pwa_id,
    p_anonymous_id,
    v_session_id,
    v_event_type,
    v_platform,
    v_device_type,
    v_browser,
    v_os,
    v_now
  );

  RETURN v_pwa_id;
END;
$$;

ALTER FUNCTION public.record_pwa_event(uuid, text, uuid, text, text, text, text) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.record_pwa_event(uuid, text, uuid, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_pwa_event(uuid, text, uuid, text, text, text, text) TO anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 19. Maintenance Function: public.cleanup_dmps_analytics_presence
-- Removes stale presence rows older than presence_timeout_seconds.
-- Prepared for future scheduler / admin invocation (not auto-executed).
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cleanup_dmps_analytics_presence()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_timeout_seconds integer := 60;
  v_deleted integer := 0;
BEGIN
  -- Allow execution by service_role/postgres or authenticated admins
  IF current_user NOT IN ('postgres', 'service_role') AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT COALESCE(presence_timeout_seconds, 60)
  INTO v_timeout_seconds
  FROM public.dmps_analytics_config
  WHERE id = 'default'
  LIMIT 1;

  v_timeout_seconds := GREATEST(10, COALESCE(v_timeout_seconds, 60));

  DELETE FROM public.dmps_analytics_presence
  WHERE last_seen_at < now() - make_interval(secs => v_timeout_seconds);

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

ALTER FUNCTION public.cleanup_dmps_analytics_presence() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.cleanup_dmps_analytics_presence() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cleanup_dmps_analytics_presence() FROM anon;
GRANT EXECUTE ON FUNCTION public.cleanup_dmps_analytics_presence() TO authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 20. Retention Function: public.apply_dmps_analytics_retention
-- Enforces retention_days from dmps_analytics_config strictly on analytics tables.
-- Never touches any DMPS INFO content tables. Not executed during Stage 1.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.apply_dmps_analytics_retention()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_retention_days integer := 365;
  v_cutoff timestamptz;
  v_del_pv integer := 0;
  v_del_ev integer := 0;
  v_del_sr integer := 0;
  v_del_pw integer := 0;
  v_del_se integer := 0;
  v_del_da integer := 0;
BEGIN
  IF current_user NOT IN ('postgres', 'service_role') AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT COALESCE(retention_days, 365)
  INTO v_retention_days
  FROM public.dmps_analytics_config
  WHERE id = 'default'
  LIMIT 1;

  v_retention_days := GREATEST(1, COALESCE(v_retention_days, 365));
  v_cutoff := now() - make_interval(days => v_retention_days);

  DELETE FROM public.dmps_analytics_page_views WHERE created_at < v_cutoff;
  GET DIAGNOSTICS v_del_pv = ROW_COUNT;

  DELETE FROM public.dmps_analytics_events WHERE created_at < v_cutoff;
  GET DIAGNOSTICS v_del_ev = ROW_COUNT;

  DELETE FROM public.dmps_analytics_searches WHERE created_at < v_cutoff;
  GET DIAGNOSTICS v_del_sr = ROW_COUNT;

  DELETE FROM public.dmps_analytics_pwa WHERE created_at < v_cutoff;
  GET DIAGNOSTICS v_del_pw = ROW_COUNT;

  DELETE FROM public.dmps_analytics_sessions WHERE created_at < v_cutoff;
  GET DIAGNOSTICS v_del_se = ROW_COUNT;

  DELETE FROM public.dmps_analytics_daily WHERE date < (v_cutoff AT TIME ZONE 'UTC')::date;
  GET DIAGNOSTICS v_del_da = ROW_COUNT;

  RETURN jsonb_build_object(
    'retention_days', v_retention_days,
    'cutoff', v_cutoff,
    'deleted_page_views', v_del_pv,
    'deleted_events', v_del_ev,
    'deleted_searches', v_del_sr,
    'deleted_pwa', v_del_pw,
    'deleted_sessions', v_del_se,
    'deleted_daily', v_del_da
  );
END;
$$;

ALTER FUNCTION public.apply_dmps_analytics_retention() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.apply_dmps_analytics_retention() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.apply_dmps_analytics_retention() FROM anon;
GRANT EXECUTE ON FUNCTION public.apply_dmps_analytics_retention() TO authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 21. Daily Aggregation Function: public.refresh_dmps_analytics_daily
-- Recomputes real daily statistics from actual analytics tables for [start_date, end_date].
-- Does NOT invent or seed demo rows; only upserts dates with real recorded activity.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.refresh_dmps_analytics_daily(
  start_date date DEFAULT CURRENT_DATE,
  end_date date DEFAULT CURRENT_DATE
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_start date := LEAST(COALESCE(start_date, CURRENT_DATE), COALESCE(end_date, CURRENT_DATE));
  v_end date := GREATEST(COALESCE(start_date, CURRENT_DATE), COALESCE(end_date, CURRENT_DATE));
  v_day date;
  v_day_start timestamptz;
  v_day_end timestamptz;
  v_unique_visitors integer;
  v_new_visitors integer;
  v_returning_visitors integer;
  v_sessions integer;
  v_page_views integer;
  v_active_peak integer;
  v_searches integer;
  v_search_no_results integer;
  v_pwa_installs integer;
  v_pwa_launches integer;
  v_events integer;
  v_engagement_seconds bigint;
  v_upserted integer := 0;
BEGIN
  IF current_user NOT IN ('postgres', 'service_role') AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Prevent unbounded multi-decade loops
  IF (v_end - v_start) > 366 THEN
    v_start := v_end - 366;
  END IF;

  v_day := v_start;
  WHILE v_day <= v_end LOOP
    v_day_start := (v_day::timestamp AT TIME ZONE 'UTC');
    v_day_end := ((v_day + 1)::timestamp AT TIME ZONE 'UTC');

    -- Sessions & engagement on v_day
    SELECT
      COUNT(*)::integer,
      COALESCE(SUM(COALESCE(s.duration_seconds, 0)), 0)::bigint
    INTO v_sessions, v_engagement_seconds
    FROM public.dmps_analytics_sessions s
    WHERE s.started_at >= v_day_start AND s.started_at < v_day_end;

    -- Page views on v_day
    SELECT COUNT(*)::integer
    INTO v_page_views
    FROM public.dmps_analytics_page_views pv
    WHERE pv.entered_at >= v_day_start AND pv.entered_at < v_day_end;

    -- Events on v_day
    SELECT COUNT(*)::integer
    INTO v_events
    FROM public.dmps_analytics_events ev
    WHERE ev.created_at >= v_day_start AND ev.created_at < v_day_end;

    -- Searches on v_day
    SELECT
      COUNT(*)::integer,
      COUNT(*) FILTER (WHERE sr.result_count = 0)::integer
    INTO v_searches, v_search_no_results
    FROM public.dmps_analytics_searches sr
    WHERE sr.created_at >= v_day_start AND sr.created_at < v_day_end;

    -- PWA events on v_day
    SELECT
      COUNT(*) FILTER (WHERE pw.event_type = 'pwa_install')::integer,
      COUNT(*) FILTER (WHERE pw.event_type = 'pwa_launch')::integer
    INTO v_pwa_installs, v_pwa_launches
    FROM public.dmps_analytics_pwa pw
    WHERE pw.created_at >= v_day_start AND pw.created_at < v_day_end;

    -- Only upsert if real activity exists on v_day (or row already exists for v_day)
    IF (v_sessions + v_page_views + v_events + v_searches + v_pwa_installs + v_pwa_launches) > 0
       OR EXISTS (SELECT 1 FROM public.dmps_analytics_daily d WHERE d.date = v_day)
    THEN
      -- Unique visitors across all activity tables on v_day
      WITH day_visitors AS (
        SELECT s.anonymous_id FROM public.dmps_analytics_sessions s
        WHERE s.started_at >= v_day_start AND s.started_at < v_day_end
        UNION
        SELECT pv.anonymous_id FROM public.dmps_analytics_page_views pv
        WHERE pv.entered_at >= v_day_start AND pv.entered_at < v_day_end
        UNION
        SELECT ev.anonymous_id FROM public.dmps_analytics_events ev
        WHERE ev.created_at >= v_day_start AND ev.created_at < v_day_end
        UNION
        SELECT sr.anonymous_id FROM public.dmps_analytics_searches sr
        WHERE sr.created_at >= v_day_start AND sr.created_at < v_day_end
        UNION
        SELECT pw.anonymous_id FROM public.dmps_analytics_pwa pw
        WHERE pw.created_at >= v_day_start AND pw.created_at < v_day_end
      ),
      first_seen AS (
        SELECT dv.anonymous_id,
               EXISTS (
                 SELECT 1
                 FROM public.dmps_analytics_sessions prev
                 WHERE prev.anonymous_id = dv.anonymous_id
                   AND prev.started_at < v_day_start
               ) AS seen_before
        FROM day_visitors dv
      )
      SELECT
        COUNT(*)::integer,
        COUNT(*) FILTER (WHERE NOT seen_before)::integer,
        COUNT(*) FILTER (WHERE seen_before)::integer
      INTO v_unique_visitors, v_new_visitors, v_returning_visitors
      FROM first_seen;

      -- Peak concurrent active visitors within the day (bucketed by minute of session overlap)
      SELECT COALESCE(MAX(concurrent_users), 0)::integer
      INTO v_active_peak
      FROM (
        SELECT date_trunc('minute', s.started_at) AS bucket,
               COUNT(DISTINCT s.anonymous_id) AS concurrent_users
        FROM public.dmps_analytics_sessions s
        WHERE s.started_at >= v_day_start AND s.started_at < v_day_end
        GROUP BY 1
      ) buckets;

      INSERT INTO public.dmps_analytics_daily (
        date,
        unique_visitors,
        new_visitors,
        returning_visitors,
        sessions,
        page_views,
        active_users_peak,
        searches,
        search_no_results,
        pwa_installs,
        pwa_launches,
        events,
        total_engagement_seconds,
        created_at,
        updated_at
      )
      VALUES (
        v_day,
        COALESCE(v_unique_visitors, 0),
        COALESCE(v_new_visitors, 0),
        COALESCE(v_returning_visitors, 0),
        COALESCE(v_sessions, 0),
        COALESCE(v_page_views, 0),
        GREATEST(COALESCE(v_active_peak, 0), CASE WHEN COALESCE(v_unique_visitors, 0) > 0 THEN 1 ELSE 0 END),
        COALESCE(v_searches, 0),
        COALESCE(v_search_no_results, 0),
        COALESCE(v_pwa_installs, 0),
        COALESCE(v_pwa_launches, 0),
        COALESCE(v_events, 0),
        COALESCE(v_engagement_seconds, 0),
        now(),
        now()
      )
      ON CONFLICT (date) DO UPDATE
      SET
        unique_visitors = EXCLUDED.unique_visitors,
        new_visitors = EXCLUDED.new_visitors,
        returning_visitors = EXCLUDED.returning_visitors,
        sessions = EXCLUDED.sessions,
        page_views = EXCLUDED.page_views,
        active_users_peak = GREATEST(public.dmps_analytics_daily.active_users_peak, EXCLUDED.active_users_peak),
        searches = EXCLUDED.searches,
        search_no_results = EXCLUDED.search_no_results,
        pwa_installs = EXCLUDED.pwa_installs,
        pwa_launches = EXCLUDED.pwa_launches,
        events = EXCLUDED.events,
        total_engagement_seconds = EXCLUDED.total_engagement_seconds,
        updated_at = now();

      v_upserted := v_upserted + 1;
    END IF;

    v_day := v_day + 1;
  END LOOP;

  RETURN v_upserted;
END;
$$;

ALTER FUNCTION public.refresh_dmps_analytics_daily(date, date) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.refresh_dmps_analytics_daily(date, date) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.refresh_dmps_analytics_daily(date, date) FROM anon;
GRANT EXECUTE ON FUNCTION public.refresh_dmps_analytics_daily(date, date) TO authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 22. Supabase Realtime Setup for public.dmps_analytics_presence
-- Only dmps_analytics_presence is added to supabase_realtime for live active user tracking.
-- ------------------------------------------------------------------------------
ALTER TABLE public.dmps_analytics_presence REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'dmps_analytics_presence'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.dmps_analytics_presence;
    END IF;
  END IF;
END $$;
