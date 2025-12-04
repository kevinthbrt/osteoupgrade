-- ============================================
-- Suppression complète de l'intégration System.io
-- ============================================
-- Ce script retire les tables, colonnes et index liés à System.io
-- afin de migrer vers la stack emailing Resend/Brevo.

-- Nettoyage des politiques RLS (si elles existent)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'user_course_enrollments' AND n.nspname = 'public'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their own enrollments" ON public.user_course_enrollments';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can view all enrollments" ON public.user_course_enrollments';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'systemio_courses' AND n.nspname = 'public'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can view active courses" ON public.systemio_courses';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can manage all courses" ON public.systemio_courses';
  END IF;
END$$;

-- Suppression des tables liées à System.io
DROP TABLE IF EXISTS public.user_course_enrollments CASCADE;
DROP TABLE IF EXISTS public.systemio_courses CASCADE;
DROP TABLE IF EXISTS public.systemio_sync_logs CASCADE;

-- Suppression des colonnes System.io sur profiles
ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS systemio_contact_id,
  DROP COLUMN IF EXISTS systemio_synced_at;

-- Suppression des index spécifiques
DROP INDEX IF EXISTS idx_profiles_systemio_contact_id;
DROP INDEX IF EXISTS idx_systemio_courses_is_active;
DROP INDEX IF EXISTS idx_user_course_enrollments_user_id;
DROP INDEX IF EXISTS idx_user_course_enrollments_course_id;
DROP INDEX IF EXISTS idx_systemio_sync_logs_user_id;
DROP INDEX IF EXISTS idx_systemio_sync_logs_created_at;

-- Vérification rapide
SELECT 'System.io cleanup completed' AS status;
