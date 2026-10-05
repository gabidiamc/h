-- ==============================================================================
-- File: supabase/verify_analytics_foundation.sql
-- Description: Strictly READ-ONLY diagnostic queries to verify the DMPS INFO
--              Analytics Foundation (Stage 1) in Supabase SQL Editor.
-- Safety: Does NOT modify any schema, tables, or data.
-- ==============================================================================

-- 1. Verify existence & RLS status of all 8 DMPS Analytics tables
SELECT
  req.table_name,
  c.oid IS NOT NULL AS table_exists,
  COALESCE(c.relrowsecurity, false) AS rls_enabled,
  CASE c.relreplident
    WHEN 'f' THEN 'FULL'
    WHEN 'd' THEN 'DEFAULT'
    WHEN 'n' THEN 'NOTHING'
    WHEN 'i' THEN 'INDEX'
    ELSE NULL
  END AS replica_identity
FROM (VALUES
  ('dmps_analytics_config'),
  ('dmps_analytics_sessions'),
  ('dmps_analytics_page_views'),
  ('dmps_analytics_events'),
  ('dmps_analytics_presence'),
  ('dmps_analytics_searches'),
  ('dmps_analytics_pwa'),
  ('dmps_analytics_daily')
) AS req(table_name)
LEFT JOIN pg_namespace n
  ON n.nspname = 'public'
LEFT JOIN pg_class c
  ON c.relnamespace = n.oid
 AND c.relname = req.table_name
 AND c.relkind = 'r'
ORDER BY req.table_name;

-- 2. Verify RLS policies on DMPS Analytics tables (Ensuring no public SELECT/INSERT leaks)
SELECT
  tablename AS table_name,
  policyname AS policy_name,
  permissive,
  roles,
  cmd AS command,
  qual AS using_expression,
  with_check AS with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename LIKE 'dmps_analytics_%'
ORDER BY tablename, policyname;

-- 3. Verify all secondary and primary indexes on DMPS Analytics tables
SELECT
  tablename AS table_name,
  indexname AS index_name,
  indexdef AS index_definition
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename LIKE 'dmps_analytics_%'
ORDER BY tablename, indexname;

-- 4. Verify hardened RPC functions & SECURITY DEFINER configuration
SELECT
  req.function_name,
  p.oid IS NOT NULL AS function_exists,
  COALESCE(p.prosecdef, false) AS is_security_definer,
  pg_get_function_identity_arguments(p.oid) AS arguments,
  pg_get_function_result(p.oid) AS return_type,
  p.proconfig AS function_config
FROM (VALUES
  ('record_session'),
  ('heartbeat_presence'),
  ('record_page_view'),
  ('record_event'),
  ('record_search'),
  ('record_pwa_event'),
  ('cleanup_dmps_analytics_presence'),
  ('apply_dmps_analytics_retention'),
  ('refresh_dmps_analytics_daily'),
  ('sanitize_dmps_analytics_metadata')
) AS req(function_name)
LEFT JOIN pg_namespace n
  ON n.nspname = 'public'
LEFT JOIN pg_proc p
  ON p.pronamespace = n.oid
 AND p.proname = req.function_name
ORDER BY req.function_name;

-- 5. Verify Supabase Realtime publication for dmps_analytics_presence
SELECT
  pubname AS publication_name,
  schemaname AS schema_name,
  tablename AS table_name,
  TRUE AS published_in_realtime
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND schemaname = 'public'
  AND tablename LIKE 'dmps_analytics_%'
ORDER BY tablename;

-- 6. Verify initial default configuration in dmps_analytics_config (if table exists)
SELECT
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
  track_country,
  created_at,
  updated_at
FROM public.dmps_analytics_config
WHERE id = 'default';
