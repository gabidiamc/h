DROP POLICY IF EXISTS announcements_public_read ON public.announcements;
CREATE POLICY announcements_public_read ON public.announcements
FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS announcement_translations_public_read ON public.announcement_translations;
CREATE POLICY announcement_translations_public_read ON public.announcement_translations
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.announcements a
    WHERE a.id = announcement_translations.announcement_id
      AND a.status = 'published'
  )
);