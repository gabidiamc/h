-- Infrastructure for Official Sources, Sync Engine, Change Proposals, and Data Audit
-- Non-destructive: alters or creates tables if not exists, preserves all existing tables and data.

-- 1. Extend or enhance official_sources table
DO $$ 
BEGIN
  -- Add new columns to official_sources if they do not exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'official_sources' AND column_name = 'organization') THEN
    ALTER TABLE public.official_sources ADD COLUMN organization text DEFAULT 'Des Moines Public Schools';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'official_sources' AND column_name = 'category') THEN
    ALTER TABLE public.official_sources ADD COLUMN category text DEFAULT 'district';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'official_sources' AND column_name = 'school_id') THEN
    ALTER TABLE public.official_sources ADD COLUMN school_id text DEFAULT 'lincoln';
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

-- 3. Create official_content_items table (Unified normalized store)
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
  status text DEFAULT 'scheduled',
  official_url text NOT NULL,
  source_published_at timestamptz,
  source_updated_at timestamptz,
  first_seen_at timestamptz DEFAULT now(),
  last_seen_at timestamptz DEFAULT now(),
  verified_at timestamptz DEFAULT now(),
  publication_status text NOT NULL DEFAULT 'published',
  confidence_status text NOT NULL DEFAULT 'official_verified',
  content_hash text,
  raw_reference jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT uq_official_content_source_ext UNIQUE (source_id, external_id)
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
  requires_review boolean NOT NULL DEFAULT true,
  review_status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
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

-- 6. Indexes for high performance querying
CREATE INDEX IF NOT EXISTS idx_sync_runs_source_id ON public.source_sync_runs(source_id);
CREATE INDEX IF NOT EXISTS idx_sync_runs_status ON public.source_sync_runs(status);
CREATE INDEX IF NOT EXISTS idx_content_items_source ON public.official_content_items(source_id);
CREATE INDEX IF NOT EXISTS idx_content_items_type ON public.official_content_items(content_type);
CREATE INDEX IF NOT EXISTS idx_content_items_pub_status ON public.official_content_items(publication_status);
CREATE INDEX IF NOT EXISTS idx_change_proposals_status ON public.source_change_proposals(review_status);
CREATE INDEX IF NOT EXISTS idx_change_proposals_source ON public.source_change_proposals(source_id);
CREATE INDEX IF NOT EXISTS idx_data_audit_source ON public.official_data_audit(source_id);
CREATE INDEX IF NOT EXISTS idx_data_audit_time ON public.official_data_audit(performed_at DESC);

-- 7. Enable RLS and setup policies
ALTER TABLE public.official_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.source_sync_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.official_content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.source_change_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.official_data_audit ENABLE ROW LEVEL SECURITY;

-- Public can read verified official_sources and published official_content_items
CREATE POLICY IF NOT EXISTS "Public read published content items" 
  ON public.official_content_items FOR SELECT 
  USING (publication_status = 'published');

CREATE POLICY IF NOT EXISTS "Public read official sources" 
  ON public.official_sources FOR SELECT 
  USING (is_verified = true OR is_enabled = true);

-- Staff with roles can read & write all sync runs, proposals, audit, and sources
CREATE POLICY IF NOT EXISTS "Staff manage official sources" 
  ON public.official_sources FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()));

CREATE POLICY IF NOT EXISTS "Staff view sync runs" 
  ON public.source_sync_runs FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()));

CREATE POLICY IF NOT EXISTS "Staff manage content items" 
  ON public.official_content_items FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()));

CREATE POLICY IF NOT EXISTS "Staff manage change proposals" 
  ON public.source_change_proposals FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()));

CREATE POLICY IF NOT EXISTS "Staff view data audit" 
  ON public.official_data_audit FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()));
