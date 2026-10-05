ALTER TABLE public.student_programs
  ADD COLUMN IF NOT EXISTS name_en text,
  ADD COLUMN IF NOT EXISTS description_en text,
  ADD COLUMN IF NOT EXISTS how_to_participate_en text,
  ADD COLUMN IF NOT EXISTS requirements_en text,
  ADD COLUMN IF NOT EXISTS cost_en text,
  ADD COLUMN IF NOT EXISTS audience_en text;