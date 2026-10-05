-- ==============================================================================
-- Migration: 20261003000000_dmps_analytics_intelligence.sql
-- Description: DMPS INFO — Analytics System (Stage 4: Analytics Intelligence)
-- Purpose: Server-side PostgreSQL aggregation RPC (`public.get_dmps_analytics_intelligence`)
--          protected by `public.is_admin()` to minimize Supabase egress, eliminate
--          N+1 queries, and preserve strict visitor privacy (never exposing
--          anonymous_id or session_id to the client).
-- Safety: Strictly non-destructive and idempotent.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.get_dmps_analytics_intelligence(
  p_start_at timestamptz DEFAULT NULL,
  p_end_at timestamptz DEFAULT now(),
  p_prev_start_at timestamptz DEFAULT NULL,
  p_prev_end_at timestamptz DEFAULT NULL,
  p_school_id text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
DECLARE
  v_end timestamptz := COALESCE(p_end_at, now());
  v_school text := NULLIF(btrim(COALESCE(p_school_id, '')), '');
  v_has_prev boolean := (p_prev_start_at IS NOT NULL AND p_prev_end_at IS NOT NULL);
  v_result jsonb;
BEGIN
  -- 1. Enforce strict administrative access
  IF current_user NOT IN ('postgres', 'service_role') AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: administrative role required for Analytics Intelligence';
  END IF;

  IF v_school = 'all' THEN
    v_school := NULL;
  END IF;

  WITH
  -- Current period filtered views
  cur_pv AS (
    SELECT
      pv.id,
      pv.anonymous_id,
      pv.session_id,
      pv.path,
      COALESCE(NULLIF(btrim(pv.content_type), ''), 'page') AS content_type,
      COALESCE(NULLIF(btrim(pv.content_id), ''), pv.path) AS content_id,
      pv.school_id,
      pv.language,
      pv.entered_at,
      pv.duration_seconds
    FROM public.dmps_analytics_page_views pv
    WHERE pv.entered_at <= v_end
      AND (p_start_at IS NULL OR pv.entered_at >= p_start_at)
      AND (v_school IS NULL OR pv.school_id = v_school)
  ),
  -- Previous period filtered views
  prev_pv AS (
    SELECT
      pv.id,
      pv.anonymous_id,
      pv.session_id,
      pv.path,
      COALESCE(NULLIF(btrim(pv.content_type), ''), 'page') AS content_type,
      COALESCE(NULLIF(btrim(pv.content_id), ''), pv.path) AS content_id,
      pv.school_id
    FROM public.dmps_analytics_page_views pv
    WHERE v_has_prev
      AND pv.entered_at >= p_prev_start_at
      AND pv.entered_at < p_prev_end_at
      AND (v_school IS NULL OR pv.school_id = v_school)
  ),
  -- Current period sessions
  cur_sess AS (
    SELECT
      s.id,
      s.anonymous_id,
      s.started_at,
      s.landing_path,
      s.exit_path,
      s.device_type,
      s.browser,
      s.operating_system,
      s.language,
      s.is_pwa,
      s.page_views,
      s.event_count,
      s.duration_seconds
    FROM public.dmps_analytics_sessions s
    WHERE s.started_at <= v_end
      AND (p_start_at IS NULL OR s.started_at >= p_start_at)
      AND (
        v_school IS NULL
        OR EXISTS (
          SELECT 1 FROM cur_pv cp WHERE cp.session_id = s.id
        )
      )
  ),
  prev_sess AS (
    SELECT
      s.id,
      s.anonymous_id
    FROM public.dmps_analytics_sessions s
    WHERE v_has_prev
      AND s.started_at >= p_prev_start_at
      AND s.started_at < p_prev_end_at
      AND (
        v_school IS NULL
        OR EXISTS (
          SELECT 1 FROM prev_pv pp WHERE pp.session_id = s.id
        )
      )
  ),
  -- Current period events
  cur_ev AS (
    SELECT
      ev.id,
      ev.anonymous_id,
      ev.session_id,
      ev.event_name,
      ev.event_category,
      ev.path,
      COALESCE(NULLIF(btrim(ev.content_type), ''), 'page') AS content_type,
      COALESCE(NULLIF(btrim(ev.content_id), ''), ev.path) AS content_id,
      ev.school_id,
      ev.language,
      ev.created_at
    FROM public.dmps_analytics_events ev
    WHERE ev.created_at <= v_end
      AND (p_start_at IS NULL OR ev.created_at >= p_start_at)
      AND (v_school IS NULL OR ev.school_id = v_school)
  ),
  prev_ev AS (
    SELECT
      ev.id,
      ev.anonymous_id,
      ev.session_id,
      ev.event_name,
      COALESCE(NULLIF(btrim(ev.content_type), ''), 'page') AS content_type,
      COALESCE(NULLIF(btrim(ev.content_id), ''), ev.path) AS content_id
    FROM public.dmps_analytics_events ev
    WHERE v_has_prev
      AND ev.created_at >= p_prev_start_at
      AND ev.created_at < p_prev_end_at
      AND (v_school IS NULL OR ev.school_id = v_school)
  ),
  -- Current & previous searches
  cur_sr AS (
    SELECT
      sr.id,
      sr.anonymous_id,
      sr.session_id,
      sr.query,
      sr.normalized_query,
      sr.result_count,
      sr.language,
      sr.created_at
    FROM public.dmps_analytics_searches sr
    WHERE sr.created_at <= v_end
      AND (p_start_at IS NULL OR sr.created_at >= p_start_at)
  ),
  prev_sr AS (
    SELECT
      sr.id,
      sr.anonymous_id,
      sr.session_id,
      sr.normalized_query,
      sr.result_count
    FROM public.dmps_analytics_searches sr
    WHERE v_has_prev
      AND sr.created_at >= p_prev_start_at
      AND sr.created_at < p_prev_end_at
  ),
  -- Current & previous PWA events
  cur_pwa AS (
    SELECT
      pw.id,
      pw.anonymous_id,
      pw.session_id,
      pw.event_type,
      pw.platform,
      pw.operating_system,
      pw.created_at
    FROM public.dmps_analytics_pwa pw
    WHERE pw.created_at <= v_end
      AND (p_start_at IS NULL OR pw.created_at >= p_start_at)
  ),
  prev_pwa AS (
    SELECT
      pw.id,
      pw.event_type
    FROM public.dmps_analytics_pwa pw
    WHERE v_has_prev
      AND pw.created_at >= p_prev_start_at
      AND pw.created_at < p_prev_end_at
  ),
  -- Content items aggregation (current vs previous)
  content_cur AS (
    SELECT
      content_type,
      content_id,
      MAX(path) AS sample_path,
      COUNT(*)::integer AS views,
      COUNT(DISTINCT anonymous_id)::integer AS users,
      COUNT(DISTINCT session_id)::integer AS sessions,
      ROUND(AVG(duration_seconds) FILTER (WHERE duration_seconds > 0))::integer AS avg_duration_seconds
    FROM cur_pv
    GROUP BY content_type, content_id
  ),
  content_prev AS (
    SELECT
      content_type,
      content_id,
      COUNT(*)::integer AS prev_views
    FROM prev_pv
    GROUP BY content_type, content_id
  ),
  content_combined AS (
    SELECT
      COALESCE(c.content_type, p.content_type) AS content_type,
      COALESCE(c.content_id, p.content_id) AS content_id,
      c.sample_path,
      COALESCE(c.views, 0) AS current_views,
      COALESCE(p.prev_views, 0) AS previous_views,
      COALESCE(c.users, 0) AS users,
      COALESCE(c.sessions, 0) AS sessions,
      c.avg_duration_seconds
    FROM content_cur c
    FULL OUTER JOIN content_prev p
      ON c.content_type = p.content_type AND c.content_id = p.content_id
  ),
  content_by_type AS (
    SELECT
      content_type,
      COUNT(*)::integer ASviews,
      COUNT(DISTINCT anonymous_id)::integer AS users,
      COUNT(DISTINCT session_id)::integer AS sessions
    FROM cur_pv
    GROUP BY content_type
  ),
  -- Search terms aggregation (current vs previous)
  search_cur_terms AS (
    SELECT
      normalized_query,
      MAX(query) AS display_query,
      COUNT(*)::integer AS searches,
      COUNT(DISTINCT anonymous_id)::integer AS users,
      COUNT(*) FILTER (WHERE result_count = 0)::integer AS zero_results_count,
      ROUND(AVG(result_count)::numeric, 1) AS avg_results
    FROM cur_sr
    WHERE normalized_query IS NOT NULL AND btrim(normalized_query) <> ''
    GROUP BY normalized_query
  ),
  search_prev_terms AS (
    SELECT
      normalized_query,
      COUNT(*)::integer AS prev_searches
    FROM prev_sr
    WHERE normalized_query IS NOT NULL AND btrim(normalized_query) <> ''
    GROUP BY normalized_query
  ),
  search_terms_combined AS (
    SELECT
      c.normalized_query,
      c.display_query,
      c.searches AS current_searches,
      COALESCE(p.prev_searches, 0) AS previous_searches,
      c.users,
      c.zero_results_count,
      c.avg_results
    FROM search_cur_terms c
    LEFT JOIN search_prev_terms p ON c.normalized_query = p.normalized_query
  ),
  -- Navigation sequences (ordered page views within each session)
  ordered_pv AS (
    SELECT
      session_id,
      anonymous_id,
      path,
      LAG(path) OVER (PARTITION BY session_id ORDER BY entered_at ASC, id ASC) AS prev_path,
      LEAD(path) OVER (PARTITION BY session_id ORDER BY entered_at ASC, id ASC) AS next_path,
      ROW_NUMBER() OVER (PARTITION BY session_id ORDER BY entered_at ASC, id ASC) AS step_asc,
      ROW_NUMBER() OVER (PARTITION BY session_id ORDER BY entered_at DESC, id DESC) AS step_desc
    FROM cur_pv
  ),
  nav_transitions AS (
    SELECT
      prev_path AS from_path,
      path AS to_path,
      COUNT(*)::integer AS transitions,
      COUNT(DISTINCT session_id)::integer AS sessions,
      COUNT(DISTINCT anonymous_id)::integer AS users
    FROM ordered_pv
    WHERE prev_path IS NOT NULL AND prev_path <> path
    GROUP BY prev_path, path
    ORDER BY transitions DESC
    LIMIT 25
  ),
  after_entry_paths AS (
    SELECT
      prev_path AS landing_path,
      path AS second_path,
      COUNT(*)::integer AS transitions,
      COUNT(DISTINCT session_id)::integer AS sessions
    FROM ordered_pv
    WHERE step_asc = 2 AND prev_path IS NOT NULL
    GROUP BY prev_path, path
    ORDER BY transitions DESC
    LIMIT 20
  ),
  before_exit_paths AS (
    SELECT
      prev_path AS previous_path,
      path AS exit_path,
      COUNT(*)::integer AS transitions,
      COUNT(DISTINCT session_id)::integer AS sessions
    FROM ordered_pv
    WHERE step_desc = 1 AND prev_path IS NOT NULL
    GROUP BY prev_path, path
    ORDER BY transitions DESC
    LIMIT 20
  ),
  entry_pages AS (
    SELECT
      landing_path AS path,
      COUNT(*)::integer AS sessions,
      COUNT(DISTINCT anonymous_id)::integer AS users
    FROM cur_sess
    WHERE landing_path IS NOT NULL AND btrim(landing_path) <> ''
    GROUP BY landing_path
    ORDER BY sessions DESC
    LIMIT 20
  ),
  exit_pages AS (
    SELECT
      exit_path AS path,
      COUNT(*)::integer AS sessions,
      COUNT(DISTINCT anonymous_id)::integer AS users
    FROM cur_sess
    WHERE exit_path IS NOT NULL AND btrim(exit_path) <> ''
    GROUP BY exit_path
    ORDER BY sessions DESC
    LIMIT 20
  ),
  -- Session depth & behavior intelligence
  session_stats AS (
    SELECT
      COUNT(*)::integer AS total_sessions,
      ROUND(AVG(duration_seconds) FILTER (WHERE duration_seconds IS NOT NULL AND duration_seconds >= 0))::integer AS avg_duration_seconds,
      ROUND(AVG(page_views)::numeric, 2) AS avg_pages_per_session,
      COUNT(*) FILTER (WHERE page_views <= 1)::integer AS single_page_sessions,
      COUNT(*) FILTER (WHERE page_views > 1)::integer AS multi_page_sessions,
      COUNT(*) FILTER (WHERE page_views >= 3)::integer AS deep_navigation_sessions,
      COUNT(*) FILTER (
        WHERE EXISTS (SELECT 1 FROM cur_sr sr WHERE sr.session_id = cur_sess.id)
      )::integer AS sessions_with_searches,
      COUNT(*) FILTER (
        WHERE event_count > 0 OR EXISTS (SELECT 1 FROM cur_ev ev WHERE ev.session_id = cur_sess.id)
      )::integer AS sessions_with_events
    FROM cur_sess
  )
  SELECT jsonb_build_object(
    'totals', jsonb_build_object(
      'current_page_views', (SELECT COUNT(*)::integer FROM cur_pv),
      'previous_page_views', (SELECT COUNT(*)::integer FROM prev_pv),
      'current_users', (SELECT COUNT(DISTINCT anonymous_id)::integer FROM cur_sess),
      'previous_users', (SELECT COUNT(DISTINCT anonymous_id)::integer FROM prev_sess),
      'current_sessions', (SELECT COUNT(*)::integer FROM cur_sess),
      'previous_sessions', (SELECT COUNT(*)::integer FROM prev_sess),
      'current_searches', (SELECT COUNT(*)::integer FROM cur_sr),
      'previous_searches', (SELECT COUNT(*)::integer FROM prev_sr),
      'current_zero_searches', (SELECT COUNT(*)::integer FROM cur_sr WHERE result_count = 0),
      'current_events', (SELECT COUNT(*)::integer FROM cur_ev),
      'previous_events', (SELECT COUNT(*)::integer FROM prev_ev),
      'current_pwa_launches', (SELECT COUNT(*)::integer FROM cur_pwa WHERE event_type = 'pwa_launch'),
      'previous_pwa_launches', (SELECT COUNT(*)::integer FROM prev_pwa WHERE event_type = 'pwa_launch'),
      'current_pwa_prompts', (SELECT COUNT(*)::integer FROM cur_pwa WHERE event_type = 'pwa_prompt_shown'),
      'previous_pwa_prompts', (SELECT COUNT(*)::integer FROM prev_pwa WHERE event_type = 'pwa_prompt_shown'),
      'current_pwa_installs', (SELECT COUNT(*)::integer FROM cur_pwa WHERE event_type = 'pwa_install'),
      'previous_pwa_installs', (SELECT COUNT(*)::integer FROM prev_pwa WHERE event_type = 'pwa_install')
    ),
    'content_items', COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'content_type', cc.content_type,
            'content_id', cc.content_id,
            'path', cc.sample_path,
            'current_views', cc.current_views,
            'previous_views', cc.previous_views,
            'users', cc.users,
            'sessions', cc.sessions,
            'avg_duration_seconds', cc.avg_duration_seconds
          )
          ORDER BY cc.current_views DESC, cc.previous_views DESC
        )
        FROM (SELECT * FROM content_combined LIMIT 150) cc
      ),
      '[]'::jsonb
    ),
    'content_by_type', COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'content_type', cbt.content_type,
            'views', cbt.ASviews,
            'users', cbt.users,
            'sessions', cbt.sessions
          )
          ORDER BY cbt.ASviews DESC
        )
        FROM content_by_type cbt
      ),
      '[]'::jsonb
    ),
    'search_terms', COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'normalized_query', stc.normalized_query,
            'display_query', stc.display_query,
            'current_searches', stc.current_searches,
            'previous_searches', stc.previous_searches,
            'users', stc.users,
            'zero_results_count', stc.zero_results_count,
            'avg_results', stc.avg_results
          )
          ORDER BY stc.current_searches DESC
        )
        FROM (SELECT * FROM search_terms_combined LIMIT 100) stc
      ),
      '[]'::jsonb
    ),
    'session_intelligence', (
      SELECT jsonb_build_object(
        'total_sessions', COALESCE(ss.total_sessions, 0),
        'avg_duration_seconds', ss.avg_duration_seconds,
        'avg_pages_per_session', ss.avg_pages_per_session,
        'single_page_sessions', COALESCE(ss.single_page_sessions, 0),
        'multi_page_sessions', COALESCE(ss.multi_page_sessions, 0),
        'deep_navigation_sessions', COALESCE(ss.deep_navigation_sessions, 0),
        'sessions_with_searches', COALESCE(ss.sessions_with_searches, 0),
        'sessions_with_events', COALESCE(ss.sessions_with_events, 0)
      )
      FROM session_stats ss
    ),
    'navigation', jsonb_build_object(
      'transitions', COALESCE((SELECT jsonb_agg(row_to_json(nt)) FROM nav_transitions nt), '[]'::jsonb),
      'after_entry', COALESCE((SELECT jsonb_agg(row_to_json(ae)) FROM after_entry_paths ae), '[]'::jsonb),
      'before_exit', COALESCE((SELECT jsonb_agg(row_to_json(be)) FROM before_exit_paths be), '[]'::jsonb),
      'entry_pages', COALESCE((SELECT jsonb_agg(row_to_json(ep)) FROM entry_pages ep), '[]'::jsonb),
      'exit_pages', COALESCE((SELECT jsonb_agg(row_to_json(xp)) FROM exit_pages xp), '[]'::jsonb)
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

ALTER FUNCTION public.get_dmps_analytics_intelligence(timestamptz, timestamptz, timestamptz, timestamptz, text) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.get_dmps_analytics_intelligence(timestamptz, timestamptz, timestamptz, timestamptz, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_dmps_analytics_intelligence(timestamptz, timestamptz, timestamptz, timestamptz, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_dmps_analytics_intelligence(timestamptz, timestamptz, timestamptz, timestamptz, text) TO authenticated, service_role;
