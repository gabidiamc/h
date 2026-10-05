-- ==============================================================================
-- DMPS Family Info: Consolidated Idempotent Migration for Official Sources & Sync Engine
-- Safe to execute repeatedly in Supabase SQL Editor. Non-destructive.
-- ==============================================================================

-- 1. Create official_sources table if it does not exist
CREATE TABLE IF NOT EXISTS public.official_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  official_url text NOT NULL,
  source_type text NOT NULL DEFAULT 'public_html',
  integration_method text NOT NULL DEFAULT 'web_parser',
  status text NOT NULL DEFAULT 'idle',
  connection_status text NOT NULL DEFAULT 'connected_unverified',
  automation_mode text NOT NULL DEFAULT 'semi_automatic',
  organization text DEFAULT 'Des Moines Public Schools',
  category text DEFAULT 'district',
  school_id text DEFAULT 'lincoln',
  connector_id text,
  connector_key text,
  api_url text,
  feed_url text,
  endpoint_used text,
  allowed_domains text[] DEFAULT ARRAY['dmschools.org', 'lincoln.dmschools.org', 'east.dmschools.org', 'ridedart.com', 'gobound.com', 'nutrislice.com'],
  update_frequency_minutes integer DEFAULT 360,
  requires_review boolean DEFAULT true,
  priority integer DEFAULT 3,
  is_enabled boolean DEFAULT true,
  terms_status text DEFAULT 'public_verified',
  credentials_reference text,
  last_checked_at timestamptz,
  last_success_at timestamptz,
  last_attempt_at timestamptz,
  next_run_at timestamptz,
  last_http_status integer,
  last_records_received integer DEFAULT 0,
  last_records_valid integer DEFAULT 0,
  last_records_rejected integer DEFAULT 0,
  consecutive_failures integer DEFAULT 0,
  running_lock text,
  last_error text,
  items_count integer DEFAULT 0,
  content_hash text,
  notes text,
  is_verified boolean DEFAULT false,
  approved_at timestamptz,
  approved_by text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Ensure all required columns exist on official_sources
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'official_sources' AND column_name = 'organization') THEN
    ALTER TABLE public.official_sources ADD COLUMN organization text DEFAULT 'Des Moines Public Schools';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'official_sources' AND column_name = 'category') THEN
    ALTER TABLE public.official_sources ADD COLUMN category text DEFAULT 'district';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'official_sources' AND column_name = 'school_id') THEN
    ALTER TABLE public.official_sources ADD COLUMN school_id text DEFAULT 'lincoln';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'official_sources' AND column_name = 'connector_id') THEN
    ALTER TABLE public.official_sources ADD COLUMN connector_id text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'official_sources' AND column_name = 'connector_key') THEN
    ALTER TABLE public.official_sources ADD COLUMN connector_key text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'official_sources' AND column_name = 'api_url') THEN
    ALTER TABLE public.official_sources ADD COLUMN api_url text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'official_sources' AND column_name = 'feed_url') THEN
    ALTER TABLE public.official_sources ADD COLUMN feed_url text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'official_sources' AND column_name = 'allowed_domains') THEN
    ALTER TABLE public.official_sources ADD COLUMN allowed_domains text[] DEFAULT ARRAY['dmschools.org', 'lincoln.dmschools.org', 'east.dmschools.org', 'ridedart.com', 'gobound.com', 'nutrislice.com'];
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'official_sources' AND column_name = 'automation_mode') THEN
    ALTER TABLE public.official_sources ADD COLUMN automation_mode text DEFAULT 'semi_automatic';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'official_sources' AND column_name = 'update_frequency_minutes') THEN
    ALTER TABLE public.official_sources ADD COLUMN update_frequency_minutes integer DEFAULT 360;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'official_sources' AND column_name = 'requires_review') THEN
    ALTER TABLE public.official_sources ADD COLUMN requires_review boolean DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'official_sources' AND column_name = 'priority') THEN
    ALTER TABLE public.official_sources ADD COLUMN priority integer DEFAULT 3;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'official_sources' AND column_name = 'is_enabled') THEN
    ALTER TABLE public.official_sources ADD COLUMN is_enabled boolean DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'official_sources' AND column_name = 'terms_status') THEN
    ALTER TABLE public.official_sources ADD COLUMN terms_status text DEFAULT 'public_verified';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'official_sources' AND column_name = 'credentials_reference') THEN
    ALTER TABLE public.official_sources ADD COLUMN credentials_reference text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'official_sources' AND column_name = 'last_success_at') THEN
    ALTER TABLE public.official_sources ADD COLUMN last_success_at timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'official_sources' AND column_name = 'next_run_at') THEN
    ALTER TABLE public.official_sources ADD COLUMN next_run_at timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'official_sources' AND column_name = 'status') THEN
    ALTER TABLE public.official_sources ADD COLUMN status text DEFAULT 'idle';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'official_sources' AND column_name = 'last_error') THEN
    ALTER TABLE public.official_sources ADD COLUMN last_error text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'official_sources' AND column_name = 'items_count') THEN
    ALTER TABLE public.official_sources ADD COLUMN items_count integer DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'official_sources' AND column_name = 'connection_status') THEN
    ALTER TABLE public.official_sources ADD COLUMN connection_status text DEFAULT 'connected_unverified';
  END IF;
