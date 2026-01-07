-- ==========================================
-- QUICK FIX : Suppression test_categories + Debug emails
-- ==========================================

-- ==========================================
-- 1. VÉRIFIER SI LA TABLE EST UTILISÉE
-- ==========================================

-- Voir le contenu de test_categories
SELECT * FROM public.test_categories;

-- Vérifier s'il y a des foreign keys qui pointent vers test_categories
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_name = 'test_categories';

-- ==========================================
-- 2. SUPPRIMER test_categories (SI VIDE ET NON UTILISÉE)
-- ==========================================

-- Décommente cette ligne pour supprimer :
-- DROP TABLE IF EXISTS public.test_categories CASCADE;

-- ==========================================
-- 3. DEBUG EMAILS REÇUS
-- ==========================================

-- A) Vérifier le contenu de received_emails
SELECT
  id,
  from_email,
  from_name,
  to_email,
  subject,
  received_at,
  category,
  is_read,
  resend_message_id
FROM public.received_emails
ORDER BY received_at DESC
LIMIT 10;

-- B) Compter les emails
SELECT
  COUNT(*) as total_emails,
  COUNT(*) FILTER (WHERE is_read = false) as unread,
  COUNT(*) FILTER (WHERE category = 'parrainage') as parrainage,
  COUNT(*) FILTER (WHERE category = 'support') as support,
  COUNT(*) FILTER (WHERE category = 'general') as general,
  COUNT(*) FILTER (WHERE category = 'spam') as spam
FROM public.received_emails;

-- C) Vérifier les RLS policies sur received_emails
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'received_emails';

-- D) Si pas de policies, les créer :
-- (Normalement déjà créées par le script SETUP_REFERRAL_EMAILS_AND_RLS.sql)

-- Enable RLS
ALTER TABLE public.received_emails ENABLE ROW LEVEL SECURITY;

-- Policy pour les admins (SELECT)
DROP POLICY IF EXISTS "Admins can view received emails" ON public.received_emails;
CREATE POLICY "Admins can view received emails"
ON public.received_emails
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Policy pour les admins (UPDATE)
DROP POLICY IF EXISTS "Admins can update received emails" ON public.received_emails;
CREATE POLICY "Admins can update received emails"
ON public.received_emails
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Policy pour les admins (DELETE)
DROP POLICY IF EXISTS "Admins can delete received emails" ON public.received_emails;
CREATE POLICY "Admins can delete received emails"
ON public.received_emails
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- E) Tester une insertion manuelle (pour vérifier les permissions)
-- Décommente pour tester :
/*
INSERT INTO public.received_emails (
  from_email,
  to_email,
  subject,
  text_content,
  category
)
VALUES (
  'test-manuel@example.com',
  'admin@osteo-upgrade.fr',
  'Test manuel depuis SQL',
  'Ceci est un test manuel pour vérifier que l''insertion fonctionne.',
  'general'
);
*/

-- F) Vérifier les derniers emails avec tous les détails
SELECT
  id,
  from_email,
  from_name,
  to_email,
  subject,
  LEFT(text_content, 100) as preview,
  category,
  is_read,
  resend_message_id,
  received_at,
  created_at
FROM public.received_emails
ORDER BY received_at DESC
LIMIT 5;

-- ==========================================
-- 4. AUTRES TABLES À SUPPRIMER (SI CONFIRMÉ)
-- ==========================================

-- Décommente uniquement si tu es SÛR de ne plus les utiliser :

-- consultation_sessions_legacy (remplacée par v2)
-- DROP TABLE IF EXISTS public.consultation_sessions_legacy CASCADE;

-- anatomical_zones (structure 3D inutilisée)
-- DROP TABLE IF EXISTS public.anatomical_zones CASCADE;

-- user_sessions (générique inutilisée)
-- DROP TABLE IF EXISTS public.user_sessions CASCADE;

-- user_login_tracking (doublon avec user_gamification_stats)
-- DROP TABLE IF EXISTS public.user_login_tracking CASCADE;
