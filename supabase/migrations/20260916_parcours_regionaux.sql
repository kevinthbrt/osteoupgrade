-- Parcours régionaux : environnement d'apprentissage par région anatomique.
--
-- Le site portait déjà les briques (pathologies, tests orthopédiques, clusters,
-- vidéos de pratique, exercices) mais rien ne les reliait en un parcours
-- d'apprentissage : un praticien qui voulait devenir compétent sur la lombalgie
-- devait ouvrir quatre modules distincts et deviner l'ordre. Ces tables
-- ajoutent la couche manquante : un module par région, découpé en chapitres,
-- chaque chapitre citant les briques existantes au lieu de les dupliquer.
--
-- Principe : aucune donnée clinique n'est recopiée ici. Un test orthopédique
-- reste dans `orthopedic_tests`, une vidéo dans `practice_videos`. Corriger une
-- sensibilité à un seul endroit continue de corriger tout le site.

-- ============================================================================
-- 1. MODULES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.region_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  subtitle TEXT,
  intro_html TEXT,
  cover_image_url TEXT,
  objectives JSONB NOT NULL DEFAULT '[]'::jsonb,
  prerequisites TEXT,
  estimated_hours NUMERIC(4,1),
  status TEXT NOT NULL DEFAULT 'draft',
  is_free_access BOOLEAN NOT NULL DEFAULT FALSE,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT region_modules_status_check CHECK (status IN ('draft', 'published', 'archived')),
  CONSTRAINT region_modules_region_check CHECK (region = ANY (ARRAY[
    'cervical', 'atm', 'crane', 'thoracique', 'lombaire', 'sacro-iliaque',
    'cotes', 'epaule', 'coude', 'poignet', 'main', 'hanche', 'genou',
    'cheville', 'pied', 'neurologique', 'vasculaire', 'systemique'
  ]))
);

COMMENT ON TABLE public.region_modules IS 'Parcours d''apprentissage par région anatomique. Un module regroupe des chapitres qui citent les tests, clusters, pathologies et vidéos déjà en base.';
COMMENT ON COLUMN public.region_modules.status IS 'draft : visible des seuls administrateurs. published : visible des abonnés. archived : retiré sans être supprimé.';

-- ============================================================================
-- 2. CHAPITRES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.region_chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES public.region_modules(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  part TEXT,
  kind TEXT NOT NULL DEFAULT 'diagnostic',
  summary TEXT,
  objectives JSONB NOT NULL DEFAULT '[]'::jsonb,
  key_points JSONB NOT NULL DEFAULT '[]'::jsonb,
  estimated_minutes INTEGER,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_free_access BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (module_id, slug),
  CONSTRAINT region_chapters_kind_check CHECK (kind IN (
    'fondamentaux', 'raisonnement', 'triage', 'anamnese', 'examen',
    'diagnostic', 'traitement', 'reorientation', 'cas_clinique'
  ))
);

COMMENT ON COLUMN public.region_chapters.part IS 'Regroupement affiché dans le sommaire (« Triage et sécurité », « Traiter »…).';
COMMENT ON COLUMN public.region_chapters.key_points IS 'Tableau de chaînes : ce qu''il faut retenir, affiché en fin de chapitre.';

CREATE INDEX IF NOT EXISTS idx_region_chapters_module ON public.region_chapters(module_id, order_index);

-- ============================================================================
-- 3. SECTIONS DE CONTENU
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.region_chapter_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES public.region_chapters(id) ON DELETE CASCADE,
  title TEXT,
  body_html TEXT NOT NULL DEFAULT '',
  callout TEXT NOT NULL DEFAULT 'none',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT region_chapter_sections_callout_check CHECK (callout IN (
    'none', 'cle', 'drapeau_rouge', 'preuve', 'piege', 'pratique', 'reorientation'
  ))
);

COMMENT ON COLUMN public.region_chapter_sections.callout IS 'Habillage visuel de la section : encart neutre, point clé, drapeau rouge, niveau de preuve, piège fréquent, mise en pratique, réorientation.';

CREATE INDEX IF NOT EXISTS idx_region_chapter_sections_chapter ON public.region_chapter_sections(chapter_id, order_index);