END $$;

-- 2. Create source_sync_runs table
CREATE TABLE IF NOT EXISTS public.source_sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid REFERENCES public.official_sources(id) ON DELETE CASCADE,
  sync_type text NOT NULL DEFAULT 'scheduled',
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  status text NOT NULL DEFAULT 'running',
  http_status integer,
  items_received integer DEFAULT 0,
  items_created integer DEFAULT 0,
  items_updated integer DEFAULT 0,
  items_unchanged integer DEFAULT 0,
  items_flagged integer DEFAULT 0,
  items_archived integer DEFAULT 0,
  error_code text,
  error_summary text,
  response_hash text,
  parser_version text DEFAULT '1.0.0',
  triggered_by text DEFAULT 'system',
  created_at timestamptz DEFAULT now()
);

-- 3. Create official_content_items table
CREATE TABLE IF NOT EXISTS public.official_content_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid REFERENCES public.official_sources(id) ON DELETE SET NULL,
  external_id text NOT NULL,
  content_type text NOT NULL,
  school_id text DEFAULT 'lincoln',
  title text NOT NULL,
  summary text,
  body text,
  starts_at timestamptz,
  ends_at timestamptz,
  timezone text DEFAULT 'America/Chicago',
  location_name text,
  location_address text,
  status text DEFAULT 'active',
  official_url text NOT NULL,
  source_published_at timestamptz,
  source_updated_at timestamptz,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  verified_at timestamptz NOT NULL DEFAULT now(),
  publication_status text NOT NULL DEFAULT 'published',
  confidence_status text NOT NULL DEFAULT 'official_verified',
  content_hash text,
  raw_reference jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_external_content_per_source UNIQUE (source_id, external_id)
);

-- 4. Create source_change_proposals table
CREATE TABLE IF NOT EXISTS public.source_change_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid REFERENCES public.official_sources(id) ON DELETE CASCADE,
  sync_run_id uuid REFERENCES public.source_sync_runs(id) ON DELETE SET NULL,
  content_item_id uuid REFERENCES public.official_content_items(id) ON DELETE SET NULL,
  change_type text NOT NULL,
  field_name text NOT NULL,
  previous_value text,
  proposed_value text,
  detected_at timestamptz NOT NULL DEFAULT now(),
  risk_level text NOT NULL DEFAULT 'low',
  requires_review boolean DEFAULT true,
  review_status text NOT NULL DEFAULT 'pending',
  reviewed_by text,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz DEFAULT now()
);

-- 5. Create official_data_audit table
CREATE TABLE IF NOT EXISTS public.official_data_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid REFERENCES public.official_sources(id) ON DELETE SET NULL,
  sync_run_id uuid REFERENCES public.source_sync_runs(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  previous_state jsonb,
  new_state jsonb,
  performed_by text NOT NULL DEFAULT 'system',
  performed_at timestamptz NOT NULL DEFAULT now(),
  reason text,
  parser_version text DEFAULT '1.0.0'
);

