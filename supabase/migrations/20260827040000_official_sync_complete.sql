-- Comprehensive, Reproducible Migration for Official Sources, Sync Engine, Change Proposals, Data Audit & Silver Cord Persistence
-- Non-destructive and idempotent.

-- 1. Extend or enhance official_sources table with honest status fields
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
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'official_sources' AND column_name = 'connection_status') THEN
    ALTER TABLE public.official_sources ADD COLUMN connection_status text DEFAULT 'connected_unverified';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'official_sources' AND column_name = 'integration_method') THEN
    ALTER TABLE public.official_sources ADD COLUMN integration_method text DEFAULT 'Página pública oficial (HTML)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'official_sources' AND column_name = 'endpoint_used') THEN
    ALTER TABLE public.official_sources ADD COLUMN endpoint_used text;
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
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'official_sources' AND column_name = 'last_attempt_at') THEN
    ALTER TABLE public.official_sources ADD COLUMN last_attempt_at timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'official_sources' AND column_name = 'next_run_at') THEN
    ALTER TABLE public.official_sources ADD COLUMN next_run_at timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'official_sources' AND column_name = 'last_http_status') THEN
    ALTER TABLE public.official_sources ADD COLUMN last_http_status integer;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'official_sources' AND column_name = 'last_records_received') THEN
    ALTER TABLE public.official_sources ADD COLUMN last_records_received integer DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'official_sources' AND column_name = 'last_records_valid') THEN
    ALTER TABLE public.official_sources ADD COLUMN last_records_valid integer DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'official_sources' AND column_name = 'last_records_rejected') THEN
    ALTER TABLE public.official_sources ADD COLUMN last_records_rejected integer DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'official_sources' AND column_name = 'consecutive_failures') THEN
    ALTER TABLE public.official_sources ADD COLUMN consecutive_failures integer DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'official_sources' AND column_name = 'running_lock') THEN
    ALTER TABLE public.official_sources ADD COLUMN running_lock timestamptz;
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

-- 2. source_sync_runs
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
  parser_version text DEFAULT '2.0.0',
  triggered_by text DEFAULT 'system',
  created_at timestamptz DEFAULT now()
);

-- 3. official_content_items
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

-- 4. source_change_proposals
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

-- 5. official_data_audit
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
  parser_version text DEFAULT '2.0.0'
);

-- 6. Silver Cord User-Scoped Persistence Tables
CREATE TABLE IF NOT EXISTS public.silver_cord_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  records_count integer NOT NULL DEFAULT 0,
  total_minutes integer NOT NULL DEFAULT 0,
  import_source text NOT NULL DEFAULT 'pasted_text',
  imported_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.silver_cord_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  import_id uuid REFERENCES public.silver_cord_imports(id) ON DELETE SET NULL,
  service_date date NOT NULL,
  recorded_time text,
  total_minutes integer NOT NULL DEFAULT 0,
  grade text NOT NULL DEFAULT 'Unknown',
  school_year text NOT NULL DEFAULT '2026-2027',
  location_name text NOT NULL,
  activity_description text NOT NULL,
  supervisor_name text,
  source_fingerprint text NOT NULL,
  import_status text NOT NULL DEFAULT 'confirmed',
  needs_review boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_silver_cord_user_fingerprint UNIQUE (user_id, source_fingerprint)
);

CREATE TABLE IF NOT EXISTS public.silver_cord_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text DEFAULT 'community',
  address text,
  is_official_partner boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.silver_cord_import_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  import_id uuid REFERENCES public.silver_cord_imports(id) ON DELETE CASCADE,
  line_index integer,
  error_type text NOT NULL,
  error_message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 7. High-Performance Indexes
