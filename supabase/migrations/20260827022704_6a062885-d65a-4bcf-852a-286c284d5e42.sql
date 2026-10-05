DROP TABLE IF EXISTS public.monetag_stats_imports CASCADE;
DROP TABLE IF EXISTS public.inappropriate_ad_reports CASCADE;
DROP TABLE IF EXISTS public.ad_placement_events CASCADE;
DROP TABLE IF EXISTS public.ad_zones CASCADE;
DROP TABLE IF EXISTS public.advertising_settings_audit CASCADE;
DELETE FROM public.site_settings WHERE key = 'ads_enabled';