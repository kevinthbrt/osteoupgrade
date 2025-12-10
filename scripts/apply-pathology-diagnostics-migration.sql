-- ============================================================================
-- SCRIPT D'APPLICATION DE LA MIGRATION POUR LES DIAGNOSTICS
-- ============================================================================
-- À exécuter dans le SQL Editor de Supabase
--
-- Ce script enrichit la table pathologies pour transformer les pathologies
-- en diagnostics complets avec photos, signes cliniques et tests associés.
-- ============================================================================

-- 1. Ajouter les colonnes pour les signes cliniques et l'image
ALTER TABLE public.pathologies
ADD COLUMN IF NOT EXISTS clinical_signs TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. Créer la table de liaison entre pathologies et tests (many-to-many)
CREATE TABLE IF NOT EXISTS public.pathology_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pathology_id UUID NOT NULL REFERENCES public.pathologies(id) ON DELETE CASCADE,
  test_id UUID NOT NULL REFERENCES public.orthopedic_tests(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Contrainte unique pour éviter les doublons
  UNIQUE(pathology_id, test_id)
);

-- 3. Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_pathology_tests_pathology_id ON public.pathology_tests(pathology_id);
CREATE INDEX IF NOT EXISTS idx_pathology_tests_test_id ON public.pathology_tests(test_id);

-- 4. Ajouter des commentaires pour documenter les tables
COMMENT ON TABLE public.pathology_tests IS 'Liaison many-to-many entre pathologies (diagnostics) et tests orthopédiques. Un test peut appartenir à plusieurs diagnostics.';
COMMENT ON COLUMN public.pathologies.clinical_signs IS 'Signes cliniques évidents de la pathologie';
COMMENT ON COLUMN public.pathologies.image_url IS 'URL de l''image stockée dans Vercel Blob';

-- 5. Vérification : afficher un résumé
SELECT
  'Migration appliquée avec succès!' as status,
  COUNT(*) as nb_pathologies,
  COUNT(clinical_signs) as nb_avec_signes_cliniques,
  COUNT(image_url) as nb_avec_images
FROM public.pathologies;
