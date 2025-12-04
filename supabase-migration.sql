-- ============================================
-- Migration pour OsteoUpgrade : Mise à jour rôles & nettoyage System.io
-- ============================================
-- Date: 2025-12-04
-- Description: Ajout des rôles premium_silver/premium_gold et harmonisation post-retrait System.io

-- 1. Modifier la contrainte CHECK sur le rôle dans la table profiles
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_role_check
CHECK (role = ANY (ARRAY['free'::text, 'premium_silver'::text, 'premium_gold'::text, 'admin'::text]));

-- 2. Mettre à jour les utilisateurs premium existants vers premium_silver (par défaut)
-- Vous pouvez ensuite ajuster manuellement les utilisateurs qui doivent être premium_gold
UPDATE public.profiles
SET role = 'premium_silver'
WHERE role = 'premium';

-- 3. Créer ou vérifier l'index sur le rôle pour accélérer les vérifications d'accès
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- ============================================
-- NOTES IMPORTANTES
-- ============================================
--
-- 1. Les tables et colonnes liées à System.io sont supprimées dans le script
--    `supabase-remove-systemio.sql`. Exécutez-le après cette migration si ce n'est
--    pas déjà fait.
-- 2. Les futures notifications e-learning seront envoyées via Resend/Brevo (pas de
--    dépendance System.io).
--
-- ============================================

COMMIT;
