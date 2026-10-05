-- ==============================================================================
-- MIGRATION: 20261005000000_branding_identity_v1.sql
-- Independent Visual Identity System for DMPS INFO:
-- 1. Application Logo (internal app logo)
-- 2. Website Favicon (browser tabs)
-- 3. PWA Icon (progressive web app icon & apple-touch-icon)
-- ==============================================================================

-- 1. Extend public.appearance_settings with independent asset columns & versioning
ALTER TABLE public.appearance_settings ADD COLUMN IF NOT EXISTS pwa_icon_url text;
ALTER TABLE public.appearance_settings ADD COLUMN IF NOT EXISTS application_logo_storage_path text;
ALTER TABLE public.appearance_settings ADD COLUMN IF NOT EXISTS favicon_storage_path text;
ALTER TABLE public.appearance_settings ADD COLUMN IF NOT EXISTS pwa_icon_storage_path text;
ALTER TABLE public.appearance_settings ADD COLUMN IF NOT EXISTS branding_version text DEFAULT '1';

-- 2. Create branding-assets storage bucket if storage schema exists
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
      'branding-assets',
      'branding-assets',
      true,
      20971520, -- 20 MB max per branding asset
      ARRAY[
        'image/png',
        'image/jpeg',
        'image/jpg',
        'image/webp',
        'image/svg+xml',
        'image/x-icon',
        'image/vnd.microsoft.icon'
      ]
    )
    ON CONFLICT (id) DO UPDATE SET
      public = true,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;
  END IF;
END $$;

-- 3. Storage policies for branding-assets
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'storage'
      AND table_name = 'objects'
  ) THEN
    DROP POLICY IF EXISTS branding_assets_public_read ON storage.objects;
    DROP POLICY IF EXISTS branding_assets_staff_insert ON storage.objects;
    DROP POLICY IF EXISTS branding_assets_staff_update ON storage.objects;
    DROP POLICY IF EXISTS branding_assets_staff_delete ON storage.objects;

    -- Public read access for branding assets
    CREATE POLICY branding_assets_public_read ON storage.objects
      FOR SELECT TO anon, authenticated
      USING (bucket_id = 'branding-assets');

    -- Only authorized staff can insert, update, or delete branding assets
    CREATE POLICY branding_assets_staff_insert ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'branding-assets' AND public.can_manage_content());

    CREATE POLICY branding_assets_staff_update ON storage.objects
      FOR UPDATE TO authenticated
      USING (bucket_id = 'branding-assets' AND public.can_manage_content())
      WITH CHECK (bucket_id = 'branding-assets' AND public.can_manage_content());

    CREATE POLICY branding_assets_staff_delete ON storage.objects
      FOR DELETE TO authenticated
      USING (bucket_id = 'branding-assets' AND public.can_manage_content());
  END IF;
END $$;
