-- ==============================================================================
-- File: supabase/verify_podcast_studio.sql
-- Description: Strictly READ-ONLY diagnostic queries to verify the DMPS INFO
--              Podcast Studio v1 schema in Supabase SQL Editor / remote DB.
-- Safety: Does NOT modify any schema, tables, or data.
-- ==============================================================================

-- 1. Verify existence & RLS status of all 4 Podcast Studio tables
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
  ('podcasts'),
  ('podcast_episodes'),
  ('podcast_transcripts'),
  ('podcast_analytics_events')) AS req(table_name)
LEFT JOIN pg_namespace n
  ON n.nspname = 'public'
LEFT JOIN pg_class c
  ON c.relnamespace = n.oid AND c.relname = req.table_name AND c.relkind = 'r'
ORDER BY req.table_name;

-- 2. Verify RLS policies on Podcast Studio tables
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
  AND tablename IN ('podcasts', 'podcast_episodes', 'podcast_transcripts', 'podcast_analytics_events')
ORDER BY tablename, policyname;

-- 3. Verify Foreign Keys and Constraints
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.referential_constraints rc
  ON tc.constraint_name = rc.constraint_name
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('podcasts', 'podcast_episodes', 'podcast_transcripts', 'podcast_analytics_events')
ORDER BY tc.table_name, kcu.column_name;

-- 4. Verify explicit table privileges (GRANTs)
SELECT
  table_name,
  grantee,
  privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND table_name IN ('podcasts', 'podcast_episodes', 'podcast_transcripts', 'podcast_analytics_events')
  AND grantee IN ('anon', 'authenticated', 'service_role')
ORDER BY table_name, grantee, privilege_type;

-- 5. Verify storage bucket: podcast-media
SELECT
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'podcast-media';

-- 6. Verify storage RLS policies for podcast-media
SELECT
  policyname AS policy_name,
  permissive,
  roles,
  cmd AS command,
  qual AS using_expression,
  with_check AS with_check_expression
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE 'podcast_media_%'
ORDER BY policyname;

-- 7. Verify Supabase Realtime publication
SELECT
  pubname AS publication_name,
  schemaname AS schema_name,
  tablename AS table_name,
  TRUE AS published_in_realtime
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND schemaname = 'public'
  AND tablename IN ('podcasts', 'podcast_episodes', 'podcast_transcripts')
ORDER BY tablename;
