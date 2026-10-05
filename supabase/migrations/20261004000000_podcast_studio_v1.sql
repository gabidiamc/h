-- ==============================================================================
-- Migration: 20261004000000_podcast_studio_v1.sql
-- Description: DMPS INFO — PODCAST STUDIO V1
--              Tables: podcasts, podcast_episodes, podcast_transcripts,
--                      podcast_analytics_events
--              Storage Bucket: podcast-media (audio, video, podcast branding images)
--              Security: Hardened RLS policies (published-only for public, full
--                        management for content staff/admins), referential integrity
--                        (FK to dmps_analytics_sessions ON DELETE SET NULL),
--                        explicit role GRANTs, and Supabase Realtime publication.
-- ==============================================================================

-- 1. Table: public.podcasts
CREATE TABLE IF NOT EXISTS public.podcasts (
  id text PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  cover_url text,
  cover_storage_path text,
  banner_url text,
  banner_storage_path text,
  logo_url text,
  logo_storage_path text,
  language text NOT NULL DEFAULT 'es',
  status public.content_status NOT NULL DEFAULT 'draft',
  school_id text DEFAULT 'all',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_podcasts_status_updated
  ON public.podcasts (status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_podcasts_language
  ON public.podcasts (language);
CREATE INDEX IF NOT EXISTS idx_podcasts_school_id
  ON public.podcasts (school_id);

-- 2. Table: public.podcast_episodes
CREATE TABLE IF NOT EXISTS public.podcast_episodes (
  id text PRIMARY KEY,
  podcast_id text NOT NULL REFERENCES public.podcasts(id) ON DELETE CASCADE,
  slug text NOT NULL,
  title text NOT NULL,
  description text,
  episode_number integer NOT NULL DEFAULT 1 CHECK (episode_number >= 0),
  season_number integer NOT NULL DEFAULT 1 CHECK (season_number >= 0),
  published_at timestamptz,
  duration_seconds integer NOT NULL DEFAULT 0 CHECK (duration_seconds >= 0),
  audio_url text,
  audio_storage_path text,
  audio_mime_type text,
  audio_size_bytes bigint CHECK (audio_size_bytes IS NULL OR audio_size_bytes >= 0),
  video_url text,
  video_storage_path text,
  video_mime_type text,
  video_size_bytes bigint CHECK (video_size_bytes IS NULL OR video_size_bytes >= 0),
  cover_url text,
  cover_storage_path text,
  language text NOT NULL DEFAULT 'es',
  status public.content_status NOT NULL DEFAULT 'draft',
  transcript_status text NOT NULL DEFAULT 'none'
    CHECK (transcript_status IN ('none', 'processing', 'review_ready', 'published', 'failed')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_podcast_episodes_podcast_slug UNIQUE (podcast_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_podcast_episodes_podcast_order
  ON public.podcast_episodes (podcast_id, season_number DESC, episode_number DESC);
CREATE INDEX IF NOT EXISTS idx_podcast_episodes_status_published
  ON public.podcast_episodes (status, published_at DESC);

-- 3. Table: public.podcast_transcripts
CREATE TABLE IF NOT EXISTS public.podcast_transcripts (
  id text PRIMARY KEY,
  episode_id text NOT NULL UNIQUE REFERENCES public.podcast_episodes(id) ON DELETE CASCADE,
  language text NOT NULL DEFAULT 'es',
  full_text text NOT NULL DEFAULT '',
  segments jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'processing', 'review_ready', 'published', 'failed')),
  provider text DEFAULT 'gemini-3.5-transcribe',
  generated_at timestamptz,
  reviewed_at timestamptz,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_podcast_transcripts_episode_status
  ON public.podcast_transcripts (episode_id, status);

-- 4. Table: public.podcast_analytics_events
CREATE TABLE IF NOT EXISTS public.podcast_analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_id uuid NOT NULL,
  session_id uuid REFERENCES public.dmps_analytics_sessions(id) ON DELETE SET NULL,
  podcast_id text NOT NULL REFERENCES public.podcasts(id) ON DELETE CASCADE,
  episode_id text NOT NULL REFERENCES public.podcast_episodes(id) ON DELETE CASCADE,
  event_type text NOT NULL
    CHECK (event_type IN (
      'play_start',
      'play_progress',
      'play_pause',
      'play_resume',
      'play_seek',
      'play_complete',
      'transcript_segment_click',
      'speed_change'
    )),
  position_seconds numeric NOT NULL DEFAULT 0 CHECK (position_seconds >= 0),
  duration_seconds numeric NOT NULL DEFAULT 0 CHECK (duration_seconds >= 0),
  listened_seconds numeric NOT NULL DEFAULT 0 CHECK (listened_seconds >= 0),
  completion_percent numeric NOT NULL DEFAULT 0 CHECK (completion_percent >= 0 AND completion_percent <= 100),
  playback_rate numeric NOT NULL DEFAULT 1,
  device_type text,
  language text,
  is_pwa boolean NOT NULL DEFAULT false,
  playback_mode text NOT NULL DEFAULT 'audio' CHECK (playback_mode IN ('audio', 'video')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_podcast_analytics_podcast_created
  ON public.podcast_analytics_events (podcast_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_podcast_analytics_episode_created
  ON public.podcast_analytics_events (episode_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_podcast_analytics_event_type
  ON public.podcast_analytics_events (event_type, created_at DESC);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.podcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.podcast_episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.podcast_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.podcast_analytics_events ENABLE ROW LEVEL SECURITY;

-- Drop any pre-existing policies idempotently
DROP POLICY IF EXISTS public_read ON public.podcasts;
DROP POLICY IF EXISTS content_manage ON public.podcasts;
DROP POLICY IF EXISTS public_read ON public.podcast_episodes;
DROP POLICY IF EXISTS content_manage ON public.podcast_episodes;
DROP POLICY IF EXISTS public_read ON public.podcast_transcripts;
DROP POLICY IF EXISTS content_manage ON public.podcast_transcripts;
DROP POLICY IF EXISTS public_insert ON public.podcast_analytics_events;
DROP POLICY IF EXISTS admin_read ON public.podcast_analytics_events;
DROP POLICY IF EXISTS content_manage ON public.podcast_analytics_events;
DROP POLICY IF EXISTS admin_manage ON public.podcast_analytics_events;

-- Podcasts RLS: Public reads published podcasts; staff manages all
CREATE POLICY public_read ON public.podcasts
  FOR SELECT TO anon, authenticated
  USING (status = 'published' OR (auth.role() = 'authenticated' AND public.can_manage_content()));

CREATE POLICY content_manage ON public.podcasts
  FOR ALL TO authenticated
  USING (public.can_manage_content())
  WITH CHECK (public.can_manage_content());

-- Podcast Episodes RLS: Public reads published episodes; staff manages all
CREATE POLICY public_read ON public.podcast_episodes
  FOR SELECT TO anon, authenticated
  USING (status = 'published' OR (auth.role() = 'authenticated' AND public.can_manage_content()));

CREATE POLICY content_manage ON public.podcast_episodes
  FOR ALL TO authenticated
  USING (public.can_manage_content())
  WITH CHECK (public.can_manage_content());

-- Podcast Transcripts RLS: Public reads published transcripts; staff manages all
CREATE POLICY public_read ON public.podcast_transcripts
  FOR SELECT TO anon, authenticated
  USING (status = 'published' OR (auth.role() = 'authenticated' AND public.can_manage_content()));

CREATE POLICY content_manage ON public.podcast_transcripts
  FOR ALL TO authenticated
  USING (public.can_manage_content())
  WITH CHECK (public.can_manage_content());

-- Podcast Analytics Events RLS: Public inserts telemetry; staff reads and manages
CREATE POLICY public_insert ON public.podcast_analytics_events
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY admin_manage ON public.podcast_analytics_events
  FOR ALL TO authenticated
  USING (public.can_manage_content() OR public.is_admin())
  WITH CHECK (public.can_manage_content() OR public.is_admin());

-- 6. Explicit Role Permissions (GRANTs)
GRANT SELECT ON TABLE public.podcasts TO anon;
GRANT ALL ON TABLE public.podcasts TO authenticated, service_role;

GRANT SELECT ON TABLE public.podcast_episodes TO anon;
GRANT ALL ON TABLE public.podcast_episodes TO authenticated, service_role;

GRANT SELECT ON TABLE public.podcast_transcripts TO anon;
GRANT ALL ON TABLE public.podcast_transcripts TO authenticated, service_role;

GRANT INSERT ON TABLE public.podcast_analytics_events TO anon;
GRANT ALL ON TABLE public.podcast_analytics_events TO authenticated, service_role;

-- 7. Storage Bucket Provisioning: podcast-media
-- Purpose: Stores podcast audio (MP3, WAV, M4A, OGG, AAC, WebM), video (MP4, WebM),
--          and podcast artwork (cover, banner, logo in JPG, PNG, WebP).
-- Folder structure:
--   podcasts/{podcast_id}/branding/{asset_type}_{timestamp}.{ext}
--   podcasts/{podcast_id}/episodes/{episode_id}/audio/{filename}
--   podcasts/{podcast_id}/episodes/{episode_id}/video/{filename}
--   podcasts/{podcast_id}/episodes/{episode_id}/cover/{filename}
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'storage'
      AND table_name = 'buckets'
  ) THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'podcast-media',
      'podcast-media',
      true,
      524288000, -- 500 MB max per media object
      ARRAY[
        'audio/mpeg',
        'audio/mp3',
        'audio/mp4',
        'audio/x-m4a',
        'audio/aac',
        'audio/wav',
        'audio/x-wav',
        'audio/ogg',
        'audio/webm',
        'video/mp4',
        'video/webm',
        'video/ogg',
        'image/jpeg',
        'image/png',
        'image/webp'
      ]
    )
    ON CONFLICT (id) DO UPDATE
    SET public = EXCLUDED.public,
        file_size_limit = EXCLUDED.file_size_limit,
        allowed_mime_types = EXCLUDED.allowed_mime_types;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'storage'
      AND table_name = 'objects'
  ) THEN
    DROP POLICY IF EXISTS podcast_media_public_read ON storage.objects;
    DROP POLICY IF EXISTS podcast_media_staff_insert ON storage.objects;
    DROP POLICY IF EXISTS podcast_media_staff_update ON storage.objects;
    DROP POLICY IF EXISTS podcast_media_staff_delete ON storage.objects;

    CREATE POLICY podcast_media_public_read ON storage.objects
      FOR SELECT TO anon, authenticated
      USING (bucket_id = 'podcast-media');

    CREATE POLICY podcast_media_staff_insert ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'podcast-media' AND public.can_manage_content());

    CREATE POLICY podcast_media_staff_update ON storage.objects
      FOR UPDATE TO authenticated
      USING (bucket_id = 'podcast-media' AND public.can_manage_content())
      WITH CHECK (bucket_id = 'podcast-media' AND public.can_manage_content());

    CREATE POLICY podcast_media_staff_delete ON storage.objects
      FOR DELETE TO authenticated
      USING (bucket_id = 'podcast-media' AND public.can_manage_content());
  END IF;
END $$;

-- 8. Supabase Realtime Publication
DO $$
DECLARE
  t text;
  podcast_realtime_tables text[] := ARRAY[
    'podcasts',
    'podcast_episodes',
    'podcast_transcripts'
  ];
BEGIN
  FOREACH t IN ARRAY podcast_realtime_tables LOOP
    EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL;', t);

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
