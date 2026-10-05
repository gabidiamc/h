-- 1. Advertising audit log
CREATE TABLE IF NOT EXISTS public.advertising_settings_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  previous_state boolean,
  new_state boolean NOT NULL,
  changed_by uuid,
  changed_at timestamptz NOT NULL DEFAULT now(),
  reason text
);

GRANT SELECT, INSERT ON public.advertising_settings_audit TO authenticated;
GRANT ALL ON public.advertising_settings_audit TO service_role;

ALTER TABLE public.advertising_settings_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ads_audit_staff_read" ON public.advertising_settings_audit;
CREATE POLICY "ads_audit_staff_read" ON public.advertising_settings_audit
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "ads_audit_staff_insert" ON public.advertising_settings_audit;
CREATE POLICY "ads_audit_staff_insert" ON public.advertising_settings_audit
  FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()) AND changed_by = auth.uid());

-- 2. Close the privilege-escalation hole: no client-side self-assignment of roles.
DROP POLICY IF EXISTS "user_roles_self_bootstrap" ON public.user_roles;