CREATE INDEX IF NOT EXISTS idx_sync_runs_source_id ON public.source_sync_runs(source_id);
CREATE INDEX IF NOT EXISTS idx_sync_runs_status ON public.source_sync_runs(status);
CREATE INDEX IF NOT EXISTS idx_content_items_source ON public.official_content_items(source_id);
CREATE INDEX IF NOT EXISTS idx_content_items_type ON public.official_content_items(content_type);
CREATE INDEX IF NOT EXISTS idx_content_items_pub_status ON public.official_content_items(publication_status);
CREATE INDEX IF NOT EXISTS idx_change_proposals_status ON public.source_change_proposals(review_status);
CREATE INDEX IF NOT EXISTS idx_change_proposals_source ON public.source_change_proposals(source_id);
CREATE INDEX IF NOT EXISTS idx_data_audit_source ON public.official_data_audit(source_id);
CREATE INDEX IF NOT EXISTS idx_data_audit_time ON public.official_data_audit(performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_official_sources_conn_status ON public.official_sources(connection_status);
CREATE INDEX IF NOT EXISTS idx_official_sources_next_run ON public.official_sources(next_run_at);
CREATE INDEX IF NOT EXISTS idx_silver_cord_records_user_id ON public.silver_cord_records(user_id);
CREATE INDEX IF NOT EXISTS idx_silver_cord_records_date ON public.silver_cord_records(service_date DESC);
CREATE INDEX IF NOT EXISTS idx_silver_cord_imports_user_id ON public.silver_cord_imports(user_id);

-- 8. Enable RLS and Configure Strict Security Policies
ALTER TABLE public.official_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.source_sync_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.official_content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.source_change_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.official_data_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.silver_cord_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.silver_cord_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.silver_cord_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.silver_cord_import_errors ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT SELECT ON public.official_sources TO anon, authenticated;
GRANT SELECT ON public.official_content_items TO anon, authenticated;
GRANT ALL ON public.official_sources TO authenticated;
GRANT ALL ON public.source_sync_runs TO authenticated;
GRANT ALL ON public.official_content_items TO authenticated;
GRANT ALL ON public.source_change_proposals TO authenticated;
GRANT ALL ON public.official_data_audit TO authenticated;
GRANT ALL ON public.silver_cord_imports TO authenticated;
GRANT ALL ON public.silver_cord_records TO authenticated;
GRANT ALL ON public.silver_cord_locations TO authenticated;
GRANT ALL ON public.silver_cord_import_errors TO authenticated;

-- Policies for official_sources & content
DROP POLICY IF EXISTS "Public read published content items" ON public.official_content_items;
CREATE POLICY "Public read published content items" 
  ON public.official_content_items FOR SELECT 
  USING (publication_status = 'published');

DROP POLICY IF EXISTS "Public read official sources" ON public.official_sources;
CREATE POLICY "Public read official sources" 
  ON public.official_sources FOR SELECT 
  USING (is_verified = true OR is_enabled = true);

DROP POLICY IF EXISTS "Staff manage official sources" ON public.official_sources;
CREATE POLICY "Staff manage official sources" 
  ON public.official_sources FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Staff view sync runs" ON public.source_sync_runs;
CREATE POLICY "Staff view sync runs" 
  ON public.source_sync_runs FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Staff manage content items" ON public.official_content_items;
CREATE POLICY "Staff manage content items" 
  ON public.official_content_items FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Staff manage change proposals" ON public.source_change_proposals;
CREATE POLICY "Staff manage change proposals" 
  ON public.source_change_proposals FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Staff view data audit" ON public.official_data_audit;
CREATE POLICY "Staff view data audit" 
  ON public.official_data_audit FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()));

-- Strict Student User-Scoped Policies for Silver Cord
DROP POLICY IF EXISTS "Student read own silver cord records" ON public.silver_cord_records;
CREATE POLICY "Student read own silver cord records"
  ON public.silver_cord_records FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Student insert own silver cord records" ON public.silver_cord_records;
CREATE POLICY "Student insert own silver cord records"
  ON public.silver_cord_records FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Student update own silver cord records" ON public.silver_cord_records;
CREATE POLICY "Student update own silver cord records"
  ON public.silver_cord_records FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Student delete own silver cord records" ON public.silver_cord_records;
CREATE POLICY "Student delete own silver cord records"
  ON public.silver_cord_records FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Student read own silver cord imports" ON public.silver_cord_imports;
CREATE POLICY "Student read own silver cord imports"
  ON public.silver_cord_imports FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Student insert own silver cord imports" ON public.silver_cord_imports;
CREATE POLICY "Student insert own silver cord imports"
  ON public.silver_cord_imports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Student read own silver cord errors" ON public.silver_cord_import_errors;
CREATE POLICY "Student read own silver cord errors"
  ON public.silver_cord_import_errors FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Student insert own silver cord errors" ON public.silver_cord_import_errors;
CREATE POLICY "Student insert own silver cord errors"
  ON public.silver_cord_import_errors FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