-- 6. Configure Row Level Security (RLS) safely
ALTER TABLE public.official_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.source_sync_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.official_content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.source_change_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.official_data_audit ENABLE ROW LEVEL SECURITY;

-- Helper role check subquery: (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('super_admin', 'admin', 'administrator', 'staff', 'content_admin', 'calendar_admin')))

-- Policies for official_sources
DROP POLICY IF EXISTS "Public can view official sources" ON public.official_sources;
CREATE POLICY "Public can view official sources"
  ON public.official_sources FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Staff can manage official sources" ON public.official_sources;
CREATE POLICY "Staff can manage official sources"
  ON public.official_sources FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('super_admin', 'admin', 'administrator', 'staff', 'content_admin', 'calendar_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('super_admin', 'admin', 'administrator', 'staff', 'content_admin', 'calendar_admin')));

-- Policies for source_sync_runs
DROP POLICY IF EXISTS "Staff can view sync runs" ON public.source_sync_runs;
CREATE POLICY "Staff can view sync runs"
  ON public.source_sync_runs FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('super_admin', 'admin', 'administrator', 'staff', 'content_admin', 'calendar_admin')));

DROP POLICY IF EXISTS "Staff can manage sync runs" ON public.source_sync_runs;
CREATE POLICY "Staff can manage sync runs"
  ON public.source_sync_runs FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('super_admin', 'admin', 'administrator', 'staff', 'content_admin', 'calendar_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('super_admin', 'admin', 'administrator', 'staff', 'content_admin', 'calendar_admin')));

-- Policies for official_content_items
DROP POLICY IF EXISTS "Public can view published official content" ON public.official_content_items;
CREATE POLICY "Public can view published official content"
  ON public.official_content_items FOR SELECT
  USING (publication_status = 'published');

DROP POLICY IF EXISTS "Staff can view all official content items" ON public.official_content_items;
CREATE POLICY "Staff can view all official content items"
  ON public.official_content_items FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('super_admin', 'admin', 'administrator', 'staff', 'content_admin', 'calendar_admin')));

DROP POLICY IF EXISTS "Staff can manage official content items" ON public.official_content_items;
CREATE POLICY "Staff can manage official content items"
  ON public.official_content_items FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('super_admin', 'admin', 'administrator', 'staff', 'content_admin', 'calendar_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('super_admin', 'admin', 'administrator', 'staff', 'content_admin', 'calendar_admin')));

-- Policies for source_change_proposals
DROP POLICY IF EXISTS "Staff can view change proposals" ON public.source_change_proposals;
CREATE POLICY "Staff can view change proposals"
  ON public.source_change_proposals FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('super_admin', 'admin', 'administrator', 'staff', 'content_admin', 'calendar_admin')));

DROP POLICY IF EXISTS "Staff can manage change proposals" ON public.source_change_proposals;
CREATE POLICY "Staff can manage change proposals"
  ON public.source_change_proposals FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('super_admin', 'admin', 'administrator', 'staff', 'content_admin', 'calendar_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('super_admin', 'admin', 'administrator', 'staff', 'content_admin', 'calendar_admin')));

-- Policies for official_data_audit
DROP POLICY IF EXISTS "Staff can view audit logs" ON public.official_data_audit;
CREATE POLICY "Staff can view audit logs"
  ON public.official_data_audit FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('super_admin', 'admin', 'administrator', 'staff', 'content_admin', 'calendar_admin')));

-- 7. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_official_sources_school ON public.official_sources(school_id);
CREATE INDEX IF NOT EXISTS idx_official_sources_status ON public.official_sources(status);
CREATE INDEX IF NOT EXISTS idx_official_sources_connector ON public.official_sources(connector_id);
CREATE INDEX IF NOT EXISTS idx_sync_runs_source ON public.source_sync_runs(source_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_items_lookup ON public.official_content_items(school_id, content_type, publication_status);
CREATE INDEX IF NOT EXISTS idx_content_items_dates ON public.official_content_items(starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_change_proposals_pending ON public.source_change_proposals(source_id, review_status);
