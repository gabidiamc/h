-- Roles
CREATE TYPE public.app_role AS ENUM ('admin','customer');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins read all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Customer / owner profiles
CREATE TABLE public.app_users (
  id uuid PRIMARY KEY,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.app_users TO authenticated;
GRANT ALL ON public.app_users TO service_role;
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own profile read" ON public.app_users FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Admins read profiles" ON public.app_users FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Own profile insert" ON public.app_users FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Own profile update" ON public.app_users FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "Admins update profiles" ON public.app_users FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- The first account created becomes the shop owner
CREATE OR REPLACE FUNCTION public.bootstrap_first_admin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER app_users_bootstrap_role AFTER INSERT ON public.app_users
FOR EACH ROW EXECUTE FUNCTION public.bootstrap_first_admin();

-- Publicly readable document tables, owner-writable
DO $do$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['site_config','products','important_dates','blocked_dates','gallery','reviews','loyalty_tiers','coupons']
  LOOP
    EXECUTE format('CREATE TABLE public.%I (id text PRIMARY KEY, data jsonb NOT NULL DEFAULT ''{}''::jsonb, updated_at timestamptz NOT NULL DEFAULT now())', t);
    EXECUTE format('GRANT SELECT ON public.%I TO anon, authenticated', t);
    EXECUTE format('GRANT INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "Public read" ON public.%I FOR SELECT TO anon, authenticated USING (true)', t);
    EXECUTE format('CREATE POLICY "Admins write" ON public.%I FOR ALL TO authenticated USING (public.has_role(auth.uid(),''admin'')) WITH CHECK (public.has_role(auth.uid(),''admin''))', t);
  END LOOP;
END
$do$;

CREATE POLICY "Customers add reviews" ON public.reviews FOR INSERT TO authenticated WITH CHECK (true);

-- Customer-owned document tables
DO $do$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['orders','custom_requests','chat_conversations','loyalty_transactions']
  LOOP
    EXECUTE format('CREATE TABLE public.%I (id text PRIMARY KEY, owner_id uuid, data jsonb NOT NULL DEFAULT ''{}''::jsonb, updated_at timestamptz NOT NULL DEFAULT now())', t);
    EXECUTE format('CREATE INDEX %I ON public.%I (owner_id)', t || '_owner_idx', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "Owner reads own" ON public.%I FOR SELECT TO authenticated USING (owner_id = auth.uid())', t);
    EXECUTE format('CREATE POLICY "Admins read all" ON public.%I FOR SELECT TO authenticated USING (public.has_role(auth.uid(),''admin''))', t);
    EXECUTE format('CREATE POLICY "Owner inserts own" ON public.%I FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid())', t);
    EXECUTE format('CREATE POLICY "Owner updates own" ON public.%I FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid())', t);
    EXECUTE format('CREATE POLICY "Admins write all" ON public.%I FOR ALL TO authenticated USING (public.has_role(auth.uid(),''admin'')) WITH CHECK (public.has_role(auth.uid(),''admin''))', t);
  END LOOP;
END
$do$;

CREATE TABLE public.gift_cards (
  id text PRIMARY KEY,
  owner_id uuid,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gift_cards TO authenticated;
GRANT ALL ON public.gift_cards TO service_role;
ALTER TABLE public.gift_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read gift cards" ON public.gift_cards FOR SELECT TO authenticated USING (true);
CREATE POLICY "Buyers create gift cards" ON public.gift_cards FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Owner updates own gift cards" ON public.gift_cards FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Admins write gift cards" ON public.gift_cards FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.site_config, public.products, public.orders,
  public.custom_requests, public.important_dates, public.blocked_dates, public.gallery, public.reviews,
  public.gift_cards, public.loyalty_tiers, public.coupons, public.chat_conversations, public.app_users,
  public.loyalty_transactions;