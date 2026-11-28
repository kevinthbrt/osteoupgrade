-- Parcours animés : ce que le lecteur pas à pas a besoin de savoir.
-- Voir docs/PARCOURS_ANIMES.md.
--
-- Tout est additif et facultatif : un chapitre sans `anime` s'affiche comme
-- avant, une section sans personnage aussi, une activité sans `after_section`
-- reste en fin de chapitre.

-- Le mode se décide chapitre par chapitre : on met en scène un chapitre quand
-- il est prêt, sans toucher aux autres.
ALTER TABLE public.region_chapters
  ADD COLUMN IF NOT EXISTS anime BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.region_chapters.anime IS
  'Affiche le chapitre dans le lecteur pas à pas, avec personnages et activités intercalées.';

-- Un personnage peut accompagner une section : il porte l'émotion et le point
-- de vue, jamais seul une affirmation scientifique, qui reste dans le texte.
ALTER TABLE public.region_chapter_sections
  ADD COLUMN IF NOT EXISTS personnage TEXT,
  ADD COLUMN IF NOT EXISTS expression TEXT,
  ADD COLUMN IF NOT EXISTS replique TEXT;

COMMENT ON COLUMN public.region_chapter_sections.personnage IS
  'Personnage affiché à côté de la section (osteo, patient, disque, vertebre, colonne, bassin).';
COMMENT ON COLUMN public.region_chapter_sections.expression IS
  'Expression du personnage, voir lib/personnages.ts.';
COMMENT ON COLUMN public.region_chapter_sections.replique IS
  'Ce que dit le personnage dans sa bulle.';

-- Une activité peut se placer juste après une section, pour vérifier la notion
-- au moment où elle vient d'être lue.
ALTER TABLE public.region_chapter_activities
  ADD COLUMN IF NOT EXISTS after_section INTEGER;

COMMENT ON COLUMN public.region_chapter_activities.after_section IS
  'order_index de la section après laquelle l''activité s''affiche. NULL : en fin de chapitre.';

-- Trois nouveaux formats :
--   scene          : dialogue entre personnages, non noté ;
--   que_dire       : le patient réagit à la formulation choisie ;
--   trouver_niveau : on désigne un étage sur la colonne.
ALTER TABLE public.region_chapter_activities
  DROP CONSTRAINT IF EXISTS region_chapter_activities_kind_check;
ALTER TABLE public.region_chapter_activities
  ADD CONSTRAINT region_chapter_activities_kind_check CHECK (kind IN (
    'qcm', 'vrai_faux', 'cas_etape', 'probabilite', 'tri_drapeaux', 'arbre_decision',
    'scene', 'que_dire', 'trouver_niveau'
  ));