-- ============================================================================
-- 4. LIAISONS VERS LES BRIQUES EXISTANTES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.region_chapter_pathologies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES public.region_chapters(id) ON DELETE CASCADE,
  pathology_id UUID NOT NULL REFERENCES public.pathologies(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'principal',
  note TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (chapter_id, pathology_id),
  CONSTRAINT region_chapter_pathologies_role_check CHECK (role IN ('principal', 'differentiel', 'drapeau_rouge'))
);

CREATE TABLE IF NOT EXISTS public.region_chapter_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES public.region_chapters(id) ON DELETE CASCADE,
  test_id UUID NOT NULL REFERENCES public.orthopedic_tests(id) ON DELETE CASCADE,
  note TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (chapter_id, test_id)
);

CREATE TABLE IF NOT EXISTS public.region_chapter_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES public.region_chapters(id) ON DELETE CASCADE,
  cluster_id UUID NOT NULL REFERENCES public.orthopedic_test_clusters(id) ON DELETE CASCADE,
  note TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (chapter_id, cluster_id)
);

CREATE TABLE IF NOT EXISTS public.region_chapter_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES public.region_chapters(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.rehab_exercises(id) ON DELETE CASCADE,
  note TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (chapter_id, exercise_id)
);

-- ============================================================================
-- 5. TECHNIQUES RECOMMANDÉES
-- ============================================================================
--
-- Une technique existe indépendamment de sa vidéo : le catalogue de gestes
-- fondés sur les preuves est plus large que ce qui est filmé aujourd'hui.
-- `to_film` marque ce qui reste à tourner, `practice_video_id` relie la
-- technique à sa démonstration dès qu'elle existe.

CREATE TABLE IF NOT EXISTS public.region_chapter_techniques (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES public.region_chapters(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  approach TEXT NOT NULL,
  description_html TEXT,
  indications TEXT,
  contraindications TEXT,
  dosage TEXT,
  evidence_level TEXT NOT NULL DEFAULT 'incertain',
  evidence_summary TEXT,
  practice_video_id UUID REFERENCES public.practice_videos(id) ON DELETE SET NULL,
  vimeo_url TEXT,
  to_film BOOLEAN NOT NULL DEFAULT FALSE,
  film_brief TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT region_chapter_techniques_approach_check CHECK (approach IN (
    'hvla', 'lvla', 'mwm', 'mckenzie', 'exercice', 'neurodynamique',
    'dry_needling', 'tissus_mous', 'education', 'auto_traitement', 'adjuvant'
  )),
  CONSTRAINT region_chapter_techniques_evidence_check CHECK (evidence_level IN (
    'fort', 'modere', 'faible', 'incertain', 'non_recommande'
  ))
);

COMMENT ON COLUMN public.region_chapter_techniques.to_film IS 'Technique recommandée dont la démonstration n''est pas encore tournée. Alimente la liste de tournage de l''administration.';
COMMENT ON COLUMN public.region_chapter_techniques.film_brief IS 'Ce que la vidéo doit montrer : installation, prise, paramètre, erreurs à éviter.';

CREATE INDEX IF NOT EXISTS idx_region_chapter_techniques_chapter ON public.region_chapter_techniques(chapter_id, order_index);
CREATE INDEX IF NOT EXISTS idx_region_chapter_techniques_to_film ON public.region_chapter_techniques(to_film) WHERE to_film;

-- ============================================================================
-- 6. BIBLIOGRAPHIE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.region_chapter_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES public.region_chapters(id) ON DELETE CASCADE,
  citation TEXT NOT NULL,
  year INTEGER,
  source_type TEXT NOT NULL DEFAULT 'etude',
  takeaway TEXT,
  url TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT region_chapter_references_type_check CHECK (source_type IN (
    'recommandation', 'revue_systematique', 'meta_analyse', 'essai_randomise',
    'etude', 'consensus', 'ouvrage'
  ))
);

CREATE INDEX IF NOT EXISTS idx_region_chapter_references_chapter ON public.region_chapter_references(chapter_id, order_index);

