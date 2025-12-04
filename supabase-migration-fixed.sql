-- ============================================
-- Migration pour OsteoUpgrade : Nouveaux rôles
-- ============================================
-- Date: 2025-12-04
-- Description: Ajout des rôles premium_silver et premium_gold

-- ÉTAPE 1: Désactiver temporairement la contrainte
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_role_check;

-- ÉTAPE 2: Mettre à jour les utilisateurs premium existants vers premium_silver
-- Faire cela AVANT d'ajouter la nouvelle contrainte
UPDATE public.profiles
SET role = 'premium_silver'
WHERE role = 'premium';

-- ÉTAPE 3: Ajouter la nouvelle contrainte avec les nouveaux rôles
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_role_check
CHECK (role = ANY (ARRAY['free'::text, 'premium_silver'::text, 'premium_gold'::text, 'admin'::text]));

-- ÉTAPE 4: Créer une table pour stocker les formations System.io (E-learning)
CREATE TABLE IF NOT EXISTS public.systemio_courses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  systemio_course_id text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  thumbnail_url text,
  course_url text NOT NULL,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT systemio_courses_pkey PRIMARY KEY (id)
);

-- ÉTAPE 5: Créer une table pour suivre les inscriptions des utilisateurs aux formations
CREATE TABLE IF NOT EXISTS public.user_course_enrollments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid NOT NULL,
  enrolled_at timestamp with time zone DEFAULT now(),
  last_accessed_at timestamp with time zone,
  progress numeric DEFAULT 0,
  completed boolean DEFAULT false,
  completed_at timestamp with time zone,
  CONSTRAINT user_course_enrollments_pkey PRIMARY KEY (id),
  CONSTRAINT user_course_enrollments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT user_course_enrollments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.systemio_courses(id) ON DELETE CASCADE,
  CONSTRAINT user_course_enrollments_unique UNIQUE (user_id, course_id)
);

-- ÉTAPE 6: Créer une table pour logger les synchronisations avec System.io
CREATE TABLE IF NOT EXISTS public.systemio_sync_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  sync_type text NOT NULL, -- 'user_creation', 'course_sync', 'enrollment'
  status text NOT NULL, -- 'success', 'failed', 'pending'
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT systemio_sync_logs_pkey PRIMARY KEY (id),
  CONSTRAINT systemio_sync_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- ÉTAPE 7: Ajouter un champ pour stocker l'ID System.io dans profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS systemio_contact_id text,
ADD COLUMN IF NOT EXISTS systemio_synced_at timestamp with time zone;

-- ÉTAPE 8: Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_systemio_contact_id ON public.profiles(systemio_contact_id);
CREATE INDEX IF NOT EXISTS idx_systemio_courses_is_active ON public.systemio_courses(is_active);
CREATE INDEX IF NOT EXISTS idx_user_course_enrollments_user_id ON public.user_course_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_course_enrollments_course_id ON public.user_course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_systemio_sync_logs_user_id ON public.systemio_sync_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_systemio_sync_logs_created_at ON public.systemio_sync_logs(created_at);

-- ÉTAPE 9: Mettre à jour les RLS (Row Level Security)
-- Permettre aux utilisateurs de voir leurs propres inscriptions
ALTER TABLE public.user_course_enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own enrollments" ON public.user_course_enrollments;
CREATE POLICY "Users can view their own enrollments"
ON public.user_course_enrollments
FOR SELECT
USING (auth.uid() = user_id);

-- Permettre aux admins de voir toutes les inscriptions
DROP POLICY IF EXISTS "Admins can view all enrollments" ON public.user_course_enrollments;
CREATE POLICY "Admins can view all enrollments"
ON public.user_course_enrollments
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Permettre à tous les utilisateurs authentifiés de voir les cours actifs
ALTER TABLE public.systemio_courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view active courses" ON public.systemio_courses;
CREATE POLICY "Authenticated users can view active courses"
ON public.systemio_courses
FOR SELECT
USING (is_active = true AND auth.uid() IS NOT NULL);

-- Admins peuvent tout gérer
DROP POLICY IF EXISTS "Admins can manage all courses" ON public.systemio_courses;
CREATE POLICY "Admins can manage all courses"
ON public.systemio_courses
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- ============================================
-- VÉRIFICATION
-- ============================================

-- Vérifier que la migration s'est bien passée
SELECT
  'Migration terminée avec succès' as message,
  COUNT(*) as total_utilisateurs,
  COUNT(CASE WHEN role = 'free' THEN 1 END) as free,
  COUNT(CASE WHEN role = 'premium_silver' THEN 1 END) as premium_silver,
  COUNT(CASE WHEN role = 'premium_gold' THEN 1 END) as premium_gold,
  COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin
FROM public.profiles;

-- ============================================
-- NOTES IMPORTANTES
-- ============================================
--
-- ✅ Tous les utilisateurs "premium" ont été convertis en "premium_silver"
-- ✅ Les nouvelles tables System.io ont été créées
-- ✅ Les index et politiques RLS ont été configurés
--
-- Prochaines étapes :
-- 1. Configurer SYSTEMIO_API_KEY dans Vercel
-- 2. Redéployer l'application
-- 3. Promouvoir certains utilisateurs en premium_gold si nécessaire :
--    UPDATE public.profiles SET role = 'premium_gold' WHERE email = 'user@example.com';
--
-- ============================================
