-- Safe read-only diagnostic for the DMPS INFO runtime schema.
-- Run in Supabase SQL Editor. This does not modify data.
SELECT
  table_name,
  to_regclass(format('public.%I', table_name)) IS NOT NULL AS exists
FROM (VALUES
  ('appearance_settings'),
  ('site_settings'),
  ('articles'),
  ('article_translations'),
  ('categories'),
  ('category_translations'),
  ('schools'),
  ('school_translations'),
  ('contacts'),
  ('resources'),
  ('events'),
  ('activities'),
  ('faqs'),
  ('programs'),
  ('user_roles')
) AS required(table_name)
ORDER BY table_name;
