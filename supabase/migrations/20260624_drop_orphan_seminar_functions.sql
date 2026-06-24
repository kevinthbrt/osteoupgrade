-- Les séminaires ont été supprimés (tables seminars/seminar_registrations drop en 20260415).
-- Ces fonctions sont orphelines et étaient exposées en SECURITY DEFINER au rôle anon
-- (advisor sécurité Supabase). On les supprime.
DROP FUNCTION IF EXISTS public.cancel_seminar_reminder_enrollments();
DROP FUNCTION IF EXISTS public.enroll_user_in_seminar_automation();
DROP FUNCTION IF EXISTS public.enroll_user_in_seminar_cancellation_automation();
