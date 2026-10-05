INSERT INTO public.help_settings (id, setting_key, setting_value)
VALUES
  (gen_random_uuid(),'PUBLIC_REVIEW_ENABLED','true'),
  (gen_random_uuid(),'PUBLIC_REVIEW_PROVIDER','trustpilot'),
  (gen_random_uuid(),'PUBLIC_REVIEW_URL','https://www.trustpilot.com/evaluate/familiasdmps.app'),
  (gen_random_uuid(),'PUBLIC_REVIEW_VERIFIED_AT', now()::text)
ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value;