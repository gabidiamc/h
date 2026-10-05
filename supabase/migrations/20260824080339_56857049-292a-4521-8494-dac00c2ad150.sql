-- 1) Advertising tables
CREATE TABLE IF NOT EXISTS public.ad_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id text NOT NULL UNIQUE,
  provider text NOT NULL DEFAULT 'monetag',
  format text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  script_url text NOT NULL,
  allowed_routes text[] NOT NULL DEFAULT '{}',
  frequency_limit text,
  safety_status text NOT NULL DEFAULT 'pending',
  last_tested_at timestamptz,
  last_error text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ad_zones TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ad_zones TO authenticated;
GRANT ALL ON public.ad_zones TO service_role;
ALTER TABLE public.ad_zones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ad_zones_public_read ON public.ad_zones;
CREATE POLICY ad_zones_public_read ON public.ad_zones FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS ad_zones_admin_write ON public.ad_zones;
CREATE POLICY ad_zones_admin_write ON public.ad_zones FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
DROP TRIGGER IF EXISTS ad_zones_updated_at ON public.ad_zones;
CREATE TRIGGER ad_zones_updated_at BEFORE UPDATE ON public.ad_zones
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.ad_placement_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id text NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('load_requested','script_loaded','script_error','placement_rendered','consent_accepted','consent_rejected')),
  route_category text,
  detail text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.ad_placement_events TO anon, authenticated;
GRANT SELECT ON public.ad_placement_events TO authenticated;
GRANT ALL ON public.ad_placement_events TO service_role;
ALTER TABLE public.ad_placement_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ad_events_public_insert ON public.ad_placement_events;
CREATE POLICY ad_events_public_insert ON public.ad_placement_events FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS ad_events_staff_read ON public.ad_placement_events;
CREATE POLICY ad_events_staff_read ON public.ad_placement_events FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

CREATE TABLE IF NOT EXISTS public.inappropriate_ad_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id text,
  page_path text,
  reason text NOT NULL,
  screenshot_url text,
  review_status text NOT NULL DEFAULT 'pending',
  reported_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.inappropriate_ad_reports TO authenticated;
GRANT ALL ON public.inappropriate_ad_reports TO service_role;
ALTER TABLE public.inappropriate_ad_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ad_reports_staff_read ON public.inappropriate_ad_reports;
CREATE POLICY ad_reports_staff_read ON public.inappropriate_ad_reports FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS ad_reports_staff_insert ON public.inappropriate_ad_reports;
CREATE POLICY ad_reports_staff_insert ON public.inappropriate_ad_reports FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS ad_reports_admin_update ON public.inappropriate_ad_reports;
CREATE POLICY ad_reports_admin_update ON public.inappropriate_ad_reports FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
DROP TRIGGER IF EXISTS ad_reports_updated_at ON public.inappropriate_ad_reports;
CREATE TRIGGER ad_reports_updated_at BEFORE UPDATE ON public.inappropriate_ad_reports
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.monetag_stats_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id text,
  stat_date date NOT NULL,
  impressions bigint NOT NULL DEFAULT 0,
  revenue numeric NOT NULL DEFAULT 0,
  cpm numeric,
  source text NOT NULL DEFAULT 'monetag_csv',
  imported_by uuid,
  imported_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.monetag_stats_imports TO authenticated;
GRANT ALL ON public.monetag_stats_imports TO service_role;
ALTER TABLE public.monetag_stats_imports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS monetag_stats_staff_read ON public.monetag_stats_imports;
CREATE POLICY monetag_stats_staff_read ON public.monetag_stats_imports FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS monetag_stats_admin_write ON public.monetag_stats_imports;
CREATE POLICY monetag_stats_admin_write ON public.monetag_stats_imports FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- 2) Security: only admins may write roles or invitations
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname, tablename FROM pg_policies
    WHERE schemaname='public' AND tablename IN ('user_roles','admin_invitations')
      AND cmd IN ('INSERT','UPDATE','DELETE','ALL')
  LOOP
    EXECUTE format('DROP POLICY %I ON public.%I', p.policyname, p.tablename);
  END LOOP;
END $$;

CREATE POLICY user_roles_admin_insert ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY user_roles_admin_update ON public.user_roles FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY user_roles_admin_delete ON public.user_roles FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY admin_invitations_admin_insert ON public.admin_invitations FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY admin_invitations_admin_update ON public.admin_invitations FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY admin_invitations_admin_delete ON public.admin_invitations FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));