-- ============================================================================
-- 7. PROGRESSION
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.region_chapter_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chapter_id UUID NOT NULL REFERENCES public.region_chapters(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (user_id, chapter_id)
);

CREATE INDEX IF NOT EXISTS idx_region_chapter_progress_user ON public.region_chapter_progress(user_id);

-- ============================================================================
-- 8. RLS
-- ============================================================================

ALTER TABLE public.region_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.region_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.region_chapter_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.region_chapter_pathologies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.region_chapter_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.region_chapter_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.region_chapter_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.region_chapter_techniques ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.region_chapter_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.region_chapter_progress ENABLE ROW LEVEL SECURITY;

-- `public.is_admin()` existe déjà (SECURITY DEFINER, `row_security off`) et est
-- utilisée par les policies des autres modules : la réutiliser évite une
-- seconde définition du rôle administrateur qui pourrait diverger.

-- Un brouillon n'est lisible que des administrateurs : le contenu clinique est
-- relu avant d'être servi aux abonnés.
CREATE POLICY "Lecture des modules publiés"
  ON public.region_modules FOR SELECT TO authenticated
  USING (status = 'published' OR public.is_admin());

CREATE POLICY "Écriture des modules réservée aux admins"
  ON public.region_modules FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Lecture des chapitres publiés"
  ON public.region_chapters FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.region_modules m
      WHERE m.id = module_id AND (m.status = 'published' OR public.is_admin())
    )
  );

CREATE POLICY "Écriture des chapitres réservée aux admins"
  ON public.region_chapters FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Les tables filles suivent le chapitre : même condition de lecture, écriture
-- réservée aux administrateurs.
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'region_chapter_sections',
    'region_chapter_pathologies',
    'region_chapter_tests',
    'region_chapter_clusters',
    'region_chapter_exercises',
    'region_chapter_techniques',
    'region_chapter_references'
  ] LOOP
    EXECUTE format($f$
      CREATE POLICY "Lecture %1$s"
        ON public.%1$I FOR SELECT TO authenticated
        USING (
          EXISTS (
            SELECT 1
            FROM public.region_chapters c
            JOIN public.region_modules m ON m.id = c.module_id
            WHERE c.id = %1$I.chapter_id
              AND (m.status = 'published' OR public.is_admin())
          )
        );
    $f$, t);

    EXECUTE format($f$
      CREATE POLICY "Écriture %1$s"
        ON public.%1$I FOR ALL TO authenticated
        USING (public.is_admin())
        WITH CHECK (public.is_admin());
    $f$, t);
  END LOOP;
END $$;

CREATE POLICY "Chacun lit sa progression"
  ON public.region_chapter_progress FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Chacun enregistre sa progression"
  ON public.region_chapter_progress FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Chacun retire sa progression"
  ON public.region_chapter_progress FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- 9. HORODATAGE
-- ============================================================================

CREATE OR REPLACE FUNCTION public.touch_region_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_region_modules_updated_at ON public.region_modules;
CREATE TRIGGER trg_region_modules_updated_at
  BEFORE UPDATE ON public.region_modules
  FOR EACH ROW EXECUTE FUNCTION public.touch_region_updated_at();

DROP TRIGGER IF EXISTS trg_region_chapters_updated_at ON public.region_chapters;
CREATE TRIGGER trg_region_chapters_updated_at
  BEFORE UPDATE ON public.region_chapters
  FOR EACH ROW EXECUTE FUNCTION public.touch_region_updated_at();

DROP TRIGGER IF EXISTS trg_region_chapter_sections_updated_at ON public.region_chapter_sections;
CREATE TRIGGER trg_region_chapter_sections_updated_at
  BEFORE UPDATE ON public.region_chapter_sections
  FOR EACH ROW EXECUTE FUNCTION public.touch_region_updated_at();

DROP TRIGGER IF EXISTS trg_region_chapter_techniques_updated_at ON public.region_chapter_techniques;
CREATE TRIGGER trg_region_chapter_techniques_updated_at
  BEFORE UPDATE ON public.region_chapter_techniques
  FOR EACH ROW EXECUTE FUNCTION public.touch_region_updated_at();
