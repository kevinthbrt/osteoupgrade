-- ============================================
-- Migration pour OsteoUpgrade : Mise à jour rôles & nettoyage System.io (version corrigée)
-- ============================================
-- Date: 2025-12-04
-- Description: Ajout des rôles premium_silver/premium_gold et harmonisation post-retrait System.io

-- ÉTAPE 1: Désactiver temporairement la contrainte
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_role_check;

-- ÉTAPE 2: Mettre à jour les utilisateurs premium existants vers premium_silver
UPDATE public.profiles
SET role = 'premium_silver'
WHERE role = 'premium';

-- ÉTAPE 3: Ajouter la nouvelle contrainte avec les nouveaux rôles
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_role_check
CHECK (role = ANY (ARRAY['free'::text, 'premium_silver'::text, 'premium_gold'::text, 'admin'::text]));

-- ÉTAPE 4: Créer ou vérifier l'index sur le rôle
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- ============================================
-- NOTES IMPORTANTES
-- ============================================
-- ✅ Les éléments System.io (tables, colonnes, index) doivent être supprimés via
--    `supabase-remove-systemio.sql` pour éviter les dépendances obsolètes.
-- ✅ Plus besoin de clés API System.io : privilégier RESEND_API_KEY et BREVO_API_KEY
--    pour les futurs envois email.
-- ============================================
