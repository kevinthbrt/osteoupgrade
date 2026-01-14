-- ============================================================================
-- Migration : Suppression de la région "main" et fusion avec "poignet"
-- Date: 2026-01-14
-- ============================================================================
-- Cette migration fusionne la région "main" avec "poignet" dans tout le système.
-- Les données existantes avec region='main' sont migrées vers 'poignet'.
-- Les contraintes CHECK sont mises à jour pour retirer 'main' de la liste.

BEGIN;

-- 1. MIGRATION DES DONNÉES : Migrer toutes les entrées "main" vers "poignet"
-- --------------------------------------------------------------------------

-- Migration des cas cliniques
UPDATE clinical_cases_v2
SET region = 'poignet'
WHERE region = 'main';

-- Migration des vues topographiques e-learning
UPDATE elearning_topographic_views
SET region = 'poignet'
WHERE region = 'main';

-- Migration des pathologies
UPDATE pathologies
SET region = 'poignet'
WHERE region = 'main';

-- Migration des vidéos de pratique
UPDATE practice_videos
SET region = 'poignet'
WHERE region = 'main';

-- Migration des zones topographiques
UPDATE topographic_zones
SET region = 'poignet'
WHERE region = 'main';


-- 2. SUPPRESSION DES CHECK CONSTRAINTS EXISTANTS
-- --------------------------------------------------------------------------

ALTER TABLE clinical_cases_v2
DROP CONSTRAINT IF EXISTS clinical_cases_v2_region_check;

ALTER TABLE elearning_topographic_views
DROP CONSTRAINT IF EXISTS elearning_topographic_views_region_check;

ALTER TABLE pathologies
DROP CONSTRAINT IF EXISTS pathologies_region_check;

ALTER TABLE practice_videos
DROP CONSTRAINT IF EXISTS practice_videos_region_check;

ALTER TABLE topographic_zones
DROP CONSTRAINT IF EXISTS topographic_zones_region_check;


-- 3. RECRÉATION DES CHECK CONSTRAINTS SANS "main"
-- --------------------------------------------------------------------------

ALTER TABLE clinical_cases_v2
ADD CONSTRAINT clinical_cases_v2_region_check
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
  'hanche'::text,
  'genou'::text,
  'cheville'::text,
  'pied'::text,
  'neurologique'::text,
  'vasculaire'::text,
  'systemique'::text
]));

ALTER TABLE elearning_topographic_views
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
  'hanche'::text,
  'genou'::text,
  'cheville'::text,
  'pied'::text,
  'neurologique'::text,
  'vasculaire'::text,
  'systemique'::text
]));

ALTER TABLE pathologies
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
  'hanche'::text,
  'genou'::text,
  'cheville'::text,
  'pied'::text,
  'neurologique'::text,
  'vasculaire'::text,
  'systemique'::text
]));

ALTER TABLE practice_videos
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
  'hanche'::text,
  'genou'::text,
  'cheville'::text,
  'pied'::text,
  'neurologique'::text,
  'vasculaire'::text,
  'systemique'::text
]));

ALTER TABLE topographic_zones
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
  'hanche'::text,
  'genou'::text,
  'cheville'::text,
  'pied'::text,
  'neurologique'::text,
  'vasculaire'::text,
  'systemique'::text
]));

-- 4. AJOUT DE COMMENTAIRES
-- --------------------------------------------------------------------------

COMMENT ON CONSTRAINT clinical_cases_v2_region_check ON public.clinical_cases_v2
IS 'Régions anatomiques valides (main fusionné avec poignet le 2026-01-14)';

COMMENT ON CONSTRAINT elearning_topographic_views_region_check ON public.elearning_topographic_views
IS 'Régions anatomiques valides (main fusionné avec poignet le 2026-01-14)';

COMMENT ON CONSTRAINT pathologies_region_check ON public.pathologies
IS 'Régions anatomiques valides (main fusionné avec poignet le 2026-01-14)';

COMMENT ON CONSTRAINT practice_videos_region_check ON public.practice_videos
IS 'Régions anatomiques valides (main fusionné avec poignet le 2026-01-14)';

COMMENT ON CONSTRAINT topographic_zones_region_check ON public.topographic_zones
IS 'Régions anatomiques valides (main fusionné avec poignet le 2026-01-14)';

COMMIT;
