-- Sorteos & Descuentos (Giveaways & Discounts Schema)

-- 1. Giveaways Table
CREATE TABLE IF NOT EXISTS public.giveaways (
  id text PRIMARY KEY,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.giveaways TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.giveaways TO authenticated;
GRANT ALL ON public.giveaways TO service_role;
ALTER TABLE public.giveaways ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read giveaways" ON public.giveaways FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage giveaways" ON public.giveaways FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- 2. Giveaway Entries Table
CREATE TABLE IF NOT EXISTS public.giveaway_entries (
  id text PRIMARY KEY,
  owner_id uuid,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS giveaway_entries_owner_idx ON public.giveaway_entries (owner_id);
GRANT SELECT, INSERT ON public.giveaway_entries TO authenticated;
GRANT SELECT ON public.giveaway_entries TO anon;
GRANT ALL ON public.giveaway_entries TO service_role;
ALTER TABLE public.giveaway_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read giveaway entries" ON public.giveaway_entries FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Customers insert own entry" ON public.giveaway_entries FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Admins manage giveaway entries" ON public.giveaway_entries FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- 3. Giveaway Winners Table
CREATE TABLE IF NOT EXISTS public.giveaway_winners (
  id text PRIMARY KEY,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.giveaway_winners TO anon, authenticated;
GRANT ALL ON public.giveaway_winners TO service_role;
ALTER TABLE public.giveaway_winners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read giveaway winners" ON public.giveaway_winners FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage giveaway winners" ON public.giveaway_winners FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- 4. Discounts Table
CREATE TABLE IF NOT EXISTS public.discounts (
  id text PRIMARY KEY,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.discounts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.discounts TO authenticated;
GRANT ALL ON public.discounts TO service_role;
ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read discounts" ON public.discounts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage discounts" ON public.discounts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Realtime publication replica identity
ALTER TABLE public.giveaways REPLICA IDENTITY FULL;
ALTER TABLE public.giveaway_entries REPLICA IDENTITY FULL;
ALTER TABLE public.giveaway_winners REPLICA IDENTITY FULL;
ALTER TABLE public.discounts REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.giveaways, public.giveaway_entries, public.giveaway_winners, public.discounts;
