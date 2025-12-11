-- Migration pour mettre à jour les contraintes CHECK sur les régions anatomiques
-- Ajoute les nouvelles régions: ATM, Crâne, Sacro-iliaque, Côtes, Neurologique, Vasculaire, Systémique

-- ============================================================================
-- 1. TABLE PATHOLOGIES
-- ============================================================================

-- Supprimer l'ancienne contrainte
ALTER TABLE public.pathologies
DROP CONSTRAINT IF EXISTS pathologies_region_check;

-- Ajouter la nouvelle contrainte avec toutes les régions
ALTER TABLE public.pathologies
ADD CONSTRAINT pathologies_region_check
CHECK (region = ANY (ARRAY[
  'cervical'::text,
  'atm'::text,
  'crane'::text,
  'thoracique'::text,
  'lombaire'::text,
  'sacro-iliaque'::text,
  'cotes'::text,
  'epaule'::text,
  'coude'::text,
  'poignet'::text,
  'main'::text,
  'hanche'::text,
  'genou'::text,
  'cheville'::text,
  'pied'::text,
  'neurologique'::text,
  'vasculaire'::text,
  'systemique'::text
]));

-- ============================================================================
-- 2. TABLE ELEARNING_TOPOGRAPHIC_VIEWS
-- ============================================================================

-- Supprimer l'ancienne contrainte
ALTER TABLE public.elearning_topographic_views
DROP CONSTRAINT IF EXISTS elearning_topographic_views_region_check;

-- Ajouter la nouvelle contrainte avec toutes les régions
ALTER TABLE public.elearning_topographic_views
ADD CONSTRAINT elearning_topographic_views_region_check
CHECK (region = ANY (ARRAY[
  'cervical'::text,
  'atm'::text,
  'crane'::text,
  'thoracique'::text,
  'lombaire'::text,
  'sacro-iliaque'::text,
  'cotes'::text,
  'epaule'::text,
  'coude'::text,
  'poignet'::text,
  'main'::text,
  'hanche'::text,
  'genou'::text,
  'cheville'::text,
  'pied'::text,
  'neurologique'::text,
  'vasculaire'::text,
  'systemique'::text
]));

-- ============================================================================
-- 3. TABLE PRACTICE_VIDEOS
-- ============================================================================

-- Supprimer l'ancienne contrainte
ALTER TABLE public.practice_videos
DROP CONSTRAINT IF EXISTS practice_videos_region_check;

-- Ajouter la nouvelle contrainte avec toutes les régions
ALTER TABLE public.practice_videos
ADD CONSTRAINT practice_videos_region_check
CHECK (region = ANY (ARRAY[
  'cervical'::text,
  'atm'::text,
  'crane'::text,
  'thoracique'::text,
  'lombaire'::text,
  'sacro-iliaque'::text,
  'cotes'::text,
  'epaule'::text,
  'coude'::text,
  'poignet'::text,
  'main'::text,
  'hanche'::text,
  'genou'::text,
  'cheville'::text,
  'pied'::text,
  'neurologique'::text,
  'vasculaire'::text,
  'systemique'::text
]));

-- ============================================================================
-- 4. TABLE TOPOGRAPHIC_ZONES
-- ============================================================================

-- Supprimer l'ancienne contrainte
ALTER TABLE public.topographic_zones
DROP CONSTRAINT IF EXISTS topographic_zones_region_check;

-- Ajouter la nouvelle contrainte avec toutes les régions
ALTER TABLE public.topographic_zones
ADD CONSTRAINT topographic_zones_region_check
CHECK (region = ANY (ARRAY[
  'cervical'::text,
  'atm'::text,
  'crane'::text,
  'thoracique'::text,
  'lombaire'::text,
  'sacro-iliaque'::text,
  'cotes'::text,
  'epaule'::text,
  'coude'::text,
  'poignet'::text,
  'main'::text,
  'hanche'::text,
  'genou'::text,
  'cheville'::text,
  'pied'::text,
  'neurologique'::text,
  'vasculaire'::text,
  'systemique'::text
]));

-- ============================================================================
-- COMMENTAIRES
-- ============================================================================

COMMENT ON CONSTRAINT pathologies_region_check ON public.pathologies
IS 'Valide les régions anatomiques incluant tête/cou, membres, tronc et général';

COMMENT ON CONSTRAINT elearning_topographic_views_region_check ON public.elearning_topographic_views
IS 'Valide les régions anatomiques pour les vues topographiques e-learning';

COMMENT ON CONSTRAINT practice_videos_region_check ON public.practice_videos
IS 'Valide les régions anatomiques pour les vidéos de pratique';

COMMENT ON CONSTRAINT topographic_zones_region_check ON public.topographic_zones
IS 'Valide les régions anatomiques pour les zones topographiques';
