-- ============================================================================
-- DMPS Info: Función de Base de Datos y Disparadores para Control de Vigencia
-- Zona Horaria Oficial: America/Chicago (Des Moines, Iowa)
-- Desactiva y archiva automáticamente recursos cuando su fecha de vigencia vence.
-- ============================================================================

-- 1. Función Principal para Desactivar Registros Vencidos y Publicar Programados
CREATE OR REPLACE FUNCTION public.fn_update_content_statuses()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_now_chicago timestamp with time zone := timezone('America/Chicago', now());
  v_today_chicago date := (v_now_chicago)::date;
  v_events_updated integer := 0;
  v_announcements_updated integer := 0;
  v_activities_updated integer := 0;
  v_programs_updated integer := 0;
  v_articles_updated integer := 0;
BEGIN
  -- A. ACTUALIZAR EVENTOS (events)
  -- 1. Publicar eventos programados que alcanzan su fecha de inicio hoy
  UPDATE public.events
  SET status = 'published', updated_at = now()
  WHERE status = 'scheduled'
    AND start_date <= v_today_chicago;

  -- 2. Desactivar y archivar eventos cuya fecha final ya transcurrió
  UPDATE public.events
  SET status = 'archived', updated_at = now()
  WHERE status = 'published'
    AND end_date IS NOT NULL
    AND end_date < v_today_chicago;
  GET DIAGNOSTICS v_events_updated = ROW_COUNT;

  -- B. ACTUALIZAR ANUNCIOS Y AVISOS (announcements)
  -- 1. Publicar anuncios programados cuya fecha starts_at ya llegó (en hora de Chicago)
  UPDATE public.announcements
  SET status = 'published', updated_at = now()
  WHERE status = 'scheduled'
    AND timezone('America/Chicago', starts_at) <= v_now_chicago;

  -- 2. Desactivar y archivar automáticamente anuncios cuya fecha expires_at ha expirado
  UPDATE public.announcements
  SET status = 'archived', updated_at = now()
  WHERE status = 'published'
    AND expires_at IS NOT NULL
    AND timezone('America/Chicago', expires_at) < v_now_chicago;
  GET DIAGNOSTICS v_announcements_updated = ROW_COUNT;

  -- C. ACTUALIZAR PROGRAMAS (programs)
  -- Desactivar programas cuya fecha de fin ya expiró
  UPDATE public.programs
  SET status = 'archived', enrollment_open = false, updated_at = now()
  WHERE status = 'published'
    AND end_date IS NOT NULL
    AND (end_date)::date < v_today_chicago;
  GET DIAGNOSTICS v_programs_updated = ROW_COUNT;

  -- D. ACTUALIZAR ARTÍCULOS (articles)
  -- Desactivar artículos con fecha de revisión o caducidad vencida
  UPDATE public.articles
  SET status = 'archived', updated_at = now()
  WHERE status = 'published'
    AND review_date IS NOT NULL
    AND (review_date)::date < v_today_chicago;
  GET DIAGNOSTICS v_articles_updated = ROW_COUNT;

  -- E. ACTUALIZAR DEPORTES Y ACTIVIDADES (activities)
  UPDATE public.activities
  SET status = 'archived', enrollment_open = false, updated_at = now()
  WHERE status = 'published'
    AND verified_at IS NOT NULL
    AND timezone('America/Chicago', verified_at) < (v_now_chicago - interval '180 days');
  GET DIAGNOSTICS v_activities_updated = ROW_COUNT;

  -- Retornar resumen en JSON
  RETURN jsonb_build_object(
    'success', true,
    'executed_at_chicago', v_now_chicago,
    'events_updated', v_events_updated,
    'announcements_updated', v_announcements_updated,
    'programs_updated', v_programs_updated,
    'articles_updated', v_articles_updated,
    'activities_updated', v_activities_updated
  );
END;
$$;

-- 2. Disparador (Trigger) para calcular estado antes de insertar o editar Eventos
CREATE OR REPLACE FUNCTION public.trg_fn_calculate_event_status()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_today_chicago date := (timezone('America/Chicago', now()))::date;
BEGIN
  IF NEW.is_cancelled = true THEN
    RETURN NEW;
  END IF;

  IF NEW.status NOT IN ('draft', 'archived', 'in_review') THEN
    IF NEW.end_date IS NOT NULL AND NEW.end_date < v_today_chicago THEN
      NEW.status := 'archived';
    ELSIF NEW.start_date > v_today_chicago THEN
      NEW.status := 'scheduled';
    ELSE
      NEW.status := 'published';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_events_lifecycle_status ON public.events;
CREATE TRIGGER trg_events_lifecycle_status
BEFORE INSERT OR UPDATE OF start_date, end_date, is_cancelled, status
ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.trg_fn_calculate_event_status();

-- 3. Programación Periódica con pg_cron (ejecuta cada 15 minutos en Supabase)
-- SELECT cron.schedule(
--   'dmps_status_lifecycle_cron',
--   '*/15 * * * *',
--   'SELECT public.fn_update_content_statuses();'
-- );
